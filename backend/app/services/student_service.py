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


async def get_student_by_id(student_id: str):
    try:
        return await db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        return None


async def create_student(user: dict):
    now = datetime.now(timezone.utc)

    password_hash = None
    if "password" in user and user["password"]:
        password_hash = hash_password(user["password"])

    student = {
        "google_id": user.get("sub") or user.get("google_id"),
        "name": user.get("name", "Student User"),
        "email": user["email"].lower().strip(),
        "password_hash": password_hash,
        "profile_picture": user.get("picture"),
        "student_id": user.get("student_id"),
        "department": user.get("department", "MCA"),
        "semester": user.get("semester", 1),
        "role": "student",
        "github_username": user.get("github_username"),
        "github_connected": bool(user.get("github_username")),
        "onboarding_completed": bool(user.get("onboarding_completed", False)),
        "created_at": now,
        "updated_at": now
    }

    result = await db.students.insert_one(student)
    student["_id"] = result.inserted_id
    return student


async def verify_student_credentials(email: str, password: str):
    student = await get_student_by_email(email)
    if not student or not student.get("password_hash"):
        return None
    if verify_password(password, student["password_hash"]):
        return student
    return None


async def update_student_profile(student_id: str, profile_data: dict):
    now = datetime.now(timezone.utc)
    update_fields = {
        "updated_at": now,
        "onboarding_completed": True
    }

    allowed_keys = ["student_id", "department", "semester", "github_username"]
    for key in allowed_keys:
        if key in profile_data and profile_data[key] is not None:
            update_fields[key] = profile_data[key]

    if "github_username" in update_fields:
        update_fields["github_connected"] = bool(update_fields["github_username"])

    await db.students.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update_fields}
    )

    return await get_student_by_id(student_id)


async def init_default_student():
    try:
        existing = await get_student_by_email("student@fisat.ac.in")
        if existing:
            await db.students.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password("student123"),
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
                        "email": "student@fisat.ac.in",
                        "password_hash": hash_password("student123"),
                        "role": "student",
                        "onboarding_completed": True
                    }}
                )
            else:
                await create_student({
                    "name": "Alex Johnson",
                    "email": "student@fisat.ac.in",
                    "password": "student123",
                    "student_id": "FIT25MCA-2008",
                    "department": "MCA",
                    "semester": 2,
                    "github_username": "alexj-fisat",
                    "onboarding_completed": True
                })
    except Exception as e:
        print(f"Default student initialization notice: {e}")



