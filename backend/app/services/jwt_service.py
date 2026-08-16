from datetime import datetime, timedelta, timezone
from jose import jwt

from app.config.settings import settings

def create_access_token(
    user_id: str,
    role: str = "student",
    google_id: str | None = None,
    name: str = "",
    email: str = "",
    picture: str = ""
):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "role": role,
        "google_id": google_id,
        "name": name,
        "email": email,
        "picture": picture,
        "exp": expire
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except Exception:
        return None
