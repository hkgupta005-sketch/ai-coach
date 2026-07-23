"""
Mock interview logic, ported from the notebook's chat-session approach but
made stateless per-request (Flask-friendly) — the conversation history lives
in the browser session, not in a long-lived Python chat object.
"""

import json
import re
import logging

from .gemini_client import is_configured, generate_text

logger = logging.getLogger("interview_engine")

ROLE_LABELS = {
    "python": "Python Developer",
    "data_science": "Data Science & Machine Learning",
    "web_dev": "Web Developer",
    "behavioral": "Behavioral (STAR method)",
}

SYSTEM_PROMPT = (
    "You are an elite technical interviewer running a live mock interview for a "
    "{role} position. Ask one question at a time. After each candidate answer, "
    "score that specific answer from 0-100 for quality and completeness, give "
    "1-2 concise sentences of constructive feedback, then ask the next question. "
    "Keep questions and feedback natural and concise."
)


def _extract_json(raw_text):
    text = raw_text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    return json.loads(text)


def start_interview(role_key):
    """Returns {"question": "..."} — the opening question for the chosen role."""
    role_label = ROLE_LABELS.get(role_key, "Software Engineering")

    if not is_configured():
        logger.error("Interview start requested but Gemini not configured")
        return {"error": "The AI interviewer is temporarily unavailable. Please try again shortly."}

    try:
        prompt = (
            SYSTEM_PROMPT.format(role=role_label)
            + "\n\nThis is the start of the interview — there is no prior answer yet.\n"
            + 'Respond with STRICT JSON ONLY, exactly: {"next_question": "<your first question>"}'
        )
        raw_text = generate_text(prompt)
        data = _extract_json(raw_text)
        return {"question": data.get("next_question") or "Tell me about a project you're proud of."}
    except Exception as e:
        logger.error(f"Interview start error: {e}")
        return {"question": "Tell me about a challenging project you've worked on recently."}


def continue_interview(role_key, question, answer):
    """
    Given the question just asked and the candidate's answer, returns:
      {"feedback": "...", "score": <0-100>, "next_question": "..."}
    """
    role_label = ROLE_LABELS.get(role_key, "Software Engineering")

    if not is_configured():
        return {"error": "The AI interviewer is temporarily unavailable. Please try again shortly."}

    try:
        prompt = (
            SYSTEM_PROMPT.format(role=role_label)
            + f"\n\nQuestion just asked: {question}\nCandidate's answer: {answer}\n\n"
            + "Respond with STRICT JSON ONLY, exactly this shape:\n"
            + '{"feedback": "<1-2 sentence constructive feedback>", '
            + '"score": <integer 0-100>, '
            + '"next_question": "<the next interview question>"}'
        )
        raw_text = generate_text(prompt)
        data = _extract_json(raw_text)

        try:
            score = max(0, min(100, int(data.get("score", 70))))
        except (TypeError, ValueError):
            score = 70

        return {
            "feedback": data.get("feedback") or "Solid answer — keep it structured and specific.",
            "score": score,
            "next_question": data.get("next_question") or "Tell me about another relevant experience.",
        }
    except Exception as e:
        logger.error(f"Interview continue error: {e}")
        return {
            "feedback": "Good attempt — try adding a measurable outcome next time.",
            "score": 70,
            "next_question": "Tell me about a time you disagreed with a teammate. What happened?",
        }
