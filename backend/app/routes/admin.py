from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies.auth import get_current_admin
from app.services import admin_service

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
    metrics = await admin_service.get_admin_dashboard_metrics()
    return {
        "status": "success",
        "data": metrics
    }

@router.get("/classes")
async def get_all_academic_classes(current_admin: dict = Depends(get_current_admin)):
    classes_data = await admin_service.get_academic_classes()
    return {
        "status": "success",
        "data": classes_data
    }

@router.get("/classes/{program}/{semester}")
async def get_academic_class_detail(
    program: str,
    semester: str,
    current_admin: dict = Depends(get_current_admin)
):
    details = await admin_service.get_academic_class_details(program, semester)
    return {
        "status": "success",
        "data": details
    }

@router.get("/students")
async def get_students_list(
    search: str = Query("", description="Search by name, student_id, or email"),
    program: str = Query("", description="Filter by program/department"),
    semester: str = Query("", description="Filter by semester"),
    status: str = Query("", description="Filter by status (active/inactive)"),
    limit: int = Query(100, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin)
):
    res = await admin_service.get_admin_students(search, program, semester, status, limit, skip)
    return {
        "status": "success",
        "data": res
    }

@router.get("/students/{student_id}")
async def get_student_detail(
    student_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    student = await admin_service.get_admin_student_by_id(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record '{student_id}' not found"
        )
    return {
        "status": "success",
        "data": student
    }

@router.put("/students/{student_id}")
async def update_student(
    student_id: str,
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    updated = await admin_service.update_admin_student(student_id, payload, admin_name)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record '{student_id}' not found for update"
        )
    return {
        "status": "success",
        "message": "Student institutional records updated successfully",
        "data": updated
    }

@router.post("/students")
async def create_student(
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    if not payload.get("name") or not payload.get("email") or not payload.get("student_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email, and student_id are required."
        )
    created = await admin_service.create_admin_student(payload, admin_name)
    return {
        "status": "success",
        "message": "Student account created successfully",
        "data": created
    }

@router.patch("/students/{student_id}/status")
async def toggle_student_account_status(
    student_id: str,
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    is_active = bool(payload.get("is_active", True))
    res = await admin_service.toggle_student_status(student_id, is_active, admin_name)
    return {
        "status": "success",
        "data": res
    }

@router.get("/faculty")
async def get_all_faculty_members(current_admin: dict = Depends(get_current_admin)):
    faculty_list = await admin_service.get_all_faculty_admin()
    return {
        "status": "success",
        "data": faculty_list
    }

@router.post("/faculty")
async def create_faculty_account(
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    if not payload.get("name") or not payload.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name and email are required for faculty registration."
        )
    created = await admin_service.create_faculty_member(payload, admin_name)
    return {
        "status": "success",
        "message": "Faculty member registered successfully",
        "data": created
    }

@router.put("/faculty/{faculty_id}")
async def update_faculty_account(
    faculty_id: str,
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    res = await admin_service.update_faculty_member(faculty_id, payload, admin_name)
    return {
        "status": "success",
        "message": "Faculty details updated successfully",
        "data": res
    }

@router.post("/faculty/reassign-course")
async def reassign_course_to_faculty(
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    course_id = payload.get("course_id")
    target_faculty_id = payload.get("target_faculty_id") or payload.get("faculty_id") or payload.get("faculty_email")

    if not course_id or not target_faculty_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="course_id and target_faculty_id are required."
        )

    try:
        result = await admin_service.reassign_faculty_course(course_id, target_faculty_id, admin_name)
        return {
            "status": "success",
            "message": result["message"],
            "data": result
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/laboratories")
async def get_all_laboratories(current_admin: dict = Depends(get_current_admin)):
    labs = await admin_service.get_admin_laboratories()
    return {
        "status": "success",
        "data": labs
    }

@router.put("/laboratories/{course_id}")
async def update_laboratory(
    course_id: str,
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    res = await admin_service.update_admin_laboratory(course_id, payload, admin_name)
    return {
        "status": "success",
        "data": res
    }

@router.get("/enrollments")
async def get_enrollment_data(
    program: str = Query("MCA"),
    semester: str = Query("S3"),
    current_admin: dict = Depends(get_current_admin)
):
    matrix = await admin_service.get_enrollment_overview(program, semester)
    return {
        "status": "success",
        "data": matrix
    }

@router.put("/enrollments/{student_id}")
async def update_enrollments(
    student_id: str,
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    courses = payload.get("enrolled_courses", [])
    res = await admin_service.update_student_enrollments(student_id, courses, admin_name)
    return {
        "status": "success",
        "data": res
    }

@router.get("/announcements")
async def get_announcements_list(current_admin: dict = Depends(get_current_admin)):
    items = await admin_service.get_admin_announcements()
    return {
        "status": "success",
        "data": items
    }

@router.post("/announcements")
async def create_announcement_item(
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    if not payload.get("title") or not payload.get("content"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and content are required."
        )
    res = await admin_service.create_admin_announcement(payload, admin_name)
    return {
        "status": "success",
        "message": "Announcement published successfully",
        "data": res
    }

@router.delete("/announcements/{announcement_id}")
async def delete_announcement_item(
    announcement_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    res = await admin_service.delete_admin_announcement(announcement_id, admin_name)
    return {
        "status": "success",
        "data": res
    }

@router.get("/audit")
async def get_system_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: str = Query("", description="Filter by action keyword"),
    current_admin: dict = Depends(get_current_admin)
):
    logs = await admin_service.get_audit_logs(limit, action)
    return {
        "status": "success",
        "data": logs
    }

@router.get("/settings")
async def get_system_settings_data(current_admin: dict = Depends(get_current_admin)):
    settings_data = await admin_service.get_system_settings()
    return {
        "status": "success",
        "data": settings_data
    }

@router.put("/settings")
async def update_system_settings_data(
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    res = await admin_service.update_system_settings(payload, admin_name)
    return {
        "status": "success",
        "data": res
    }

@router.post("/maintenance")
async def toggle_maintenance_mode(
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    admin_name = current_admin.get("name", "System Administrator")
    is_enabled = bool(payload.get("maintenance_mode", False))
    message = payload.get("maintenance_message", "")
    expected_return = payload.get("expected_return", "")

    res = await admin_service.set_maintenance_mode(is_enabled, message, expected_return, admin_name)
    return {
        "status": "success",
        "message": f"Maintenance mode has been {'enabled' if is_enabled else 'disabled'}",
        "data": res
    }
