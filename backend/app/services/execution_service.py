import os
import shutil
import tempfile
import time
import uuid
import logging

try:
    import docker
    from docker.errors import DockerException, ContainerError
except ImportError:
    docker = None
    DockerException = Exception
    ContainerError = Exception

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Initialize Docker Client
docker_client = None
if settings.IDE_EXECUTION_ENABLED:
    try:
        if docker is not None:
            docker_client = docker.from_env()
            docker_client.ping()
            logger.info("Docker client initialized successfully.")
        else:
            logger.warning("Docker python package is not installed.")
    except Exception as e:
        logger.warning(f"Docker is unavailable: {e}. Code execution will be disabled.")
        docker_client = None

def is_execution_available() -> bool:
    return docker_client is not None and settings.IDE_EXECUTION_ENABLED

async def execute_code(language: str, code: str, stdin: str = "") -> dict:
    if not is_execution_available():
        return {
            "status": "Service Unavailable",
            "language": language,
            "stdout": "",
            "stderr": "Code execution service is currently unavailable.",
            "exit_code": -1,
            "execution_time_ms": 0,
            "timed_out": False
        }

    # Prepare sandbox directory
    sandbox_dir = tempfile.mkdtemp(prefix="labflow_sandbox_")
    
    try:
        # File names and commands based on language
        if language == "python":
            source_file = "main.py"
            compile_cmd = None
            run_cmd = "python3 main.py < input.txt"
        elif language == "c":
            source_file = "main.c"
            compile_cmd = "gcc -O2 main.c -o main"
            run_cmd = "./main < input.txt"
        elif language == "java":
            source_file = "Main.java"
            compile_cmd = "javac Main.java"
            run_cmd = "java Main < input.txt"
        else:
            return {
                "status": "Runtime Error",
                "language": language,
                "stdout": "",
                "stderr": f"Unsupported language: {language}",
                "exit_code": 1,
                "execution_time_ms": 0,
                "timed_out": False
            }

        # Write code and input
        with open(os.path.join(sandbox_dir, source_file), "w", encoding="utf-8") as f:
            f.write(code)
            
        with open(os.path.join(sandbox_dir, "input.txt"), "w", encoding="utf-8") as f:
            f.write(stdin)
            
        # Create execution script
        script_content = f"#!/bin/bash\n"
        if compile_cmd:
            script_content += f"{compile_cmd} 2> compile_err.txt\n"
            script_content += f"if [ $? -ne 0 ]; then\n"
            script_content += f"  cat compile_err.txt >&2\n"
            script_content += f"  exit 127\n"
            script_content += f"fi\n"
        
        script_content += f"{run_cmd}\n"
        
        script_path = os.path.join(sandbox_dir, "run.sh")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(script_content)
        
        # We need to use Docker to run the script
        start_time = time.time()
        
        try:
            # Note: in a production environment, sandbox_dir must be accessible by docker daemon
            # If Docker is running on Windows (Docker Desktop), temp paths usually map correctly.
            # Using volumes with bind mount
            container = docker_client.containers.run(
                image="labflow-sandbox",
                command=["/bin/bash", "/sandbox/run.sh"],
                volumes={
                    os.path.abspath(sandbox_dir): {
                        "bind": "/sandbox",
                        "mode": "rw"
                    }
                },
                working_dir="/sandbox",
                mem_limit=settings.IDE_MEMORY_LIMIT,
                nano_cpus=settings.IDE_CPU_LIMIT,
                network_mode="none",
                read_only=True,
                detach=True
            )
            
            # Wait for execution with timeout
            try:
                result = container.wait(timeout=settings.IDE_EXECUTION_TIMEOUT_SECONDS)
                exit_code = result["StatusCode"]
                timed_out = False
            except Exception as e:
                # Assuming timeout exception from requests/urllib3 or docker wait
                container.kill()
                exit_code = 124 # Timeout exit code
                timed_out = True
            
            logs = container.logs(stdout=True, stderr=True, demux=True)
            stdout_bytes, stderr_bytes = logs[0], logs[1]
            
            stdout = stdout_bytes.decode("utf-8", errors="replace") if stdout_bytes else ""
            stderr = stderr_bytes.decode("utf-8", errors="replace") if stderr_bytes else ""
            
            # Truncate output to IDE_MAX_OUTPUT_BYTES
            if len(stdout) > settings.IDE_MAX_OUTPUT_BYTES:
                stdout = stdout[:settings.IDE_MAX_OUTPUT_BYTES] + "\n...[Output Truncated]"
            if len(stderr) > settings.IDE_MAX_OUTPUT_BYTES:
                stderr = stderr[:settings.IDE_MAX_OUTPUT_BYTES] + "\n...[Error Truncated]"
                
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            status = "Success"
            if timed_out:
                status = "Time Limit Exceeded"
                stderr = "Execution timed out." + ("\n" + stderr if stderr else "")
            elif exit_code == 127:
                status = "Compilation Error"
            elif exit_code != 0:
                status = "Runtime Error"
                
            # Clean up container
            container.remove(force=True)
            
            return {
                "status": status,
                "language": language,
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "execution_time_ms": execution_time_ms,
                "timed_out": timed_out
            }

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            return {
                "status": "Runtime Error",
                "language": language,
                "stdout": "",
                "stderr": f"Docker container error: {str(e)}",
                "exit_code": 1,
                "execution_time_ms": execution_time_ms,
                "timed_out": False
            }

    finally:
        # Always clean up the temporary directory
        shutil.rmtree(sandbox_dir, ignore_errors=True)
