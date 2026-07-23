"""
Shared Gemini configuration used by chat, ATS scanning, and interviews.
Uses Google's newer `google-genai` SDK (successor to `google-generativeai`),
which correctly supports the newer "AQ." API key format that Google rolled
out in 2026 alongside the older "AIza..." format.

Configured once from the server-side .env key — visitors never touch this.

Google's free-tier model lineup has been shifting frequently through 2026
(models get deprecated, quotas change per-account). Rather than hardcode one
model name that can silently break, we try a short list of candidates in
order and cache whichever one actually works for this account/key — so the
app self-adjusts instead of needing a manual model-name chase every time
Google changes something.
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("gemini_client")

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

# Tried in order — first one that successfully responds is cached and reused.
MODEL_CANDIDATES = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]

_client = None
_init_error = None
_working_model = None  # cached once we find one that responds

if not API_KEY:
    _init_error = "GEMINI_API_KEY is missing from .env"
    logger.warning(_init_error)
else:
    try:
        from google import genai

        _client = genai.Client(api_key=API_KEY)
    except Exception as e:
        _init_error = f"Gemini failed to initialize: {e}"
        logger.error(_init_error)


def is_configured():
    return _client is not None


def get_client():
    return _client


def get_init_error():
    return _init_error


def generate_text(prompt):
    """
    Runs a single-turn generation and returns the plain text reply.

    Tries MODEL_CANDIDATES in order the first time; once one works, it's
    cached in _working_model and used directly on every later call (no
    repeated trial-and-error once we know what works for this account).

    Raises the last error if every candidate fails — callers already catch
    and log this.
    """
    global _working_model

    if _working_model:
        response = _client.models.generate_content(model=_working_model, contents=prompt)
        return response.text

    last_error = None
    for candidate in MODEL_CANDIDATES:
        try:
            response = _client.models.generate_content(model=candidate, contents=prompt)
            _working_model = candidate
            logger.info(f"Gemini model selected and cached: {candidate}")
            return response.text
        except Exception as e:
            logger.warning(f"Model '{candidate}' failed ({e}); trying next candidate.")
            last_error = e

    raise last_error
