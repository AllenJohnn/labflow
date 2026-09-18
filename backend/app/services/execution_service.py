import os
import shutil
import tempfile
import time
import subprocess
import sys
import logging
from typing import Dict, Any

from app.config.settings import settings

logger = logging.getLogger(__name__)

_active_executions = set()

def truncate_output(text: str, max_bytes: int) -> str:
    if not text:
        return ""
    encoded = text.encode('utf-8', errors='replace')
    if len(encoded) > max_bytes:
        return encoded[:max_bytes].decode('utf-8', errors='replace') + "\n...[Output Truncated]"
    return text

def set_limits():
    try:
        import resource
        memory_limit_bytes = settings.IDE_MEMORY_LIMIT_KB * 1024
        resource.setrlimit(resource.RLIMIT_AS, (memory_limit_bytes, memory_limit_bytes))
    except (ImportError, ValueError, OSError, AttributeError):
        pass

async def execute_code(student_id: str, language: str, code: str, stdin: str = "") -> Dict[str, Any]:
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
    
    sandbox_dir = tempfile.mkdtemp(prefix="labflow_sandbox_")
    
    try:
        source_file = ""
        run_cmd = []
        compile_cmd = []
        
        if language == "python":
            source_file = "main.py"
            run_cmd = [sys.executable, "main.py"]
        elif language == "c":
            source_file = "main.c"
            if sys.platform == "win32":
                compile_cmd = ["gcc", "-O2", "main.c", "-o", "main.exe"]
                run_cmd = ["main.exe"]
            else:
                compile_cmd = ["gcc", "-O2", "main.c", "-o", "main"]
                run_cmd = ["./main"]
        elif language == "java":
            source_file = "Main.java"
            compile_cmd = ["javac", "Main.java"]
            run_cmd = ["java", "Main"]
        else:
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

        with open(os.path.join(sandbox_dir, source_file), "w", encoding="utf-8") as f:
            f.write(code)
            
        compile_output = ""
        if compile_cmd:
            try:
                comp_res = subprocess.run(
                    compile_cmd,
                    cwd=sandbox_dir,
                    capture_output=True,
                    text=True,
                    timeout=settings.IDE_EXECUTION_TIMEOUT_SECONDS
                )
                compile_output = truncate_output(comp_res.stderr or comp_res.stdout, settings.IDE_MAX_OUTPUT_BYTES)
                if comp_res.returncode != 0:
                    return {
                        "status": "Compilation Error",
                        "execution_status": "compilation_error",
                        "language": language,
                        "stdout": "",
                        "stderr": compile_output,
                        "compile_output": compile_output,
                        "exit_code": comp_res.returncode,
                        "execution_time_ms": 0,
                        "memory_kb": 0,
                        "timed_out": False
                    }
            except subprocess.TimeoutExpired:
                return {
                    "status": "Time Limit Exceeded",
                    "execution_status": "timeout",
                    "language": language,
                    "stdout": "",
                    "stderr": "Compilation timed out.",
                    "compile_output": "Compilation timed out.",
                    "exit_code": 1,
                    "execution_time_ms": int(settings.IDE_EXECUTION_TIMEOUT_SECONDS * 1000),
                    "memory_kb": 0,
                    "timed_out": True
                }
            except Exception as e:
                return {
                    "status": "Compilation Error",
                    "execution_status": "compilation_error",
                    "language": language,
                    "stdout": "",
                    "stderr": f"Compilation failed: {e}",
                    "compile_output": f"Compilation failed: {e}",
                    "exit_code": 1,
                    "execution_time_ms": 0,
                    "memory_kb": 0,
                    "timed_out": False
                }

        kwargs = {}
        if sys.platform != "win32":
            kwargs["preexec_fn"] = set_limits

        start_time = time.time()
        timed_out = False
        try:
            run_res = subprocess.run(
                run_cmd,
                cwd=sandbox_dir,
                input=stdin,
                capture_output=True,
                text=True,
                timeout=settings.IDE_EXECUTION_TIMEOUT_SECONDS,
                **kwargs
            )
            stdout = run_res.stdout
            stderr = run_res.stderr
            exit_code = run_res.returncode
        except subprocess.TimeoutExpired as e:
            stdout = e.stdout.decode('utf-8', errors='replace') if isinstance(e.stdout, bytes) else (e.stdout or "")
            stderr = e.stderr.decode('utf-8', errors='replace') if isinstance(e.stderr, bytes) else (e.stderr or "Execution timed out.")
            exit_code = 124
            timed_out = True
        except Exception as e:
            stdout = ""
            stderr = f"Runtime failed: {e}"
            exit_code = 1

        execution_time_ms = int((time.time() - start_time) * 1000)
        
        stdout = truncate_output(stdout, settings.IDE_MAX_OUTPUT_BYTES)
        stderr = truncate_output(stderr, settings.IDE_MAX_OUTPUT_BYTES)
        
        status = "Success"
        execution_status = "completed"
        
        if timed_out:
            status = "Time Limit Exceeded"
            execution_status = "timeout"
        elif exit_code != 0:
            status = "Runtime Error"
            execution_status = "runtime_error"

        return {
            "status": status,
            "execution_status": execution_status,
            "language": language,
            "stdout": stdout,
            "stderr": stderr,
            "compile_output": compile_output,
            "exit_code": exit_code,
            "execution_time_ms": execution_time_ms,
            "memory_kb": 0,
            "timed_out": timed_out
        }

    finally:
        _active_executions.remove(student_id)
        shutil.rmtree(sandbox_dir, ignore_errors=True)
