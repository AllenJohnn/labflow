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
    now = datetime.now(timezone.utc)
    
    password_hash = None
    if "password" in data and data["password"]:
        password_hash = hash_password(data["password"])

    faculty_doc = {
        "google_id": data.get("google_id"),
        "name": data.get("name", "Faculty Member"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "profile_picture": data.get("profile_picture"),
        "faculty_id": data.get("faculty_id"),
        "department": data.get("department", "MCA"),
        "designation": data.get("designation", "Assistant Professor"),
        "role": "faculty",
        "onboarding_completed": bool(data.get("onboarding_completed", False)),
        "created_at": now,
        "updated_at": now
    }

    result = await db.faculty.insert_one(faculty_doc)
    faculty_doc["_id"] = result.inserted_id
    return faculty_doc


async def verify_faculty_credentials(email: str, password: str):
    faculty = await get_faculty_by_email(email)
    if not faculty or not faculty.get("password_hash"):
        return None
    if verify_password(password, faculty["password_hash"]):
        return faculty
    return None


async def update_faculty_profile(faculty_id: str, profile_data: dict):
    now = datetime.now(timezone.utc)
    update_fields = {
        "updated_at": now,
        "onboarding_completed": True
    }

    allowed_keys = ["faculty_id", "department", "designation", "name"]
    for key in allowed_keys:
        if key in profile_data and profile_data[key] is not None:
            update_fields[key] = profile_data[key]

    await db.faculty.update_one(
        {"_id": ObjectId(faculty_id)},
        {"$set": update_fields}
    )

    return await get_faculty_by_id(faculty_id)


async def init_default_faculty():
    try:
        existing = await get_faculty_by_email("faculty@fisat.ac.in")
        if existing:
            await db.faculty.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password("faculty123"),
                    "role": "faculty",
                    "onboarding_completed": True
                }}
            )
        else:
            await create_faculty({
                "name": "Dr. Sarah Thomas",
                "email": "faculty@fisat.ac.in",
                "password": "faculty123",
                "faculty_id": "FAC-MCA-001",
                "department": "MCA",
                "designation": "Associate Professor",
                "onboarding_completed": True
            })
    except Exception as e:
        print(f"Default faculty initialization notice: {e}")



