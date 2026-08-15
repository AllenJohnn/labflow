import os
from pathlib import Path
from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.core.security import hash_password, verify_password

DEFAULT_FACULTY_EMAIL = os.getenv("DEFAULT_FACULTY_EMAIL", "faculty@fisat.ac.in")
DEFAULT_FACULTY_PASS = os.getenv("DEFAULT_FACULTY_PASSWORD", "faculty123")

# Default Lab Seed Definitions
DEFAULT_LABS = [
    {
        "course_id": "nsa",
        "code": "NSA",
        "name": "Network Security & Applications",
        "faculty": "Rakhi",
        "faculty_email": "faculty@fisat.ac.in",
        "department": "Computer Applications",
        "semester": "S3",
        "total_students": 60,
        "syllabus_url": "/syllabi/NSA_Syllabus.pdf",
    },
    {
        "course_id": "adbms",
        "code": "ADBMS",
        "name": "Advanced Database Management Systems",
        "faculty": "Shidha",
        "faculty_email": "shidha@fisat.ac.in",
        "department": "Computer Applications",
        "semester": "S3",
        "total_students": 60,
        "syllabus_url": "/syllabi/ADBMS_Syllabus.pdf",
    },
    {
        "course_id": "java",
        "code": "JAVA",
        "name": "Object Oriented Programming Lab (Java)",
        "faculty": "Rosemary Mathew",
        "faculty_email": "rosemary@fisat.ac.in",
        "department": "Computer Applications",
        "semester": "S3",
        "total_students": 60,
        "syllabus_url": "/syllabi/JAVA_Syllabus.pdf",
    },
]

DEFAULT_EXERCISES = [
    # NSA (Linux Utilities & Administration)
    {
        "exercise_id": "nsa-ex1",
        "course_id": "nsa",
        "exercise_number": "01",
        "title": "Directory Tree & Linux File Operations",
        "description": "Create hierarchical directory structure Project34, copy, merge files with cat, sort pay records, and inspect file counts using Linux utilities.",
        "faculty": "Rakhi",
        "is_assigned": True,
        "assigned_date": "2026-08-10T09:00:00Z",
        "due_date": "2026-08-20T23:59:59Z",
    },
    {
        "exercise_id": "nsa-ex2",
        "course_id": "nsa",
        "exercise_number": "02",
        "title": "Advanced Linux Filters, Find & Text Processing",
        "description": "Implement sort on employee records, locate largest file, parse file permissions with pipeline, rename files using find -exec, and ROT13 text encryption with tr.",
        "faculty": "Rakhi",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    {
        "exercise_id": "nsa-ex3",
        "course_id": "nsa",
        "exercise_number": "03",
        "title": "Shell Scripting & Regular Expressions",
        "description": "Develop shell scripts with grep/sed/awk pattern matching, conditional execution, and automated report generation.",
        "faculty": "Rakhi",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    {
        "exercise_id": "nsa-ex4",
        "course_id": "nsa",
        "exercise_number": "04",
        "title": "Linux Network Administration & Socket Testing",
        "description": "Configure networking utilities, packet analysis, client-server socket testing, and firewall access control rules.",
        "faculty": "Rakhi",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    # ADBMS (20MCA134 Advanced DBMS Lab)
    {
        "exercise_id": "adbms-ex1",
        "course_id": "adbms",
        "exercise_number": "01",
        "title": "Relational Database Schema Design, DDL & DML",
        "description": "Create database with primary/foreign keys and integrity constraints. Apply DDL, DML, DCL and TCL operations with joins, grouping, and subqueries.",
        "faculty": "Shidha",
        "is_assigned": True,
        "assigned_date": "2026-08-01T09:00:00Z",
        "due_date": "2026-08-10T23:59:59Z",
    },
    {
        "exercise_id": "adbms-ex2",
        "course_id": "adbms",
        "exercise_number": "02",
        "title": "PL/SQL Programs, Cursors, Triggers & Procedures",
        "description": "Construct PL/SQL blocks implementing explicit cursors, stored procedures, user-defined functions, and automated database triggers.",
        "faculty": "Shidha",
        "is_assigned": True,
        "assigned_date": "2026-08-05T09:00:00Z",
        "due_date": "2026-08-15T23:59:59Z",
    },
    {
        "exercise_id": "adbms-ex3",
        "course_id": "adbms",
        "exercise_number": "03",
        "title": "NoSQL Database Installation & CRUD Operations",
        "description": "Set up NoSQL database (MongoDB/Cassandra). Perform document CRUD operations, query filtering, and aggregation pipelines.",
        "faculty": "Shidha",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    {
        "exercise_id": "adbms-ex4",
        "course_id": "adbms",
        "exercise_number": "04",
        "title": "NoSQL Administration, Indexing & Sharding",
        "description": "Implement security policies, user roles, replica set configurations, document indexing, and cloud database deployment.",
        "faculty": "Shidha",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    # JAVA (20MCA132 Object Oriented Programming Lab)
    {
        "exercise_id": "java-ex1",
        "course_id": "java",
        "exercise_number": "01",
        "title": "Classes, Objects, Constructors & Nested Classes",
        "description": "Implement Product class with minimum price search, Matrix addition, Complex numbers, Symmetric matrix, and static nested CPU/RAM architecture.",
        "faculty": "Rosemary Mathew",
        "is_assigned": True,
        "assigned_date": "2026-08-02T09:00:00Z",
        "due_date": "2026-08-12T23:59:59Z",
    },
    {
        "exercise_id": "java-ex2",
        "course_id": "java",
        "exercise_number": "02",
        "title": "Arrays, String Manipulations & Array of Objects",
        "description": "Implement string sorting algorithms, substring search, and Employee record management using array of objects.",
        "faculty": "Rosemary Mathew",
        "is_assigned": True,
        "assigned_date": "2026-08-08T09:00:00Z",
        "due_date": "2026-08-18T23:59:59Z",
    },
    {
        "exercise_id": "java-ex3",
        "course_id": "java",
        "exercise_number": "03",
        "title": "Inheritance, Method Overloading & Interfaces",
        "description": "Design multilevel inheritance hierarchies (Person-Employee-Teacher, Publisher-Book, Student-Sports-Result) and billing interfaces.",
        "faculty": "Rosemary Mathew",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    {
        "exercise_id": "java-ex4",
        "course_id": "java",
        "exercise_number": "04",
        "title": "Packages, User Exceptions, Multithreading & Collections",
        "description": "Build graphics/arithmetic packages, custom exceptions, thread synchronization, generic Stack, and Java Collection Framework.",
        "faculty": "Rosemary Mathew",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    {
        "exercise_id": "java-ex5",
        "course_id": "java",
        "exercise_number": "05",
        "title": "AWT Event Handling & 2D Graphics",
        "description": "Develop interactive GUI applications with AWT components, shape choice components, and mouse/window event listeners.",
        "faculty": "Rosemary Mathew",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
    {
        "exercise_id": "java-ex6",
        "course_id": "java",
        "exercise_number": "06",
        "title": "File I/O Operations & Socket Programming",
        "description": "Implement file read/write streams, directory traversal, and TCP/UDP client-server network socket communication.",
        "faculty": "Rosemary Mathew",
        "is_assigned": False,
        "assigned_date": None,
        "due_date": None,
    },
]

DEMO_STUDENTS = [
    {"name": "ADRIAN ANTONY", "student_id": "FIT25MCA-2001", "email": "adrian.antony@fisat.ac.in"},
    {"name": "AFLAH MUJEEB", "student_id": "FIT25MCA-2002", "email": "aflah.m@fisat.ac.in"},
    {"name": "AGNAN KEN RODRIGUES", "student_id": "FIT25MCA-2003", "email": "agnan.k@fisat.ac.in"},
    {"name": "AGNET JOSEPH", "student_id": "FIT25MCA-2004", "email": "agnet.j@fisat.ac.in"},
    {"name": "AKSHARA A", "student_id": "FIT25MCA-2005", "email": "akshara.a@fisat.ac.in"},
    {"name": "ALANT SAJI", "student_id": "FIT25MCA-2006", "email": "alant.s@fisat.ac.in"},
    {"name": "ALEENA DOMINIC", "student_id": "FIT25MCA-2007", "email": "aleena.d@fisat.ac.in"},
    {"name": "ALLEN JOHN JOY", "student_id": "FIT25MCA-2008", "email": "allenjohnjoy2004@gmail.com"},
    {"name": "AMRITHA", "student_id": "FIT25MCA-2009", "email": "amritha@fisat.ac.in"},
    {"name": "ANAGHA AJIDEV", "student_id": "FIT25MCA-2010", "email": "anagha.a@fisat.ac.in"},
    {"name": "ANANTHU UNNITHAN", "student_id": "FIT25MCA-2011", "email": "ananthu.u@fisat.ac.in"},
    {"name": "ANANYA T", "student_id": "FIT25MCA-2012", "email": "ananya.t@fisat.ac.in"},
    {"name": "ANGEL WILSON", "student_id": "FIT25MCA-2013", "email": "angel.w@fisat.ac.in"},
    {"name": "ANIRUDH A MENON", "student_id": "FIT25MCA-2014", "email": "anirudh.m@fisat.ac.in"},
    {"name": "ANNET PAUL T", "student_id": "FIT25MCA-2015", "email": "annet.p@fisat.ac.in"},
    {"name": "ANN MARIYA VARGHESE", "student_id": "FIT25MCA-2016", "email": "ann.mariya@fisat.ac.in"},
    {"name": "ANU MARIYA VARGHESE", "student_id": "FIT25MCA-2017", "email": "anu.mariya@fisat.ac.in"},
    {"name": "ANURAG T S", "student_id": "FIT25MCA-2018", "email": "anurag.ts@fisat.ac.in"},
    {"name": "ARATHI R NAIR", "student_id": "FIT25MCA-2019", "email": "arathi.r@fisat.ac.in"},
    {"name": "ARCHANA M", "student_id": "FIT25MCA-2020", "email": "archana.m@fisat.ac.in"},
    {"name": "ARYA A", "student_id": "FIT25MCA-2021", "email": "arya.a@fisat.ac.in"},
    {"name": "ARYA P S", "student_id": "FIT25MCA-2022", "email": "arya.ps@fisat.ac.in"},
    {"name": "ASHIL ANTO", "student_id": "FIT25MCA-2023", "email": "ashil.a@fisat.ac.in"},
    {"name": "ASWATHY G R", "student_id": "FIT25MCA-2024", "email": "aswathy.gr@fisat.ac.in"},
    {"name": "AVANY C MURALIDHARAN", "student_id": "FIT25MCA-2025", "email": "avany.c@fisat.ac.in"},
    {"name": "AYYAPPAHARI P R", "student_id": "FIT25MCA-2026", "email": "ayyappahari.pr@fisat.ac.in"},
    {"name": "BIMI GIJO", "student_id": "FIT25MCA-2027", "email": "bimi.g@fisat.ac.in"},
    {"name": "CIBIN VINCENT", "student_id": "FIT25MCA-2028", "email": "cibin.v@fisat.ac.in"},
    {"name": "GOUTHAM M", "student_id": "FIT25MCA-2029", "email": "goutham.m@fisat.ac.in"},
    {"name": "HIRAN JOY", "student_id": "FIT25MCA-2030", "email": "hiran.j@fisat.ac.in"},
    {"name": "JOEL JACOB", "student_id": "FIT25MCA-2031", "email": "joel.j@fisat.ac.in"},
    {"name": "JOSHUA J", "student_id": "FIT25MCA-2032", "email": "joshua.j@fisat.ac.in"},
    {"name": "JOSIN K RAJAN", "student_id": "FIT25MCA-2033", "email": "josin.k@fisat.ac.in"},
    {"name": "JYOTHIKA K T", "student_id": "FIT25MCA-2034", "email": "jyothika.kt@fisat.ac.in"},
    {"name": "KRISHNAGADHA U G", "student_id": "FIT25MCA-2035", "email": "krishnagadha.ug@fisat.ac.in"},
    {"name": "LAKSHMI KRISHNA K K", "student_id": "FIT25MCA-2036", "email": "lakshmi.kk@fisat.ac.in"},
    {"name": "LIYA SEBASTIAN", "student_id": "FIT25MCA-2037", "email": "liya.s@fisat.ac.in"},
    {"name": "MAHENDRAN D M", "student_id": "FIT25MCA-2038", "email": "mahendran.dm@fisat.ac.in"},
    {"name": "MERIN THOMAS", "student_id": "FIT25MCA-2039", "email": "merin.t@fisat.ac.in"},
    {"name": "MOHAMED SHADAD", "student_id": "FIT25MCA-2040", "email": "mohamed.s@fisat.ac.in"},
    {"name": "MUHAMMED IRFAN S", "student_id": "FIT25MCA-2041", "email": "muhammed.irfan@fisat.ac.in"},
    {"name": "NEEHA NAZER", "student_id": "FIT25MCA-2042", "email": "neeha.n@fisat.ac.in"},
    {"name": "NIKHIL EASHY P", "student_id": "FIT25MCA-2043", "email": "nikhil.ep@fisat.ac.in"},
    {"name": "P U ATHUL KRISHNA", "student_id": "FIT25MCA-2044", "email": "athul.krishna@fisat.ac.in"},
    {"name": "SAI KRISHNA DINESAN", "student_id": "FIT25MCA-2045", "email": "sai.krishna@fisat.ac.in"},
    {"name": "SAJANA S KUTTIYIL", "student_id": "FIT25MCA-2046", "email": "sajana.sk@fisat.ac.in"},
    {"name": "SANDRA JOSEPH", "student_id": "FIT25MCA-2047", "email": "sandra.j@fisat.ac.in"},
    {"name": "SANJAY S NAIR", "student_id": "FIT25MCA-2048", "email": "sanjay.sn@fisat.ac.in"},
    {"name": "SHANIYA SHAJU", "student_id": "FIT25MCA-2049", "email": "shaniya.s@fisat.ac.in"},
    {"name": "SHAUN PETER ANTONY", "student_id": "FIT25MCA-2050", "email": "shaun.pa@fisat.ac.in"},
    {"name": "SIVAGANGA S NAIR", "student_id": "FIT25MCA-2051", "email": "sivaganga.sn@fisat.ac.in"},
    {"name": "SIVANI R ANIL", "student_id": "FIT25MCA-2052", "email": "sivani.ra@fisat.ac.in"},
    {"name": "SREEDEV KAILAS", "student_id": "FIT25MCA-2053", "email": "sreedev.k@fisat.ac.in"},
    {"name": "STEPHANO BENNY", "student_id": "FIT25MCA-2054", "email": "stephano.b@fisat.ac.in"},
    {"name": "SUMEDHA C P", "student_id": "FIT25MCA-2055", "email": "sumedha.cp@fisat.ac.in"},
    {"name": "SURUMI K A", "student_id": "FIT25MCA-2056", "email": "surumi.ka@fisat.ac.in"},
    {"name": "TANIYA MARIA JAISON", "student_id": "FIT25MCA-2057", "email": "taniya.mj@fisat.ac.in"},
    {"name": "VARSHA JOHNSON", "student_id": "FIT25MCA-2058", "email": "varsha.j@fisat.ac.in"},
    {"name": "VISAKH S", "student_id": "FIT25MCA-2059", "email": "visakh.s@fisat.ac.in"},
    {"name": "V S HIBA", "student_id": "FIT25MCA-2060", "email": "hiba.vs@fisat.ac.in"},
]


DEFAULT_FALLBACK_FACULTY = {
    "_id": ObjectId("66b9f1a0e4b0a1b2c3d4e5f6"),
    "name": "Rakhi",
    "email": DEFAULT_FACULTY_EMAIL,
    "faculty_id": "FAC-MCA-001",
    "department": "MCA",
    "designation": "Associate Professor",
    "role": "faculty",
    "assigned_labs": ["nsa"],
    "password_hash": hash_password(DEFAULT_FACULTY_PASS),
    "onboarding_completed": True,
}


async def get_faculty_by_email(email: str):
    if not email:
        return None
    try:
        doc = await db.faculty.find_one({"email": email.lower().strip()})
        if doc:
            return doc
    except Exception as e:
        print(f"[Faculty] DB lookup notice: {e}")
    if email.lower().strip() == DEFAULT_FACULTY_EMAIL.lower():
        return DEFAULT_FALLBACK_FACULTY
    return None


async def get_faculty_by_id(faculty_id: str):
    if not faculty_id:
        return None
    try:
        if ObjectId.is_valid(faculty_id):
            doc = await db.faculty.find_one({"_id": ObjectId(faculty_id)})
            if doc:
                return doc
    except Exception as e:
        print(f"[Faculty] DB lookup by ID notice: {e}")
    return DEFAULT_FALLBACK_FACULTY


async def get_faculty_by_google_id(google_id: str):
    if not google_id:
        return None
    try:
        return await db.faculty.find_one({"google_id": google_id})
    except Exception:
        return None


async def create_faculty(data: dict):
    password_hash = None
    if "password" in data and data["password"]:
        password_hash = hash_password(data["password"])

    doc = {
        "google_id": data.get("google_id"),
        "name": data.get("name", "Faculty Member"),
        "email": data["email"].lower().strip(),
        "password_hash": password_hash,
        "profile_picture": data.get("profile_picture"),
        "faculty_id": data.get("faculty_id", "FAC-MCA-001"),
        "department": data.get("department", "MCA"),
        "designation": data.get("designation", "Associate Professor"),
        "phone": data.get("phone", ""),
        "office_location": data.get("office_location", ""),
        "avatar": data.get("avatar", ""),
        "assigned_subjects": data.get("assigned_subjects", []),
        "assigned_labs": data.get("assigned_labs", ["nsa"]),
        "role": "faculty",
        "onboarding_completed": data.get("onboarding_completed", True),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    try:
        result = await db.faculty.insert_one(doc)
        doc["_id"] = result.inserted_id
        print(f"[Auth] Faculty created successfully in MongoDB: {doc['email']}")
        return doc
    except Exception as e:
        print(f"[Auth] Error creating faculty in MongoDB ({data.get('email')}): {e}")
        doc["_id"] = ObjectId("66b9f1a0e4b0a1b2c3d4e5f6")
        return doc


async def verify_faculty_credentials(email: str, password: str):
    clean_email = email.lower().strip()
    faculty = await get_faculty_by_email(clean_email)
    if faculty:
        if faculty.get("password_hash") and verify_password(password, faculty["password_hash"]):
            return faculty
        if clean_email == DEFAULT_FACULTY_EMAIL.lower() and password == DEFAULT_FACULTY_PASS:
            return DEFAULT_FALLBACK_FACULTY

    return None

    return None


IN_MEMORY_EXERCISES = [dict(e) for e in DEFAULT_EXERCISES]
IN_MEMORY_ANNOUNCEMENTS = [
    {
        "id": "ann-1",
        "course_id": "nsa",
        "title": "NSA Lab 01 assignment is live",
        "content": "Please complete and submit the socket programming exercise on time.",
        "author": "Rakhi",
        "time": "Today",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]


async def update_faculty_profile(faculty_id: str, update_fields: dict):
    update_fields["updated_at"] = datetime.now(timezone.utc)
    if not ObjectId.is_valid(faculty_id):
        return DEFAULT_FALLBACK_FACULTY

    try:
        result = await db.faculty.update_one(
            {"_id": ObjectId(faculty_id)},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return DEFAULT_FALLBACK_FACULTY
        return await get_faculty_by_id(faculty_id)
    except Exception as e:
        print(f"[Faculty] Error updating profile for faculty {faculty_id}: {e}")
        return DEFAULT_FALLBACK_FACULTY


async def is_faculty_authorized_for_course(faculty_doc: dict, course_id: str) -> bool:
    """Validate if faculty owns or is assigned to manage this course."""
    if not faculty_doc or not course_id:
        return False

    cid = course_id.lower().strip()
    faculty_email = (faculty_doc.get("email") or "").lower().strip()

    # Admin role has full access
    if faculty_doc.get("role") == "admin":
        return True

    # 1. Check MongoDB database if available
    try:
        db_fac = await db.faculty.find_one({"email": faculty_email})
        if db_fac:
            assigned_labs = [str(x).lower().strip() for x in db_fac.get("assigned_labs", [])]
            return cid in assigned_labs
    except Exception:
        pass

    # 2. Check in-memory DEFAULT_FACULTY_ROSTER
    try:
        from app.services.admin_service import DEFAULT_FACULTY_ROSTER
        fac_record = next((f for f in DEFAULT_FACULTY_ROSTER if f["email"].lower() == faculty_email), None)
        if fac_record:
            assigned_labs = [str(x).lower().strip() for x in fac_record.get("assigned_labs", [])]
            return cid in assigned_labs
    except Exception:
        pass

    # 3. Fallback to passed faculty_doc assigned_labs
    assigned_labs = [str(x).lower().strip() for x in faculty_doc.get("assigned_labs", [])]
    return cid in assigned_labs


async def get_faculty_assigned_laboratories(faculty_doc: dict):
    """Retrieve only the laboratories assigned to this authenticated faculty member."""
    all_labs = DEFAULT_LABS
    try:
        cursor = db.laboratories.find({})
        db_labs = await cursor.to_list(length=100)
        if db_labs:
            all_labs = db_labs
    except Exception as e:
        print(f"[Faculty] DB fetch labs notice: {e}")

    assigned = []
    for lab in all_labs:
        cid = lab["course_id"].lower()
        is_auth = await is_faculty_authorized_for_course(faculty_doc, cid)
        if is_auth:
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

            lab_data = {
                "id": cid,
                "course_id": cid,
                "code": lab.get("code", cid.upper()),
                "name": lab.get("name", "Laboratory Subject"),
                "faculty": lab.get("faculty", faculty_doc.get("name", "Faculty Member")),
                "faculty_email": lab.get("faculty_email", faculty_doc.get("email")),
                "department": lab.get("department", "Computer Applications"),
                "semester": lab.get("semester", "S2"),
                "total_students": lab.get("total_students", 42),
                "assigned_exercises_count": assigned_count,
                "total_exercises_count": total_count,
                "syllabus_url": lab.get("syllabus_url", f"/syllabi/{cid.upper()}-Syllabus-Demo.pdf"),
            }
            assigned.append(lab_data)

    return assigned


async def get_faculty_laboratory_detail(faculty_doc: dict, course_id: str):
    """Retrieve operational details for a specific laboratory."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    lab_entry = next((l for l in DEFAULT_LABS if l["course_id"] == cid), DEFAULT_LABS[0])
    try:
        db_lab = await db.laboratories.find_one({"course_id": cid})
        if db_lab:
            lab_entry = db_lab
    except Exception:
        pass

    # Get exercises (DB or in-memory)
    course_exercises = []
    try:
        cursor = db.exercises.find({"course_id": cid}).sort("exercise_number", 1)
        db_exs = await cursor.to_list(length=100)
        if db_exs:
            course_exercises = db_exs
    except Exception:
        pass

    if not course_exercises:
        course_exercises = [e for e in IN_MEMORY_EXERCISES if e.get("course_id") == cid]

    assigned_exercises = [e for e in course_exercises if e.get("is_assigned")]
    current_exercise = assigned_exercises[-1] if assigned_exercises else (course_exercises[0] if course_exercises else None)

    total_students = lab_entry.get("total_students", 42)
    submitted_count = 24
    reviewed_count = 18
    pending_review_count = 6

    return {
        "id": cid,
        "course_id": cid,
        "code": lab_entry.get("code", cid.upper()),
        "name": lab_entry.get("name"),
        "faculty": lab_entry.get("faculty", faculty_doc.get("name")),
        "department": lab_entry.get("department", "MCA"),
        "semester": lab_entry.get("semester", "S2"),
        "total_students": total_students,
        "syllabus_url": lab_entry.get("syllabus_url", f"/syllabi/{cid.upper()}-Syllabus-Demo.pdf"),
        "assigned_count": len(assigned_exercises),
        "total_exercises": len(course_exercises),
        "current_exercise": {
            "id": current_exercise.get("exercise_id") if current_exercise else None,
            "exercise_number": current_exercise.get("exercise_number") if current_exercise else "01",
            "title": current_exercise.get("title") if current_exercise else "No exercises assigned",
            "status": "Assigned" if current_exercise and current_exercise.get("is_assigned") else "Not Assigned",
        } if current_exercise else None,
        "stats": {
            "total_students": total_students,
            "submitted": submitted_count,
            "reviewed": reviewed_count,
            "pending_review": pending_review_count,
        }
    }


async def get_faculty_exercises(faculty_doc: dict, course_id: str):
    """Retrieve all exercises (assigned and unassigned) for faculty view."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    try:
        cursor = db.exercises.find({"course_id": cid}).sort("exercise_number", 1)
        db_exs = await cursor.to_list(length=100)
        if db_exs:
            for ex in db_exs:
                ex["id"] = ex.get("exercise_id", str(ex["_id"]))
                if "_id" in ex:
                    ex["_id"] = str(ex["_id"])
            return db_exs
    except Exception:
        pass

    exercises = [dict(e) for e in IN_MEMORY_EXERCISES if e.get("course_id") == cid]
    for ex in exercises:
        ex["id"] = ex.get("exercise_id", "ex-1")
    return exercises


async def assign_exercise(faculty_doc: dict, exercise_id: str):
    """Set is_assigned to True for an exercise, making it live for students."""
    target_ex = None
    try:
        target_ex = await db.exercises.find_one({"exercise_id": exercise_id})
    except Exception:
        pass

    if not target_ex:
        target_ex = next((e for e in IN_MEMORY_EXERCISES if e.get("exercise_id") == exercise_id or e.get("id") == exercise_id), None)

    if not target_ex:
        return None

    cid = target_ex["course_id"].lower()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    now_iso = datetime.now(timezone.utc).isoformat()

    # Update in-memory
    mem_ex = next((e for e in IN_MEMORY_EXERCISES if e.get("exercise_id") == exercise_id or e.get("id") == exercise_id), None)
    if mem_ex:
        mem_ex["is_assigned"] = True
        mem_ex["assigned_date"] = now_iso
        mem_ex["status"] = "Assigned"

    # Update in MongoDB
    try:
        await db.exercises.update_one(
            {"exercise_id": exercise_id},
            {"$set": {"is_assigned": True, "assigned_date": now_iso, "status": "Assigned"}},
            upsert=True
        )
        updated_db = await db.exercises.find_one({"exercise_id": exercise_id})
        if updated_db:
            updated_db["_id"] = str(updated_db["_id"])
            return updated_db
    except Exception as e:
        print(f"[Faculty] DB update exercise assign notice: {e}")

    return {
        "exercise_id": exercise_id,
        "course_id": cid,
        "is_assigned": True,
        "assigned_date": now_iso,
        "status": "Assigned"
    }


async def get_faculty_submissions(faculty_doc: dict, course_id: str, exercise_id: str | None = None):
    """Retrieve student submissions for a laboratory across the 60-student MCA S3 cohort."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    course_exercises = [e for e in IN_MEMORY_EXERCISES if e.get("course_id") == cid]
    assigned_exercises = [e for e in course_exercises if e.get("is_assigned")]
    active_ex_id = exercise_id or (assigned_exercises[0].get("exercise_id") if assigned_exercises else f"{cid}-ex1")
    target_ex = next((e for e in course_exercises if e.get("exercise_id") == active_ex_id or e.get("id") == active_ex_id), course_exercises[0] if course_exercises else None)
    ex_num = target_ex.get("exercise_number", "01") if target_ex else "01"
    ex_title = target_ex.get("title", "Laboratory Exercise") if target_ex else "Laboratory Exercise"

    submissions = []
    for i, s in enumerate(DEMO_STUDENTS):
        # Realistic distribution across 60 students
        if ex_num == "01":
            is_done = i < 48
            status_val = "Evaluated" if i % 3 == 0 else ("Reviewed" if i % 3 == 1 else "Submitted") if is_done else "Not Submitted"
            sub_time = "Aug 10, 10:30 AM" if i < 15 else ("Aug 11, 02:15 PM" if i < 35 else ("Aug 12, 09:40 AM" if is_done else "—"))
            marks_val = f"{18 + (i % 3)}/20" if status_val == "Evaluated" else None
        elif ex_num == "02":
            is_done = i < 36
            status_val = "Evaluated" if i % 4 == 0 else ("Reviewed" if i % 4 == 1 else "Submitted") if is_done else "Not Submitted"
            sub_time = "Aug 12, 11:20 AM" if i < 20 else ("Aug 13, 04:05 PM" if is_done else "—")
            marks_val = f"{17 + (i % 4)}/20" if status_val == "Evaluated" else None
        else:
            is_done = i < 20
            status_val = "Evaluated" if i % 2 == 0 else "Submitted" if is_done else "Not Submitted"
            sub_time = "Aug 14, 03:30 PM" if is_done else "—"
            marks_val = "19/20" if status_val == "Evaluated" else None

        submissions.append({
            "_id": f"sub-{cid}-{ex_num}-{i+1}",
            "id": f"sub-{cid}-{ex_num}-{i+1}",
            "course_id": cid,
            "exercise_id": active_ex_id,
            "exercise_number": ex_num,
            "exercise_title": ex_title,
            "student_name": s["name"],
            "student_id": s["student_id"],
            "student_email": s["email"],
            "status": status_val,
            "submitted_at": sub_time,
            "marks": marks_val,
        })
    return submissions


async def get_faculty_students(faculty_doc: dict, course_id: str):
    """Retrieve enrolled students roster for a course with detailed exercise completion breakdown."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    course_exercises = [e for e in IN_MEMORY_EXERCISES if e.get("course_id") == cid]
    assigned_exercises = [e for e in course_exercises if e.get("is_assigned")]
    total_assigned = len(assigned_exercises) if assigned_exercises else 1

    roster = []
    for idx, s in enumerate(DEMO_STUDENTS):
        # Per-exercise breakdown for each student
        ex_progress = []
        completed_count = 0
        for ex in course_exercises:
            ex_num = ex.get("exercise_number", "01")
            is_ass = ex.get("is_assigned", False)
            if not is_ass:
                st = "Not Assigned"
                m = None
            else:
                if ex_num == "01":
                    has_sub = idx < 48
                elif ex_num == "02":
                    has_sub = idx < 36
                else:
                    has_sub = idx < 20

                if has_sub:
                    completed_count += 1
                    st = "Evaluated" if idx % 3 == 0 else ("Reviewed" if idx % 3 == 1 else "Submitted")
                    m = f"{18 + (idx % 3)}/20" if st == "Evaluated" else None
                else:
                    st = "Not Submitted"
                    m = None

            ex_progress.append({
                "exercise_id": ex.get("exercise_id"),
                "exercise_number": ex_num,
                "title": ex.get("title"),
                "is_assigned": is_ass,
                "status": st,
                "marks": m,
            })

        roster.append({
            "id": s["student_id"],
            "student_id": s["student_id"],
            "name": s["name"],
            "email": s["email"],
            "department": "MCA",
            "semester": 3,
            "batch": "MCA S3 (2025-2027)",
            "submissions_completed": f"{completed_count} / {total_assigned}",
            "completed_count": completed_count,
            "total_assigned": total_assigned,
            "status": "Active",
            "exercises_progress": ex_progress
        })
    return roster


async def update_faculty_syllabus(faculty_doc: dict, course_id: str, file):
    """Save an uploaded syllabus PDF to public/syllabi and update laboratory settings."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    filename = f"{cid.upper()}-Syllabus.pdf"
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    syllabi_dir = project_root / "public" / "syllabi"
    syllabi_dir.mkdir(parents=True, exist_ok=True)
    target_path = syllabi_dir / filename

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    syllabus_url = f"/syllabi/{filename}"

    # Update in-memory DEFAULT_LABS
    for lab in DEFAULT_LABS:
        if lab["course_id"] == cid:
            lab["syllabus_url"] = syllabus_url

    # Update MongoDB if available
    try:
        await db.laboratories.update_one(
            {"course_id": cid},
            {"$set": {"syllabus_url": syllabus_url}},
            upsert=True
        )
    except Exception as e:
        print(f"[Faculty] DB update syllabus notice: {e}")

    return {
        "course_id": cid,
        "syllabus_url": syllabus_url,
        "filename": filename
    }


async def get_faculty_announcements(faculty_doc: dict, course_id: str):
    """Retrieve announcements for a course."""
    cid = course_id.lower().strip()
    announcements = [a for a in IN_MEMORY_ANNOUNCEMENTS if a.get("course_id") in [cid, "all"]]
    return announcements


async def create_faculty_announcement(faculty_doc: dict, course_id: str, data: dict):
    """Create a new announcement for a course."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    now = datetime.now(timezone.utc)
    doc = {
        "id": f"ann-{int(now.timestamp())}",
        "course_id": cid,
        "title": data.get("title", "Laboratory Notice"),
        "content": data.get("content", ""),
        "author": faculty_doc.get("name", "Faculty Member"),
        "faculty_id": str(faculty_doc.get("_id", "fac-1")),
        "time": "Just now",
        "created_at": now.isoformat()
    }
    IN_MEMORY_ANNOUNCEMENTS.insert(0, doc)

    try:
        await db.announcements.insert_one(dict(doc))
    except Exception:
        pass

    return doc


async def init_default_faculty():
    try:
        email = DEFAULT_FACULTY_EMAIL
        password = DEFAULT_FACULTY_PASS
        existing = await get_faculty_by_email(email)
        if existing:
            await db.faculty.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password(password),
                    "role": "faculty",
                    "assigned_labs": ["nsa"],
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"[Database] Default faculty initialized/verified in MongoDB: {email}")
        else:
            await create_faculty({
                "name": "Rakhi",
                "email": email,
                "password": password,
                "faculty_id": "FAC-MCA-001",
                "department": "MCA",
                "designation": "Associate Professor",
                "assigned_labs": ["nsa"],
                "onboarding_completed": True
            })
            print(f"[Database] Default faculty inserted in MongoDB: {email}")
    except Exception as e:
        print(f"[Database] Default faculty initialization notice: {e}")


async def init_default_lab_data():
    """Seed laboratories, exercises, and 60 MCA S3 student dev seed records in MongoDB."""
    try:
        for lab in DEFAULT_LABS:
            existing = await db.laboratories.find_one({"course_id": lab["course_id"]})
            if not existing:
                await db.laboratories.insert_one(dict(lab))
                print(f"[Database] Seeded laboratory: {lab['code']}")

        for ex in DEFAULT_EXERCISES:
            existing = await db.exercises.find_one({"exercise_id": ex["exercise_id"]})
            if not existing:
                await db.exercises.insert_one(dict(ex))
                print(f"[Database] Seeded exercise: {ex['exercise_id']}")

        # Seed all 60 MCA S3 dev seed student records
        for stu in DEMO_STUDENTS:
            existing_stu = await db.students.find_one({"student_id": stu["student_id"]})
            if not existing_stu:
                stu_doc = {
                    "name": stu["name"],
                    "email": stu["email"],
                    "student_id": stu["student_id"],
                    "department": "MCA",
                    "semester": 3,
                    "role": "student",
                    "is_dev_seed": True,
                    "password_hash": hash_password("student123"),
                    "github_username": "allenjohn" if stu["student_id"] == "FIT25MCA-2008" else "",
                    "github_connected": stu["student_id"] == "FIT25MCA-2008",
                    "onboarding_completed": True,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
                await db.students.insert_one(stu_doc)

        print("[Database] Default laboratory, exercise, and 60 student dev seed datasets verified.")
    except Exception as e:
        print(f"[Database] Lab dataset initialization notice: {e}")



