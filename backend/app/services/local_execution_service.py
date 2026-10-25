"""
LabFlow Local Execution Service

Runs code locally via subprocess for Python and Java.
Falls back to Judge0 for C (no local GCC) or when local tools are unavailable.
Provides near-instant execution vs. 15-30s Judge0 CE queue times.
"""

import asyncio
import logging
import os
import shutil
import subprocess
import tempfile
import time
from typing import Dict, Any

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Detect locally available compilers/interpreters at startup
_python_bin = shutil.which("python") or shutil.which("python3")
_javac_bin = shutil.which("javac")
_java_bin = shutil.which("java")
_gcc_bin = shutil.which("gcc")

LOCAL_CAPABILITIES = {}
if _python_bin:
    LOCAL_CAPABILITIES["python"] = _python_bin
if _javac_bin and _java_bin:
    LOCAL_CAPABILITIES["java"] = (_javac_bin, _java_bin)
if _gcc_bin:
    LOCAL_CAPABILITIES["c"] = _gcc_bin

logger.info(f"[LocalExec] Detected capabilities: {list(LOCAL_CAPABILITIES.keys())}")


def _truncate(text: str, max_bytes: int = 0) -> str:
    """Truncate output to configured max bytes."""
    limit = max_bytes or getattr(settings, "IDE_MAX_OUTPUT_BYTES", 65536)
    if not text:
        return ""
    if len(text) > limit:
        return text[:limit] + "\n...[Output Truncated]"
    return text


def _make_result(
    status: str,
    execution_status: str,
    language: str,
    stdout: str = "",
    stderr: str = "",
    compile_output: str = "",
    exit_code: int = 0,
    execution_time_ms: int = 0,
    memory_kb: int = 0,
    timed_out: bool = False,
) -> Dict[str, Any]:
    """Build a normalized execution result dict."""
    return {
        "status": status,
        "execution_status": execution_status,
        "language": language,
        "stdout": _truncate(stdout),
        "stderr": _truncate(stderr),
        "compile_output": _truncate(compile_output),
        "exit_code": exit_code,
        "execution_time_ms": execution_time_ms,
        "memory_kb": memory_kb,
        "timed_out": timed_out,
    }


async def execute_python(code: str, stdin: str = "", timeout: float = 5.0) -> Dict[str, Any]:
    """Execute Python code via local interpreter."""
    with tempfile.TemporaryDirectory(prefix="labflow_py_") as tmpdir:
        src_path = os.path.join(tmpdir, "solution.py")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(code)

        start = time.perf_counter()
        try:
            proc = await asyncio.to_thread(
                subprocess.run,
                [_python_bin, "-u", src_path],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=tmpdir,
                env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            if proc.returncode == 0:
                return _make_result("Success", "completed", "python",
                    stdout=proc.stdout, stderr=proc.stderr,
                    execution_time_ms=elapsed_ms)
            else:
                return _make_result("Runtime Error", "runtime_error", "python",
                    stdout=proc.stdout, stderr=proc.stderr,
                    exit_code=proc.returncode, execution_time_ms=elapsed_ms)

        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return _make_result("Time Limit Exceeded", "timeout", "python",
                stderr="Execution timed out.",
                exit_code=1, execution_time_ms=elapsed_ms, timed_out=True)


async def execute_java(code: str, stdin: str = "", timeout: float = 5.0) -> Dict[str, Any]:
    """Execute Java code: compile with javac, then run with java."""
    javac, java = LOCAL_CAPABILITIES["java"]

    with tempfile.TemporaryDirectory(prefix="labflow_java_") as tmpdir:
        src_path = os.path.join(tmpdir, "Main.java")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(code)

        start = time.perf_counter()

        # Compile
        try:
            compile_proc = await asyncio.to_thread(
                subprocess.run,
                [javac, "Main.java"],
                capture_output=True, text=True, timeout=15.0, cwd=tmpdir,
            )
        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return _make_result("Compilation Error", "compilation_error", "java",
                stderr="Java compilation timed out.",
                compile_output="Java compilation timed out.",
                exit_code=1, execution_time_ms=elapsed_ms)

        if compile_proc.returncode != 0:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            err = compile_proc.stderr or compile_proc.stdout
            return _make_result("Compilation Error", "compilation_error", "java",
                stderr=err, compile_output=err,
                exit_code=1, execution_time_ms=elapsed_ms)

        # Run
        try:
            run_proc = await asyncio.to_thread(
                subprocess.run,
                [java, "-cp", tmpdir, "Main"],
                input=stdin,
                capture_output=True, text=True, timeout=timeout, cwd=tmpdir,
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            if run_proc.returncode == 0:
                return _make_result("Success", "completed", "java",
                    stdout=run_proc.stdout, stderr=run_proc.stderr,
                    execution_time_ms=elapsed_ms)
            else:
                return _make_result("Runtime Error", "runtime_error", "java",
                    stdout=run_proc.stdout, stderr=run_proc.stderr,
                    exit_code=run_proc.returncode, execution_time_ms=elapsed_ms)

        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return _make_result("Time Limit Exceeded", "timeout", "java",
                stderr="Execution timed out.",
                exit_code=1, execution_time_ms=elapsed_ms, timed_out=True)


async def execute_c_local(code: str, stdin: str = "", timeout: float = 5.0) -> Dict[str, Any]:
    """Execute C code: compile with gcc, then run the binary."""
    gcc = LOCAL_CAPABILITIES.get("c")
    if not gcc:
        return None  # Caller should fall back to Judge0

    with tempfile.TemporaryDirectory(prefix="labflow_c_") as tmpdir:
        src_path = os.path.join(tmpdir, "solution.c")
        exe_path = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(code)

        start = time.perf_counter()

        # Compile
        try:
            compile_proc = await asyncio.to_thread(
                subprocess.run,
                [gcc, "-o", exe_path, src_path, "-lm"],
                capture_output=True, text=True, timeout=10.0, cwd=tmpdir,
            )
        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return _make_result("Compilation Error", "compilation_error", "c",
                stderr="C compilation timed out.",
                compile_output="C compilation timed out.",
                exit_code=1, execution_time_ms=elapsed_ms)

        if compile_proc.returncode != 0:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            err = compile_proc.stderr or compile_proc.stdout
            return _make_result("Compilation Error", "compilation_error", "c",
                stderr=err, compile_output=err,
                exit_code=1, execution_time_ms=elapsed_ms)

        # Run
        try:
            run_proc = await asyncio.to_thread(
                subprocess.run,
                [exe_path],
                input=stdin,
                capture_output=True, text=True, timeout=timeout, cwd=tmpdir,
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            if run_proc.returncode == 0:
                return _make_result("Success", "completed", "c",
                    stdout=run_proc.stdout, stderr=run_proc.stderr,
                    execution_time_ms=elapsed_ms)
            else:
                return _make_result("Runtime Error", "runtime_error", "c",
                    stdout=run_proc.stdout, stderr=run_proc.stderr,
                    exit_code=run_proc.returncode, execution_time_ms=elapsed_ms)

        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return _make_result("Time Limit Exceeded", "timeout", "c",
                stderr="Execution timed out.",
                exit_code=1, execution_time_ms=elapsed_ms, timed_out=True)


def can_execute_locally(language: str) -> bool:
    """Check if a language can be executed locally."""
    return language in LOCAL_CAPABILITIES


async def execute_locally(language: str, code: str, stdin: str = "") -> Dict[str, Any] | None:
    """
    Execute code locally if the language is supported.
    Returns None if local execution is not available for this language.
    """
    timeout = getattr(settings, "IDE_EXECUTION_TIMEOUT_SECONDS", 5.0)

    if language == "python" and "python" in LOCAL_CAPABILITIES:
        return await execute_python(code, stdin, timeout)
    elif language == "java" and "java" in LOCAL_CAPABILITIES:
        return await execute_java(code, stdin, timeout)
    elif language == "c" and "c" in LOCAL_CAPABILITIES:
        return await execute_c_local(code, stdin, timeout)

    return None
