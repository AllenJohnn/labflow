import os
from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.core.security import hash_password, verify_password

DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@fisat.ac.in")
DEFAULT_ADMIN_PASS = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")


async def get_admin_by_email(email: str):
    if not email:
        return None
    return await db.admins.find_one({"email": email.lower().strip()})


async def get_admin_by_id(admin_id: str):
    if not admin_id or not ObjectId.is_valid(admin_id):
        return None
    return await db.admins.find_one({"_id": ObjectId(admin_id)})


async def create_admin(data: dict):
    now = datetime.now(timezone.utc)
    password_hash = hash_password(data["password"])

    admin_doc = {
        "name": data.get("name", "System Administrator"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "role": "admin",
        "department": data.get("department", "Central IT"),
        "created_at": now,
        "updated_at": now
    }

    try:
        result = await db.admins.insert_one(admin_doc)
        admin_doc["_id"] = result.inserted_id
        print(f"[Auth] Admin created successfully in MongoDB: {admin_doc['email']}")
        return admin_doc
    except Exception as e:
        print(f"[Auth] Error creating admin in MongoDB ({data.get('email')}): {e}")
        raise


async def verify_admin_credentials(email: str, password: str):
    clean_email = email.lower().strip()
    admin = await get_admin_by_email(clean_email)
    if admin and admin.get("password_hash"):
        if verify_password(password, admin["password_hash"]):
            return admin

    return None


async def init_default_admin():
    try:
        email = DEFAULT_ADMIN_EMAIL
        password = DEFAULT_ADMIN_PASS
        existing = await get_admin_by_email(email)
        if existing:
            await db.admins.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password(password),
                    "role": "admin",
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"[Database] Default admin initialized/verified in MongoDB: {email}")
        else:
            await create_admin({
                "name": "System Administrator",
                "email": email,
                "password": password,
                "department": "Central IT & Lab Administration"
            })
            print(f"[Database] Default admin inserted in MongoDB: {email}")
    except Exception as e:
        print(f"[Database] Default admin initialization notice: {e}")

