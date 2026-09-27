import re

file_path = 'backend/app/routes/student.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I want to replace the whole submit_exercise_work_route block down to where it calls create_or_update_submission
pattern = r'''@router\.post\("/exercises/\{exercise_id\}/submit"\)\nasync def submit_exercise_work_route\(.*?result = await create_or_update_submission'''

replacement = '''@router.post("/exercises/{exercise_id}/submit")
async def submit_exercise_work_route(
    exercise_id: str,
    payload: StudentSubmissionCreateSchema,
    current_student: dict = Depends(get_current_student)
):
    from app.services.submission_service import create_or_update_submission
    from app.services.judge0_service import execute_code as judge0_execute

    student_id = str(current_student["_id"])
    
    exec_result = await judge0_execute(
        student_id=student_id,
        language=payload.language or "c",
        code=payload.code,
        stdin=payload.stdin
    )

    result = await create_or_update_submission'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated student.py submit route")
