import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.execution_service import execute_code

async def main():
    print("Testing Python with input()")
    res = await execute_code("student_1", "python", "name = input()\nprint('Hello ' + name)", stdin="World")
    print(res["execution_status"], repr(res["stdout"]))

    print("\nTesting Java with compile error")
    res = await execute_code("student_1", "java", "public class Main { public static void main(String[] args) { error; } }")
    print(res["execution_status"], repr(res["stderr"]))

    print("\nTesting C with infinite loop (timeout)")
    res = await execute_code("student_1", "c", "int main() { while(1); return 0; }")
    print(res["execution_status"])

    print("\nTesting C with memory limit exceeded")
    res = await execute_code("student_1", "c", "#include <stdlib.h>\nint main() { while(1) malloc(1024*1024); return 0; }")
    print(res["execution_status"])

asyncio.run(main())
