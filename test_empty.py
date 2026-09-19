import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath('backend'))
from app.services.execution_service import execute_code

async def test():
    code = """n = int(input("Enter the number of values: "))
total = 0
for i in range(n):
    num = int(input("Enter a number: "))
    total += num
print("Sum =", total)"""
    stdin = ""
    res = await execute_code('test_user_empty', 'python', code, stdin)
    print("STDOUT:", repr(res.get('stdout')))
    print("STDERR:", repr(res.get('stderr')))

asyncio.run(test())
