import os
from datetime import datetime, timezone
from bson import ObjectId

from app.database.mongodb import db
from app.core.security import hash_password, verify_password

DEFAULT_STUDENT_EMAIL = os.getenv("DEFAULT_STUDENT_EMAIL", "student@fisat.ac.in")
DEFAULT_STUDENT_PASS = os.getenv("DEFAULT_STUDENT_PASSWORD", "student123")


async def get_student_by_google_id(google_id: str):
    if not google_id:
        return None
    return await db.students.find_one({"google_id": google_id})


async def get_student_by_email(email: str):
    if not email:
        return None
    return await db.students.find_one({"email": email.lower().strip()})


async def get_student_by_id(student_db_id: str):
    if not student_db_id or not ObjectId.is_valid(student_db_id):
        return None
    return await db.students.find_one({"_id": ObjectId(student_db_id)})


async def create_student(data: dict):
    now = datetime.now(timezone.utc)

    password_hash = None
    if "password" in data and data["password"]:
        password_hash = hash_password(data["password"])

    github_user = (data.get("github_username") or "").strip()

    student_doc = {
        "google_id": data.get("google_id"),
        "name": data.get("name", "Student User"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "profile_picture": data.get("profile_picture"),
        "student_id": data.get("student_id"),
        "department": data.get("department", "MCA"),
        "semester": data.get("semester", 2),
        "github_username": github_user,
        "github_connected": bool(github_user),
        "phone": data.get("phone", ""),
        "avatar": data.get("avatar", ""),
        "role": "student",
        "onboarding_completed": True,
        "created_at": now,
        "updated_at": now
    }


    try:
        result = await db.students.insert_one(student_doc)
        student_doc["_id"] = result.inserted_id
        print(f"[Auth] Student created successfully in MongoDB: {student_doc['email']}")
        return student_doc
    except Exception as e:
        print(f"[Auth] Error creating student in MongoDB ({data.get('email')}): {e}")
        raise


async def link_student_google_account(student_id: str, google_id: str, picture: str | None = None):
    now = datetime.now(timezone.utc)
    update_fields = {
        "google_id": google_id,
        "updated_at": now
    }
    if picture:
        update_fields["profile_picture"] = picture

    if not ObjectId.is_valid(student_id):
        return None

    try:
        await db.students.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": update_fields}
        )
        print(f"[Auth] Linked Google ID {google_id} to existing student document {student_id}")
        return await get_student_by_id(student_id)
    except Exception as e:
        print(f"[Auth] Error linking Google account for student {student_id}: {e}")
        raise


async def verify_student_credentials(email: str, password: str):
    clean_email = email.lower().strip()
    student = await get_student_by_email(clean_email)
    if student and student.get("password_hash"):
        if verify_password(password, student["password_hash"]):
            return student

    return None


async def get_all_students():
    cursor = db.students.find({})
    return await cursor.to_list(length=500)


async def update_student_profile(student_id: str, profile_data: dict):
    now = datetime.now(timezone.utc)
    update_fields = {"updated_at": now}

    # SECURITY ENFORCEMENT: Students can ONLY edit github_username.
    if "github_username" in profile_data:
        github_val = (profile_data["github_username"] or "").strip()
        update_fields["github_username"] = github_val
        update_fields["github_connected"] = bool(github_val)

    if not ObjectId.is_valid(student_id):
        return None

    try:
        result = await db.students.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return None
        print(f"[Student] Profile github_username updated for student {student_id}")
        return await get_student_by_id(student_id)
    except Exception as e:
        print(f"[Student] Error updating profile for student {student_id}: {e}")
        raise


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
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"[Database] Default student initialized/verified in MongoDB: {email}")
        else:
            await create_student({
                "name": "Allen John",
                "email": email,
                "password": password,
                "student_id": "FIT25MCA-2008",
                "department": "MCA",
                "semester": 2,
                "github_username": "allenjohn",
                "onboarding_completed": True
            })
            print(f"[Database] Default student inserted in MongoDB: {email}")
    except Exception as e:
        print(f"[Database] Default student initialization notice: {e}")