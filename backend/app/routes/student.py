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

from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.core.languages import ALLOWED_LANGUAGES, is_allowed_language

class StudentSubmissionCreateSchema(BaseModel):
    code: str = Field(..., min_length=1, description="Source code content for submission")
    language: str | None = Field(default=None, description="Programming language: c, java, or python")
    comments: str | None = Field(default="", description="Optional student comments")
    stdin: str = Field(default="", description="Optional standard input")

    model_config = ConfigDict(extra="ignore")

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str | None) -> str | None:
        if v is not None:
            clean = v.strip().lower()
            if clean not in ALLOWED_LANGUAGES:
                raise ValueError(
                    f"Unsupported programming language '{v}'. LabFlow supports only: C ('c'), Java ('java'), Python ('python')."
                )
            return clean
        return v

@router.get("/laboratories")
async def get_student_laboratories_route(current_student: dict = Depends(get_current_student)):
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
    exercises = await get_student_assigned_exercises(course_id, current_student)
    return {
        "status": "success",
        "data": exercises
    }

@router.get("/exercises")
async def get_all_student_exercises_route(current_student: dict = Depends(get_current_student)):
    exercises = await get_student_assigned_exercises(None, current_student)
    return {
        "status": "success",
        "data": exercises
    }

@router.get("/submissions")
async def get_my_submissions_route(current_student: dict = Depends(get_current_student)):
    from app.services.submission_service import get_student_submissions
    submissions = await get_student_submissions(current_student)
    return {
        "status": "success",
        "data": submissions
    }

@router.get("/exercises/{exercise_id}/submission")
async def get_my_exercise_submission_route(
    exercise_id: str,
    current_student: dict = Depends(get_current_student)
):
    from app.services.submission_service import get_student_exercise_submission
    sub = await get_student_exercise_submission(current_student, exercise_id)
    return {
        "status": "success",
        "data": sub
    }

class ExecutionRequestSchema(BaseModel):
    language: str = Field(..., description="Programming language: c, java, or python")
    code: str = Field(..., description="Source code content to execute")
    stdin: str = Field(default="", description="Optional standard input")
    
    model_config = ConfigDict(extra="ignore")
    
    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_LANGUAGES:
            raise ValueError(f"Unsupported language '{v}'. Allowed: {ALLOWED_LANGUAGES}")
        return clean

@router.post("/sandbox/run")
async def run_sandbox_code(
    payload: ExecutionRequestSchema,
    current_student: dict = Depends(get_current_student)
):
    from app.services.judge0_service import execute_code as judge0_execute, is_judge0_configured
    from app.services.execution_service import execute_code as local_execute
    
    student_id = str(current_student["_id"])
    
    if is_judge0_configured():
        result = await judge0_execute(
            student_id=student_id,
            language=payload.language,
            code=payload.code,
            stdin=payload.stdin
        )
    else:
        result = await local_execute(
            student_id=student_id,
            language=payload.language,
            code=payload.code,
            stdin=payload.stdin
        )
    
    return {
        "status": "success",
        "data": result
    }

@router.post("/exercises/{exercise_id}/run")
async def run_exercise_code_route(
    exercise_id: str,
    payload: ExecutionRequestSchema,
    current_student: dict = Depends(get_current_student)
):
    from app.services.judge0_service import execute_code as judge0_execute, is_judge0_configured
    from app.services.execution_service import execute_code as local_execute
    
    student_id = str(current_student["_id"])
    
    if is_judge0_configured():
        result = await judge0_execute(
            student_id=student_id,
            language=payload.language,
            code=payload.code,
            stdin=payload.stdin
        )
    else:
        result = await local_execute(
            student_id=student_id,
            language=payload.language,
            code=payload.code,
            stdin=payload.stdin
        )
    
    return {
        "status": "success",
        "data": result
    }

@router.post("/exercises/{exercise_id}/submit")
async def submit_exercise_work_route(
    exercise_id: str,
    payload: StudentSubmissionCreateSchema,
    current_student: dict = Depends(get_current_student)
):
    from app.services.submission_service import create_or_update_submission
    from app.services.judge0_service import is_judge0_configured, execute_code as judge0_execute
    from app.services.execution_service import execute_code as local_execute

    student_id = str(current_student["_id"])
    
    if is_judge0_configured():
        exec_result = await judge0_execute(
            student_id=student_id,
            language=payload.language or "c",
            code=payload.code,
            stdin=payload.stdin
        )
    else:
        exec_result = await local_execute(
            student_id=student_id,
            language=payload.language or "c",
            code=payload.code,
            stdin=payload.stdin
        )

    result = await create_or_update_submission(current_student, exercise_id, payload.model_dump())

    if result["status"] == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["message"]
        )
    elif result["status"] == "not_assigned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    elif result["status"] == "invalid_language":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    data = result["data"]
    data["execution_result"] = exec_result

    return {
        "status": "success",
        "message": result["message"],
        "data": data
    }

class LabCheckInSchema(BaseModel):
    course_id: str | None = Field(default=None, description="Optional target course ID for check-in")
    model_config = ConfigDict(extra="ignore")

@router.get("/attendance")
async def get_student_attendance_route(current_student: dict = Depends(get_current_student)):
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
