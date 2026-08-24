import os
from datetime import datetime, timezone
from bson import ObjectId

from app.database.mongodb import db
from app.core.languages import ALLOWED_LANGUAGES, is_allowed_language, normalize_language, get_default_language_for_course
from app.services.faculty_service import is_faculty_authorized_for_course, DEFAULT_LABS, DEFAULT_EXERCISES, DEMO_STUDENTS

SAMPLE_CODE_SNIPPETS = {
    "nsa": """/* Network Security & Applications - Lab 01
 * Linux Directory Tree & File Operations in C
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

int main() {
    printf("[*] LabFlow NSA Lab 01 - Linux Directory & File Operations\\n");
    
    // Create Project34 directory
    #ifdef _WIN32
    mkdir("Project34");
    #else
    mkdir("Project34", 0755);
    #endif

    FILE *fp = fopen("Project34/pay_records.txt", "w");
    if (fp) {
        fprintf(fp, "EMP001:John Doe:Engineering:75000\\n");
        fprintf(fp, "EMP002:Jane Smith:Marketing:62000\\n");
        fprintf(fp, "EMP003:Robert Brown:Security:88000\\n");
        fclose(fp);
        printf("[+] Pay records created and permissions configured.\\n");
    } else {
        perror("[-] Failed to create pay records");
        return 1;
    }

    printf("[+] Directory Tree and Linux Operations Completed Successfully.\\n");
    return 0;
}
""",
    "adbms": """\"\"\"
Advanced Database Management Systems - Lab 01
Relational Database Schema Design & Record Processing via Python
\"\"\"
import sqlite3

def setup_and_query_database():
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    cursor.execute(\"\"\"
        CREATE TABLE Department (
            dept_id VARCHAR(10) PRIMARY KEY,
            dept_name VARCHAR(100) NOT NULL,
            building VARCHAR(50)
        )
    \"\"\")

    cursor.execute(\"\"\"
        CREATE TABLE Student (
            student_id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            dept_id VARCHAR(10),
            admission_year INT CHECK (admission_year >= 2020),
            FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        )
    \"\"\")

    departments = [('MCA', 'Computer Applications', 'Central Block'), ('CSE', 'Computer Science', 'Tech Block')]
    cursor.executemany("INSERT INTO Department VALUES (?, ?, ?)", departments)

    students = [('FIT25MCA-2008', 'ALLEN JOHN JOY', 'allenjohnjoy2004@gmail.com', 'MCA', 2025)]
    cursor.executemany("INSERT INTO Student VALUES (?, ?, ?, ?, ?)", students)
    conn.commit()

    cursor.execute(\"\"\"
        SELECT d.dept_name, COUNT(s.student_id) AS total_students
        FROM Department d
        LEFT JOIN Student s ON d.dept_id = s.dept_id
        GROUP BY d.dept_name
    \"\"\")

    for row in cursor.fetchall():
        print(f"Department: {row[0]} | Enrolled Students: {row[1]}")

    conn.close()

if __name__ == "__main__":
    setup_and_query_database()
""",
    "java": """/**
 * Object Oriented Programming Lab (Java) - Lab 01
 * Matrix Operations & Static Nested CPU Architecture
 */
public class Lab01MatrixCPU {
    static class CPU {
        double price;
        CPU(double price) { this.price = price; }

        class Processor {
            int cores;
            String manufacturer;
            Processor(int cores, String manufacturer) {
                this.cores = cores;
                this.manufacturer = manufacturer;
            }
            void display() {
                System.out.println("Processor Cores: " + cores + ", Mfr: " + manufacturer);
            }
        }

        static class RAM {
            int memoryGB;
            String manufacturer;
            RAM(int memoryGB, String manufacturer) {
                this.memoryGB = memoryGB;
                this.manufacturer = manufacturer;
            }
            void display() {
                System.out.println("RAM: " + memoryGB + "GB, Mfr: " + manufacturer);
            }
        }
    }

    public static void main(String[] args) {
        CPU cpu = new CPU(45000.0);
        CPU.Processor proc = cpu.new Processor(8, "Intel Core i7");
        CPU.RAM ram = new CPU.RAM(16, "Corsair");

        proc.display();
        ram.display();
    }
}
"""
}

# In-memory storage cache to ensure instant reactivity and fallback resilience
IN_MEMORY_SUBMISSIONS = []

def _find_exercise_meta(course_id: str, exercise_id: str):
    cid = (course_id or "").lower().strip()
    eid = (exercise_id or "").strip()
    for ex in DEFAULT_EXERCISES:
        if (ex.get("exercise_id") == eid or ex.get("id") == eid) or (ex.get("course_id") == cid and ex.get("exercise_number") == eid):
            return ex
    return None

def _find_lab_meta(course_id: str):
    cid = (course_id or "").lower().strip()
    for lab in DEFAULT_LABS:
        if lab.get("course_id") == cid:
            return lab
    return None

async def get_student_submissions(student_doc: dict):
    """Retrieve all submissions for a given student."""
    stu_id = student_doc.get("student_id") or ""
    stu_email = (student_doc.get("email") or "").lower().strip()

    submissions = []
    try:
        cursor = db.submissions.find({
            "$or": [
                {"student_id": stu_id},
                {"student_email": stu_email}
            ]
        }).sort("submitted_at", -1)
        db_subs = await cursor.to_list(length=200)
        if db_subs:
            for sub in db_subs:
                sub["_id"] = str(sub["_id"])
                sub["id"] = sub.get("submission_id", str(sub["_id"]))
                submissions.append(sub)
            return submissions
    except Exception as e:
        print(f"[Submission] DB student submissions lookup notice: {e}")

    # Fallback to in-memory store
    for sub in IN_MEMORY_SUBMISSIONS:
        if sub.get("student_id") == stu_id or sub.get("student_email", "").lower() == stu_email:
            submissions.append(dict(sub))
    return submissions

async def get_student_exercise_submission(student_doc: dict, exercise_id: str):
    """Retrieve a single submission of a student for a specific exercise."""
    stu_id = student_doc.get("student_id") or ""
    stu_email = (student_doc.get("email") or "").lower().strip()
    eid = exercise_id.strip()

    try:
        doc = await db.submissions.find_one({
            "exercise_id": eid,
            "$or": [
                {"student_id": stu_id},
                {"student_email": stu_email}
            ]
        })
        if doc:
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc.get("submission_id", str(doc["_id"]))
            return doc
    except Exception as e:
        print(f"[Submission] DB single submission lookup notice: {e}")

    # Fallback to in-memory store
    for sub in IN_MEMORY_SUBMISSIONS:
        if sub.get("exercise_id") == eid and (sub.get("student_id") == stu_id or sub.get("student_email", "").lower() == stu_email):
            return dict(sub)

    return None

async def create_or_update_submission(student_doc: dict, exercise_id: str, payload: dict):
    """Create or update a student's submission for an assigned exercise."""
    eid = exercise_id.strip()

    # Verify exercise exists and is assigned
    exercise = None
    try:
        exercise = await db.exercises.find_one({"exercise_id": eid})
    except Exception:
        pass

    if not exercise:
        exercise = _find_exercise_meta("", eid)

    if not exercise:
        return {"status": "not_found", "message": f"Exercise '{eid}' was not found in the laboratory system."}

    if not exercise.get("is_assigned"):
        return {"status": "not_assigned", "message": f"Exercise '{exercise.get('title', eid)}' has not been assigned by faculty yet."}

    cid = exercise.get("course_id", "nsa").lower()
    lab_meta = _find_lab_meta(cid) or {}

    stu_id = student_doc.get("student_id", "FIT25MCA-2008")
    stu_name = student_doc.get("name", "Student User")
    stu_email = (student_doc.get("email", "")).lower().strip()
    stu_db_id = str(student_doc.get("_id", ""))

    now = datetime.now(timezone.utc)
    submission_id = f"sub-{cid}-{exercise.get('exercise_number', '01')}-{stu_id}"

    # Check for existing submission to preserve any prior evaluation status if just updating code
    code = payload.get("code") or payload.get("submitted_code") or ""
    comments = payload.get("comments") or ""

    raw_lang = payload.get("language")
    if raw_lang:
        if not is_allowed_language(raw_lang):
            return {
                "status": "invalid_language",
                "message": f"Unsupported programming language '{raw_lang}'. LabFlow supports only: C ('c'), Java ('java'), Python ('python')."
            }
        language = normalize_language(raw_lang)
    else:
        language = exercise.get("language") or get_default_language_for_course(cid)

    sub_doc = {
        "submission_id": submission_id,
        "student_id": stu_id,
        "student_name": stu_name,
        "student_email": stu_email,
        "student_db_id": stu_db_id,
        "course_id": cid,
        "course_code": lab_meta.get("code", cid.upper()),
        "course_name": lab_meta.get("name", "Laboratory Subject"),
        "exercise_id": eid,
        "exercise_number": exercise.get("exercise_number", "01"),
        "exercise_title": exercise.get("title", "Laboratory Exercise"),
        "submitted_code": code,
        "language": language,
        "comments": comments,
        "status": "Submitted",  # Newly submitted work is pending review
        "submitted_at": now.isoformat(),
        "submitted_date_display": now.strftime("%b %d, %I:%M %p"),
        "marks": existing_sub.get("marks") if existing_sub else None,
        "feedback": existing_sub.get("feedback") if existing_sub else None,
        "evaluated_at": existing_sub.get("evaluated_at") if existing_sub else None,
        "evaluated_by": existing_sub.get("evaluated_by") if existing_sub else None,
        "updated_at": now.isoformat(),
    }

    # Update in-memory store
    idx = next((i for i, s in enumerate(IN_MEMORY_SUBMISSIONS) if s.get("submission_id") == submission_id or (s.get("exercise_id") == eid and s.get("student_id") == stu_id)), None)
    if idx is not None:
        IN_MEMORY_SUBMISSIONS[idx] = dict(sub_doc)
    else:
        IN_MEMORY_SUBMISSIONS.append(dict(sub_doc))

    # Persist to MongoDB
    try:
        await db.submissions.update_one(
            {"submission_id": submission_id},
            {"$set": sub_doc},
            upsert=True
        )
        saved = await db.submissions.find_one({"submission_id": submission_id})
        if saved:
            saved["_id"] = str(saved["_id"])
            saved["id"] = saved.get("submission_id", str(saved["_id"]))
            return {"status": "success", "message": "Work submitted successfully", "data": saved}
    except Exception as e:
        print(f"[Submission] DB save submission notice: {e}")

    sub_doc["_id"] = submission_id
    sub_doc["id"] = submission_id
    return {"status": "success", "message": "Work submitted successfully", "data": sub_doc}

async def get_faculty_course_submissions(faculty_doc: dict, course_id: str, exercise_id: str | None = None, status_filter: str | None = None):
    """Retrieve full submission records and cohort summary for faculty's authorized laboratory."""
    cid = course_id.lower().strip()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return None

    # Determine active exercise for context
    course_exercises = [e for e in DEFAULT_EXERCISES if e.get("course_id") == cid]
    assigned_exercises = [e for e in course_exercises if e.get("is_assigned")]
    active_ex_id = exercise_id or (assigned_exercises[0].get("exercise_id") if assigned_exercises else f"{cid}-ex1")
    target_ex = next((e for e in course_exercises if e.get("exercise_id") == active_ex_id or e.get("id") == active_ex_id), course_exercises[0] if course_exercises else None)
    ex_num = target_ex.get("exercise_number", "01") if target_ex else "01"
    ex_title = target_ex.get("title", "Laboratory Exercise") if target_ex else "Laboratory Exercise"

    # Fetch existing submissions from MongoDB
    db_subs_map = {}
    try:
        query = {"course_id": cid}
        if exercise_id and exercise_id != "all":
            query["exercise_id"] = exercise_id
        cursor = db.submissions.find(query)
        db_subs = await cursor.to_list(length=500)
        for s in db_subs:
            s["_id"] = str(s["_id"])
            s["id"] = s.get("submission_id", str(s["_id"]))
            key = f"{s.get('student_id')}_{s.get('exercise_id')}"
            db_subs_map[key] = s
            # also map by student_id if filtering by specific exercise
            db_subs_map[s.get("student_id")] = s
    except Exception as e:
        print(f"[Submission] DB faculty fetch submissions notice: {e}")

    # Fallback to in-memory map
    for s in IN_MEMORY_SUBMISSIONS:
        if s.get("course_id") == cid:
            key = f"{s.get('student_id')}_{s.get('exercise_id')}"
            if key not in db_subs_map:
                db_subs_map[key] = dict(s)
            if s.get("student_id") not in db_subs_map:
                db_subs_map[s.get("student_id")] = dict(s)

    # Build cohort response for all 60 students
    all_submissions = []
    evaluated_count = 0
    reviewed_count = 0
    submitted_count = 0
    not_submitted_count = 0

    for i, student in enumerate(DEMO_STUDENTS):
        stu_id = student["student_id"]
        key = f"{stu_id}_{active_ex_id}"
        existing = db_subs_map.get(key) or db_subs_map.get(stu_id)

        if existing and existing.get("exercise_id") == active_ex_id:
            st = existing.get("status", "Submitted")
            sub_record = {
                "_id": existing.get("_id", f"sub-{cid}-{ex_num}-{stu_id}"),
                "id": existing.get("submission_id", f"sub-{cid}-{ex_num}-{stu_id}"),
                "submission_id": existing.get("submission_id", f"sub-{cid}-{ex_num}-{stu_id}"),
                "course_id": cid,
                "exercise_id": active_ex_id,
                "exercise_number": ex_num,
                "exercise_title": ex_title,
                "student_name": student["name"],
                "student_id": stu_id,
                "student_email": student["email"],
                "status": st,
                "submitted_at": existing.get("submitted_date_display") or existing.get("submitted_at") or "Aug 12, 10:30 AM",
                "submitted_code": existing.get("submitted_code") or SAMPLE_CODE_SNIPPETS.get(cid, "// Submitted code"),
                "language": normalize_language(existing.get("language")) or get_default_language_for_course(cid),
                "comments": existing.get("comments", ""),
                "marks": existing.get("marks"),
                "feedback": existing.get("feedback"),
                "evaluated_at": existing.get("evaluated_at"),
                "evaluated_by": existing.get("evaluated_by"),
            }
        else:
            # Default distribution for unseeded items
            is_done = i < 48 if ex_num == "01" else (i < 36 if ex_num == "02" else i < 20)
            if is_done:
                st = "Evaluated" if i % 3 == 0 else ("Reviewed" if i % 3 == 1 else "Submitted")
                m = f"{18 + (i % 3)}/20" if st == "Evaluated" else None
                fb = "Well structured logic and correct outputs verified." if st == "Evaluated" else ("Initial review completed. Code formatted correctly." if st == "Reviewed" else None)
                sub_time = "Aug 10, 10:30 AM" if i < 15 else ("Aug 11, 02:15 PM" if i < 35 else "Aug 12, 09:40 AM")
            else:
                st = "Not Submitted"
                m = None
                fb = None
                sub_time = "—"

            sub_record = {
                "_id": f"sub-{cid}-{ex_num}-{stu_id}",
                "id": f"sub-{cid}-{ex_num}-{stu_id}",
                "submission_id": f"sub-{cid}-{ex_num}-{stu_id}",
                "course_id": cid,
                "exercise_id": active_ex_id,
                "exercise_number": ex_num,
                "exercise_title": ex_title,
                "student_name": student["name"],
                "student_id": stu_id,
                "student_email": student["email"],
                "status": st,
                "submitted_at": sub_time,
                "submitted_code": SAMPLE_CODE_SNIPPETS.get(cid, "// Submitted code") if is_done else "",
                "language": get_default_language_for_course(cid),
                "comments": "Completed standard exercises" if is_done else "",
                "marks": m,
                "feedback": fb,
                "evaluated_at": "2026-08-14T10:00:00Z" if st in ["Evaluated", "Reviewed"] else None,
                "evaluated_by": faculty_doc.get("name", "Faculty Member") if st in ["Evaluated", "Reviewed"] else None,
            }

        # Track counts
        if sub_record["status"] == "Evaluated":
            evaluated_count += 1
        elif sub_record["status"] == "Reviewed":
            reviewed_count += 1
        elif sub_record["status"] == "Submitted":
            submitted_count += 1
        else:
            not_submitted_count += 1

        all_submissions.append(sub_record)

    # Filter if requested
    filtered = all_submissions
    if status_filter and status_filter != "all":
        filtered = [s for s in all_submissions if s["status"] == status_filter]

    return {
        "course_id": cid,
        "exercise_id": active_ex_id,
        "exercise_number": ex_num,
        "exercise_title": ex_title,
        "submissions": filtered,
        "stats": {
            "total_students": len(DEMO_STUDENTS),
            "evaluated": evaluated_count,
            "reviewed": reviewed_count,
            "submitted": submitted_count,
            "pending_review": submitted_count,
            "not_submitted": not_submitted_count,
        }
    }

async def get_submission_by_id(faculty_doc: dict, submission_id: str):
    """Fetch single submission details after authorization check."""
    sub = None
    try:
        if ObjectId.is_valid(submission_id):
            sub = await db.submissions.find_one({"_id": ObjectId(submission_id)})
        if not sub:
            sub = await db.submissions.find_one({"submission_id": submission_id})
    except Exception as e:
        print(f"[Submission] DB get submission by ID notice: {e}")

    if not sub:
        sub = next((s for s in IN_MEMORY_SUBMISSIONS if s.get("submission_id") == submission_id or str(s.get("_id")) == submission_id), None)

    if not sub:
        return None

    cid = sub.get("course_id", "").lower()
    if not await is_faculty_authorized_for_course(faculty_doc, cid):
        return "unauthorized"

    if "_id" in sub:
        sub["_id"] = str(sub["_id"])
    sub["id"] = sub.get("submission_id", str(sub.get("_id", "")))
    return sub

async def evaluate_submission(faculty_doc: dict, submission_id: str, evaluation_data: dict):
    """Faculty reviews / evaluates a student submission, awarding marks and feedback."""
    sub = await get_submission_by_id(faculty_doc, submission_id)
    if sub == "unauthorized":
        return {"status": "unauthorized", "message": "Access denied: You are not authorized to evaluate submissions for this laboratory."}
    
    cid = "nsa"
    if isinstance(sub, dict):
        cid = sub.get("course_id", "nsa")
    else:
        parts = submission_id.split("-")
        cid = parts[1] if len(parts) > 1 else "nsa"
        if not await is_faculty_authorized_for_course(faculty_doc, cid):
            return {"status": "unauthorized", "message": "Access denied: Unauthorized laboratory."}

    now = datetime.now(timezone.utc)
    fac_name = faculty_doc.get("name", "Faculty Member")

    new_status = evaluation_data.get("status", "Evaluated")
    marks = evaluation_data.get("marks")
    feedback = evaluation_data.get("feedback", "").strip()

    update_fields = {
        "status": new_status,
        "marks": marks,
        "feedback": feedback,
        "evaluated_by": fac_name,
        "evaluated_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    # Update in MongoDB
    try:
        await db.submissions.update_one(
            {"$or": [{"submission_id": submission_id}, {"_id": ObjectId(submission_id) if ObjectId.is_valid(submission_id) else None}]},
            {"$set": update_fields},
            upsert=True
        )
    except Exception as e:
        print(f"[Submission] DB evaluate update notice: {e}")

    # Update in memory
    idx = next((i for i, s in enumerate(IN_MEMORY_SUBMISSIONS) if s.get("submission_id") == submission_id or str(s.get("_id")) == submission_id), None)
    if idx is not None:
        IN_MEMORY_SUBMISSIONS[idx].update(update_fields)
    else:
        doc = dict(sub) if isinstance(sub, dict) else {}
        doc.update(update_fields)
        doc["submission_id"] = submission_id
        IN_MEMORY_SUBMISSIONS.append(doc)

    # Log to audit logs
    try:
        from app.services.admin_service import log_audit_event
        await log_audit_event(
            action="EVALUATE_SUBMISSION",
            target=f"Submission: {submission_id}, Course: {cid.upper()}",
            admin=fac_name,
            summary=f"Faculty {fac_name} updated submission status to '{new_status}' with marks '{marks or 'N/A'}'."
        )
    except Exception:
        pass

    updated_doc = await get_submission_by_id(faculty_doc, submission_id)
    return {"status": "success", "message": f"Submission successfully {new_status.lower()}", "data": updated_doc}

async def seed_demo_submissions(force_reset: bool = False):
    """Seed realistic submissions for all 60 MCA S3 students across NSA, ADBMS, JAVA."""
    print("[Database] Starting realistic demo submission dataset seeding...")
    now = datetime.now(timezone.utc)
    seeded_count = 0

    # If force reset is requested, clear existing demo submissions
    if force_reset:
        try:
            await db.submissions.delete_many({})
        except Exception:
            pass
        IN_MEMORY_SUBMISSIONS.clear()

    # Pre-defined detailed states for primary demo students
    KEY_STUDENT_STATUSES = {
        "FIT25MCA-2008": { # Allen John Joy
            "nsa-ex1": {
                "status": "Evaluated",
                "marks": "19/20",
                "feedback": "Excellent directory organization and clean shell pipeline implementation. Tested file permissions thoroughly.",
                "submitted_at": "Aug 10, 10:30 AM",
            },
            "adbms-ex1": {
                "status": "Evaluated",
                "marks": "20/20",
                "feedback": "Flawless schema design with full referential integrity and optimized JOIN queries.",
                "submitted_at": "Aug 05, 11:15 AM",
            },
            "adbms-ex2": {
                "status": "Submitted",
                "marks": None,
                "feedback": None,
                "submitted_at": "Aug 14, 02:40 PM",
            },
            "java-ex1": {
                "status": "Evaluated",
                "marks": "18/20",
                "feedback": "Good object-oriented design and static inner class CPU structure.",
                "submitted_at": "Aug 06, 03:20 PM",
            },
            "java-ex2": {
                "status": "Reviewed",
                "marks": None,
                "feedback": "String manipulation logic verified. Prepare for viva questions.",
                "submitted_at": "Aug 12, 09:10 AM",
            },
        },
        "FIT25MCA-2043": { # Nikhil Eashy P
            "nsa-ex1": {
                "status": "Reviewed",
                "marks": None,
                "feedback": "Directory structure verified. Ensure proper error handling in shell scripts.",
                "submitted_at": "Aug 11, 01:20 PM",
            },
            "adbms-ex1": {
                "status": "Evaluated",
                "marks": "18/20",
                "feedback": "Good DDL and constraint definitions.",
                "submitted_at": "Aug 04, 04:30 PM",
            },
        },
        "FIT25MCA-2031": { # Joel Jacob
            "nsa-ex1": {
                "status": "Submitted",
                "marks": None,
                "feedback": None,
                "submitted_at": "Aug 12, 04:50 PM",
            },
            "adbms-ex1": {
                "status": "Evaluated",
                "marks": "19/20",
                "feedback": "High quality SQL subqueries.",
                "submitted_at": "Aug 05, 10:00 AM",
            },
        },
        "FIT25MCA-2030": { # Hiran Joy
            "nsa-ex1": {
                "status": "Evaluated",
                "marks": "20/20",
                "feedback": "Flawless execution of Linux utilities.",
                "submitted_at": "Aug 10, 09:15 AM",
            },
        },
        "FIT25MCA-2050": { # Shaun Peter Antony
            "nsa-ex1": {
                "status": "Not Submitted",
                "marks": None,
                "feedback": None,
                "submitted_at": "—",
            },
            "adbms-ex1": {
                "status": "Submitted",
                "marks": None,
                "feedback": None,
                "submitted_at": "Aug 13, 03:15 PM",
            },
        },
        "FIT25MCA-2014": { # Anirudh A Menon
            "nsa-ex1": {
                "status": "Evaluated",
                "marks": "19/20",
                "feedback": "Very clean and modular file operations.",
                "submitted_at": "Aug 10, 11:45 AM",
            },
        }
    }

    # Seed across assigned exercises
    assigned_exercises = [e for e in DEFAULT_EXERCISES if e.get("is_assigned")]

    for ex in assigned_exercises:
        eid = ex["exercise_id"]
        cid = ex["course_id"]
        ex_num = ex["exercise_number"]
        lab = _find_lab_meta(cid) or {}

        for i, s in enumerate(DEMO_STUDENTS):
            stu_id = s["student_id"]
            sub_id = f"sub-{cid}-{ex_num}-{stu_id}"

            # Check if key student has explicit override
            if stu_id in KEY_STUDENT_STATUSES and eid in KEY_STUDENT_STATUSES[stu_id]:
                override = KEY_STUDENT_STATUSES[stu_id][eid]
                st = override["status"]
                m = override["marks"]
                fb = override["feedback"]
                sub_time = override["submitted_at"]
            else:
                # Distribution: Ex 01 (48 submitted: 16 Evaluated, 16 Reviewed, 16 Submitted, 12 Not Submitted)
                if ex_num == "01":
                    has_sub = i < 48
                    if has_sub:
                        st = "Evaluated" if i % 3 == 0 else ("Reviewed" if i % 3 == 1 else "Submitted")
                        m = f"{18 + (i % 3)}/20" if st == "Evaluated" else None
                        fb = f"Evaluation complete. Good work on {lab.get('code', 'Lab')} Exercise {ex_num}." if st == "Evaluated" else ("Reviewed code. Good formatting." if st == "Reviewed" else None)
                        sub_time = f"Aug {10 + (i % 3)}, {9 + (i % 6):02d}:30 AM"
                    else:
                        st = "Not Submitted"
                        m = None
                        fb = None
                        sub_time = "—"
                else:
                    has_sub = i < 36
                    if has_sub:
                        st = "Evaluated" if i % 4 == 0 else ("Reviewed" if i % 4 == 1 else "Submitted")
                        m = f"{17 + (i % 4)}/20" if st == "Evaluated" else None
                        fb = "Verified program logic." if st == "Evaluated" else None
                        sub_time = f"Aug {12 + (i % 2)}, {10 + (i % 4):02d}:15 AM"
                    else:
                        st = "Not Submitted"
                        m = None
                        fb = None
                        sub_time = "—"

            if st != "Not Submitted":
                sub_doc = {
                    "submission_id": sub_id,
                    "student_id": stu_id,
                    "student_name": s["name"],
                    "student_email": s["email"],
                    "course_id": cid,
                    "course_code": lab.get("code", cid.upper()),
                    "course_name": lab.get("name", "Laboratory Subject"),
                    "exercise_id": eid,
                    "exercise_number": ex_num,
                    "exercise_title": ex.get("title", "Laboratory Exercise"),
                    "submitted_code": SAMPLE_CODE_SNIPPETS.get(cid, "// Solution code"),
                    "language": get_default_language_for_course(cid),
                    "comments": f"Implementation for {lab.get('code', '')} Exercise {ex_num}",
                    "status": st,
                    "submitted_at": now.isoformat(),
                    "submitted_date_display": sub_time,
                    "marks": m,
                    "feedback": fb,
                    "evaluated_at": now.isoformat() if st in ["Evaluated", "Reviewed"] else None,
                    "evaluated_by": lab.get("faculty", "Faculty Member") if st in ["Evaluated", "Reviewed"] else None,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                }

                # Update in memory
                idx = next((k for k, x in enumerate(IN_MEMORY_SUBMISSIONS) if x.get("submission_id") == sub_id), None)
                if idx is not None:
                    IN_MEMORY_SUBMISSIONS[idx] = sub_doc
                else:
                    IN_MEMORY_SUBMISSIONS.append(sub_doc)
                seeded_count += 1

    # Persist to MongoDB in batch
    try:
        from pymongo import UpdateOne
        operations = [
            UpdateOne({"submission_id": s["submission_id"]}, {"$set": s}, upsert=True)
            for s in IN_MEMORY_SUBMISSIONS
        ]
        if operations:
            await db.submissions.bulk_write(operations, ordered=False)
            print(f"[Database] Successfully bulk seeded {len(operations)} student submissions in MongoDB.")
    except Exception as e:
        print(f"[Submission] DB bulk seed notice: {e}")

    print(f"[Database] Successfully prepared {seeded_count} realistic student submissions in system.")
    return {
        "seeded_count": seeded_count,
        "by_course": {
            "nsa": len([s for s in IN_MEMORY_SUBMISSIONS if s.get("course_id") == "nsa"]),
            "adbms": len([s for s in IN_MEMORY_SUBMISSIONS if s.get("course_id") == "adbms"]),
            "java": len([s for s in IN_MEMORY_SUBMISSIONS if s.get("course_id") == "java"]),
        }
    }
    return {"status": "success", "seeded_submissions_count": seeded_count}
