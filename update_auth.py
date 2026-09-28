with open('backend/app/routes/auth.py', 'r') as f:
    content = f.read()

replacement1 = '''        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid student email or password"
        )

    try:
        from app.services.attendance_service import get_active_or_next_lab_session, record_student_lab_attendance
        session_info = get_active_or_next_lab_session()
        if session_info and session_info.get("active_session"):
            course_id = session_info["active_session"].get("course_id")
            if course_id:
                await record_student_lab_attendance(student, course_id, is_manual=False)
    except Exception as e:
        print(f"[Auth] Auto attendance error: {e}")'''

content = content.replace('''        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid student email or password"
        )''', replacement1, 1)

replacement2 = '''        role = "student"

        try:
            from app.services.attendance_service import get_active_or_next_lab_session, record_student_lab_attendance
            session_info = get_active_or_next_lab_session()
            if session_info and session_info.get("active_session"):
                course_id = session_info["active_session"].get("course_id")
                if course_id:
                    await record_student_lab_attendance(user_obj, course_id, is_manual=False)
        except Exception as e:
            print(f"[Auth] Auto attendance error: {e}")'''

content = content.replace('''        role = "student"''', replacement2, 1)

with open('backend/app/routes/auth.py', 'w') as f:
    f.write(content)
