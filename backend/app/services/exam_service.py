from datetime import datetime, timedelta, timezone
import os

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database.mongodb import db
from app.services.faculty_service import is_faculty_authorized_for_course


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _retakes_enabled() -> bool:
    return os.getenv("EXAM_ALLOW_RETAKES", "false").strip().lower() in ("true", "1", "yes")


def _focus_guard_enabled() -> bool:
    return os.getenv("EXAM_FOCUS_GUARD_ENABLED", "true").strip().lower() in ("true", "1", "yes")


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _plain(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return _as_utc(value)
    if isinstance(value, dict):
        return {key: _plain(item) for key, item in value.items() if key != "_id"}
    if isinstance(value, list):
        return [_plain(item) for item in value]
    return value


def _student_question(question: dict) -> dict:
    result = {
        "id": question["id"],
        "prompt": question["prompt"],
        "type": question["type"],
        "options": question.get("options", []),
        "points": question["points"],
    }
    if question.get("type") == "coding":
        result["language"] = question.get("language", "python")
        result["starter_code"] = question.get("starter_code", "")
    return result


def _auto_scores(exam: dict, answers: dict) -> dict:
    scores = {}
    for question in exam.get("questions", []):
        if question.get("type") == "multiple_choice":
            scores[question["id"]] = (
                question["points"]
                if answers.get(question["id"]) == question.get("correct_answer")
                else 0
            )
    return scores


async def _get_exam(exam_id: str) -> dict:
    if not ObjectId.is_valid(exam_id):
        raise HTTPException(status_code=404, detail="Exam not found")
    exam = await db.exams.find_one({"_id": ObjectId(exam_id)})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


async def _ensure_faculty_access(exam: dict, faculty: dict) -> None:
    if not await is_faculty_authorized_for_course(faculty, exam.get("course_id")):
        raise HTTPException(status_code=403, detail="You are not assigned to this course")


def _student_courses(student: dict) -> set[str]:
    courses = student.get("enrolled_courses")
    if courses is None:
        courses = ["nsa", "adbms", "java"]
    return {str(course).strip().lower() for course in courses if course}


def _ensure_student_access(exam: dict, student: dict) -> None:
    if exam.get("course_id", "").lower() not in _student_courses(student):
        raise HTTPException(status_code=403, detail="You are not enrolled in this exam's course")


def _public_attempt(attempt: dict) -> dict:
    result = _plain(attempt)
    result["id"] = str(attempt["_id"])
    result["exam_id"] = str(attempt["exam_id"])
    return result


async def list_student_exams(student: dict) -> list[dict]:
    course_ids = sorted(_student_courses(student))
    if not course_ids:
        return []

    cursor = db.exams.find({"course_id": {"$in": course_ids}, "published": True}).sort("created_at", -1)
    exams = await cursor.to_list(length=100)
    student_id = str(student["_id"])
    result = []

    for exam in exams:
        attempt = await db.exam_attempts.find_one(
            {"exam_id": exam["_id"], "student_id": student_id},
            {"status": 1, "grading_status": 1, "score": 1, "total_points": 1, "violation_count": 1, "feedback": 1},
            sort=[("attempt_number", -1), ("started_at", -1)],
        )
        result.append({
            "id": str(exam["_id"]),
            "title": exam["title"],
            "course_id": exam["course_id"],
            "duration_minutes": exam["duration_minutes"],
            "question_count": len(exam.get("questions", [])),
            "total_points": sum(question["points"] for question in exam.get("questions", [])),
            "status": attempt.get("status") if attempt else "available",
            "grading_status": attempt.get("grading_status") if attempt else None,
            "score": attempt.get("score") if attempt and attempt.get("grading_status") == "graded" else None,
            "feedback": attempt.get("feedback") if attempt and attempt.get("grading_status") == "graded" else None,
            "violation_count": attempt.get("violation_count", 0) if attempt else 0,
            "allow_retake": _retakes_enabled(),
            "created_at": exam.get("created_at"),
        })
    return result


async def create_faculty_exam(faculty: dict, payload: dict) -> dict:
    course_id = payload["course_id"].strip().lower()
    if not await is_faculty_authorized_for_course(faculty, course_id):
        raise HTTPException(status_code=403, detail="You are not assigned to this course")

    questions = [question.model_dump() if hasattr(question, "model_dump") else dict(question) for question in payload["questions"]]
    exam = {
        "title": payload["title"].strip(),
        "course_id": course_id,
        "duration_minutes": payload["duration_minutes"],
        "questions": questions,
        "published": True,
        "created_by": str(faculty["_id"]),
        "created_by_name": faculty.get("name", "Faculty"),
        "created_at": _now(),
        "updated_at": _now(),
    }
    result = await db.exams.insert_one(exam)
    exam["_id"] = result.inserted_id
    response = _plain(exam)
    response["id"] = str(result.inserted_id)
    return response


async def list_faculty_exams(faculty: dict) -> list[dict]:
    cursor = db.exams.find({"created_by": str(faculty["_id"])}).sort("created_at", -1)
    exams = await cursor.to_list(length=100)
    result = []
    for exam in exams:
        await _ensure_faculty_access(exam, faculty)
        exam_id = exam["_id"]
        attempt_count = await db.exam_attempts.count_documents({"exam_id": exam_id})
        review_count = await db.exam_attempts.count_documents({
            "exam_id": exam_id,
            "grading_status": "pending",
            "status": {"$ne": "in_progress"},
        })
        result.append({
            "id": str(exam_id),
            "title": exam["title"],
            "course_id": exam["course_id"],
            "duration_minutes": exam["duration_minutes"],
            "question_count": len(exam.get("questions", [])),
            "total_points": sum(question["points"] for question in exam.get("questions", [])),
            "published": exam.get("published", False),
            "attempt_count": attempt_count,
            "review_count": review_count,
            "created_at": exam.get("created_at"),
        })
    return result


async def get_student_exam_room(exam_id: str, student: dict) -> dict:
    exam = await _get_exam(exam_id)
    _ensure_student_access(exam, student)
    if not exam.get("published"):
        raise HTTPException(status_code=404, detail="Exam is not available")

    attempt = await db.exam_attempts.find_one(
        {"exam_id": exam["_id"], "student_id": str(student["_id"])},
        sort=[("attempt_number", -1), ("started_at", -1)],
    )
    if attempt and attempt.get("status") == "in_progress" and _as_utc(attempt["deadline_at"]) <= _now():
        attempt = await finish_student_attempt(exam, student, "expired")

    return {
        "exam": {
            "id": str(exam["_id"]),
            "title": exam["title"],
            "course_id": exam["course_id"],
            "duration_minutes": exam["duration_minutes"],
            "questions": [_student_question(question) for question in exam.get("questions", [])],
            "total_points": sum(question["points"] for question in exam.get("questions", [])),
            "allow_retake": _retakes_enabled(),
        },
        "attempt": _public_attempt(attempt) if attempt else None,
    }


async def start_student_attempt(exam_id: str, student: dict) -> dict:
    exam = await _get_exam(exam_id)
    _ensure_student_access(exam, student)
    if not exam.get("published"):
        raise HTTPException(status_code=404, detail="Exam is not available")

    student_id = str(student["_id"])
    query = {"exam_id": exam["_id"], "student_id": student_id}
    existing = await db.exam_attempts.find_one(
        query,
        sort=[("attempt_number", -1), ("started_at", -1)],
    )
    if existing:
        if existing.get("status") == "in_progress" and _as_utc(existing["deadline_at"]) <= _now():
            existing = await finish_student_attempt(exam, student, "expired")
        if existing.get("status") == "in_progress" or not _retakes_enabled():
            return _public_attempt(existing)

    started_at = _now()
    attempt_number = await db.exam_attempts.count_documents(query) + 1
    attempt = {
        "exam_id": exam["_id"],
        "student_id": student_id,
        "attempt_number": attempt_number,
        "student_name": student.get("name", "Student"),
        "student_email": student.get("email", ""),
        "student_number": student.get("student_id", ""),
        "answers": {
            question["id"]: question.get("starter_code", "")
            for question in exam.get("questions", [])
            if question.get("type") == "coding" and question.get("starter_code")
        },
        "question_scores": _auto_scores(exam, {}),
        "score": 0,
        "total_points": sum(question["points"] for question in exam.get("questions", [])),
        "violation_count": 0,
        "status": "in_progress",
        "grading_status": "pending",
        "started_at": started_at,
        "deadline_at": started_at + timedelta(minutes=exam["duration_minutes"]),
    }
    try:
        result = await db.exam_attempts.insert_one(attempt)
        attempt["_id"] = result.inserted_id
    except DuplicateKeyError:
        attempt = await db.exam_attempts.find_one(
            query,
            sort=[("attempt_number", -1), ("started_at", -1)],
        )
    return _public_attempt(attempt)


async def _student_attempt(exam: dict, student: dict) -> dict:
    attempt = await db.exam_attempts.find_one(
        {"exam_id": exam["_id"], "student_id": str(student["_id"])},
        sort=[("attempt_number", -1), ("started_at", -1)],
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
    if attempt.get("status") == "in_progress" and _as_utc(attempt["deadline_at"]) <= _now():
        attempt = await finish_student_attempt(exam, student, "expired")
    return attempt


async def save_student_answer(exam_id: str, student: dict, question_id: str, answer: str) -> dict:
    exam = await _get_exam(exam_id)
    _ensure_student_access(exam, student)
    if not any(question["id"] == question_id for question in exam.get("questions", [])):
        raise HTTPException(status_code=404, detail="Question not found")
    attempt = await _student_attempt(exam, student)
    if attempt.get("status") != "in_progress":
        raise HTTPException(status_code=409, detail="This exam attempt is already closed")

    now = _now()
    result = await db.exam_attempts.update_one(
        {"_id": attempt["_id"], "status": "in_progress", "deadline_at": {"$gt": now}},
        {"$set": {f"answers.{question_id}": answer, "updated_at": now}},
    )
    if result.matched_count == 0:
        await _student_attempt(exam, student)
        raise HTTPException(status_code=409, detail="The exam time has expired")
    return {"saved": True}


async def ensure_exam_code_execution(
    exam_id: str, question_id: str, student: dict, language: str
) -> None:
    """Allow code execution only for the matching active exam coding question."""
    exam = await _get_exam(exam_id)
    _ensure_student_access(exam, student)
    if not exam.get("published"):
        raise HTTPException(status_code=404, detail="Exam is not available")

    question = next(
        (item for item in exam.get("questions", []) if item.get("id") == question_id),
        None,
    )
    if not question or question.get("type") != "coding":
        raise HTTPException(status_code=404, detail="Coding question not found")
    if question.get("language", "python") != language:
        raise HTTPException(status_code=422, detail="The selected language does not match this question")

    attempt = await _student_attempt(exam, student)
    if attempt.get("status") != "in_progress":
        raise HTTPException(status_code=409, detail="This exam attempt is already closed")
    if _as_utc(attempt["deadline_at"]) <= _now():
        await finish_student_attempt(exam, student, "expired")
        raise HTTPException(status_code=409, detail="The exam time has expired")


async def finish_student_attempt(exam: dict, student: dict, reason: str = "submitted") -> dict:
    attempt = await db.exam_attempts.find_one(
        {"exam_id": exam["_id"], "student_id": str(student["_id"])},
        sort=[("attempt_number", -1), ("started_at", -1)],
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
    if attempt.get("status") != "in_progress":
        return attempt

    scores = _auto_scores(exam, attempt.get("answers", {}))
    score = sum(scores.values())
    has_written_questions = any(question.get("type") != "multiple_choice" for question in exam.get("questions", []))
    await db.exam_attempts.update_one(
        {"_id": attempt["_id"], "status": "in_progress"},
        {"$set": {
            "status": reason,
            "grading_status": "pending" if has_written_questions else "graded",
            "question_scores": scores,
            "score": score,
            "submitted_at": _now(),
            "termination_reason": "focus_violations" if reason == "terminated" else None,
        }},
    )
    return await db.exam_attempts.find_one({"_id": attempt["_id"]})


async def submit_student_attempt(exam_id: str, student: dict) -> dict:
    exam = await _get_exam(exam_id)
    _ensure_student_access(exam, student)
    attempt = await _student_attempt(exam, student)
    if attempt.get("status") == "in_progress":
        attempt = await finish_student_attempt(exam, student, "submitted")
    return _public_attempt(attempt)


async def record_focus_violation(exam_id: str, student: dict, kind: str) -> dict:
    exam = await _get_exam(exam_id)
    _ensure_student_access(exam, student)
    attempt = await _student_attempt(exam, student)
    if not _focus_guard_enabled():
        return {
            "violation_count": attempt.get("violation_count", 0),
            "terminated": False,
            "attempt": _public_attempt(attempt),
        }
    if attempt.get("status") != "in_progress":
        return {"violation_count": attempt.get("violation_count", 0), "terminated": attempt.get("status") == "terminated"}

    updated = await db.exam_attempts.find_one_and_update(
        {"_id": attempt["_id"], "status": "in_progress", "deadline_at": {"$gt": _now()}},
        {"$inc": {"violation_count": 1}, "$set": {"last_violation": kind, "last_violation_at": _now()}},
        return_document=True,
    )
    if not updated:
        updated = await _student_attempt(exam, student)

    terminated = updated.get("violation_count", 0) > 2 and updated.get("status") == "in_progress"
    if terminated:
        updated = await finish_student_attempt(exam, student, "terminated")
    return {
        "violation_count": updated.get("violation_count", 0),
        "terminated": updated.get("status") == "terminated",
        "attempt": _public_attempt(updated),
    }


async def list_exam_attempts(exam_id: str, faculty: dict) -> list[dict]:
    exam = await _get_exam(exam_id)
    await _ensure_faculty_access(exam, faculty)
    cursor = db.exam_attempts.find({"exam_id": exam["_id"]}).sort("submitted_at", -1)
    attempts = await cursor.to_list(length=500)
    return [
        {
            **_public_attempt(attempt),
            "questions": [
                {
                    **_student_question(question),
                    "correct_answer": question.get("correct_answer"),
                    "answer": attempt.get("answers", {}).get(question["id"], ""),
                    "awarded_points": attempt.get("question_scores", {}).get(question["id"], 0),
                }
                for question in exam.get("questions", [])
            ],
        }
        for attempt in attempts
    ]


async def grade_exam_attempt(exam_id: str, attempt_id: str, faculty: dict, scores: dict, feedback: str) -> dict:
    exam = await _get_exam(exam_id)
    await _ensure_faculty_access(exam, faculty)
    if not ObjectId.is_valid(attempt_id):
        raise HTTPException(status_code=404, detail="Attempt not found")
    attempt = await db.exam_attempts.find_one({"_id": ObjectId(attempt_id), "exam_id": exam["_id"]})
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.get("status") == "in_progress":
        raise HTTPException(status_code=409, detail="The student has not submitted this attempt")

    question_ids = {question["id"] for question in exam.get("questions", [])}
    if set(scores) - question_ids:
        raise HTTPException(status_code=422, detail="A score was provided for an unknown question")

    final_scores = dict(attempt.get("question_scores", {}))
    question_points = {question["id"]: question["points"] for question in exam.get("questions", [])}
    for question_id, value in scores.items():
        numeric_value = float(value)
        if numeric_value < 0 or numeric_value > question_points[question_id]:
            raise HTTPException(status_code=422, detail=f"Score for question {question_id} is outside its point range")
        final_scores[question_id] = numeric_value

    total_score = sum(final_scores.get(question_id, 0) for question_id in question_points)
    await db.exam_attempts.update_one(
        {"_id": attempt["_id"]},
        {"$set": {
            "question_scores": final_scores,
            "score": total_score,
            "grading_status": "graded",
            "feedback": feedback,
            "graded_by": str(faculty["_id"]),
            "graded_at": _now(),
        }},
    )
    return _public_attempt(await db.exam_attempts.find_one({"_id": attempt["_id"]}))
