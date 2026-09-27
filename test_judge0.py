import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.services.judge0_service import execute_code
from app.config.settings import settings

async def main():
    print(f"JUDGE0_API_URL: {settings.JUDGE0_API_URL}")
    student_id = "test_student_123"
    
    print("\n--- Python Test ---")
    res = await execute_code(student_id, "python", 'print("Hello LabFlow")')
    print(res)
    
    print("\n--- C Test ---")
    c_code = "#include <stdio.h>\nint main() {\n    printf(\"Hello LabFlow\");\n    return 0;\n}"
    res2 = await execute_code(student_id, "c", c_code)
    print(res2)
    
    print("\n--- Java Test ---")
    java_code = "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello LabFlow\");\n    }\n}"
    res3 = await execute_code(student_id, "java", java_code)
    print(res3)
    
    print("\n--- Python stdin Test ---")
    py_stdin_code = "import sys\nnum = sys.stdin.read().strip()\nprint(f'Input: {num}')"
    res4 = await execute_code(student_id, "python", py_stdin_code, "42")
    print(res4)
    
    print("\n--- C Compilation Error Test ---")
    c_err_code = "int main() { printf(\"Missing include\") return 0; }"
    res5 = await execute_code(student_id, "c", c_err_code)
    print(res5)
    
    print("\n--- Python Runtime Error Test ---")
    py_err_code = "print(1/0)"
    res6 = await execute_code(student_id, "python", py_err_code)
    print(res6)
    
    print("\n--- Unsupported Language Test ---")
    res7 = await execute_code(student_id, "javascript", "console.log('Hello')")
    print(res7)

if __name__ == "__main__":
    asyncio.run(main())
