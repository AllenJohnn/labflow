from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict

from app.dependencies.auth import get_current_student
from app.services.student_service import (
    update_student_profile,
    get_student_assigned_laboratories,
    get_student_assigned_exercises,
)

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


@router.get("/laboratories")
async def get_student_laboratories_route(current_student: dict = Depends(get_current_student)):
    """Retrieve assigned laboratories for current student."""
    labs = await get_student_assigned_laboratories()
    return {
        "status": "success",
        "data": labs
    }


@router.get("/laboratories/{course_id}/exercises")
async def get_student_course_exercises_route(
    course_id: str,
    current_student: dict = Depends(get_current_student)
):
    """Retrieve only assigned exercises for this course."""
    exercises = await get_student_assigned_exercises(course_id)
    return {
        "status": "success",
        "data": exercises
    }


@router.get("/exercises")
async def get_all_student_exercises_route(current_student: dict = Depends(get_current_student)):
    """Retrieve all assigned exercises across courses."""
    exercises = await get_student_assigned_exercises()
    return {
        "status": "success",
        "data": exercises
    }


class LabCheckInSchema(BaseModel):
    course_id: str | None = Field(default=None, description="Optional target course ID for check-in")
    model_config = ConfigDict(extra="ignore")


@router.get("/attendance")
async def get_student_attendance_route(current_student: dict = Depends(get_current_student)):
    """Retrieve student attendance dashboard data without altering attendance records."""
    from app.services.attendance_service import get_student_attendance_data
    attendance_data = await get_student_attendance_data(current_student)
    return {
        "status": "success",
        "data": attendance_data
    }


@router.post("/laboratories/{course_id}/enter")
async def student_enter_laboratory_route(
    course_id: str,
    current_student: dict = Depends(get_current_student)
):
    """
    Triggered when a student enters/opens a specific laboratory.
    Validates enrollment and timetable active session before logging attendance.
    """
    from app.services.attendance_service import record_student_lab_attendance
    result = await record_student_lab_attendance(current_student, course_id, is_manual=False)
    
    if result["status"] == "not_enrolled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result["message"]
        )

    return {
        "status": "success",
        "data": result
    }


@router.post("/attendance/check-in")
async def student_manual_check_in(
    payload: LabCheckInSchema | None = None,
    current_student: dict = Depends(get_current_student)
):
    """
    Manual student check-in for current active lab session.
    Strictly validates timetable active session, enrollment, and grace period.
    """
    from app.services.attendance_service import (
        record_student_lab_attendance,
        get_active_or_next_lab_session,
        get_student_attendance_data
    )

    target_course_id = payload.course_id if (payload and payload.course_id) else None
    if not target_course_id:
        session_info = get_active_or_next_lab_session()
        active = session_info.get("active_session")
        if active and active.get("is_active_now"):
            target_course_id = active.get("course_id")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No scheduled laboratory session is currently active for check-in."
            )

    result = await record_student_lab_attendance(current_student, target_course_id, is_manual=True)

    if result["status"] == "not_enrolled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result["message"]
        )
    elif result["status"] == "no_active_session":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    summary = await get_student_attendance_data(current_student)

    return {
        "status": "success",
        "message": result["message"],
        "data": {
            "result": result,
            "summary": summary
        }
    }



