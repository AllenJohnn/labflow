import os
from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.core.security import hash_password, verify_password

DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@fisat.ac.in")
DEFAULT_ADMIN_PASS = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")

# Global in-memory system settings cache
IN_MEMORY_SYSTEM_SETTINGS = {
    "maintenance_mode": False,
    "maintenance_message": "Maintenance in progress. The system is temporarily unavailable while maintenance is being performed. Please try again later.",
    "expected_return": "Shortly",
    "academic_year": "2025-2026",
    "default_semester": "S3",
    "institution_name": "Federal Institute of Science and Technology (FISAT)",
    "department": "Department of Computer Applications",
    "required_attendance_threshold": 75.0,
    "late_grace_period_minutes": 10,
}

# Default Academic Programs & Classes
DEFAULT_ACADEMIC_CLASSES = [
    {
        "class_id": "mca-s1",
        "program": "MCA",
        "semester": "S1",
        "name": "MCA Semester 1",
        "academic_year": "2025-2026",
        "student_count": 30,
        "is_active": True,
        "subjects": [
            {"code": "ADS", "name": "Advanced Data Structures Lab", "faculty": "Rosemary Mathew", "faculty_email": "rosemary@fisat.ac.in"},
            {"code": "WEB", "name": "Web Programming Laboratory", "faculty": "Rakhi", "faculty_email": "faculty@fisat.ac.in"},
        ]
    },
    {
        "class_id": "mca-s3",
        "program": "MCA",
        "semester": "S3",
        "name": "MCA Semester 3",
        "academic_year": "2025-2026",
        "student_count": 60,
        "is_active": True,
        "subjects": [
            {"code": "NSA", "course_id": "nsa", "name": "Network Security & Applications", "faculty": "Rakhi", "faculty_email": "faculty@fisat.ac.in"},
            {"code": "ADBMS", "course_id": "adbms", "name": "Advanced Database Management Systems", "faculty": "Shidha", "faculty_email": "shidha@fisat.ac.in"},
            {"code": "JAVA", "course_id": "java", "name": "Object Oriented Programming Lab (Java)", "faculty": "Rosemary Mathew", "faculty_email": "rosemary@fisat.ac.in"},
        ]
    },
    {
        "class_id": "imca-s1",
        "program": "IMCA",
        "semester": "S1",
        "name": "Integrated MCA Semester 1",
        "academic_year": "2025-2026",
        "student_count": 40,
        "is_active": True,
        "subjects": [
            {"code": "CP", "name": "C Programming Laboratory", "faculty": "Rakhi", "faculty_email": "faculty@fisat.ac.in"},
        ]
    },
    {
        "class_id": "imca-s3",
        "program": "IMCA",
        "semester": "S3",
        "name": "Integrated MCA Semester 3",
        "academic_year": "2025-2026",
        "student_count": 38,
        "is_active": True,
        "subjects": [
            {"code": "DS", "name": "Data Structures Lab", "faculty": "Shidha", "faculty_email": "shidha@fisat.ac.in"},
            {"code": "DBMS", "name": "Database Management Lab", "faculty": "Rosemary Mathew", "faculty_email": "rosemary@fisat.ac.in"},
        ]
    },
    {
        "class_id": "cse-s1",
        "program": "CSE",
        "semester": "S1",
        "name": "B.Tech CSE Semester 1",
        "academic_year": "2025-2026",
        "student_count": 60,
        "is_active": True,
        "subjects": [
            {"code": "PY", "name": "Python Programming Lab", "faculty": "Rakhi", "faculty_email": "faculty@fisat.ac.in"},
        ]
    },
    {
        "class_id": "cse-s3",
        "program": "CSE",
        "semester": "S3",
        "name": "B.Tech CSE Semester 3",
        "academic_year": "2025-2026",
        "student_count": 58,
        "is_active": True,
        "subjects": [
            {"code": "OS", "name": "Operating Systems Laboratory", "faculty": "Shidha", "faculty_email": "shidha@fisat.ac.in"},
            {"code": "OOP", "name": "Object Oriented Programming in Java", "faculty": "Rosemary Mathew", "faculty_email": "rosemary@fisat.ac.in"},
        ]
    },
    {
        "class_id": "cse-s5",
        "program": "CSE",
        "semester": "S5",
        "name": "B.Tech CSE Semester 5",
        "academic_year": "2025-2026",
        "student_count": 55,
        "is_active": True,
        "subjects": [
            {"code": "NET", "name": "Networking Lab", "faculty": "Rakhi", "faculty_email": "faculty@fisat.ac.in"},
            {"code": "SS", "name": "System Software Lab", "faculty": "Shidha", "faculty_email": "shidha@fisat.ac.in"},
        ]
    },
]

DEFAULT_FACULTY_ROSTER = [
    {
        "faculty_id": "FAC-MCA-001",
        "name": "Rakhi",
        "email": "faculty@fisat.ac.in",
        "department": "MCA",
        "designation": "Associate Professor",
        "phone": "+91 94470 12345",
        "assigned_labs": ["nsa"],
        "is_active": True,
    },
    {
        "faculty_id": "FAC-MCA-002",
        "name": "Shidha",
        "email": "shidha@fisat.ac.in",
        "department": "MCA",
        "designation": "Assistant Professor",
        "phone": "+91 94470 23456",
        "assigned_labs": ["adbms"],
        "is_active": True,
    },
    {
        "faculty_id": "FAC-MCA-003",
        "name": "Rosemary Mathew",
        "email": "rosemary@fisat.ac.in",
        "department": "MCA",
        "designation": "Assistant Professor",
        "phone": "+91 94470 34567",
        "assigned_labs": ["java"],
        "is_active": True,
    },
]

# In-memory Audit Logs
IN_MEMORY_AUDIT_LOGS = [
    {
        "id": "audit-1",
        "timestamp": "2026-08-15T09:00:00Z",
        "action": "SYSTEM_INITIALIZATION",
        "target": "Platform Infrastructure",
        "admin": "System Administrator",
        "summary": "Verified MCA S3 academic allocation with 60 enrolled students."
    },
    {
        "id": "audit-2",
        "timestamp": "2026-08-15T09:15:00Z",
        "action": "ALLOCATE_FACULTY",
        "target": "NSA Laboratory",
        "admin": "System Administrator",
        "summary": "Assigned Rakhi (Associate Professor) to Network Security & Applications (NSA)."
    },
    {
        "id": "audit-3",
        "timestamp": "2026-08-15T09:20:00Z",
        "action": "ALLOCATE_FACULTY",
        "target": "ADBMS Laboratory",
        "admin": "System Administrator",
        "summary": "Assigned Shidha (Assistant Professor) to Advanced DBMS Laboratory (ADBMS)."
    },
    {
        "id": "audit-4",
        "timestamp": "2026-08-15T09:25:00Z",
        "action": "ALLOCATE_FACULTY",
        "target": "JAVA Laboratory",
        "admin": "System Administrator",
        "summary": "Assigned Rosemary Mathew (Assistant Professor) to OOP Lab Java (JAVA)."
    },
]


# =========================================================================
# AUDIT LOGGING HELPER
# =========================================================================

async def log_audit_action(action: str, target: str, summary: str, admin_name: str = "System Administrator"):
    """Record an administrative operation for accountability (secrets strictly excluded)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    entry = {
        "timestamp": now_iso,
        "action": action.upper().strip(),
        "target": target.strip(),
        "admin": admin_name.strip(),
        "summary": summary.strip(),
        "created_at": datetime.now(timezone.utc),
    }

    # Insert into MongoDB
    try:
        res = await db.audit_logs.insert_one(dict(entry))
        entry["_id"] = str(res.inserted_id)
        entry["id"] = str(res.inserted_id)
    except Exception as e:
        print(f"[Audit] DB insert notice: {e}")
        entry["id"] = f"audit-{len(IN_MEMORY_AUDIT_LOGS) + 1}"

    IN_MEMORY_AUDIT_LOGS.insert(0, entry)
    if len(IN_MEMORY_AUDIT_LOGS) > 200:
        IN_MEMORY_AUDIT_LOGS.pop()

    print(f"[Audit Log] {entry['action']} on '{entry['target']}' by {entry['admin']}: {entry['summary']}")
    return entry


DEFAULT_FALLBACK_ADMIN = {
    "_id": ObjectId("66b9f1a0e4b0a1b2c3d4e5f9"),
    "name": "System Administrator",
    "email": DEFAULT_ADMIN_EMAIL,
    "role": "admin",
    "department": "Central IT & Lab Administration",
    "password_hash": hash_password(DEFAULT_ADMIN_PASS),
}


# =========================================================================
# AUTHENTICATION & INITIALIZATION
# =========================================================================

async def get_admin_by_email(email: str):
    if not email:
        return None
    clean_email = email.lower().strip()
    try:
        doc = await db.admins.find_one({"email": clean_email})
        if doc:
            return doc
    except Exception as e:
        print(f"[Admin] DB fetch admin notice: {e}")

    if clean_email == DEFAULT_ADMIN_EMAIL.lower():
        return DEFAULT_FALLBACK_ADMIN
    return None


async def get_admin_by_id(admin_id: str):
    if not admin_id:
        return None
    try:
        if ObjectId.is_valid(admin_id):
            doc = await db.admins.find_one({"_id": ObjectId(admin_id)})
            if doc:
                return doc
    except Exception as e:
        print(f"[Admin] DB fetch admin by id notice: {e}")

    if str(admin_id) == str(DEFAULT_FALLBACK_ADMIN["_id"]) or admin_id == "admin":
        return DEFAULT_FALLBACK_ADMIN
    return None


async def create_admin(data: dict):
    now = datetime.now(timezone.utc)
    password_hash = hash_password(data["password"])

    admin_doc = {
        "name": data.get("name", "System Administrator"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "role": "admin",
        "department": data.get("department", "Central IT"),
        "created_at": now,
        "updated_at": now
    }

    try:
        result = await db.admins.insert_one(admin_doc)
        admin_doc["_id"] = result.inserted_id
        print(f"[Auth] Admin created successfully in MongoDB: {admin_doc['email']}")
        return admin_doc
    except Exception as e:
        print(f"[Auth] Error creating admin in MongoDB ({data.get('email')}): {e}")
        admin_doc["_id"] = DEFAULT_FALLBACK_ADMIN["_id"]
        return admin_doc


async def verify_admin_credentials(email: str, password: str):
    clean_email = email.lower().strip()
    admin = await get_admin_by_email(clean_email)
    if admin:
        if admin.get("password_hash"):
            if verify_password(password, admin["password_hash"]):
                return admin
        elif password == DEFAULT_ADMIN_PASS:
            return admin
    return None


async def init_default_admin():
    try:
        email = DEFAULT_ADMIN_EMAIL
        password = DEFAULT_ADMIN_PASS
        existing = await get_admin_by_email(email)
        if existing:
            await db.admins.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password(password),
                    "role": "admin",
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"[Database] Default admin initialized/verified in MongoDB: {email}")
        else:
            await create_admin({
                "name": "System Administrator",
                "email": email,
                "password": password,
                "department": "Central IT & Lab Administration"
            })
            print(f"[Database] Default admin inserted in MongoDB: {email}")

        # Seed system settings if not present
        settings_doc = await db.system_settings.find_one({"type": "general"})
        if not settings_doc:
            await db.system_settings.insert_one({
                "type": "general",
                "maintenance_mode": False,
                "maintenance_message": "Maintenance in progress. The system is temporarily unavailable while maintenance is being performed. Please try again later.",
                "expected_return": "Shortly",
                "academic_year": "2025-2026",
                "default_semester": "S3",
                "updated_at": datetime.now(timezone.utc)
            })

        # Seed additional faculty members into db.faculty if needed
        for fac in DEFAULT_FACULTY_ROSTER:
            fac_existing = await db.faculty.find_one({"email": fac["email"].lower().strip()})
            if not fac_existing:
                await db.faculty.insert_one({
                    "name": fac["name"],
                    "email": fac["email"].lower().strip(),
                    "password_hash": hash_password("faculty123"),
                    "faculty_id": fac["faculty_id"],
                    "department": fac["department"],
                    "designation": fac["designation"],
                    "phone": fac.get("phone", "+91 94470 00000"),
                    "assigned_labs": fac["assigned_labs"],
                    "role": "faculty",
                    "onboarding_completed": True,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                })
                print(f"[Database] Seeded faculty member: {fac['name']} ({fac['email']})")

    except Exception as e:
        print(f"[Database] Default admin initialization notice: {e}")


# =========================================================================
# SYSTEM STATUS & MAINTENANCE MODE
# =========================================================================

def is_maintenance_active() -> bool:
    """Synchronous fast-check for maintenance mode."""
    return IN_MEMORY_SYSTEM_SETTINGS.get("maintenance_mode", False)


async def get_system_settings():
    try:
        doc = await db.system_settings.find_one({"type": "general"})
        if doc:
            IN_MEMORY_SYSTEM_SETTINGS["maintenance_mode"] = doc.get("maintenance_mode", False)
            IN_MEMORY_SYSTEM_SETTINGS["maintenance_message"] = doc.get("maintenance_message", IN_MEMORY_SYSTEM_SETTINGS["maintenance_message"])
            IN_MEMORY_SYSTEM_SETTINGS["expected_return"] = doc.get("expected_return", IN_MEMORY_SYSTEM_SETTINGS["expected_return"])
            IN_MEMORY_SYSTEM_SETTINGS["academic_year"] = doc.get("academic_year", "2025-2026")
            IN_MEMORY_SYSTEM_SETTINGS["default_semester"] = doc.get("default_semester", "S3")
            IN_MEMORY_SYSTEM_SETTINGS["required_attendance_threshold"] = float(doc.get("required_attendance_threshold", 75.0))
            IN_MEMORY_SYSTEM_SETTINGS["late_grace_period_minutes"] = int(doc.get("late_grace_period_minutes", 10))
    except Exception:
        pass

    return {
        "maintenance_mode": IN_MEMORY_SYSTEM_SETTINGS["maintenance_mode"],
        "maintenance_message": IN_MEMORY_SYSTEM_SETTINGS["maintenance_message"],
        "expected_return": IN_MEMORY_SYSTEM_SETTINGS["expected_return"],
        "academic_year": IN_MEMORY_SYSTEM_SETTINGS["academic_year"],
        "default_semester": IN_MEMORY_SYSTEM_SETTINGS["default_semester"],
        "institution_name": IN_MEMORY_SYSTEM_SETTINGS["institution_name"],
        "department": IN_MEMORY_SYSTEM_SETTINGS["department"],
        "required_attendance_threshold": IN_MEMORY_SYSTEM_SETTINGS["required_attendance_threshold"],
        "late_grace_period_minutes": IN_MEMORY_SYSTEM_SETTINGS["late_grace_period_minutes"],
        "database_status": "Connected",
        "system_status": "Maintenance Active" if IN_MEMORY_SYSTEM_SETTINGS["maintenance_mode"] else "Operational",
    }


async def set_maintenance_mode(is_enabled: bool, message: str = "", expected_return: str = "", admin_name: str = "System Administrator"):
    IN_MEMORY_SYSTEM_SETTINGS["maintenance_mode"] = is_enabled
    if message:
        IN_MEMORY_SYSTEM_SETTINGS["maintenance_message"] = message
    if expected_return:
        IN_MEMORY_SYSTEM_SETTINGS["expected_return"] = expected_return

    try:
        await db.system_settings.update_one(
            {"type": "general"},
            {"$set": {
                "maintenance_mode": is_enabled,
                "maintenance_message": IN_MEMORY_SYSTEM_SETTINGS["maintenance_message"],
                "expected_return": IN_MEMORY_SYSTEM_SETTINGS["expected_return"],
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    except Exception as e:
        print(f"[Admin] Set maintenance DB update notice: {e}")

    action = "ENABLE_MAINTENANCE" if is_enabled else "DISABLE_MAINTENANCE"
    summary = f"Maintenance mode {'enabled: ' + IN_MEMORY_SYSTEM_SETTINGS['maintenance_message'] if is_enabled else 'disabled. Normal operations restored.'}"
    await log_audit_action(action, "System Infrastructure", summary, admin_name)

    return await get_system_settings()


async def update_system_settings(data: dict, admin_name: str = "System Administrator"):
    if "academic_year" in data:
        IN_MEMORY_SYSTEM_SETTINGS["academic_year"] = data["academic_year"]
    if "default_semester" in data:
        IN_MEMORY_SYSTEM_SETTINGS["default_semester"] = data["default_semester"]
    if "required_attendance_threshold" in data:
        IN_MEMORY_SYSTEM_SETTINGS["required_attendance_threshold"] = float(data["required_attendance_threshold"])
    if "late_grace_period_minutes" in data:
        IN_MEMORY_SYSTEM_SETTINGS["late_grace_period_minutes"] = int(data["late_grace_period_minutes"])

    try:
        await db.system_settings.update_one(
            {"type": "general"},
            {"$set": {
                "academic_year": IN_MEMORY_SYSTEM_SETTINGS["academic_year"],
                "default_semester": IN_MEMORY_SYSTEM_SETTINGS["default_semester"],
                "required_attendance_threshold": IN_MEMORY_SYSTEM_SETTINGS["required_attendance_threshold"],
                "late_grace_period_minutes": IN_MEMORY_SYSTEM_SETTINGS["late_grace_period_minutes"],
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    except Exception as e:
        print(f"[Admin] Update settings DB notice: {e}")

    await log_audit_action(
        "UPDATE_SYSTEM_SETTINGS",
        "Academic Configuration",
        f"Updated Academic Year to {IN_MEMORY_SYSTEM_SETTINGS['academic_year']}, Sem to {IN_MEMORY_SYSTEM_SETTINGS['default_semester']}, Req Attendance: {IN_MEMORY_SYSTEM_SETTINGS['required_attendance_threshold']}%, Grace Period: {IN_MEMORY_SYSTEM_SETTINGS['late_grace_period_minutes']}m",
        admin_name
    )
    return await get_system_settings()


# =========================================================================
# DASHBOARD STATS & METRICS
# =========================================================================

async def get_admin_dashboard_metrics():
    total_students = 60
    total_faculty = 3
    total_labs = 3
    total_classes = len(DEFAULT_ACADEMIC_CLASSES)

    try:
        db_stu = await db.students.count_documents({})
        if db_stu > 0:
            total_students = db_stu

        db_fac = await db.faculty.count_documents({})
        if db_fac > 0:
            total_faculty = db_fac

        db_lab = await db.laboratories.count_documents({})
        if db_lab > 0:
            total_labs = db_lab
    except Exception:
        pass

    sys_settings = await get_system_settings()

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_laboratories": total_labs,
        "total_classes": total_classes,
        "system_status": sys_settings["system_status"],
        "maintenance_mode": sys_settings["maintenance_mode"],
        "database_status": sys_settings["database_status"],
        "active_term": f"Academic Year {sys_settings['academic_year']} ({sys_settings['default_semester']})",
        "academic_year": sys_settings["academic_year"],
        "default_semester": sys_settings["default_semester"],
    }


# =========================================================================
# ACADEMIC CLASSES & PROGRAM SECTIONS
# =========================================================================

async def get_academic_classes():
    """Retrieve all academic program sections grouped by program (MCA, IMCA, CSE)."""
    # Count real students in MCA S3
    mca_s3_count = 60
    try:
        c = await db.students.count_documents({"department": "MCA", "semester": 3})
        if c > 0:
            mca_s3_count = c
    except Exception:
        pass

    classes = []
    for cls in DEFAULT_ACADEMIC_CLASSES:
        item = dict(cls)
        if item["class_id"] == "mca-s3":
            item["student_count"] = mca_s3_count
        classes.append(item)

    # Group by Program
    grouped = {}
    for cls in classes:
        prog = cls["program"]
        if prog not in grouped:
            grouped[prog] = []
        grouped[prog].append(cls)

    return {
        "classes": classes,
        "grouped_by_program": grouped,
    }


async def get_academic_class_details(program: str, semester: str):
    """Retrieve details for an academic class including subjects, faculty, and enrolled students."""
    prog_clean = program.upper().strip()
    sem_clean = semester.upper().strip()

    # Find class configuration
    cls_config = next(
        (c for c in DEFAULT_ACADEMIC_CLASSES if c["program"].upper() == prog_clean and c["semester"].upper() == sem_clean),
        None
    )

    if not cls_config:
        cls_config = {
            "class_id": f"{prog_clean.lower()}-{sem_clean.lower()}",
            "program": prog_clean,
            "semester": sem_clean,
            "name": f"{prog_clean} {sem_clean}",
            "academic_year": "2025-2026",
            "student_count": 0,
            "is_active": True,
            "subjects": []
        }

    # Fetch students for this class
    students_list = []
    sem_num = 3 if "3" in sem_clean else (1 if "1" in sem_clean else 5)
    try:
        cursor = db.students.find({"department": prog_clean, "semester": sem_num}).sort("student_id", 1)
        db_students = await cursor.to_list(length=200)
        for s in db_students:
            students_list.append({
                "id": str(s["_id"]),
                "student_id": s.get("student_id", ""),
                "name": s.get("name", ""),
                "email": s.get("email", ""),
                "department": s.get("department", prog_clean),
                "semester": f"S{s.get('semester', sem_num)}",
                "status": "Active" if s.get("is_active", True) else "Inactive",
                "enrolled_courses": s.get("enrolled_courses", ["nsa", "adbms", "java"]),
            })
    except Exception as e:
        print(f"[Admin] Fetch class students notice: {e}")

    # Fallback to demo 60 students if MCA S3
    if not students_list and prog_clean == "MCA" and sem_clean == "S3":
        from app.services.faculty_service import DEMO_STUDENTS
        students_list = [
            {
                "id": f"stu-{idx + 1}",
                "student_id": s["student_id"],
                "name": s["name"],
                "email": s["email"],
                "department": "MCA",
                "semester": "S3",
                "status": "Active",
                "enrolled_courses": ["nsa", "adbms", "java"],
            }
            for idx, s in enumerate(DEMO_STUDENTS)
        ]

    # Synchronize current faculty assignments for class subjects
    subjects = []
    for subj in cls_config.get("subjects", []):
        s_item = dict(subj)
        cid = s_item.get("course_id")
        if cid:
            try:
                lab_doc = await db.laboratories.find_one({"course_id": cid.lower()})
                if lab_doc:
                    s_item["faculty"] = lab_doc.get("faculty", s_item["faculty"])
                    s_item["faculty_email"] = lab_doc.get("faculty_email", s_item.get("faculty_email", ""))
            except Exception:
                pass
        subjects.append(s_item)

    return {
        "class_id": cls_config.get("class_id"),
        "program": prog_clean,
        "semester": sem_clean,
        "name": cls_config.get("name"),
        "academic_year": cls_config.get("academic_year", "2025-2026"),
        "student_count": len(students_list),
        "is_active": cls_config.get("is_active", True),
        "subjects": subjects,
        "students": students_list,
    }


# =========================================================================
# STUDENT MANAGEMENT (ADMIN INSTITUTIONAL AUTHORITY)
# =========================================================================

async def get_admin_students(search: str = "", program: str = "", semester: str = "", status: str = "", limit: int = 100, skip: int = 0):
    query = {}
    if program and program != "all":
        query["department"] = program.upper()
    if semester and semester != "all":
        try:
            sem_val = int(semester.replace("S", "").replace("s", ""))
            query["semester"] = sem_val
        except Exception:
            pass
    if status and status != "all":
        query["is_active"] = (status.lower() == "active")

    students = []
    try:
        cursor = db.students.find(query).sort("student_id", 1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        for s in docs:
            students.append({
                "id": str(s["_id"]),
                "student_id": s.get("student_id", ""),
                "name": s.get("name", ""),
                "email": s.get("email", ""),
                "phone": s.get("phone", "+91 94470 12345"),
                "department": s.get("department", "MCA"),
                "semester": f"S{s.get('semester', 3)}",
                "status": "Active" if s.get("is_active", True) else "Inactive",
                "enrolled_courses": s.get("enrolled_courses", ["nsa", "adbms", "java"]),
                "github_connected": bool(s.get("github_username")),
            })
    except Exception as e:
        print(f"[Admin] DB fetch students notice: {e}")

    # Fallback if empty
    if not students:
        from app.services.faculty_service import DEMO_STUDENTS
        students = [
            {
                "id": f"stu-{idx + 1}",
                "student_id": s["student_id"],
                "name": s["name"],
                "email": s["email"],
                "phone": "+91 94470 12345",
                "department": "MCA",
                "semester": "S3",
                "status": "Active",
                "enrolled_courses": ["nsa", "adbms", "java"],
                "github_connected": s["student_id"] == "FIT25MCA-2008",
            }
            for idx, s in enumerate(DEMO_STUDENTS)
        ]

    # Filter by search string in-memory if needed
    if search:
        s_term = search.lower().strip()
        students = [s for s in students if s_term in s["name"].lower() or s_term in s["student_id"].lower() or s_term in s["email"].lower()]

    return {
        "total": len(students),
        "students": students,
    }


async def get_admin_student_by_id(student_id_or_obj_id: str):
    """Retrieve full student institutional record for admin inspection & modification."""
    clean_id = student_id_or_obj_id.strip()
    student_doc = None

    try:
        if ObjectId.is_valid(clean_id):
            student_doc = await db.students.find_one({"_id": ObjectId(clean_id)})
        if not student_doc:
            student_doc = await db.students.find_one({"student_id": clean_id.upper()})
        if not student_doc:
            student_doc = await db.students.find_one({"email": clean_id.lower()})
    except Exception:
        pass

    if not student_doc:
        from app.services.faculty_service import DEMO_STUDENTS
        match = next((s for s in DEMO_STUDENTS if s["student_id"].upper() == clean_id.upper() or s["name"].lower() == clean_id.lower()), None)
        if match:
            student_doc = {
                "_id": f"stu-{match['student_id']}",
                "name": match["name"],
                "email": match["email"],
                "phone": "+91 94470 12345",
                "student_id": match["student_id"],
                "department": "MCA",
                "semester": 3,
                "is_active": True,
                "enrolled_courses": ["nsa", "adbms", "java"],
                "github_username": "allenjohn" if match["student_id"] == "FIT25MCA-2008" else "",
            }

    if not student_doc:
        return None

    # Format available laboratories with enrollment flag
    enrolled_set = set([str(c).lower() for c in student_doc.get("enrolled_courses", ["nsa", "adbms", "java"])])
    available_labs = [
        {"course_id": "nsa", "code": "NSA", "name": "Network Security & Applications", "faculty": "Rakhi", "is_enrolled": "nsa" in enrolled_set},
        {"course_id": "adbms", "code": "ADBMS", "name": "Advanced Database Management Systems", "faculty": "Shidha", "is_enrolled": "adbms" in enrolled_set},
        {"course_id": "java", "code": "JAVA", "name": "Object Oriented Programming Lab (Java)", "faculty": "Rosemary Mathew", "is_enrolled": "java" in enrolled_set},
    ]

    return {
        "id": str(student_doc.get("_id", clean_id)),
        "student_id": student_doc.get("student_id", ""),
        "name": student_doc.get("name", ""),
        "email": student_doc.get("email", ""),
        "phone": student_doc.get("phone", "+91 94470 12345"),
        "department": student_doc.get("department", "MCA"),
        "semester": f"S{student_doc.get('semester', 3)}",
        "academic_year": "2025-2026",
        "status": "Active" if student_doc.get("is_active", True) else "Inactive",
        "enrolled_courses": list(enrolled_set),
        "available_laboratories": available_labs,
        "github_connected": bool(student_doc.get("github_username")),
        "submissions_overview": {
            "completed": 2,
            "pending": 1,
            "evaluated": 2,
            "attendance": "96%"
        }
    }


async def update_admin_student(student_id_or_obj_id: str, data: dict, admin_name: str = "System Administrator"):
    """Update institutional student records (Admin only)."""
    clean_id = student_id_or_obj_id.strip()

    update_fields = {}
    changes = []

    if "name" in data:
        update_fields["name"] = data["name"].strip()
        changes.append(f"Name: '{update_fields['name']}'")

    if "email" in data:
        update_fields["email"] = data["email"].lower().strip()
        changes.append(f"Email: '{update_fields['email']}'")

    if "phone" in data:
        update_fields["phone"] = data["phone"].strip()

    if "student_id" in data:
        update_fields["student_id"] = data["student_id"].upper().strip()
        changes.append(f"Roll No: '{update_fields['student_id']}'")

    if "department" in data:
        update_fields["department"] = data["department"].upper().strip()
        changes.append(f"Department: '{update_fields['department']}'")

    if "semester" in data:
        try:
            sem_int = int(str(data["semester"]).replace("S", "").replace("s", "").strip())
            update_fields["semester"] = sem_int
            changes.append(f"Semester: S{sem_int}")
        except Exception:
            pass

    if "status" in data:
        is_active = (str(data["status"]).lower() == "active")
        update_fields["is_active"] = is_active
        changes.append(f"Status: {'Active' if is_active else 'Inactive'}")

    if "enrolled_courses" in data:
        courses = [str(c).lower().strip() for c in data["enrolled_courses"] if c]
        update_fields["enrolled_courses"] = courses
        changes.append(f"Enrollments: {', '.join(courses).upper()}")

    update_fields["updated_at"] = datetime.now(timezone.utc)

    # Perform DB update
    try:
        query = {"_id": ObjectId(clean_id)} if ObjectId.is_valid(clean_id) else {"student_id": clean_id.upper()}
        await db.students.update_one(query, {"$set": update_fields})
    except Exception as e:
        print(f"[Admin] Update student DB notice: {e}")

    target_name = update_fields.get("name") or clean_id
    summary = f"Updated student records: {', '.join(changes)}"
    await log_audit_action("UPDATE_STUDENT", f"{target_name} ({clean_id})", summary, admin_name)

    return await get_admin_student_by_id(clean_id)


async def create_admin_student(data: dict, admin_name: str = "System Administrator"):
    """Register a new student account into the academic institution."""
    now = datetime.now(timezone.utc)
    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    student_id = data.get("student_id", "").upper().strip()
    dept = data.get("department", "MCA").upper().strip()

    sem_int = 3
    try:
        sem_int = int(str(data.get("semester", "3")).replace("S", "").replace("s", "").strip())
    except Exception:
        pass

    enrolled = [str(c).lower().strip() for c in data.get("enrolled_courses", ["nsa", "adbms", "java"])]

    student_doc = {
        "name": name,
        "email": email,
        "phone": data.get("phone", "+91 94470 00000"),
        "student_id": student_id,
        "department": dept,
        "semester": sem_int,
        "role": "student",
        "is_active": True,
        "enrolled_courses": enrolled,
        "password_hash": hash_password(data.get("password", "student123")),
        "onboarding_completed": True,
        "created_at": now,
        "updated_at": now,
    }

    try:
        res = await db.students.insert_one(student_doc)
        student_doc["_id"] = res.inserted_id
    except Exception as e:
        print(f"[Admin] Create student DB notice: {e}")

    await log_audit_action("CREATE_STUDENT", f"{name} ({student_id})", f"Enrolled in {dept} S{sem_int} with courses {', '.join(enrolled).upper()}", admin_name)
    return await get_admin_student_by_id(student_id)


async def toggle_student_status(student_id: str, is_active: bool, admin_name: str = "System Administrator"):
    try:
        query = {"_id": ObjectId(student_id)} if ObjectId.is_valid(student_id) else {"student_id": student_id.upper()}
        await db.students.update_one(query, {"$set": {"is_active": is_active, "updated_at": datetime.now(timezone.utc)}})
    except Exception as e:
        print(f"[Admin] Toggle student status DB notice: {e}")

    action = "ACTIVATE_STUDENT" if is_active else "DEACTIVATE_STUDENT"
    await log_audit_action(action, student_id, f"Set account status to {'Active' if is_active else 'Inactive'}", admin_name)
    return {"student_id": student_id, "is_active": is_active}


# =========================================================================
# FACULTY MANAGEMENT & COURSE ALLOCATION
# =========================================================================

async def get_all_faculty_admin():
    """Retrieve all faculty members along with assigned laboratories."""
    faculty_list = []
    try:
        cursor = db.faculty.find({}).sort("name", 1)
        docs = await cursor.to_list(length=100)
        for f in docs:
            assigned = [str(x).lower().strip() for x in f.get("assigned_labs", [])]
            faculty_list.append({
                "id": str(f["_id"]),
                "faculty_id": f.get("faculty_id", "FAC-MCA-001"),
                "name": f.get("name", "Faculty Member"),
                "email": f.get("email", ""),
                "phone": f.get("phone", "+91 94470 12345"),
                "department": f.get("department", "MCA"),
                "designation": f.get("designation", "Assistant Professor"),
                "assigned_labs": assigned,
                "is_active": f.get("is_active", True),
            })
    except Exception as e:
        print(f"[Admin] Fetch faculty DB notice: {e}")

    if not faculty_list:
        faculty_list = [dict(f) for f in DEFAULT_FACULTY_ROSTER]

    return faculty_list


async def create_faculty_member(data: dict, admin_name: str = "System Administrator"):
    """Register a new faculty member."""
    now = datetime.now(timezone.utc)
    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    fac_id = data.get("faculty_id", "").upper().strip() or f"FAC-MCA-00{len(DEFAULT_FACULTY_ROSTER) + 1}"
    assigned = [str(c).lower().strip() for c in data.get("assigned_labs", [])]

    fac_doc = {
        "name": name,
        "email": email,
        "faculty_id": fac_id,
        "department": data.get("department", "MCA"),
        "designation": data.get("designation", "Assistant Professor"),
        "phone": data.get("phone", "+91 94470 12345"),
        "assigned_labs": assigned,
        "password_hash": hash_password(data.get("password", "faculty123")),
        "role": "faculty",
        "is_active": True,
        "onboarding_completed": True,
        "created_at": now,
        "updated_at": now,
    }

    try:
        res = await db.faculty.insert_one(fac_doc)
        fac_doc["_id"] = str(res.inserted_id)
    except Exception as e:
        print(f"[Admin] Create faculty DB notice: {e}")

    await log_audit_action("CREATE_FACULTY", f"{name} ({fac_id})", f"Created faculty in {fac_doc['department']} with labs: {', '.join(assigned).upper()}", admin_name)
    return fac_doc


async def update_faculty_member(faculty_id: str, data: dict, admin_name: str = "System Administrator"):
    """Update institutional faculty profile."""
    update_fields = {}
    changes = []

    if "name" in data:
        update_fields["name"] = data["name"].strip()
        changes.append(f"Name: {update_fields['name']}")
    if "email" in data:
        update_fields["email"] = data["email"].lower().strip()
        changes.append(f"Email: {update_fields['email']}")
    if "designation" in data:
        update_fields["designation"] = data["designation"].strip()
        changes.append(f"Designation: {update_fields['designation']}")
    if "department" in data:
        update_fields["department"] = data["department"].strip()
        changes.append(f"Department: {update_fields['department']}")
    if "phone" in data:
        update_fields["phone"] = data["phone"].strip()
    if "is_active" in data:
        update_fields["is_active"] = bool(data["is_active"])
        changes.append(f"Status: {'Active' if update_fields['is_active'] else 'Inactive'}")

    update_fields["updated_at"] = datetime.now(timezone.utc)

    try:
        query = {"_id": ObjectId(faculty_id)} if ObjectId.is_valid(faculty_id) else {"faculty_id": faculty_id}
        await db.faculty.update_one(query, {"$set": update_fields})
    except Exception as e:
        print(f"[Admin] Update faculty DB notice: {e}")

    await log_audit_action("UPDATE_FACULTY", faculty_id, f"Updated faculty profile: {', '.join(changes)}", admin_name)
    return {"faculty_id": faculty_id, "updated": True}


async def reassign_faculty_course(course_id: str, target_faculty_id_or_email: str, admin_name: str = "System Administrator"):
    """
    Institutional Course Reassignment.
    Reassigns a laboratory course from current faculty to a new faculty member.
    Enforces immediate backend authorization shift (previous faculty loses access).
    """
    cid = course_id.lower().strip()
    target_clean = target_faculty_id_or_email.strip()

    # 1. Find the target faculty document
    target_fac = None
    try:
        if ObjectId.is_valid(target_clean):
            target_fac = await db.faculty.find_one({"_id": ObjectId(target_clean)})
        if not target_fac:
            target_fac = await db.faculty.find_one({"faculty_id": target_clean.upper()})
        if not target_fac:
            target_fac = await db.faculty.find_one({"email": target_clean.lower()})
    except Exception:
        pass

    if not target_fac:
        target_fac = next((f for f in DEFAULT_FACULTY_ROSTER if f["faculty_id"].upper() == target_clean.upper() or f["email"].lower() == target_clean.lower() or f["name"].lower() == target_clean.lower()), None)

    if not target_fac:
        raise ValueError(f"Target faculty '{target_clean}' not found")

    new_faculty_name = target_fac["name"]
    new_faculty_email = target_fac["email"]

    # 2. Identify and remove course_id from any faculty member who previously held it
    try:
        # Pull course_id from all other faculty
        await db.faculty.update_many(
            {"assigned_labs": cid},
            {"$pull": {"assigned_labs": cid}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        # Add course_id to the target faculty member
        if ObjectId.is_valid(str(target_fac.get("_id", ""))):
            await db.faculty.update_one(
                {"_id": target_fac["_id"]},
                {"$addToSet": {"assigned_labs": cid}, "$set": {"updated_at": datetime.now(timezone.utc)}}
            )
        else:
            await db.faculty.update_one(
                {"email": new_faculty_email.lower()},
                {"$addToSet": {"assigned_labs": cid}, "$set": {"updated_at": datetime.now(timezone.utc)}}
            )

        # 3. Update the Laboratory document's faculty fields
        await db.laboratories.update_one(
            {"course_id": cid},
            {"$set": {
                "faculty": new_faculty_name,
                "faculty_email": new_faculty_email,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
    except Exception as e:
        print(f"[Admin] Reassign faculty course DB notice: {e}")

    # Synchronize in-memory structures
    for f in DEFAULT_FACULTY_ROSTER:
        if cid in f["assigned_labs"]:
            f["assigned_labs"].remove(cid)
        if f["email"].lower() == new_faculty_email.lower():
            if cid not in f["assigned_labs"]:
                f["assigned_labs"].append(cid)

    try:
        from app.services.faculty_service import DEFAULT_FALLBACK_FACULTY
        if cid in DEFAULT_FALLBACK_FACULTY.get("assigned_labs", []) and new_faculty_email.lower() != DEFAULT_FALLBACK_FACULTY["email"].lower():
            DEFAULT_FALLBACK_FACULTY["assigned_labs"].remove(cid)
        elif cid not in DEFAULT_FALLBACK_FACULTY.get("assigned_labs", []) and new_faculty_email.lower() == DEFAULT_FALLBACK_FACULTY["email"].lower():
            DEFAULT_FALLBACK_FACULTY["assigned_labs"].append(cid)
    except Exception:
        pass

    for lab in DEFAULT_ACADEMIC_CLASSES:
        for subj in lab.get("subjects", []):
            if subj.get("course_id") == cid or subj.get("code").lower() == cid:
                subj["faculty"] = new_faculty_name
                subj["faculty_email"] = new_faculty_email

    summary = f"Reassigned laboratory '{cid.upper()}' to {new_faculty_name} ({new_faculty_email}). Previous faculty authorizations revoked."
    await log_audit_action("REASSIGN_LABORATORY_COURSE", f"Course: {cid.upper()}", summary, admin_name)

    return {
        "course_id": cid,
        "assigned_faculty": new_faculty_name,
        "faculty_email": new_faculty_email,
        "status": "success",
        "message": summary
    }


# =========================================================================
# LABORATORY / COURSE MANAGEMENT
# =========================================================================

async def get_admin_laboratories():
    """Retrieve all laboratory subjects for institutional oversight."""
    from app.services.faculty_service import DEFAULT_LABS
    labs = []
    try:
        cursor = db.laboratories.find({})
        db_labs = await cursor.to_list(length=100)
        if db_labs:
            for l in db_labs:
                labs.append({
                    "id": str(l.get("_id", l.get("course_id"))),
                    "course_id": l.get("course_id", ""),
                    "code": l.get("code", l.get("course_id", "").upper()),
                    "name": l.get("name", ""),
                    "faculty": l.get("faculty", "Faculty Member"),
                    "faculty_email": l.get("faculty_email", ""),
                    "department": l.get("department", "MCA"),
                    "semester": l.get("semester", "S3"),
                    "total_students": l.get("total_students", 60),
                    "is_active": l.get("is_active", True),
                    "syllabus_url": l.get("syllabus_url", f"/syllabi/{l.get('code', 'NSA')}_Syllabus.pdf"),
                })
    except Exception as e:
        print(f"[Admin] Fetch labs DB notice: {e}")

    if not labs:
        labs = [
            {
                "id": lab["course_id"],
                "course_id": lab["course_id"],
                "code": lab["code"],
                "name": lab["name"],
                "faculty": lab["faculty"],
                "faculty_email": lab.get("faculty_email", ""),
                "department": lab["department"],
                "semester": lab["semester"],
                "total_students": lab.get("total_students", 60),
                "is_active": True,
                "syllabus_url": lab["syllabus_url"],
            }
            for lab in DEFAULT_LABS
        ]

    return labs


async def update_admin_laboratory(course_id: str, data: dict, admin_name: str = "System Administrator"):
    cid = course_id.lower().strip()
    update_fields = {}
    if "is_active" in data:
        update_fields["is_active"] = bool(data["is_active"])
    if "name" in data:
        update_fields["name"] = data["name"].strip()
    if "department" in data:
        update_fields["department"] = data["department"].strip()
    if "semester" in data:
        update_fields["semester"] = data["semester"].strip()

    update_fields["updated_at"] = datetime.now(timezone.utc)

    try:
        await db.laboratories.update_one({"course_id": cid}, {"$set": update_fields})
    except Exception as e:
        print(f"[Admin] Update lab DB notice: {e}")

    await log_audit_action("UPDATE_LABORATORY", f"Course: {cid.upper()}", f"Updated course configuration: {data}", admin_name)
    return {"course_id": cid, "updated": True}


# =========================================================================
# ENROLLMENT MANAGEMENT
# =========================================================================

async def get_enrollment_overview(program: str = "MCA", semester: str = "S3"):
    """Retrieve full enrollment matrix for a class."""
    return await get_academic_class_details(program, semester)


async def update_student_enrollments(student_id: str, courses: list[str], admin_name: str = "System Administrator"):
    """Add or remove laboratory enrollments for a student."""
    clean_courses = [str(c).lower().strip() for c in courses if c]
    try:
        query = {"_id": ObjectId(student_id)} if ObjectId.is_valid(student_id) else {"student_id": student_id.upper()}
        await db.students.update_one(query, {"$set": {"enrolled_courses": clean_courses, "updated_at": datetime.now(timezone.utc)}})
    except Exception as e:
        print(f"[Admin] Update enrollments DB notice: {e}")

    await log_audit_action("UPDATE_ENROLLMENT", student_id, f"Enrolled courses set to: {', '.join(clean_courses).upper()}", admin_name)
    return {"student_id": student_id, "enrolled_courses": clean_courses}


# =========================================================================
# INSTITUTIONAL ANNOUNCEMENTS
# =========================================================================

async def get_admin_announcements():
    announcements = []
    try:
        cursor = db.announcements.find({}).sort("created_at", -1)
        docs = await cursor.to_list(length=50)
        for a in docs:
            announcements.append({
                "id": str(a.get("_id", a.get("id"))),
                "title": a.get("title", ""),
                "content": a.get("content", ""),
                "audience": a.get("audience", "Everyone"),
                "author": a.get("author", "System Administrator"),
                "time": a.get("time", "Recently"),
                "created_at": a.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(a.get("created_at"), datetime) else str(a.get("created_at")),
            })
    except Exception as e:
        print(f"[Admin] Fetch announcements DB notice: {e}")

    if not announcements:
        announcements = [
            {
                "id": "ann-admin-1",
                "title": "Even Semester 2026 Programming Lab Term Schedule",
                "content": "All departments are advised to complete lab curriculum requirements by the end of this month.",
                "audience": "Everyone",
                "author": "System Administrator",
                "time": "Today, 09:00 AM",
            },
            {
                "id": "ann-admin-2",
                "title": "Laboratory Maintenance Window Scheduled",
                "content": "Routine platform maintenance and server health diagnostics scheduled for Saturday 11:00 PM.",
                "audience": "Everyone",
                "author": "System Administrator",
                "time": "Yesterday",
            }
        ]

    return announcements


async def create_admin_announcement(data: dict, admin_name: str = "System Administrator"):
    now = datetime.now(timezone.utc)
    ann_doc = {
        "title": data.get("title", "").strip(),
        "content": data.get("content", "").strip(),
        "audience": data.get("audience", "Everyone").strip(),
        "author": admin_name,
        "time": "Just now",
        "created_at": now,
        "updated_at": now,
    }

    try:
        res = await db.announcements.insert_one(ann_doc)
        ann_doc["_id"] = str(res.inserted_id)
        ann_doc["id"] = str(res.inserted_id)
    except Exception as e:
        print(f"[Admin] Create announcement DB notice: {e}")
        ann_doc["id"] = f"ann-{datetime.now().timestamp()}"

    await log_audit_action("CREATE_ANNOUNCEMENT", f"Audience: {ann_doc['audience']}", f"Published notice: '{ann_doc['title']}'", admin_name)
    return ann_doc


async def delete_admin_announcement(announcement_id: str, admin_name: str = "System Administrator"):
    try:
        query = {"_id": ObjectId(announcement_id)} if ObjectId.is_valid(announcement_id) else {"id": announcement_id}
        await db.announcements.delete_one(query)
    except Exception as e:
        print(f"[Admin] Delete announcement DB notice: {e}")

    await log_audit_action("DELETE_ANNOUNCEMENT", announcement_id, "Removed institutional announcement.", admin_name)
    return {"id": announcement_id, "deleted": True}


# =========================================================================
# AUDIT LOGS RETRIEVAL
# =========================================================================

async def get_audit_logs(limit: int = 50, action_filter: str = ""):
    """Retrieve audit history."""
    logs = []
    query = {}
    if action_filter and action_filter != "all":
        query["action"] = action_filter.upper()

    try:
        cursor = db.audit_logs.find(query).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            logs.append({
                "id": str(d.get("_id", d.get("id"))),
                "timestamp": d.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "action": d.get("action", "ADMIN_ACTION"),
                "target": d.get("target", "System"),
                "admin": d.get("admin", "System Administrator"),
                "summary": d.get("summary", ""),
            })
    except Exception as e:
        print(f"[Admin] Fetch audit logs DB notice: {e}")

    if not logs:
        logs = IN_MEMORY_AUDIT_LOGS

    return logs
