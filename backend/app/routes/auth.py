from fastapi import APIRouter, Request

from app.services.auth_service import oauth
from app.services.student_service import (
    get_student_by_google_id,
    create_student
)
from app.services.jwt_service import create_access_token


router = APIRouter()


@router.get("/student/google/login")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri
    )


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)

    user = token.get("userinfo")

    google_id = user["sub"]

    student = await get_student_by_google_id(google_id)

    if not student:
        student = await create_student(user)

    access_token = create_access_token(
        str(student["_id"]),
        student["google_id"]
    )

    return {
        "message": "Student login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "student": {
            "name": student["name"],
            "email": student["email"],
            "google_id": student["google_id"]
        }
    }