import os
from datetime import datetime, timezone
from bson import ObjectId

from app.database.mongodb import db
from app.core.security import hash_password, verify_password


async def get_student_by_google_id(google_id: str):
    return await db.students.find_one({
        "google_id": google_id
    })


async def get_student_by_email(email: str):
    return await db.students.find_one({
        "email": email.lower().strip()
    })


async def get_student_by_id(student_db_id: str):
    try:
        return await db.students.find_one({"_id": ObjectId(student_db_id)})
    except Exception:
        return None


async def create_student(data: dict):
    now = datetime.now(timezone.utc)

    password_hash = None
    if "password" in data and data["password"]:
        password_hash = hash_password(data["password"])

    student_doc = {
        "google_id": data.get("google_id"),
        "name": data.get("name", "Student"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "profile_picture": data.get("profile_picture"),
        "student_id": data.get("student_id"),
        "department": data.get("department", "MCA"),
        "semester": data.get("semester", 1),
        "github_username": data.get("github_username"),
        "phone": data.get("phone", ""),
        "avatar": data.get("avatar", ""),
        "role": "student",
        "onboarding_completed": bool(data.get("onboarding_completed", False)),
        "created_at": now,
        "updated_at": now
    }

    result = await db.students.insert_one(student_doc)
    student_doc["_id"] = result.inserted_id
    return student_doc


async def verify_student_credentials(email: str, password: str):
    student = await get_student_by_email(email)
    if not student or not student.get("password_hash"):
        return None
    if verify_password(password, student["password_hash"]):
        return student
    return None


async def get_all_students():
    cursor = db.students.find({})
    return await cursor.to_list(length=500)


async def update_student_profile(student_id: str, profile_data: dict):
    now = datetime.now(timezone.utc)
    update_fields = {
        "updated_at": now
    }

    allowed_keys = [
        "student_id", "department", "semester", "github_username",
        "phone", "name", "avatar", "onboarding_completed"
    ]
    for key in allowed_keys:
        if key in profile_data and profile_data[key] is not None:
            update_fields[key] = profile_data[key]

    await db.students.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update_fields}
    )

    return await get_student_by_id(student_id)


DEFAULT_STUDENT_EMAIL = os.getenv("DEFAULT_STUDENT_EMAIL", "student@fisat.ac.in")
DEFAULT_STUDENT_PASS = os.getenv("DEFAULT_STUDENT_PASSWORD", "student123")


async def init_default_student():
    try:
        email = DEFAULT_STUDENT_EMAIL
        password = DEFAULT_STUDENT_PASS
        existing = await get_student_by_email(email)
        if existing:
            await db.students.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password(password),
                    "role": "student",
                    "onboarding_completed": True
                }}
            )
        else:
            existing_by_roll = await db.students.find_one({"student_id": "FIT25MCA-2008"})
            if existing_by_roll:
                await db.students.update_one(
                    {"_id": existing_by_roll["_id"]},
                    {"$set": {
                        "email": email,
                        "password_hash": hash_password(password),
                        "role": "student",
                        "onboarding_completed": True
                    }}
                )
            else:
                await create_student({
                    "name": "Alex Johnson",
                    "email": email,
                    "password": password,
                    "student_id": "FIT25MCA-2008",
                    "department": "MCA",
                    "semester": 2,
                    "github_username": "alexj-fisat",
                    "onboarding_completed": True
                })
    except Exception as e:
        print(f"Default student initialization notice: {e}")