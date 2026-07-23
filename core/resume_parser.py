"""
Resume PDF -> plain text extraction.
"""

import io
import logging
from pypdf import PdfReader

logger = logging.getLogger("resume_parser")


def extract_pdf_text(file_bytes):
    """
    file_bytes: raw bytes of an uploaded PDF.
    Returns extracted text as a string. Raises ValueError on unreadable files.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        logger.error(f"Could not open PDF: {e}")
        raise ValueError("That file doesn't look like a valid PDF.")

    text = "".join((page.extract_text() or "") + "\n" for page in reader.pages)
    return text.strip()
