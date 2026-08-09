from app.database.mongodb import db


async def create_indexes():
    # Helper to safely create index without throwing on pre-existing spec conflicts
    async def safe_create_index(collection, keys, **kwargs):
        try:
            await collection.create_index(keys, **kwargs)
        except Exception as e:
            print(f"Index creation notice for {collection.name} ({keys}): {e}")

    # Students indexes
    await safe_create_index(db.students, "google_id", unique=True, sparse=True)
    await safe_create_index(db.students, "email", unique=True, sparse=True)
    await safe_create_index(db.students, "student_id", unique=True, sparse=True)
    await safe_create_index(db.students, "department")
    await safe_create_index(db.students, "semester")

    # Faculty indexes
    await safe_create_index(db.faculty, "email", unique=True, sparse=True)
    await safe_create_index(db.faculty, "google_id", unique=True, sparse=True)
    await safe_create_index(db.faculty, "faculty_id", unique=True, sparse=True)
    await safe_create_index(db.faculty, "department")

    # Admins indexes
    await safe_create_index(db.admins, "email", unique=True, sparse=True)