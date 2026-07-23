import logging
import uuid
from collections import defaultdict
from datetime import datetime
from time import time

from flask import Flask, render_template, request, jsonify, session

from core.chat_engine import get_reply, is_configured_public, SCENARIO_PROMPTS
from core.resume_parser import extract_pdf_text
from core.ats_scanner import scan_resume
from core.interview_engine import start_interview, continue_interview, ROLE_LABELS

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.secret_key = "dev-secret-change-this-in-production"

# ---------------------------------------------------------------
# In-memory per-visitor store (keyed by a token in their session
# cookie). Holds resume text + ATS results + a small activity log
# so the dashboard reflects real usage instead of hardcoded numbers.
# NOTE: this resets if the server restarts, and only works with a
# single process. For real production use, swap this dict for a
# database (SQLite/Postgres) keyed the same way.
# ---------------------------------------------------------------
STORE = {}


def get_store():
    token = session.get("token")
    if not token or token not in STORE:
        token = str(uuid.uuid4())
        session["token"] = token
        STORE[token] = {
            "filename": None,
            "resume_text": None,
            "ats_result": None,
            "ats_history": [],   # [{"score": int, "ts": iso str}]
            "activity": [],      # [{"text": str, "ts": iso str}]
        }
    return STORE[token]


def log_activity(store, text):
    store["activity"].append({"text": text, "ts": datetime.now().strftime("%b %d, %I:%M %p")})
    store["activity"] = store["activity"][-20:]


# ---------------------------------------------------------------
# Simple per-IP rate limit for AI-calling endpoints (in-memory).
# ---------------------------------------------------------------
LIMIT_PER_MINUTE = 15
_request_log = defaultdict(list)


def _rate_limited(ip):
    now = time()
    _request_log[ip] = [t for t in _request_log[ip] if now - t < 60]
    if len(_request_log[ip]) >= LIMIT_PER_MINUTE:
        return True
    _request_log[ip].append(now)
    return False


# ---------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", active="home")


@app.route("/upload")
def upload():
    return render_template("upload.html", active="upload")


@app.route("/result")
def result():
    store = get_store()
    return render_template(
        "result.html",
        active="upload",
        ats=store["ats_result"],
        filename=store["filename"],
    )


@app.route("/chat")
def chat():
    store = get_store()
    return render_template("chat.html", active="chat", has_resume=bool(store["resume_text"]))


@app.route("/interview")
def interview():
    return render_template("interview.html", active="interview", roles=ROLE_LABELS)


@app.route("/dashboard")
def dashboard():
    store = get_store()
    scores = session.get("interview_scores", [])
    ats_result = store["ats_result"]

    ats_history = store["ats_history"]
    trend_labels = [f"Scan {i+1}" for i in range(len(ats_history))]
    trend_scores = [h["score"] for h in ats_history]

    matched = len(ats_result["matched_keywords"]) if ats_result else 0
    missing = len(ats_result["missing_keywords"]) if ats_result else 0

    return render_template(
        "dashboard.html",
        active="dashboard",
        resume_uploaded=bool(store["resume_text"]),
        ats_score=ats_result["score"] if ats_result else None,
        interview_readiness=round(sum(scores) / len(scores)) if scores else None,
        mock_interview_count=session.get("interview_sessions_count", 0),
        activity=list(reversed(store["activity"][-6:])),
        trend_labels=trend_labels,
        trend_scores=trend_scores,
        skill_matched=matched,
        skill_missing=missing,
    )


@app.route("/settings")
def settings():
    return render_template("settings.html", active="settings")


# ---------------------------------------------------------------
# Resume upload + ATS scan
# ---------------------------------------------------------------
@app.route("/api/upload", methods=["POST"])
def api_upload():
    file = request.files.get("resume")
    if not file or file.filename == "":
        return jsonify({"error": "No file uploaded."}), 400
    if not file.filename.lower().endswith((".pdf",)):
        return jsonify({"error": "Please upload a PDF file."}), 400

    try:
        text = extract_pdf_text(file.read())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"PDF parse error: {e}")
        return jsonify({"error": "Couldn't read that PDF — try a different file."}), 400

    if not text:
        return jsonify({"error": "Couldn't extract any text — is this a scanned/image PDF?"}), 400

    store = get_store()
    store["filename"] = file.filename
    store["resume_text"] = text
    store["ats_result"] = None
    log_activity(store, f"Uploaded resume — {file.filename}")

    return jsonify({"filename": file.filename, "chars": len(text)})


@app.route("/api/ats-scan", methods=["POST"])
def api_ats_scan():
    ip = request.remote_addr or "unknown"
    if _rate_limited(ip):
        return jsonify({"error": "Too many requests — please wait a moment and try again."}), 429

    store = get_store()
    if not store["resume_text"]:
        return jsonify({"error": "Upload a resume first."}), 400

    result = scan_resume(store["resume_text"])
    if "error" in result:
        return jsonify(result), 502

    store["ats_result"] = result
    store["ats_history"].append({
        "score": result["score"],
        "ts": datetime.now().strftime("%b %d, %I:%M %p"),
    })
    store["ats_history"] = store["ats_history"][-12:]
    log_activity(store, f"ATS scan completed — score {result['score']}")

    return jsonify(result)


# ---------------------------------------------------------------
# Chat
# ---------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def api_chat():
    ip = request.remote_addr or "unknown"
    if _rate_limited(ip):
        return jsonify({"reply": "Too many messages — please wait a moment and try again."}), 429

    data = request.get_json(silent=True) or {}
    scenario = data.get("scenario")
    message = SCENARIO_PROMPTS.get(scenario) if scenario else (data.get("message") or "").strip()
    display_label = data.get("label") or message

    if not message:
        return jsonify({"reply": "Type a message first!"}), 400

    store = get_store()
    history = session.get("chat_history", [])
    resume_context = store["resume_text"] or ""

    reply = get_reply(message, history=history, resume_context=resume_context)

    history.append({"role": "user", "text": display_label})
    history.append({"role": "model", "text": reply})
    session["chat_history"] = history[-12:]
    log_activity(store, f"Chatted with AI Coach — \u201c{display_label[:40]}\u201d")

    return jsonify({"reply": reply})


# ---------------------------------------------------------------
# Mock interview
# ---------------------------------------------------------------
@app.route("/api/interview/start", methods=["POST"])
def api_interview_start():
    ip = request.remote_addr or "unknown"
    if _rate_limited(ip):
        return jsonify({"error": "Too many requests — please wait a moment and try again."}), 429

    data = request.get_json(silent=True) or {}
    role = data.get("role", "python")
    if role not in ROLE_LABELS:
        role = "python"

    result = start_interview(role)
    if "error" in result:
        return jsonify(result), 502

    session["interview_role"] = role
    session["interview_question"] = result["question"]
    session["interview_scores"] = []
    session["interview_sessions_count"] = session.get("interview_sessions_count", 0) + 1

    store = get_store()
    log_activity(store, f"Started mock interview — {ROLE_LABELS[role]}")

    return jsonify({"question": result["question"], "role_label": ROLE_LABELS[role]})


@app.route("/api/interview/answer", methods=["POST"])
def api_interview_answer():
    ip = request.remote_addr or "unknown"
    if _rate_limited(ip):
        return jsonify({"error": "Too many requests — please wait a moment and try again."}), 429

    data = request.get_json(silent=True) or {}
    answer = (data.get("answer") or "").strip()
    if not answer:
        return jsonify({"error": "Type or record an answer first."}), 400

    role = session.get("interview_role", "python")
    question = session.get("interview_question", "Tell me about yourself.")

    result = continue_interview(role, question, answer)
    if "error" in result:
        return jsonify(result), 502

    scores = session.get("interview_scores", [])
    scores.append(result["score"])
    session["interview_scores"] = scores
    session["interview_question"] = result["next_question"]

    store = get_store()
    log_activity(store, f"Answered mock interview question — scored {result['score']}")

    return jsonify(result)


@app.route("/api/health")
def api_health():
    return jsonify({"gemini_configured": is_configured_public()})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
