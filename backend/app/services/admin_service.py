from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.core.security import hash_password, verify_password


async def get_admin_by_email(email: str):
    return await db.admins.find_one({"email": email.lower().strip()})


async def get_admin_by_id(admin_id: str):
    try:
        return await db.admins.find_one({"_id": ObjectId(admin_id)})
    except Exception:
        return None


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

    result = await db.admins.insert_one(admin_doc)
    admin_doc["_id"] = result.inserted_id
    return admin_doc


async def verify_admin_credentials(email: str, password: str):
    admin = await get_admin_by_email(email)
    if not admin or not admin.get("password_hash"):
        return None
    if verify_password(password, admin["password_hash"]):
        return admin
    return None


async def init_default_admin():
    try:
        existing = await get_admin_by_email("admin@fisat.ac.in")
        if existing:
            await db.admins.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password("admin123"),
                    "role": "admin"
                }}
            )
        else:
            await create_admin({
                "name": "System Administrator",
                "email": "admin@fisat.ac.in",
                "password": "admin123",
                "department": "Central IT & Lab Administration"
            })
    except Exception as e:
        print(f"Default admin initialization notice: {e}")


