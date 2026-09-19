import os
from datetime import datetime, timezone
from bson import ObjectId

from app.database.mongodb import db
from app.core.security import hash_password, verify_password

DEFAULT_STUDENT_EMAIL = os.getenv("DEFAULT_STUDENT_EMAIL", "student@fisat.ac.in")
DEFAULT_STUDENT_PASS = os.getenv("DEFAULT_STUDENT_PASSWORD", "student123")

DEFAULT_FALLBACK_STUDENT = {
    "_id": ObjectId("66b9f1a0e4b0a1b2c3d4e5f7"),
    "name": "ALLEN JOHN JOY",
    "email": DEFAULT_STUDENT_EMAIL,
    "student_id": "FIT25MCA-2008",
    "department": "MCA",
    "semester": 3,
    "role": "student",
    "github_username": "allenjohn",
    "password_hash": hash_password(DEFAULT_STUDENT_PASS),
    "onboarding_completed": True,
}

async def get_student_by_google_id(google_id: str):
    if not google_id:
        return None
    try:
        return await db.students.find_one({"google_id": google_id})
    except Exception:
        return None

async def get_student_by_email(email: str):
    if not email:
        return None
    try:
        doc = await db.students.find_one({"email": email.lower().strip()})
        if doc:
            return doc
    except Exception as e:
        print(f"[Student] DB lookup notice: {e}")
    if email.lower().strip() == DEFAULT_STUDENT_EMAIL.lower():
        return DEFAULT_FALLBACK_STUDENT
    return None

async def get_student_by_id(student_db_id: str):
    if not student_db_id:
        return None
    try:
        if ObjectId.is_valid(student_db_id):
            doc = await db.students.find_one({"_id": ObjectId(student_db_id)})
            if doc:
                return doc
        else:
            doc = await db.students.find_one({"$or": [{"student_id": student_db_id}, {"email": student_db_id.lower().strip()}]})
            if doc:
                return doc
    except Exception as e:
        print(f"[Student] DB lookup by ID notice: {e}")

    from app.services.faculty_service import DEMO_STUDENTS
    clean_id = str(student_db_id).lower().strip()
    found_stu = next((s for s in DEMO_STUDENTS if s.get("student_id", "").lower() == clean_id or s.get("email", "").lower() == clean_id), None)
    if found_stu:
        return {
            "_id": ObjectId("66b9f1a0e4b0a1b2c3d4e5f7"),
            "name": found_stu["name"],
            "email": found_stu["email"],
            "student_id": found_stu["student_id"],
            "department": "MCA",
            "semester": 3,
            "role": "student",
            "github_username": found_stu["name"].lower().replace(" ", ""),
            "onboarding_completed": True,
        }

    return DEFAULT_FALLBACK_STUDENT

async def create_student(data: dict):
    now = datetime.now(timezone.utc)

    password_hash = None
    if "password" in data and data["password"]:
        password_hash = hash_password(data["password"])

    github_user = (data.get("github_username") or "").strip()

    student_doc = {
        "google_id": data.get("google_id"),
        "name": data.get("name", "Student User"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "profile_picture": data.get("profile_picture"),
        "student_id": data.get("student_id"),
        "department": data.get("department", "MCA"),
        "semester": data.get("semester", 2),
        "github_username": github_user,
        "github_connected": bool(github_user),
        "phone": data.get("phone", ""),
        "avatar": data.get("avatar", ""),
        "role": "student",
        "onboarding_completed": True,
        "created_at": now,
        "updated_at": now
    }

    try:
        result = await db.students.insert_one(student_doc)
        student_doc["_id"] = result.inserted_id
        print(f"[Auth] Student created successfully in MongoDB: {student_doc['email']}")
        return student_doc
    except Exception as e:
        print(f"[Auth] Error creating student in MongoDB ({data.get('email')}): {e}")
        student_doc["_id"] = ObjectId("66b9f1a0e4b0a1b2c3d4e5f7")
        return student_doc

async def link_student_google_account(student_id: str, google_id: str, picture: str | None = None):
    now = datetime.now(timezone.utc)
    update_fields = {
        "google_id": google_id,
        "updated_at": now
    }
    if picture:
        update_fields["profile_picture"] = picture

    if not ObjectId.is_valid(student_id):
        return None

    try:
        await db.students.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": update_fields}
        )
        print(f"[Auth] Linked Google ID {google_id} to existing student document {student_id}")
        return await get_student_by_id(student_id)
    except Exception as e:
        print(f"[Auth] Error linking Google account for student {student_id}: {e}")
        return DEFAULT_FALLBACK_STUDENT

async def verify_student_credentials(email: str, password: str):
    clean_email = email.lower().strip()
    student = await get_student_by_email(clean_email)
    if student:
        if student.get("password_hash") and verify_password(password, student["password_hash"]):
            return student
        import os
        if os.getenv("DEBUG", "False").lower() == "true":
            if clean_email == DEFAULT_STUDENT_EMAIL.lower() and password == DEFAULT_STUDENT_PASS:
                return DEFAULT_FALLBACK_STUDENT

    return None

async def get_all_students():
    cursor = db.students.find({})
    return await cursor.to_list(length=500)

async def update_student_profile(student_id: str, profile_data: dict):
    now = datetime.now(timezone.utc)
    update_fields = {"updated_at": now}

    if "github_username" in profile_data:
        github_val = (profile_data["github_username"] or "").strip()
        update_fields["github_username"] = github_val
        update_fields["github_connected"] = bool(github_val)

    if not ObjectId.is_valid(student_id):
        return None

    try:
        result = await db.students.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return None
        print(f"[Student] Profile github_username updated for student {student_id}")
        return await get_student_by_id(student_id)
    except Exception as e:
        print(f"[Student] Error updating profile for student {student_id}: {e}")
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Changes not saved, try again later."
        )

async def get_student_assigned_laboratories():
    from app.services.faculty_service import DEFAULT_LABS, IN_MEMORY_EXERCISES

    all_labs = DEFAULT_LABS
    try:
        cursor = db.laboratories.find({})
        db_labs = await cursor.to_list(length=100)
        if db_labs:
            all_labs = db_labs
    except Exception as e:
        print(f"[Student] DB labs lookup notice: {e}")

    result = []
    for lab in all_labs:
        cid = lab["course_id"].lower()
        assigned_count = sum(1 for e in IN_MEMORY_EXERCISES if e.get("course_id") == cid and e.get("is_assigned"))
        total_count = sum(1 for e in IN_MEMORY_EXERCISES if e.get("course_id") == cid)

        try:
            db_assigned = await db.exercises.count_documents({"course_id": cid, "is_assigned": True})
            db_total = await db.exercises.count_documents({"course_id": cid})
            if db_total > 0:
                assigned_count = db_assigned
                total_count = db_total
        except Exception:
            pass

        result.append({
            "id": cid,
            "code": lab.get("code", cid.upper()),
            "name": lab.get("name"),
            "faculty": lab.get("faculty"),
            "department": lab.get("department", "Computer Applications"),
            "semester": lab.get("semester", "S2"),
            "exercisesCount": assigned_count,
            "totalExercises": total_count,
            "syllabusUrl": lab.get("syllabus_url", f"/syllabi/{cid.upper()}-Syllabus-Demo.pdf"),
        })
    return result

async def get_student_assigned_exercises(course_id: str | None = None, student_doc: dict | None = None):
    from app.services.faculty_service import IN_MEMORY_EXERCISES
    from app.services.submission_service import get_student_submissions

    cid = course_id.lower().strip() if course_id else None

    # Retrieve student's submissions to attach accurate status
    stu_submissions_map = {}
    if student_doc:
        try:
            subs = await get_student_submissions(student_doc)
            for s in subs:
                stu_submissions_map[s.get("exercise_id")] = s
        except Exception:
            pass

    from app.config.settings import settings

    # Check if student qualifies for temporary IDE development access
    stu_email = (student_doc.get("email") if student_doc else "").lower().strip()
    is_dev_student = settings.IDE_DEMO_MODE and (stu_email == settings.DEMO_STUDENT_EMAIL.lower() or not stu_email)

    try:
        query_conditions = [{"is_assigned": True}]
        if is_dev_student:
            query_conditions.append({"exercise_id": {"$in": settings.DEMO_EXERCISE_IDS}})

        query = {"$or": query_conditions}
        if cid:
            query = {"$and": [{"course_id": cid}, {"$or": query_conditions}]}

        cursor = db.exercises.find(query).sort("exercise_number", 1)
        db_exs = await cursor.to_list(length=100)
        if db_exs:
            result = []
            for ex in db_exs:
                eid = ex.get("exercise_id", str(ex["_id"]))
                sub = stu_submissions_map.get(eid)
                sub_status = sub.get("status") if sub else "Not Submitted"
                ex_lang = ex.get("language") or ("c" if ex.get("course_id") == "nsa" else ("python" if ex.get("course_id") == "adbms" else "java"))
                result.append({
                    "id": eid,
                    "exercise_id": eid,
                    "courseId": ex.get("course_id"),
                    "course_id": ex.get("course_id"),
                    "exerciseNumber": ex.get("exercise_number"),
                    "exercise_number": ex.get("exercise_number"),
                    "title": ex.get("title"),
                    "description": ex.get("description", ""),
                    "language": ex_lang,
                    "starter_code": ex.get("starter_code"),
                    "faculty": ex.get("faculty"),
                    "isAssigned": True,
                    "is_assigned": True,
                    "assignedDate": ex.get("assigned_date"),
                    "assigned_date": ex.get("assigned_date"),
                    "status": sub_status,
                    "dueDate": ex.get("due_date"),
                    "due_date": ex.get("due_date"),
                    "submission": sub,
                    "marks": sub.get("marks") if sub else None,
                    "feedback": sub.get("feedback") if sub else None,
                })
            return result
    except Exception as e:
        print(f"[Student] DB exercises lookup notice: {e}")

    result = []
    for ex in IN_MEMORY_EXERCISES:
        eid = ex.get("exercise_id", "ex-1")
        is_visible = ex.get("is_assigned") or (is_dev_student and eid in settings.DEMO_EXERCISE_IDS)
        if is_visible and (not cid or ex.get("course_id") == cid):
            sub = stu_submissions_map.get(eid)
            sub_status = sub.get("status") if sub else "Not Submitted"
            ex_lang = ex.get("language") or ("c" if ex.get("course_id") == "nsa" else ("python" if ex.get("course_id") == "adbms" else "java"))
            result.append({
                "id": eid,
                "exercise_id": eid,
                "courseId": ex.get("course_id"),
                "course_id": ex.get("course_id"),
                "exerciseNumber": ex.get("exercise_number"),
                "exercise_number": ex.get("exercise_number"),
                "title": ex.get("title"),
                "description": ex.get("description", ""),
                "language": ex_lang,
                "starter_code": ex.get("starter_code"),
                "faculty": ex.get("faculty"),
                "isAssigned": True,
                "is_assigned": True,
                "assignedDate": ex.get("assigned_date"),
                "assigned_date": ex.get("assigned_date"),
                "status": sub_status,
                "dueDate": ex.get("due_date"),
                "due_date": ex.get("due_date"),
                "submission": sub,
                "marks": sub.get("marks") if sub else None,
                "feedback": sub.get("feedback") if sub else None,
            })
    return result

async def init_default_student():
    try:
        email = DEFAULT_STUDENT_EMAIL
        password = DEFAULT_STUDENT_PASS
        existing = await get_student_by_email(email)
        if existing:
            await db.students.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password(password),
                    "role": "student",
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"[Database] Default student initialized/verified in MongoDB: {email}")
        else:
            await create_student({
                "name": "Allen John",
                "email": email,
                "password": password,
                "student_id": "FIT25MCA-2008",
                "department": "MCA",
                "semester": 2,
                "github_username": "allenjohn",
                "onboarding_completed": True
            })
            print(f"[Database] Default student inserted in MongoDB: {email}")
    except Exception as e:
        print(f"[Database] Default student initialization notice: {e}")
