from datetime import datetime, timedelta, timezone
from jose import jwt

from app.config.settings import settings


def create_access_token(student_id: str, google_id: str):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRE_MINUTES
    )

    payload = {
        "sub": student_id,
        "google_id": google_id,
        "role": "student",
        "exp": expire
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )