import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        login_res = await client.post("/auth/student/login", json={"email": "student@fisat.ac.in", "password": "student123"})
        if login_res.status_code != 200:
            print("Failed to authenticate.")
            return
        student_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "print(input())", "stdin": "HelloLabFlow"}, headers=student_headers)
        print("Python+stdin:", res.json()["data"]["stdout"].strip() if res.status_code == 200 else res.text)

        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "java", "code": "public class Main { public static void ma(String[] args) {} }"}, headers=student_headers)
        print("Java Compile Error:", res.json()["data"]["stderr"].strip() if res.status_code == 200 else res.text)

        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "c", "code": "int main() { while(1) {} }"}, headers=student_headers)
        print("C timeout:", res.json()["data"]["status"] if res.status_code == 200 else res.text)

        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "try:\n  with open('.env', 'r') as f: print('Success')\nexcept Exception as e: print('Fail:', e)"}, headers=student_headers)
        print("Read .env:", res.json()["data"]["stdout"].strip() if res.status_code == 200 else res.text)

        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\nprint(list(os.environ.keys()))"}, headers=student_headers)
        print("Dump os.environ:", res.json()["data"]["stdout"].strip() if res.status_code == 200 else res.text)

        res = await client.post("/student/exercises/nsa-ex1/run", json={"language": "python", "code": "import os\ntry: print(len(os.listdir('..')))\nexcept Exception as e: print('Fail:', e)"}, headers=student_headers)
        print("os.listdir(..):", res.json()["data"]["stdout"].strip() if res.status_code == 200 else res.text)

asyncio.run(main())
