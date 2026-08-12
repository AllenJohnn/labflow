from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict

from app.dependencies.auth import get_current_student
from app.services.student_service import update_student_profile

router = APIRouter()


class ProfileUpdateSchema(BaseModel):
    github_username: str | None = Field(default=None, description="Only GitHub username is editable by students")

    model_config = ConfigDict(extra="forbid")


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
    student_id = str(current_student["_id"])
    
    # Strictly pass only github_username payload to service
    updated_student = await update_student_profile(
        student_id=student_id,
        profile_data={"github_username": payload.github_username}
    )

    if not updated_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update student profile"
        )

    updated_student["_id"] = str(updated_student["_id"])

    return {
        "status": "success",
        "message": "GitHub profile updated successfully",
        "data": updated_student
    }

