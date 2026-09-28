from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr

from app.config.settings import settings
from app.services.auth_service import oauth
from app.services.student_service import (
    get_student_by_google_id,
    create_student,
    verify_student_credentials,
    get_student_by_email,
    link_student_google_account
)
from app.services.faculty_service import (
    get_faculty_by_google_id,
    create_faculty,
    verify_faculty_credentials,
    get_faculty_by_email,
    update_faculty_profile
)
from app.services.admin_service import (
    verify_admin_credentials,
    get_admin_by_email
)
from app.services.jwt_service import create_access_token
from app.dependencies.auth import get_current_user

router = APIRouter()

class LoginCredentialsSchema(BaseModel):
    email: EmailStr
    password: str

@router.post("/student/login")
async def student_login(credentials: LoginCredentialsSchema):
    student = await verify_student_credentials(credentials.email, credentials.password)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid student email or password"
        )

    token = create_access_token(
        user_id=str(student["_id"]),
        role="student",
        google_id=student.get("google_id"),
        name=student.get("name", "Student User"),
        email=student.get("email", ""),
        picture=student.get("profile_picture", "")
    )

    student["_id"] = str(student["_id"])
    if "password_hash" in student:
        del student["password_hash"]

    return {
        "status": "success",
        "message": "Student login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": student
    }

@router.get("/student/google/login")
async def student_google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    print("[Auth] Google login started for student")
    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        state="student"
    )

@router.post("/faculty/login")
async def faculty_login(credentials: LoginCredentialsSchema):
    faculty = await verify_faculty_credentials(credentials.email, credentials.password)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid faculty email or password"
        )

    token = create_access_token(
        user_id=str(faculty["_id"]),
        role="faculty",
        google_id=faculty.get("google_id"),
        name=faculty.get("name", "Faculty Member"),
        email=faculty.get("email", ""),
        picture=faculty.get("profile_picture", "")
    )

    faculty["_id"] = str(faculty["_id"])
    if "password_hash" in faculty:
        del faculty["password_hash"]

    return {
        "status": "success",
        "message": "Faculty login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": faculty
    }

@router.get("/faculty/google/login")
async def faculty_google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    print("[Auth] Google login started for faculty")
    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        state="faculty"
    )

@router.post("/admin/login")
async def admin_login(credentials: LoginCredentialsSchema):
    admin = await verify_admin_credentials(credentials.email, credentials.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator email or password"
        )

    token = create_access_token(
        user_id=str(admin["_id"]),
        role="admin",
        name=admin.get("name", "System Administrator"),
        email=admin.get("email", ""),
    )

    admin["_id"] = str(admin["_id"])
    if "password_hash" in admin:
        del admin["password_hash"]

    return {
        "status": "success",
        "message": "Admin login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": admin
    }

@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request):
    print("[Auth] Google login callback received")
    token = await oauth.google.authorize_access_token(request)
    user = token.get("userinfo")
    if not user or "sub" not in user:
        print("[Auth] Error: Google userinfo or sub missing from token response")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve valid user info from Google"
        )

    google_id = user["sub"]
    email = user.get("email", "").lower().strip()
    name = user.get("name", "User")
    picture = user.get("picture", "")

    state = request.query_params.get("state", "student")

    if state == "faculty":
        user_obj = await get_faculty_by_google_id(google_id)
        if not user_obj and email:
            user_obj = await get_faculty_by_email(email)
            if user_obj:
                await update_faculty_profile(str(user_obj["_id"]), {
                    "google_id": google_id,
                    "profile_picture": picture
                })
                user_obj["google_id"] = google_id
                user_obj["profile_picture"] = picture
        if not user_obj:
            print(f"[Auth] Creating new faculty document in MongoDB for {email}")
            user_obj = await create_faculty({
                "google_id": google_id,
                "name": name,
                "email": email,
                "profile_picture": picture,
            })
        role = "faculty"
    else:
        print(f"[Auth] Student lookup by google_id")
        user_obj = await get_student_by_google_id(google_id)
        if not user_obj and email:
            print(f"[Auth] Student not found by google_id, checking email {email}")
            user_obj = await get_student_by_email(email)
            if user_obj:
                print(f"[Auth] Found existing student document by email. Linking Google ID")
                user_obj = await link_student_google_account(
                    student_id=str(user_obj["_id"]),
                    google_id=google_id,
                    picture=picture
                )
        if not user_obj:
            print(f"[Auth] Student not found in MongoDB, creating new student document for {email}")
            user_obj = await create_student({
                "google_id": google_id,
                "name": name,
                "email": email,
                "profile_picture": picture,
                "student_id": None,
                "department": "MCA",
                "semester": 2,
                "github_username": ""
            })
        else:
            print(f"[Auth] Existing student found: {user_obj.get('email')}")
        role = "student"

    access_token = create_access_token(
        user_id=str(user_obj["_id"]),
        role=role,
        google_id=user_obj.get("google_id"),
        name=user_obj.get("name", name),
        email=user_obj.get("email", email),
        picture=user_obj.get("profile_picture", picture)
    )

    print("[Auth] JWT created. Redirecting to frontend callback")
    frontend_redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
    return RedirectResponse(url=frontend_redirect_url)

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    user_data = dict(current_user)
    if "password_hash" in user_data:
        del user_data["password_hash"]
    return {
        "status": "success",
        "data": user_data
    }

import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt
from bson import ObjectId
from app.services.jwt_service import decode_access_token
from app.services.github_service import github_service, encrypt_token
from app.database.mongodb import db

@router.get("/github/login")
async def github_login(request: Request, token: str):
    # 1. Validate user via JWT
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "student":
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    
    # 2. Generate CSRF state wrapping user_id
    nonce = secrets.token_urlsafe(16)
    state_payload = {
        "sub": payload["sub"],
        "nonce": nonce,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    state = jwt.encode(state_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    request.session["github_oauth_nonce"] = nonce
    
    # 3. Redirect to GitHub
    redirect_uri = settings.GITHUB_REDIRECT_URI
    return await oauth.github.authorize_redirect(request, redirect_uri, state=state)

@router.get("/github/callback", name="github_callback")
async def github_callback(request: Request, state: str):
    # 1. Validate State and CSRF
    try:
        state_payload = jwt.decode(state, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid OAuth state parameter")
        
    nonce = state_payload.get("nonce")
    user_id = state_payload.get("sub")
    
    # Session cookie might be dropped cross-origin on localhost redirect, 
    # but the signed JWT state protects against CSRF on its own.
    request.session.pop("github_oauth_nonce", None)
    
    # 2. Exchange Code for Token
    token_resp = await oauth.github.authorize_access_token(request)
    access_token = token_resp.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to retrieve GitHub access token")
        
    expires_in = token_resp.get("expires_in")
    refresh_token = token_resp.get("refresh_token")
    refresh_token_expires_in = token_resp.get("refresh_token_expires_in")
    
    token_expires_at = None
    if expires_in:
        token_expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))).isoformat()
        
    refresh_token_expires_at = None
    if refresh_token_expires_in:
        refresh_token_expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(refresh_token_expires_in))).isoformat()
    
    # 3. Get GitHub Identity
    gh_user = await github_service.get_current_user(access_token)
    if not gh_user:
        raise HTTPException(status_code=400, detail="Failed to retrieve GitHub user identity")
        
    github_user_id = str(gh_user.get("id"))
    github_username = gh_user.get("login")
    
    # 4. Save to DB securely
    update_data = {
        "github_connected": True,
        "github_username": github_username,
        "github": {
            "connected": True,
            "user_id": github_user_id,
            "username": github_username,
            "encrypted_access_token": encrypt_token(access_token),
            "token_expires_at": token_expires_at,
        }
    }
    
    if refresh_token:
        update_data["github"]["encrypted_refresh_token"] = encrypt_token(refresh_token)
        update_data["github"]["refresh_token_expires_at"] = refresh_token_expires_at
        
    await db.students.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/student/profile?github=success")
