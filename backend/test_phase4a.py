import asyncio
import httpx

API_URL = "http://127.0.0.1:8001/api/v1"

async def test_backend():
    print("Testing Phase 4A Backend Test Case Foundation...")
    
    # 1. Login as faculty
    async with httpx.AsyncClient(trust_env=False) as client:
        fac_resp = await client.post(f"{API_URL}/auth/faculty/login", json={
            "email": "faculty@fisat.ac.in",
            "password": "faculty123"
        })
        fac_data = fac_resp.json()
        if "access_token" not in fac_data:
            print("Failed to login as faculty")
            print(fac_resp.status_code)
            print(fac_resp.text)
            return
        
        fac_token = fac_data["access_token"]
        fac_headers = {"Authorization": f"Bearer {fac_token}"}
        
        print("\n[+] Testing PUT test-cases route...")
        tc_payload = {
            "test_cases": [
                {
                    "id": "tc1",
                    "input": "4\n",
                    "expected_output": "16\n",
                    "is_hidden": False
                },
                {
                    "id": "tc2",
                    "input": "5\n",
                    "expected_output": "25\n",
                    "is_hidden": True
                }
            ]
        }
        
        put_resp = await client.put(f"{API_URL}/faculty/exercises/nsa-ex1/test-cases", json=tc_payload, headers=fac_headers)
        if put_resp.status_code == 200:
            print("[PASS] Successfully updated test cases")
        else:
            print(f"[FAIL] Failed to update test cases: {put_resp.text}")
            
    # 2. Login as student
    async with httpx.AsyncClient(trust_env=False) as client:
        stu_resp = await client.post(f"{API_URL}/auth/student/login", json={
            "email": "allenjohnjoy2004@gmail.com",
            "password": "password123"
        })
        stu_data = stu_resp.json()
        
        if "access_token" not in stu_data:
            print("Failed to login as student")
            print(stu_data)
            return
            
        stu_token = stu_data["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}
        
        print("\n[+] Testing POST run-tests route (Passing code)...")
        passing_code = "import sys\nprint(int(sys.stdin.read().strip()) ** 2)"
        
        run_resp = await client.post(f"{API_URL}/student/exercises/nsa-ex1/run-tests", json={
            "language": "python",
            "code": passing_code
        }, headers=stu_headers, timeout=15.0)
        
        if run_resp.status_code == 200:
            print("[PASS] run-tests success!")
            data = run_resp.json().get("data", {})
            print(f"Status: {data.get('status')} | Passed: {data.get('passed_tests')}/{data.get('total_tests')}")
            for tc in data.get("results", []):
                print(f"  TC {tc['test_case_id']}: {tc['status']} | Expected: {repr(tc.get('expected_output', 'HIDDEN'))} | Actual: {repr(tc.get('actual_output', 'HIDDEN'))}")
        else:
            print(f"[FAIL] Failed to run tests: {run_resp.text}")
            
        print("\n[+] Testing POST run-tests route (Failing code)...")
        failing_code = "import sys\nprint(int(sys.stdin.read().strip()) ** 3)"
        
        run_resp2 = await client.post(f"{API_URL}/student/exercises/nsa-ex1/run-tests", json={
            "language": "python",
            "code": failing_code
        }, headers=stu_headers, timeout=15.0)
        
        if run_resp2.status_code == 200:
            print("[PASS] run-tests (fail) success!")
            data = run_resp2.json().get("data", {})
            print(f"Status: {data.get('status')} | Passed: {data.get('passed_tests')}/{data.get('total_tests')}")
            for tc in data.get("results", []):
                print(f"  TC {tc['test_case_id']}: {tc['status']} | Expected: {repr(tc.get('expected_output', 'HIDDEN'))} | Actual: {repr(tc.get('actual_output', 'HIDDEN'))}")
        else:
            print(f"[FAIL] Failed to run tests: {run_resp2.text}")
            
if __name__ == '__main__':
    asyncio.run(test_backend())
