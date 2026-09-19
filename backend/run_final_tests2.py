import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        login_res = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        student_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        # 5. Security: Read backend/.env (absolute)
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\ntry:\n  with open('D:/Personal Project/labflow/backend/.env', 'r') as f: print(f.read()[:15] + '...')\nexcept Exception as e: print('Fail:', type(e).__name__, str(e))"}, headers=student_headers)
        print("5. Read .env:", res.json()["data"]["stdout"].strip())

        # 6. Security: os.listdir on absolute path outside sandbox_dir
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\ntry:\n  print(len(os.listdir('D:/Personal Project/labflow/backend')))\nexcept Exception as e: print('Fail:', type(e).__name__, str(e))"}, headers=student_headers)
        print("6. os.listdir outside sandbox:", res.json()["data"]["stdout"].strip())

asyncio.run(main())
