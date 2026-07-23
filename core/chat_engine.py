"""
Chat engine — talks to Gemini using the shared server-side client.
Visitors to the site never see, enter, or need an API key.
"""

import logging

from .gemini_client import is_configured, generate_text

logger = logging.getLogger("chat_engine")

SYSTEM_CONTEXT = (
    "You are an elite tech career coach and senior technical recruiter, embedded "
    "in a resume and interview-prep website. Give concise, practical, encouraging "
    "advice about resumes, ATS optimization, interview answers, salary negotiation, "
    "and career strategy. Ground your answers in the candidate's resume when it's "
    "provided. Keep replies under 150 words unless the user asks for something longer."
)

SCENARIO_PROMPTS = {
    "swe_review": (
        "Perform a detailed resume review specifically tailored for a Software "
        "Engineering (SWE) role. Evaluate tech stack positioning, project impact "
        "metrics, system architecture exposure, and bullet point structure."
    ),
    "ats_gap": (
        "Conduct a strict ATS (Applicant Tracking System) gap analysis. Identify "
        "missing technical keywords, section formatting risks, unparsed acronyms, "
        "and missing industry-standard terms for tech roles."
    ),
    "salary": (
        "Based on the experience level, skills, and projects in this resume, "
        "provide tailored salary negotiation advice. Include how to position past "
        "achievements to justify higher compensation during offer calls."
    ),
    "interview_prep": (
        "Generate 5 targeted mock interview questions (a mix of technical "
        "deep-dives and behavioral STAR-method questions) based directly on the "
        "projects and experience listed in this resume."
    ),
    "cover_letter": (
        "Draft a professional, compelling 3-paragraph cover letter for a "
        "software/tech position using the candidate's actual projects and "
        "achievements from the resume."
    ),
}


def is_configured_public():
    return is_configured()


def get_reply(message, history=None, resume_context=""):
    if not message or not message.strip():
        return "Ask me anything about your resume, ATS score, or interview prep."

    if not is_configured():
        logger.error("Chat requested but Gemini is not configured")
        return (
            "The AI coach is temporarily unavailable — the team has been "
            "notified. Please try again shortly."
        )

    try:
        prompt_parts = [SYSTEM_CONTEXT]
        if resume_context:
            prompt_parts.append(f"Candidate's resume:\n{resume_context[:8000]}")
        if history:
            convo = "\n".join(f"{h['role']}: {h['text']}" for h in history[-6:])
            prompt_parts.append(f"Recent conversation:\n{convo}")
        prompt_parts.append(f"User: {message}")

        text = (generate_text("\n\n".join(prompt_parts)) or "").strip()
        return text if text else "I couldn't generate a response — try rephrasing that?"

    except Exception as e:
        msg = str(e)
        logger.error(f"Gemini error: {msg}")

        if "429" in msg or "RESOURCE_EXHAUSTED" in msg.upper() or "quota" in msg.lower():
            return "I'm getting a lot of requests right now — try again in a minute."
        if any(code in msg.upper() for code in ["401", "403", "API_KEY_INVALID", "UNAUTHENTICATED", "PERMISSION_DENIED"]):
            logger.critical("Gemini API key invalid or misconfigured — check .env")
            return "The AI coach is temporarily unavailable. We're on it."

        return "Something went wrong on our end — please try again shortly."
