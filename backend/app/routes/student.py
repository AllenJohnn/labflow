from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies.auth import get_current_student
from app.services.student_service import update_student_profile

router = APIRouter()


class ProfileUpdateSchema(BaseModel):
    student_id: str = Field(..., min_length=2, description="Student Roll or Register Number (e.g. FIT25MCA-2008)")
    department: str = Field(default="MCA", min_length=2, description="Department (e.g. MCA, SCE, CSE, EEE)")
    semester: int = Field(default=1, ge=1, le=8, description="Current Semester (1-8)")
    github_username: str | None = None


@router.get("/me")
async def get_my_profile(current_student: dict = Depends(get_current_student)):
    return {
        "status": "success",
        "data": current_student
    }


@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateSchema,
    current_student: dict = Depends(get_current_student)
):
    student_id = current_student["_id"]
    updated_student = await update_student_profile(
        student_id=student_id,
        profile_data=payload.model_dump()
    )

    if not updated_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update student profile"
        )

    updated_student["_id"] = str(updated_student["_id"])

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "data": updated_student
    }
