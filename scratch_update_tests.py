import os
import re

updates = {
    'backend/test_admin_flow.py': ('run_tests', 'test_admin_flow'),
    'backend/test_attendance_flow.py': ('run_attendance_tests', 'test_attendance_flow'),
    'backend/test_db.py': ('main', 'test_db'),
    'backend/test_execution_flow.py': ('run_execution_flow_tests', 'test_execution_flow'),
    'backend/test_ide_flow.py': ('run_ide_flow_tests', 'test_ide_flow'),
    'backend/test_submission_flow.py': ('run_submission_workflow_tests', 'test_submission_flow'),
}

for file_path, (old_name, new_name) in updates.items():
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the function definition
    content = re.sub(rf'async def {old_name}\(\):', f'async def {new_name}():', content)
    
    # Replace the asyncio.run(...) call
    content = re.sub(rf'asyncio\.run\({old_name}\(\)\)', f'asyncio.run({new_name}())', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path}")

