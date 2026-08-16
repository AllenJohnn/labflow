from fastapi import APIRouter
from app.database.mongodb import db

router = APIRouter()

@router.get("/")
async def health():
    try:
        await db.command("ping")

        return {
            "status": "ok",
            "service": "LabFlow API",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(e)
        }
