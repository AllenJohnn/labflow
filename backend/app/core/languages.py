"""
LabFlow Programming Language Standardization

Allowed programming languages for LabFlow Phase 2:
- C ('c')
- Java ('java')
- Python ('python')

All other languages (C++, SQL, Bash, JavaScript, etc.) are disabled.
"""

ALLOWED_LANGUAGES = {"c", "java", "python"}

LANGUAGE_DISPLAY_NAMES = {
    "c": "C",
    "java": "Java",
    "python": "Python",
}

DEFAULT_COURSE_LANGUAGES = {
    "nsa": "c",
    "adbms": "python",
    "java": "java",
}

def is_allowed_language(lang: str | None) -> bool:
    """Return True if the given language identifier is in ALLOWED_LANGUAGES."""
    if not lang:
        return False
    return str(lang).strip().lower() in ALLOWED_LANGUAGES

def normalize_language(lang: str | None) -> str | None:
    """Normalize language identifier string to canonical lowercase if valid."""
    if not lang:
        return None
    cleaned = str(lang).strip().lower()
    return cleaned if cleaned in ALLOWED_LANGUAGES else None

def get_default_language_for_course(course_id: str | None) -> str:
    """Return canonical default language for a laboratory course."""
    if not course_id:
        return "c"
    return DEFAULT_COURSE_LANGUAGES.get(str(course_id).strip().lower(), "c")

def get_language_display_name(lang: str | None) -> str:
    """Return human-readable display label for a language code."""
    if not lang:
        return "Code"
    norm = str(lang).strip().lower()
    return LANGUAGE_DISPLAY_NAMES.get(norm, norm.upper())
