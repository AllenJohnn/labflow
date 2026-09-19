import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        login_res = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        student_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        print("\n--- TEST BATTERY ---")

        # 1. Python + stdin
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "print(input())", "stdin": "LabFlowRocks"}, headers=student_headers)
        print("1. Python+stdin:", res.json()["data"]["stdout"].strip())

        # 2. Java compile error (Missing Compiler test)
        # To simulate missing compiler on a system that has it, we'll just show that a syntax error behaves normally
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "java", "code": "public class Main { public static vo ma(String[] args) {} }"}, headers=student_headers)
        print("2. Java Compile Error:", res.json()["data"]["stderr"].strip().split('\n')[0])

        # 3. C timeout
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "c", "code": "int main() { while(1) {} }"}, headers=student_headers)
        print("3. C Timeout:", res.json()["data"]["status"], "(Stderr:", res.json()["data"]["stderr"], ")")

        # 4. Security: Dump os.environ
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\nprint(list(os.environ.keys()))"}, headers=student_headers)
        print("4. Dump os.environ:", res.json()["data"]["stdout"].strip())

        # 5. Security: Read backend/.env (absolute)
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\ntry:\n  with open(r'D:\Personal Project\labflow\backend\.env', 'r') as f: print(f.read()[:15] + '...')\nexcept Exception as e: print('Fail:', type(e).__name__)"}, headers=student_headers)
        print("5. Read .env:", res.json()["data"]["stdout"].strip())

        # 6. Security: os.listdir on absolute path outside sandbox_dir
        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\ntry:\n  print(len(os.listdir(r'D:\Personal Project\labflow\backend')))\nexcept Exception as e: print('Fail:', type(e).__name__)"}, headers=student_headers)
        print("6. os.listdir outside sandbox:", res.json()["data"]["stdout"].strip())

asyncio.run(main())
