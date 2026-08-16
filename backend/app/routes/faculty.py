from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from pydantic import BaseModel, Field

from app.dependencies.auth import get_current_faculty
from app.services.faculty_service import (
    update_faculty_profile,
    get_faculty_assigned_laboratories,
    get_faculty_laboratory_detail,
    get_faculty_exercises,
    assign_exercise,
    get_faculty_submissions,
    get_faculty_students,
    get_faculty_announcements,
    create_faculty_announcement,
    update_faculty_syllabus,
)

router = APIRouter()

class FacultyProfileUpdateSchema(BaseModel):
    faculty_id: str | None = Field(default=None, description="Faculty ID (e.g. FAC-MCA-001)")
    department: str | None = Field(default="MCA", description="Department (e.g. MCA, CSE, EEE)")
    designation: str | None = Field(default="Assistant Professor", description="Designation")
    name: str | None = Field(default=None, description="Faculty Full Name")

class AnnouncementCreateSchema(BaseModel):
    title: str = Field(..., min_length=2, description="Announcement title")
    content: str = Field(default="", description="Announcement body/content")

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

@router.get("/laboratories")
async def get_my_laboratories(current_faculty: dict = Depends(get_current_faculty)):
    labs = await get_faculty_assigned_laboratories(current_faculty)
    return {
        "status": "success",
        "data": labs
    }

@router.get("/laboratories/{course_id}")
async def get_laboratory_details(
    course_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    lab = await get_faculty_laboratory_detail(current_faculty, course_id)
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to manage this laboratory"
        )
    return {
        "status": "success",
        "data": lab
    }

@router.get("/laboratories/{course_id}/exercises")
async def get_laboratory_exercises(
    course_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    exercises = await get_faculty_exercises(current_faculty, course_id)
    if exercises is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to manage this laboratory"
        )
    return {
        "status": "success",
        "data": exercises
    }

@router.patch("/exercises/{exercise_id}/assign")
async def assign_lab_exercise(
    exercise_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    updated = await assign_exercise(current_faculty, exercise_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign exercise or unauthorized"
        )
    return {
        "status": "success",
        "message": "Exercise assigned successfully",
        "data": updated
    }

@router.patch("/laboratories/{course_id}/exercises/{exercise_id}/assign")
async def assign_lab_exercise_nested(
    course_id: str,
    exercise_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    updated = await assign_exercise(current_faculty, exercise_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign exercise or unauthorized"
        )
    return {
        "status": "success",
        "message": "Exercise assigned successfully",
        "data": updated
    }

@router.get("/laboratories/{course_id}/submissions")
async def get_laboratory_submissions(
    course_id: str,
    exercise_id: str | None = Query(default=None),
    current_faculty: dict = Depends(get_current_faculty)
):
    submissions = await get_faculty_submissions(current_faculty, course_id, exercise_id)
    if submissions is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to manage this laboratory"
        )
    return {
        "status": "success",
        "data": submissions
    }

@router.get("/laboratories/{course_id}/students")
async def get_laboratory_students(
    course_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    students = await get_faculty_students(current_faculty, course_id)
    if students is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to manage this laboratory"
        )
    return {
        "status": "success",
        "data": students
    }

@router.get("/laboratories/{course_id}/announcements")
async def get_laboratory_announcements(
    course_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    announcements = await get_faculty_announcements(current_faculty, course_id)
    return {
        "status": "success",
        "data": announcements
    }

@router.post("/laboratories/{course_id}/announcements")
async def post_laboratory_announcement(
    course_id: str,
    payload: AnnouncementCreateSchema,
    current_faculty: dict = Depends(get_current_faculty)
):
    announcement = await create_faculty_announcement(
        current_faculty,
        course_id,
        payload.model_dump()
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create announcement or unauthorized"
        )
    return {
        "status": "success",
        "message": "Announcement posted successfully",
        "data": announcement
    }

@router.post("/laboratories/{course_id}/syllabus")
async def upload_laboratory_syllabus(
    course_id: str,
    file: UploadFile = File(...),
    current_faculty: dict = Depends(get_current_faculty)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are accepted for syllabus upload"
        )

    result = await update_faculty_syllabus(current_faculty, course_id, file)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied or failed to update syllabus"
        )
    return {
        "status": "success",
        "message": "Syllabus PDF uploaded and replaced successfully",
        "data": result
    }

class SingleAttendanceUpdateSchema(BaseModel):
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    status: str = Field(..., description="Status (Present, Absent, Late, Excused)")

class BatchAttendanceUpdateSchema(BaseModel):
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    status: str = Field(..., description="Status to apply to all (Present, Absent)")

@router.get("/attendance")
async def get_faculty_attendance_overview_route(current_faculty: dict = Depends(get_current_faculty)):
    from app.services.attendance_service import get_faculty_attendance_overview
    overview = await get_faculty_attendance_overview(current_faculty)
    return {
        "status": "success",
        "data": overview
    }

@router.get("/attendance/{course_id}/date/{session_date}")
async def get_faculty_session_attendance_route(
    course_id: str,
    session_date: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    assigned_labs = [str(x).lower().strip() for x in current_faculty.get("assigned_labs", [])]
    if course_id.lower().strip() not in assigned_labs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: You are not assigned to manage laboratory '{course_id.upper()}'."
        )

    from app.services.attendance_service import get_faculty_session_attendance_roster
    roster = await get_faculty_session_attendance_roster(course_id, session_date)
    return {
        "status": "success",
        "data": roster
    }

@router.put("/attendance/{course_id}/student/{student_id}")
async def update_student_attendance_route(
    course_id: str,
    student_id: str,
    payload: SingleAttendanceUpdateSchema,
    current_faculty: dict = Depends(get_current_faculty)
):
    assigned_labs = [str(x).lower().strip() for x in current_faculty.get("assigned_labs", [])]
    if course_id.lower().strip() not in assigned_labs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: You are not assigned to manage laboratory '{course_id.upper()}'."
        )

    from app.services.attendance_service import update_single_student_attendance
    faculty_name = current_faculty.get("name", "Faculty")
    record = await update_single_student_attendance(
        course_id=course_id,
        student_id=student_id,
        session_date=payload.date,
        new_status=payload.status,
        faculty_name=faculty_name
    )
    return {
        "status": "success",
        "message": f"Updated attendance for {student_id} to {payload.status}.",
        "data": record
    }

@router.post("/attendance/{course_id}/batch")
async def batch_update_attendance_route(
    course_id: str,
    payload: BatchAttendanceUpdateSchema,
    current_faculty: dict = Depends(get_current_faculty)
):
    assigned_labs = [str(x).lower().strip() for x in current_faculty.get("assigned_labs", [])]
    if course_id.lower().strip() not in assigned_labs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: You are not assigned to manage laboratory '{course_id.upper()}'."
        )

    from app.services.attendance_service import batch_update_course_attendance
    faculty_name = current_faculty.get("name", "Faculty")
    res = await batch_update_course_attendance(
        course_id=course_id,
        session_date=payload.date,
        new_status=payload.status,
        faculty_name=faculty_name
    )
    return {
        "status": "success",
        "message": res["message"],
        "data": res
    }
