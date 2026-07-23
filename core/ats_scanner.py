"""
ATS scanning — ports the strict-recruiter prompt from the original notebook,
but asks Gemini for structured JSON instead of markdown so the website can
render real scores, tags, and meters instead of hardcoded numbers.
"""

import json
import re
import logging

from .gemini_client import is_configured, generate_text

logger = logging.getLogger("ats_scanner")

PROMPT_TEMPLATE = """You are an advanced Applicant Tracking System (ATS) and an elite technical recruiter.
Analyze the resume text below ruthlessly but constructively — the way a real ATS plus a skeptical recruiter would.

Respond with STRICT JSON ONLY. No markdown formatting, no code fences, no commentary before or after.
Use exactly this schema:

{{
  "score": <integer 0-100, overall ATS match quality>,
  "verdict": "<2-3 sentence overall verdict — would this pass a 6-second recruiter screen?>",
  "matched_keywords": ["<skill or keyword the resume already covers well>", "..."],
  "missing_keywords": ["<important skill/keyword that's missing or weak>", "..."],
  "strengths": ["<specific thing done well>", "..."],
  "weaknesses": ["<specific ATS red flag or weak bullet point>", "..."],
  "suggestions": ["<specific, actionable fix — rewrite a bullet if useful>", "..."]
}}

Keep each list to 3-6 items. Keep "verdict" to 2-3 sentences.

RESUME TEXT:
{resume_text}
"""


def _extract_json(raw_text):
    text = raw_text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    return json.loads(text)


def scan_resume(resume_text):
    """
    Returns a dict shaped like:
      {score, verdict, matched_keywords, missing_keywords,
       strengths, weaknesses, suggestions}
    or {"error": "..."} on failure. Never raises.
    """
    if not resume_text or not resume_text.strip():
        return {"error": "No resume text to analyze — upload a resume first."}

    if not is_configured():
        logger.error("ATS scan requested but Gemini is not configured")
        return {"error": "The AI scanner is temporarily unavailable. Please try again shortly."}

    try:
        # keep prompts within a safe size
        prompt = PROMPT_TEMPLATE.format(resume_text=resume_text[:14000])
        raw_text = generate_text(prompt)
        data = _extract_json(raw_text)

        data.setdefault("score", 0)
        data.setdefault("verdict", "")
        data.setdefault("matched_keywords", [])
        data.setdefault("missing_keywords", [])
        data.setdefault("strengths", [])
        data.setdefault("weaknesses", [])
        data.setdefault("suggestions", [])

        try:
            data["score"] = max(0, min(100, int(data["score"])))
        except (TypeError, ValueError):
            data["score"] = 0

        return data

    except json.JSONDecodeError:
        logger.error("ATS scan: model returned non-JSON output")
        return {"error": "The AI scanner returned an unexpected format — please try again."}
    except Exception as e:
        logger.error(f"ATS scan error: {e}")
        return {"error": "Something went wrong while scanning your resume. Please try again shortly."}
