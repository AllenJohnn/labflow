import asyncio
import httpx

API_URL = "http://127.0.0.1:8000/api/v1"

async def test_backend():
    print("Testing Phase 4A Backend Test Case Foundation...")
    
    async with httpx.AsyncClient() as client:
        fac_resp = await client.post(f"{API_URL}/auth/login", json={
            "email": "faculty@fisat.ac.in",
            "password": "faculty123"
        })
        if fac_resp.status_code != 200:
            print("Failed to login as faculty")
            print(fac_resp.status_code)
            print(fac_resp.text)
            return
            
        fac_data = fac_resp.json()
        print(fac_data)
