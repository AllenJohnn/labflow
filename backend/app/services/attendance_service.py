import os
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from app.database.mongodb import db
from app.services.admin_service import IN_MEMORY_SYSTEM_SETTINGS, log_audit_action

DEFAULT_TIMETABLE = [
    {
        "id": "tt-1",
        "day": "Monday",
        "day_index": 0,
        "start_time": "09:30",
        "end_time": "12:30",
        "course_id": "nsa",
        "code": "20MCA131",
        "name": "Network Security & Applications Lab",
        "faculty": "Rakhi",
        "faculty_email": "faculty@fisat.ac.in",
        "location": "Systems Lab 1",
        "department": "MCA",
        "semester": "S3"
    },
    {
        "id": "tt-2",
        "day": "Wednesday",
        "day_index": 2,
        "start_time": "13:30",
        "end_time": "16:30",
        "course_id": "adbms",
        "code": "20MCA134",
        "name": "Advanced DBMS Lab",
        "faculty": "Shidha",
        "faculty_email": "shidha@fisat.ac.in",
        "location": "Database Systems Lab",
        "department": "MCA",
        "semester": "S3"
    },
    {
        "id": "tt-3",
        "day": "Friday",
        "day_index": 4,
        "start_time": "09:30",
        "end_time": "12:30",
        "course_id": "java",
        "code": "20MCA132",
        "name": "Object Oriented Programming Lab (Java)",
        "faculty": "Shidha",
        "faculty_email": "shidha@fisat.ac.in",
        "location": "Java Programming Lab",
        "department": "MCA",
        "semester": "S3"
    },
    {
        "id": "tt-4",
        "day": "Tuesday",
        "day_index": 1,
        "start_time": "10:30",
        "end_time": "12:30",
        "course_id": "nsa",
        "code": "20MCA131",
        "name": "Network Security & Applications Practice Lab",
        "faculty": "Rakhi",
        "faculty_email": "faculty@fisat.ac.in",
        "location": "Systems Lab 1",
        "department": "MCA",
        "semester": "S3"
    },
    {
        "id": "tt-5",
        "day": "Thursday",
        "day_index": 3,
        "start_time": "14:00",
        "end_time": "16:30",
        "course_id": "adbms",
        "code": "20MCA134",
        "name": "ADBMS Query Optimization & Tuning Lab",
        "faculty": "Shidha",
        "faculty_email": "shidha@fisat.ac.in",
        "location": "Database Systems Lab",
        "department": "MCA",
        "semester": "S3"
    },
    {
        "id": "tt-6",
        "day": "Saturday",
        "day_index": 5,
        "start_time": "09:00",
        "end_time": "18:00",
        "course_id": "nsa",
        "code": "20MCA131",
        "name": "Network Security & Applications Lab",
        "faculty": "Rakhi",
        "faculty_email": "faculty@fisat.ac.in",
        "location": "Systems Lab 1",
        "department": "MCA",
        "semester": "S3"
    }
]

HISTORICAL_SESSIONS = [
    {"id": "sess-1", "date": "2026-08-03", "course_id": "nsa", "topic": "Socket Programming Basics", "time": "09:30 - 12:30", "faculty": "Rakhi", "location": "Systems Lab 1"},
    {"id": "sess-2", "date": "2026-08-04", "course_id": "nsa", "topic": "Packet Sniffing with Wireshark", "time": "10:30 - 12:30", "faculty": "Rakhi", "location": "Systems Lab 1"},
    {"id": "sess-3", "date": "2026-08-05", "course_id": "adbms", "topic": "Relational Schema DDL/DML", "time": "13:30 - 16:30", "faculty": "Shidha", "location": "Database Systems Lab"},
    {"id": "sess-4", "date": "2026-08-06", "course_id": "adbms", "topic": "Complex Joins & Subqueries", "time": "14:00 - 16:30", "faculty": "Shidha", "location": "Database Systems Lab"},
    {"id": "sess-5", "date": "2026-08-07", "course_id": "java", "topic": "Class Hierarchies & Interfaces", "time": "09:30 - 12:30", "faculty": "Shidha", "location": "Java Programming Lab"},
    {"id": "sess-6", "date": "2026-08-10", "course_id": "nsa", "topic": "TCP Client-Server Communication", "time": "09:30 - 12:30", "faculty": "Rakhi", "location": "Systems Lab 1"},
    {"id": "sess-7", "date": "2026-08-11", "course_id": "nsa", "topic": "Port Scanning & Firewall Setup", "time": "10:30 - 12:30", "faculty": "Rakhi", "location": "Systems Lab 1"},
    {"id": "sess-8", "date": "2026-08-12", "course_id": "adbms", "topic": "PL/SQL Procedures & Cursors", "time": "13:30 - 16:30", "faculty": "Shidha", "location": "Database Systems Lab"},
    {"id": "sess-9", "date": "2026-08-13", "course_id": "adbms", "topic": "Database Triggers & Packages", "time": "14:00 - 16:30", "faculty": "Shidha", "location": "Database Systems Lab"},
    {"id": "sess-10", "date": "2026-08-14", "course_id": "java", "topic": "Exception Handling & Collections", "time": "09:30 - 12:30", "faculty": "Shidha", "location": "Java Programming Lab"},
    {"id": "sess-11", "date": "2026-08-15", "course_id": "nsa", "topic": "Cryptographic Ciphers & Hashing", "time": "09:30 - 12:30", "faculty": "Rakhi", "location": "Systems Lab 1"},
]

IN_MEMORY_ATTENDANCE = {}

STUDENT_ENROLLED_LABS = ["nsa", "adbms", "java"]

def get_active_or_next_lab_session(department="MCA", semester="S3", target_course_id=None):
    now = datetime.now()
    current_weekday = now.strftime("%A")
    current_time_str = now.strftime("%H:%M")
    today_str = now.strftime("%Y-%m-%d")

    active_session = None

    for item in DEFAULT_TIMETABLE:
        if target_course_id and item["course_id"].lower() != target_course_id.lower():
            continue

        if item["day"].lower() == current_weekday.lower():
            if item["start_time"] <= current_time_str <= item["end_time"]:
                active_session = {
                    **item,
                    "date": today_str,
                    "is_active_now": True,
                    "status_label": "Live Now (Lab Session in Progress)"
                }
                break
            elif current_time_str < item["start_time"]:
                active_session = {
                    **item,
                    "date": today_str,
                    "is_active_now": False,
                    "status_label": f"Today at {item['start_time']}"
                }
                break

    upcoming = []
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    current_day_idx = now.weekday()

    for offset in range(1, 8):
        check_day_idx = (current_day_idx + offset) % 7
        if check_day_idx < 5:
            check_day_name = days_order[check_day_idx]
            classes_on_day = [c for c in DEFAULT_TIMETABLE if c["day"] == check_day_name]
            for c in classes_on_day:
                target_date = (now + timedelta(days=offset)).strftime("%Y-%m-%d")
                upcoming.append({
                    **c,
                    "date": target_date,
                    "days_away": offset,
                    "day_label": "Tomorrow" if offset == 1 else f"In {offset} days ({check_day_name})"
                })

    return {
        "active_session": active_session,
        "upcoming_classes": upcoming[:4],
        "current_date": today_str,
        "current_time": current_time_str
    }

async def record_student_lab_attendance(student_doc: dict, course_id: str, is_manual: bool = False):
    if not student_doc:
        return {"status": "unauthorized", "message": "Authentication required."}

    cid = course_id.lower().strip()
    student_id = student_doc.get("student_id") or str(student_doc.get("_id"))
    student_name = student_doc.get("name", "Student")
    roll_no = student_doc.get("roll_no") or (student_id[-4:] if len(student_id) >= 4 else "01")
    today_str = datetime.now().strftime("%Y-%m-%d")
    current_time_str = datetime.now().strftime("%H:%M:%S")

    if cid not in STUDENT_ENROLLED_LABS:
        return {
            "status": "not_enrolled",
            "message": f"Student is not enrolled in laboratory '{course_id.upper()}'."
        }

    rec_key = f"{student_id}_{cid}_{today_str}"
    if rec_key in IN_MEMORY_ATTENDANCE:
        existing = IN_MEMORY_ATTENDANCE[rec_key]
        return {
            "status": "already_recorded",
            "message": f"Attendance already recorded as {existing.get('status')} for this laboratory session.",
            "attendance_status": existing.get("status"),
            "record": existing
        }

    try:
        db_doc = await db.attendance.find_one({
            "student_id": student_id,
            "course_id": cid,
            "date": today_str
        })
        if db_doc:
            db_doc["_id"] = str(db_doc["_id"])
            IN_MEMORY_ATTENDANCE[rec_key] = db_doc
            return {
                "status": "already_recorded",
                "message": f"Attendance already recorded as {db_doc.get('status')} for this laboratory session.",
                "attendance_status": db_doc.get("status"),
                "record": db_doc
            }
    except Exception as e:
        print(f"[Attendance] DB duplicate check notice: {e}")

    session_info = get_active_or_next_lab_session(target_course_id=cid)
    active_session = session_info["active_session"]

    if not active_session or not active_session.get("is_active_now"):
        return {
            "status": "no_active_session",
            "message": f"No active scheduled session for laboratory '{course_id.upper()}' at this time."
        }

    grace_period_mins = IN_MEMORY_SYSTEM_SETTINGS.get("late_grace_period_minutes", 10)
    try:
        start_parts = active_session["start_time"].split(":")
        start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
        now_time = datetime.now()
        current_minutes = now_time.hour * 60 + now_time.minute

        if current_minutes <= (start_minutes + grace_period_mins):
            attendance_status = "Present"
        else:
            attendance_status = "Late"
    except Exception:
        attendance_status = "Present"

    source_type = "manual_check_in" if is_manual else "auto_lab_entry"
    marked_by = "System (Manual Check-In)" if is_manual else "System (Auto Lab Entry)"

    attendance_record = {
        "student_id": student_id,
        "student_name": student_name,
        "roll_no": roll_no,
        "email": student_doc.get("email"),
        "course_id": cid,
        "course_name": active_session.get("name", course_id.upper()),
        "date": today_str,
        "time": current_time_str,
        "status": attendance_status,
        "source": source_type,
        "marked_by": marked_by,
        "verification": "Authenticated Lab-Session Access",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    IN_MEMORY_ATTENDANCE[rec_key] = attendance_record

    try:
        await db.attendance.update_one(
            {"student_id": student_id, "course_id": cid, "date": today_str},
            {"$set": attendance_record},
            upsert=True
        )
    except Exception as e:
        print(f"[Attendance] DB insert notice: {e}")

    return {
        "status": "recorded",
        "attendance_status": attendance_status,
        "message": f"Attendance successfully recorded as {attendance_status} for {active_session.get('name')}.",
        "record": attendance_record
    }

async def get_student_attendance_data(student_doc: dict):
    student_id = student_doc.get("student_id") or "FIT25MCA-2008"
    student_name = student_doc.get("name", "Allen John Joy")

    required_threshold = float(IN_MEMORY_SYSTEM_SETTINGS.get("required_attendance_threshold", 75.0))

    db_records = {}
    try:
        cursor = db.attendance.find({"student_id": student_id})
        async for doc in cursor:
            k = f"{doc.get('course_id')}_{doc.get('date')}"
            db_records[k] = doc
    except Exception:
        pass

    calendar_days = []
    course_counts = {
        "nsa": {"attended": 0, "total": 0, "name": "Network Security & Applications Lab", "code": "20MCA131"},
        "adbms": {"attended": 0, "total": 0, "name": "Advanced DBMS Lab", "code": "20MCA134"},
        "java": {"attended": 0, "total": 0, "name": "OOP Lab (Java)", "code": "20MCA132"}
    }

    for idx, sess in enumerate(HISTORICAL_SESSIONS):
        cid = sess["course_id"]
        sess_date = sess["date"]
        rec_key = f"{student_id}_{cid}_{sess_date}"

        status = "Present"
        marked_by = "System (Lab Entry)"

        if rec_key in IN_MEMORY_ATTENDANCE:
            status = IN_MEMORY_ATTENDANCE[rec_key].get("status", "Present")
            marked_by = IN_MEMORY_ATTENDANCE[rec_key].get("marked_by", "Faculty Override")
        elif f"{cid}_{sess_date}" in db_records:
            status = db_records[f"{cid}_{sess_date}"].get("status", "Present")
            marked_by = db_records[f"{cid}_{sess_date}"].get("marked_by", "Faculty")
        else:
            if idx == 3:
                status = "Absent"
                marked_by = "Faculty (Unexcused Absence)"
            elif idx == 8:
                status = "Late"
                marked_by = "System (Late Entry)"
            else:
                status = "Present"
                marked_by = "System (Lab Entry)"

        if cid in course_counts:
            course_counts[cid]["total"] += 1
            if status in ["Present", "Late"]:
                course_counts[cid]["attended"] += 1

        calendar_days.append({
            "id": f"sess-{idx+1}",
            "date": sess_date,
            "course_id": cid,
            "code": course_counts.get(cid, {}).get("code", cid.upper()),
            "course_name": sess["topic"],
            "faculty": sess.get("faculty", "Faculty In-Charge"),
            "location": sess.get("location", "Computing Laboratory"),
            "time": sess["time"],
            "status": status,
            "marked_by": marked_by
        })

    total_conducted = sum(c["total"] for c in course_counts.values())
    total_attended = sum(c["attended"] for c in course_counts.values())
    overall_percentage = round((total_attended / total_conducted * 100), 1) if total_conducted > 0 else 100.0
    is_above_threshold = overall_percentage >= required_threshold

    courses_breakdown = []
    for cid, data in course_counts.items():
        pct = round((data["attended"] / data["total"] * 100), 1) if data["total"] > 0 else 100.0
        courses_breakdown.append({
            "course_id": cid,
            "code": data["code"],
            "name": data["name"],
            "attended": data["attended"],
            "total": data["total"],
            "percentage": pct,
            "is_above_threshold": pct >= required_threshold,
            "status": "Above Required Threshold" if pct >= required_threshold else "Attendance Warning"
        })

    session_context = get_active_or_next_lab_session()

    return {
        "student_id": student_id,
        "student_name": student_name,
        "overall_percentage": overall_percentage,
        "total_attended": total_attended,
        "total_conducted": total_conducted,
        "required_threshold": required_threshold,
        "is_above_threshold": is_above_threshold,
        "status_label": "Above Required Threshold" if is_above_threshold else "Attendance Warning",
        "courses_breakdown": courses_breakdown,
        "calendar_records": calendar_days,
        "active_session": session_context["active_session"],
        "upcoming_classes": session_context["upcoming_classes"],
        "timetable": DEFAULT_TIMETABLE
    }

async def get_faculty_attendance_overview(faculty_doc: dict):
    assigned_labs = [str(x).lower().strip() for x in faculty_doc.get("assigned_labs", ["nsa"])]
    required_threshold = float(IN_MEMORY_SYSTEM_SETTINGS.get("required_attendance_threshold", 75.0))

    labs_summary = []
    total_students_managed = 60

    for cid in assigned_labs:
        course_name = "Network Security & Applications Lab" if cid == "nsa" else ("Advanced DBMS Lab" if cid == "adbms" else "Object Oriented Programming Lab")
        course_code = "20MCA131" if cid == "nsa" else ("20MCA134" if cid == "adbms" else "20MCA132")

        sessions = [s for s in HISTORICAL_SESSIONS if s["course_id"] == cid]
        session_count = len(sessions)
        avg_pct = 93.4 if cid == "nsa" else (91.8 if cid == "adbms" else 95.0)

        labs_summary.append({
            "course_id": cid,
            "code": course_code,
            "name": course_name,
            "total_students": total_students_managed,
            "total_sessions": session_count,
            "avg_attendance_percentage": avg_pct,
            "required_threshold": required_threshold,
            "is_compliant": avg_pct >= required_threshold,
            "present_today": 56,
            "absent_today": 4,
            "shortage_count": 2,
            "latest_session": sessions[-1] if sessions else None
        })

    return {
        "faculty_name": faculty_doc.get("name", "Faculty"),
        "assigned_labs": labs_summary,
        "historical_dates": [s["date"] for s in HISTORICAL_SESSIONS],
        "timetable": [t for t in DEFAULT_TIMETABLE if t["course_id"] in assigned_labs]
    }

async def get_faculty_session_attendance_roster(course_id: str, session_date: str):
    from app.services.faculty_service import DEMO_STUDENTS
    cid = course_id.lower().strip()

    student_records = []
    for s in DEMO_STUDENTS:
        sid = s["student_id"]
        rec_key = f"{sid}_{cid}_{session_date}"

        status = "Present"
        marked_by = "System (Lab Entry)"

        if rec_key in IN_MEMORY_ATTENDANCE:
            status = IN_MEMORY_ATTENDANCE[rec_key].get("status", "Present")
            marked_by = IN_MEMORY_ATTENDANCE[rec_key].get("marked_by", "Faculty Override")
        else:
            if sid.endswith("2001") and session_date == "2026-08-05":
                status = "Absent"
                marked_by = "Faculty (Unexcused)"
            elif sid.endswith("2010"):
                status = "Late"
                marked_by = "System (Late Entry)"
            else:
                status = "Present"
                marked_by = "System (Lab Entry)"

        student_records.append({
            "student_id": sid,
            "name": s["name"],
            "email": s["email"],
            "roll_no": sid[-2:],
            "status": status,
            "marked_by": marked_by,
            "date": session_date,
            "course_id": cid
        })

    present_cnt = sum(1 for r in student_records if r["status"] == "Present")
    absent_cnt = sum(1 for r in student_records if r["status"] == "Absent")
    late_cnt = sum(1 for r in student_records if r["status"] == "Late")
    excused_cnt = sum(1 for r in student_records if r["status"] == "Excused")

    return {
        "course_id": cid,
        "date": session_date,
        "total_enrolled": len(student_records),
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "late_count": late_cnt,
        "excused_count": excused_cnt,
        "attendance_percentage": round(((present_cnt + late_cnt) / len(student_records) * 100), 1) if student_records else 0,
        "students": student_records
    }

async def update_single_student_attendance(course_id: str, student_id: str, session_date: str, new_status: str, faculty_name: str = "Faculty"):
    cid = course_id.lower().strip()
    rec_key = f"{student_id}_{cid}_{session_date}"

    record = {
        "student_id": student_id,
        "course_id": cid,
        "date": session_date,
        "status": new_status,
        "source": "faculty_override",
        "marked_by": f"Faculty ({faculty_name})",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    IN_MEMORY_ATTENDANCE[rec_key] = record

    try:
        await db.attendance.update_one(
            {"student_id": student_id, "course_id": cid, "date": session_date},
            {"$set": record},
            upsert=True
        )
    except Exception as e:
        print(f"[Attendance] DB update notice: {e}")

    try:
        await log_audit_action(
            action="MANUAL_ATTENDANCE_OVERRIDE",
            target=f"Student: {student_id}, Course: {cid.upper()}",
            summary=f"Changed attendance status on {session_date} to '{new_status}'",
            admin_name=faculty_name
        )
    except Exception as e:
        print(f"[Attendance] Audit log notice: {e}")

    return record

async def batch_update_course_attendance(course_id: str, session_date: str, new_status: str, faculty_name: str = "Faculty"):
    from app.services.faculty_service import DEMO_STUDENTS
    cid = course_id.lower().strip()

    updated = []
    for s in DEMO_STUDENTS:
        sid = s["student_id"]
        rec_key = f"{sid}_{cid}_{session_date}"
        record = {
            "student_id": sid,
            "student_name": s["name"],
            "course_id": cid,
            "date": session_date,
            "status": new_status,
            "source": "faculty_override",
            "marked_by": f"Faculty Batch ({faculty_name})",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        IN_MEMORY_ATTENDANCE[rec_key] = record
        updated.append(record)

    try:
        for rec in updated:
            await db.attendance.update_one(
                {"student_id": rec["student_id"], "course_id": cid, "date": session_date},
                {"$set": rec},
                upsert=True
            )
    except Exception as e:
        print(f"[Attendance] DB batch update notice: {e}")

    try:
        await log_audit_action(
            action="BATCH_ATTENDANCE_UPDATE",
            target=f"Course: {cid.upper()}, Date: {session_date}",
            summary=f"Batch marked all {len(updated)} students as '{new_status}'",
            admin_name=faculty_name
        )
    except Exception as e:
        print(f"[Attendance] Audit log notice: {e}")

    return {
        "course_id": cid,
        "date": session_date,
        "updated_count": len(updated),
        "status": new_status,
        "message": f"Successfully marked all {len(updated)} students as {new_status} for session on {session_date}."
    }
