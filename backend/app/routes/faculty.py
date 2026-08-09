from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies.auth import get_current_faculty
from app.services.faculty_service import update_faculty_profile

router = APIRouter()


class FacultyProfileUpdateSchema(BaseModel):
    faculty_id: str | None = Field(default=None, description="Faculty ID (e.g. FAC-MCA-001)")
    department: str | None = Field(default="MCA", description="Department (e.g. MCA, CSE, EEE)")
    designation: str | None = Field(default="Assistant Professor", description="Designation")
    name: str | None = Field(default=None, description="Faculty Full Name")


@router.get("/me")
async def get_my_faculty_profile(current_faculty: dict = Depends(get_current_faculty)):
    user_data = dict(current_faculty)
    if "password_hash" in user_data:
        del user_data["password_hash"]
    return {
        "status": "success",
        "data": user_data
    }


@router.put("/profile")
async def update_profile(
    payload: FacultyProfileUpdateSchema,
    current_faculty: dict = Depends(get_current_faculty)
):
    faculty_id = current_faculty["_id"]
    updated_faculty = await update_faculty_profile(
        faculty_id=faculty_id,
        profile_data=payload.model_dump(exclude_unset=True)
    )

    if not updated_faculty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update faculty profile"
        )

    updated_faculty["_id"] = str(updated_faculty["_id"])
    if "password_hash" in updated_faculty:
        del updated_faculty["password_hash"]

    return {
        "status": "success",
        "message": "Faculty profile updated successfully",
        "data": updated_faculty
    }
