from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_admin
from app.database.mongodb import db

router = APIRouter()


@router.get("/me")
async def get_my_admin_profile(current_admin: dict = Depends(get_current_admin)):
    user_data = dict(current_admin)
    if "password_hash" in user_data:
        del user_data["password_hash"]
    return {
        "status": "success",
        "data": user_data
    }


@router.get("/stats")
async def get_admin_dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    total_students = await db.students.count_documents({})
    total_faculty = await db.faculty.count_documents({})
    total_admins = await db.admins.count_documents({})

    return {
        "status": "success",
        "data": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_admins": total_admins,
            "system_status": "Operational",
            "active_term": "Academic Year 2025-2026 (Even Sem)"
        }
    }
