/**
 * LabFlow Code Execution Service Abstraction
 * 
 * Future Execution Architecture:
 * Monaco IDE -> Execution API -> Isolated Execution Sandbox (C/Java/Python) -> Output / Test Results
 * 
 * For this Phase 2 IDE milestone, when no execution backend is connected,
 * this abstraction clearly indicates execution status and isolates execution logic from submission logic.
 */

import api from "./api";

/**
 * Clean execution-service abstraction.
 * @param {Object} params
 * @param {string} params.language - 'c' | 'java' | 'python'
 * @param {string} params.code - Source code to execute
 * @param {string} params.exerciseId - Exercise identifier
 * @param {string} [params.stdin] - Optional standard input
 * @returns {Promise<Object>} Execution result object
 */
export async function runCode({ language, code, exerciseId, stdin = "" }) {
  if (!code || !code.trim()) {
    return {
      status: "Compilation Error",
      stdout: "",
      stderr: "No code provided to execute.",
      exitCode: 1,
      executionTime: "0 ms",
      testResults: [],
      message: "Please write or paste your solution code before running.",
    };
  }

  try {
    const res = await api.post(`/student/exercises/${exerciseId}/run`, {
      language,
      code,
      stdin,
    });
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.data) {
      return err.response.data.data;
    }
    return {
      status: "Service Unavailable",
      stdout: "",
      stderr: "Code execution service is not configured yet.\n\nBackend sandbox infrastructure (GCC, OpenJDK, Python runtime) will be connected in the next milestone.",
      exitCode: -1,
      executionTime: "—",
      testResults: [],
      isAvailable: false,
      message: "Code execution service is not configured yet.",
    };
  }

  return {
    status: "Service Unavailable",
    stdout: "",
    stderr: "Code execution service is not configured yet.",
    exitCode: -1,
    executionTime: "—",
    testResults: [],
    isAvailable: false,
    message: "Code execution service is not configured yet.",
  };
}
