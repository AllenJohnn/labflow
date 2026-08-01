from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health():
    return {
        "status": "ok",
        "service": "LabFlow API",
        "version": "1.0.0"
    }