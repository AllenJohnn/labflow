import { useState } from "react";
import { Terminal, AlertCircle, CheckCircle2, XCircle, Clock, Info } from "lucide-react";

export default function OutputPanel({
  outputResult,
  isRunning,
  onClear,
}) {
  const [activeTab, setActiveTab] = useState("output"); // 'output' | 'errors' | 'tests'

  const status = outputResult?.status || "Idle";
  const stdout = outputResult?.stdout || "";
  const stderr = outputResult?.stderr || "";
  const executionTime = outputResult?.executionTime || "—";
  const exitCode = outputResult?.exitCode;
  const testResults = outputResult?.testResults || [];

  const hasErrors = stderr && stderr.trim().length > 0;
  const passedTestsCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-200 border-t border-slate-700 font-mono text-[12px] overflow-hidden select-text">
      {/* Top Console Bar / Tabs */}
      <div className="h-9 shrink-0 bg-[#252526] border-b border-[#333] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className={`px-3 py-1 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "output"
                ? "bg-[#1e1e1e] text-white border-t-2 border-[#164a9c]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Output</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "errors"
                ? "bg-[#1e1e1e] text-white border-t-2 border-red-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertCircle className={`h-3.5 w-3.5 ${hasErrors ? "text-red-400" : ""}`} />
            <span>Errors</span>
            {hasErrors && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tests")}
            className={`px-3 py-1 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tests"
                ? "bg-[#1e1e1e] text-white border-t-2 border-[#159447]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Test Results</span>
            {testResults.length > 0 && (
              <span className="text-[10px] bg-slate-700 px-1 rounded-xs ml-0.5">
                {passedTestsCount}/{testResults.length}
              </span>
            )}
          </button>
        </div>

        {/* Status Indicators & Execution Time */}
        <div className="flex items-center gap-3 text-[11px] font-sans text-slate-400">
          {isRunning ? (
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Running execution...
            </span>
          ) : (
            <>
              {status !== "Idle" && (
                <span
                  className={`px-1.5 py-0.5 text-[10.5px] font-semibold uppercase rounded-xs ${
                    status === "Success"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : status === "Compilation Error" || status === "Runtime Error" || status === "Execution Error"
                      ? "bg-red-950 text-red-300 border border-red-800"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {status}
                </span>
              )}

              {executionTime !== "—" && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3 w-3" />
                  {executionTime}
                </span>
              )}

              {exitCode !== undefined && exitCode !== -1 && (
                <span className="text-slate-400">
                  exit: <strong className={exitCode === 0 ? "text-emerald-400" : "text-red-400"}>{exitCode}</strong>
                </span>
              )}
            </>
          )}

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-slate-500 hover:text-slate-300 text-[11px] font-medium transition cursor-pointer ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 p-3.5 overflow-y-auto font-mono text-[12.5px] leading-relaxed">
        {isRunning ? (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <span className="inline-block h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Compiling and executing program...</span>
          </div>
        ) : (
          <>
            {/* Output Tab */}
            {activeTab === "output" && (
              <div>
                {stdout ? (
                  <pre className="text-slate-200 whitespace-pre-wrap font-mono">{stdout}</pre>
                ) : status === "Service Unavailable" ? (
                  <div className="text-slate-400 space-y-2 font-sans text-[12.5px]">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Info className="h-4 w-4" />
                      <span>Code execution service is not configured yet.</span>
                    </div>
                    <p className="text-slate-400 leading-normal max-w-lg">
                      Backend sandbox execution infrastructure (GCC compiler, OpenJDK, Python runtime) will be connected in future milestones.
                      You can write your solution and submit directly using <strong>Submit Exercise</strong>.
                    </p>
                  </div>
                ) : status === "Idle" ? (
                  <div className="text-slate-500 italic py-2">
                    Program output will appear here after clicking <strong>Run</strong>.
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-1">
                    (No standard output produced)
                  </div>
                )}
              </div>
            )}

            {/* Errors Tab */}
            {activeTab === "errors" && (
              <div>
                {stderr ? (
                  <pre className="text-red-400 whitespace-pre-wrap font-mono">{stderr}</pre>
                ) : (
                  <div className="text-slate-500 italic py-2">
                    No errors or warnings reported.
                  </div>
                )}
              </div>
            )}

            {/* Test Results Tab */}
            {activeTab === "tests" && (
              <div className="space-y-3 font-sans text-[12.5px]">
                {testResults && testResults.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-slate-300 font-semibold mb-2">
                      {passedTestsCount} / {testResults.length} Tests Passed
                    </div>
                    {testResults.map((test, i) => (
                      <div
                        key={i}
                        className={`p-2.5 border rounded-xs flex items-start gap-2 ${
                          test.passed
                            ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                            : "bg-red-950/30 border-red-800/60 text-red-200"
                        }`}
                      >
                        {test.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[13px]">
                            {test.name || `Test Case ${i + 1}`}
                          </div>
                          {test.message && (
                            <div className="text-[11.5px] opacity-80 mt-0.5 font-mono">
                              {test.message}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 space-y-2 py-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Info className="h-4 w-4 text-slate-400" />
                      <span>Test cases evaluation is not configured yet.</span>
                    </div>
                    <p className="text-slate-400 max-w-lg leading-normal text-[12px]">
                      Automated test case runner will be executed in sandbox environments in future milestones.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
