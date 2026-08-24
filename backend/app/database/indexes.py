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
