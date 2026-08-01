from fastapi import APIRouter, Request

from app.services.auth_service import oauth

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

    return {
        "message": "Google Login Successful",
        "user": user
    }