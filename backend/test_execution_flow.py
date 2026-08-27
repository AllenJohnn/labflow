import asyncio
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"

async def run_execution_flow_tests():
    print("\n================================================================================")
    print("           LABFLOW PHASE 3 — EXTERNAL JUDGE0 EXECUTION ENGINE TESTS           ")
    print("================================================================================\n")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL, timeout=30.0) as client:
        # 1. Student Authentication
        print("1. Authenticating Dev Student (Allen John Joy)...")
        login_res = await client.post("/auth/student/login", json={
            "email": "student@fisat.ac.in",
            "password": "student123"
        })
        assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
        student_data = login_res.json()
        student_token = student_data["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print("   [PASS] Student authenticated.")

        # 2. Test unauthorized access
        print("\n2. Testing unauthorized access to run endpoint...")
        unauth_res = await client.post(
            "/student/exercises/nsa-ex1/run",
            json={"language": "python", "code": "print('Hello')"}
        )
        assert unauth_res.status_code == 401, "Expected 401 Unauthorized"
        print("   [PASS] Unauthorized request rejected properly.")

        # 3. Test execution service gracefully degrading if unavailable, or running if available
        print("\n3. Testing graceful degradation or successful basic python execution...")
        run_res = await client.post(
            "/student/exercises/nsa-ex1/run",
            json={"language": "python", "code": "print('Hello')"},
            headers=student_headers
        )
        assert run_res.status_code == 200, f"Run endpoint failed: {run_res.text}"
        data = run_res.json()["data"]
        assert data["language"] == "python"
        
        if data["status"] == "Service Unavailable":
            print("   [SKIP] Execution service unavailable (Judge0 is not configured or down). Skipping further tests.")
            return
            
        print("   [PASS] Judge0 execution backend is configured and available.")
        assert data["stdout"].strip() == "Hello", "Basic python execution failed"
        
        # 4. C Compilation Error
        print("\n4. Testing C compilation error handling...")
        c_res = await client.post(
            "/student/exercises/nsa-ex1/run",
            json={
                "language": "c",
                "code": "int main() { printf('Missing include'); return 0 }"
            },
            headers=student_headers
        )
        assert c_res.status_code == 200
        c_data = c_res.json()["data"]
        assert c_data["status"] == "Compilation Error"
        print("   [PASS] C Compilation error handled correctly.")
        
        # 5. Python Runtime Error
        print("\n5. Testing Python runtime error (ZeroDivisionError)...")
        py_res = await client.post(
            "/student/exercises/nsa-ex1/run",
            json={
                "language": "python",
                "code": "print(1 / 0)"
            },
            headers=student_headers
        )
        assert py_res.status_code == 200
        py_data = py_res.json()["data"]
        assert py_data["status"] == "Runtime Error"
        assert "ZeroDivisionError" in py_data["stderr"]
        print("   [PASS] Python runtime error handled correctly.")
        
        # 6. Java Success with Stdin
        print("\n6. Testing Java execution with stdin...")
        java_code = """
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine();
        System.out.println("Hello, " + name);
    }
}
"""
        java_res = await client.post(
            "/student/exercises/nsa-ex1/run",
            json={
                "language": "java",
                "code": java_code,
                "stdin": "LabFlow"
            },
            headers=student_headers
        )
        assert java_res.status_code == 200
        java_data = java_res.json()["data"]
        assert java_data["status"] == "Success"
        assert java_data["stdout"].strip() == "Hello, LabFlow"
        print("   [PASS] Java execution with stdin succeeded.")

        # 7. Execution Timeout
        print("\n7. Testing Execution Timeout constraints...")
        time_res = await client.post(
            "/student/exercises/nsa-ex1/run",
            json={
                "language": "python",
                "code": "import time\ntime.sleep(10)"
            },
            headers=student_headers
        )
        assert time_res.status_code == 200
        time_data = time_res.json()["data"]
        assert time_data["status"] == "Time Limit Exceeded"
        assert time_data["timed_out"] is True
        print("   [PASS] Timeout constraint handled successfully.")
        
        # 8. Concurrent Execution Prevention
        print("\n8. Testing Concurrent Execution Prevention...")
        # Fire two requests concurrently
        req1 = client.post(
            "/student/exercises/nsa-ex1/run",
            json={"language": "python", "code": "import time\ntime.sleep(2)"},
            headers=student_headers
        )
        req2 = client.post(
            "/student/exercises/nsa-ex1/run",
            json={"language": "python", "code": "print('Should be rejected')"},
            headers=student_headers
        )
        res1, res2 = await asyncio.gather(req1, req2)
        assert res1.status_code == 200 and res2.status_code == 200
        data1 = res1.json()["data"]
        data2 = res2.json()["data"]
        
        statuses = [data1["status"], data2["status"]]
        assert "Runtime Error" in statuses, "One of the requests should be rejected with Runtime Error (Concurrency guard)"
        assert any("already running" in str(d.get("stderr", "")) for d in [data1, data2])
        print("   [PASS] Concurrent requests from same student prevented.")

        
    print("\n================================================================================")
    print("                      ALL PHASE 3 TESTS PASSED                                ")
    print("================================================================================\n")

if __name__ == "__main__":
    asyncio.run(run_execution_flow_tests())
