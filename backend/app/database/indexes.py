from app.database.mongodb import db


async def create_indexes():
    await db.students.create_index(
        "google_id",
        unique=True
    )

    await db.students.create_index(
        "email",
        unique=True
    )