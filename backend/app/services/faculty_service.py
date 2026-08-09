import os
from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.core.security import hash_password, verify_password


async def get_faculty_by_email(email: str):
    return await db.faculty.find_one({"email": email.lower().strip()})


async def get_faculty_by_id(faculty_id: str):
    try:
        return await db.faculty.find_one({"_id": ObjectId(faculty_id)})
    except Exception:
        return None


async def get_faculty_by_google_id(google_id: str):
    return await db.faculty.find_one({"google_id": google_id})


async def create_faculty(data: dict):
    password_hash = None
    if "password" in data and data["password"]:
        password_hash = hash_password(data["password"])

    doc = {
        "name": data.get("name", ""),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "faculty_id": data.get("faculty_id", ""),
        "department": data.get("department", "Computer Applications"),
        "designation": data.get("designation", "Assistant Professor"),
        "phone": data.get("phone", ""),
        "office_location": data.get("office_location", ""),
        "avatar": data.get("avatar", ""),
        "assigned_subjects": data.get("assigned_subjects", []),
        "assigned_labs": data.get("assigned_labs", []),
        "role": "faculty",
        "onboarding_completed": data.get("onboarding_completed", True),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.faculty.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def verify_faculty_credentials(email: str, password: str):
    faculty = await get_faculty_by_email(email)
    if not faculty or not faculty.get("password_hash"):
        return None
    if verify_password(password, faculty["password_hash"]):
        return faculty
    return None


async def get_all_faculty():
    cursor = db.faculty.find({})
    return await cursor.to_list(length=200)


async def update_faculty_profile(faculty_id: str, update_fields: dict):
    update_fields["updated_at"] = datetime.now(timezone.utc)
    await db.faculty.update_one(
        {"_id": ObjectId(faculty_id)},
        {"$set": update_fields}
    )

    return await get_faculty_by_id(faculty_id)


DEFAULT_FACULTY_EMAIL = os.getenv("DEFAULT_FACULTY_EMAIL", "faculty@fisat.ac.in")
DEFAULT_FACULTY_PASS = os.getenv("DEFAULT_FACULTY_PASSWORD", "faculty123")


async def init_default_faculty():
    try:
        email = DEFAULT_FACULTY_EMAIL
        password = DEFAULT_FACULTY_PASS
        existing = await get_faculty_by_email(email)
        if existing:
            await db.faculty.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password(password),
                    "role": "faculty",
                    "onboarding_completed": True
                }}
            )
        else:
            await create_faculty({
                "name": "Dr. Sarah Thomas",
                "email": email,
                "password": password,
                "faculty_id": "FAC-MCA-001",
                "department": "MCA",
                "designation": "Associate Professor",
                "onboarding_completed": True
            })
    except Exception as e:
        print(f"Default faculty initialization notice: {e}")
