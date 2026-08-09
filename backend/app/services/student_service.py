from datetime import datetime, timezone

from app.database.mongodb import db


async def get_student_by_google_id(google_id: str):
    return await db.students.find_one({
        "google_id": google_id
    })


async def create_student(user: dict):
    now = datetime.now(timezone.utc)

    student = {
        "google_id": user["sub"],
        "name": user.get("name"),
        "email": user.get("email"),
        "profile_picture": user.get("picture"),
        "student_id": None,
        "department": None,
        "semester": None,
        "github_username": None,
        "github_connected": False,
        "created_at": now,
        "updated_at": now
    }

    result = await db.students.insert_one(student)

    student["_id"] = result.inserted_id

    return student