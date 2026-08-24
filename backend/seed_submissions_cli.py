import asyncio
from app.database.mongodb import check_database_connection
from app.services.submission_service import seed_demo_submissions

async def main():
    print("=== LabFlow Demo Submissions Seeding Script ===")
    try:
        await check_database_connection()
    except Exception as e:
        print(f"Notice: Database check: {e}")

    result = await seed_demo_submissions(force_reset=False)
    print("Result:", result)
    print("Seeding completed.")

if __name__ == "__main__":
    asyncio.run(main())
