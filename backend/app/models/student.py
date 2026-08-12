from datetime import datetime
from pydantic import BaseModel, EmailStr


class Student(BaseModel):

    google_id: str | None = None
    name: str
    email: EmailStr
    profile_picture: str | None = None

    student_id: str | None = None
    department: str | None = None
    semester: int | None = None

    github_username: str | None = None
    github_connected: bool = False
    phone: str | None = None
    avatar: str | None = None
    role: str = "student"
    onboarding_completed: bool = True

    created_at: datetime
    updated_at: datetime