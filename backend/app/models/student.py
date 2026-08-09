from datetime import datetime
from pydantic import BaseModel, EmailStr


class Student(BaseModel):
    google_id: str
    name: str
    email: EmailStr
    profile_picture: str | None = None

    student_id: str | None = None
    department: str | None = None
    semester: int | None = None

    github_username: str | None = None
    github_connected: bool = False

    created_at: datetime
    updated_at: datetime