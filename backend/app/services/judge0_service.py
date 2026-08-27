import asyncio
import base64
import logging
from typing import Dict, Any

import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Judge0 CE typical language IDs
LANGUAGE_MAPPING = {
    "c": 50,      # GCC 9.2.0
    "java": 62,   # OpenJDK 13.0.1
    "python": 71  # Python 3.8.1
}

# In-memory lock for concurrent execution prevention by student ID
# Using a set to track currently executing student IDs
_active_executions = set()

def is_judge0_configured() -> bool:
    return bool(settings.IDE_EXECUTION_ENABLED and settings.JUDGE0_API_URL)

def truncate_output(text: str) -> str:
    if not text:
        return ""
    if len(text) > settings.IDE_MAX_OUTPUT_BYTES:
        return text[:settings.IDE_MAX_OUTPUT_BYTES] + "\n...[Output Truncated]"
    return text

def normalize_response(judge_res: Dict[str, Any], language: str, execution_time_ms: int) -> Dict[str, Any]:
    status_id = judge_res.get("status", {}).get("id", 0)
    
    # 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, 6 = Compilation Error
    # 7-12 = Runtime Errors
    
    stdout = judge_res.get("stdout") or ""
    stderr = judge_res.get("stderr") or ""
    compile_output = judge_res.get("compile_output") or ""
    
    if isinstance(stdout, str):
        stdout = base64.b64decode(stdout).decode("utf-8", errors="replace") if stdout else ""
    if isinstance(stderr, str):
        stderr = base64.b64decode(stderr).decode("utf-8", errors="replace") if stderr else ""
    if isinstance(compile_output, str):
        compile_output = base64.b64decode(compile_output).decode("utf-8", errors="replace") if compile_output else ""
        
    stdout = truncate_output(stdout)
    stderr = truncate_output(stderr)
    compile_output = truncate_output(compile_output)
    
    status_text = "completed"
    if status_id == 5:
        status_text = "timeout"
    elif status_id == 6:
        status_text = "compilation_error"
        stderr = compile_output if compile_output else stderr
    elif status_id >= 7:
        status_text = "runtime_error"
        
    # Map back to LabFlow legacy statuses for Monaco if needed
    legacy_status = "Success"
    if status_text == "timeout":
        legacy_status = "Time Limit Exceeded"
    elif status_text == "compilation_error":
        legacy_status = "Compilation Error"
    elif status_text == "runtime_error":
        legacy_status = "Runtime Error"

    time_str = judge_res.get("time")
    time_float = float(time_str) if time_str else 0.0
    actual_exec_ms = int(time_float * 1000) or execution_time_ms
    
    memory_kb = judge_res.get("memory") or 0
    
    return {
        "status": legacy_status, # for backward compat
        "execution_status": status_text,
        "language": language,
        "stdout": stdout,
        "stderr": stderr,
        "compile_output": compile_output,
        "exit_code": 0 if status_text == "completed" else 1,
        "execution_time_ms": actual_exec_ms,
        "memory_kb": memory_kb,
        "timed_out": status_text == "timeout"
    }

async def execute_code(student_id: str, language: str, code: str, stdin: str = "") -> Dict[str, Any]:
    if not is_judge0_configured():
        return {
            "status": "Service Unavailable",
            "execution_status": "service_unavailable",
            "language": language,
            "stdout": "",
            "stderr": "Code execution service is currently unavailable.",
            "compile_output": "",
            "exit_code": -1,
            "execution_time_ms": 0,
            "memory_kb": 0,
            "timed_out": False
        }
        
    if language not in LANGUAGE_MAPPING:
        return {
            "status": "Runtime Error",
            "execution_status": "execution_error",
            "language": language,
            "stdout": "",
            "stderr": f"Unsupported language: {language}",
            "compile_output": "",
            "exit_code": 1,
            "execution_time_ms": 0,
            "memory_kb": 0,
            "timed_out": False
        }
        
    if student_id in _active_executions:
        return {
            "status": "Runtime Error",
            "execution_status": "execution_error",
            "language": language,
            "stdout": "",
            "stderr": "An execution is already running for your session. Please wait.",
            "compile_output": "",
            "exit_code": 1,
            "execution_time_ms": 0,
            "memory_kb": 0,
            "timed_out": False
        }

    _active_executions.add(student_id)
    
    try:
        api_url = settings.JUDGE0_API_URL.rstrip("/")
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if settings.JUDGE0_API_KEY:
            headers["X-Auth-Token"] = settings.JUDGE0_API_KEY
            # Also support RapidAPI if used
            headers["X-RapidAPI-Key"] = settings.JUDGE0_API_KEY
            
        payload = {
            "source_code": base64.b64encode(code.encode("utf-8")).decode("utf-8"),
            "language_id": LANGUAGE_MAPPING[language],
            "stdin": base64.b64encode(stdin.encode("utf-8")).decode("utf-8") if stdin else None,
            "cpu_time_limit": settings.IDE_EXECUTION_TIMEOUT_SECONDS,
            "memory_limit": settings.IDE_MEMORY_LIMIT_KB,
            "base64_encoded": True
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # 1. Create submission
                submit_res = await client.post(
                    f"{api_url}/submissions",
                    params={"base64_encoded": "true", "wait": "false"},
                    json=payload,
                    headers=headers
                )
                submit_res.raise_for_status()
                token = submit_res.json().get("token")
                
                if not token:
                    raise Exception("No token received from Judge0")
                
                # 2. Poll status
                max_polls = 15
                poll_interval = 0.5
                
                for _ in range(max_polls):
                    await asyncio.sleep(poll_interval)
                    poll_res = await client.get(
                        f"{api_url}/submissions/{token}",
                        params={"base64_encoded": "true"},
                        headers=headers
                    )
                    poll_res.raise_for_status()
                    result = poll_res.json()
                    
                    status_id = result.get("status", {}).get("id", 1)
                    if status_id not in [1, 2]: # 1=In Queue, 2=Processing
                        return normalize_response(result, language, int(max_polls * poll_interval * 1000))
                        
                # If we get here, it timed out overall
                return {
                    "status": "Time Limit Exceeded",
                    "execution_status": "timeout",
                    "language": language,
                    "stdout": "",
                    "stderr": "Execution timed out.",
                    "compile_output": "",
                    "exit_code": 1,
                    "execution_time_ms": int(max_polls * poll_interval * 1000),
                    "memory_kb": 0,
                    "timed_out": True
                }

            except httpx.HTTPError as e:
                logger.error(f"Judge0 HTTP error: {e}")
                return {
                    "status": "Service Unavailable",
                    "execution_status": "service_unavailable",
                    "language": language,
                    "stdout": "",
                    "stderr": "Code execution service is currently unavailable.",
                    "compile_output": "",
                    "exit_code": -1,
                    "execution_time_ms": 0,
                    "memory_kb": 0,
                    "timed_out": False
                }
            except Exception as e:
                logger.error(f"Judge0 Error: {e}")
                return {
                    "status": "Runtime Error",
                    "execution_status": "execution_error",
                    "language": language,
                    "stdout": "",
                    "stderr": "An unexpected error occurred during execution.",
                    "compile_output": "",
                    "exit_code": 1,
                    "execution_time_ms": 0,
                    "memory_kb": 0,
                    "timed_out": False
                }
    finally:
        _active_executions.remove(student_id)
