from app.database.mongodb import db

async def create_indexes():
    async def safe_create_index(collection, keys, **kwargs):
        try:
            await collection.create_index(keys, **kwargs)
        except Exception as e:
            print(f"Index creation notice for {collection.name} ({keys}): {e}")

    await safe_create_index(db.students, "google_id", unique=True, sparse=True)
    await safe_create_index(db.students, "email", unique=True, sparse=True)
    await safe_create_index(db.students, "student_id", unique=True, sparse=True)
    await safe_create_index(db.students, "department")
    await safe_create_index(db.students, "semester")

    await safe_create_index(db.faculty, "email", unique=True, sparse=True)
    await safe_create_index(db.faculty, "google_id", unique=True, sparse=True)
    await safe_create_index(db.faculty, "faculty_id", unique=True, sparse=True)
    await safe_create_index(db.faculty, "department")

    await safe_create_index(db.admins, "email", unique=True, sparse=True)

    await safe_create_index(db.submissions, "submission_id", unique=True, sparse=True)
    await safe_create_index(db.submissions, [("student_id", 1), ("exercise_id", 1)])
    await safe_create_index(db.submissions, [("course_id", 1), ("exercise_id", 1)])
    await safe_create_index(db.submissions, [("course_id", 1), ("status", 1)])
    await safe_create_index(db.submissions, "student_email")

    # Preserve legacy attempts as attempt 1, then permit additional attempts
    # without losing the original submission/review history.
    attempt_indexes = await db.exam_attempts.index_information()
    legacy_unique_indexes = [
        name
        for name, index in attempt_indexes.items()
        if index.get("unique")
        and (
            [key for key, _ in index.get("key", [])]
            if isinstance(index.get("key"), list)
            else list(index.get("key", {}).keys())
        ) == ["exam_id", "student_id"]
    ]
    if legacy_unique_indexes:
        await db.exam_attempts.update_many(
            {"attempt_number": {"$exists": False}},
            {"$set": {"attempt_number": 1}},
        )
        for index_name in legacy_unique_indexes:
            await db.exam_attempts.drop_index(index_name)

    await safe_create_index(
        db.exam_attempts,
        [("exam_id", 1), ("student_id", 1), ("attempt_number", 1)],
        unique=True,
        name="one_numbered_attempt_per_student_exam",
    )
    await safe_create_index(db.exam_attempts, [("exam_id", 1), ("status", 1)])
