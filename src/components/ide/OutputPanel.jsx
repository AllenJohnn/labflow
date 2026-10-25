import { AlertCircle, CheckCircle2, Clock, Terminal, XCircle } from "lucide-react";

export default function OutputPanel({ 
  outputResult, 
  testResults,
  isRunning,
  isRunningTests,
  activeTab,
  setActiveTab,
  stdin,
  setStdin,
  onClear,
  hasTests 
}) {
  const status = outputResult?.status || "Idle";
  const stdout = outputResult?.stdout || "";
  const stderr = outputResult?.stderr || "";
  const executionTime = outputResult?.executionTime;

  const hasErrors = status === "Compilation Error" || status === "Runtime Error" || status === "Execution Error" || Boolean(stderr);

  // If there are tests, handle them.
  const testsRunStatus = testResults?.status || "Idle";
  const passedTests = testResults?.passed_tests || 0;
  const totalTests = testResults?.total_tests || 0;
  const results = testResults?.results || [];

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Panel Toolbar / Tab Headers */}
      <div className="flex items-center justify-between border-b border-[#333] px-2 select-none shrink-0 bg-[#252526]">
        {/* Left Side: Tabs */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className={`px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "output"
                ? "bg-[#1e1e1e] text-white border-t-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Output</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "input"
                ? "bg-[#1e1e1e] text-white border-t-2 border-amber-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Input</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
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

          {hasTests && (
            <button
              type="button"
              onClick={() => setActiveTab("tests")}
              className={`px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tests"
                  ? "bg-[#1e1e1e] text-white border-t-2 border-[#159447]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Test Results</span>
              {testResults && (
                <span className="text-[10px] bg-slate-700 px-1 rounded-sm ml-0.5">
                  {passedTests}/{totalTests}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Side: Status Indicators & Clear */}
        <div className="flex items-center gap-3 text-[11px] font-sans text-slate-400">
          {(isRunning || isRunningTests) ? (
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Executing...
            </span>
          ) : (
            <>
              {status !== "Idle" && activeTab !== "tests" && (
                <span
                  className={`px-1.5 py-0.5 text-[10.5px] font-semibold uppercase rounded-sm ${
                    status === "Success" || status === "Accepted"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : status === "Compilation Error" || status === "Runtime Error" || status === "Execution Error"
                      ? "bg-red-950 text-red-300 border border-red-800"
                      : status === "Time Limit Exceeded"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {status}
                </span>
              )}
              {testsRunStatus !== "Idle" && activeTab === "tests" && (
                <span
                  className={`px-1.5 py-0.5 text-[10.5px] font-semibold uppercase rounded-sm ${
                    testsRunStatus === "Passed"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-red-950 text-red-300 border border-red-800"
                  }`}
                >
                  {testsRunStatus}
                </span>
              )}
              {executionTime && executionTime !== "—" && activeTab !== "tests" && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3 w-3" />
                  {executionTime} ms
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
      <div className="flex-1 p-3.5 overflow-y-auto font-mono text-[12.5px] leading-relaxed text-slate-300">
        {(isRunning || isRunningTests) ? (
          <div className="flex items-center gap-2 text-slate-400 py-4 font-sans">
            <span className="inline-block h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Executing...</span>
          </div>
        ) : (
          <>
            {activeTab === "output" && (
              <div>
                {stdout ? (
                  <pre className="text-slate-200 whitespace-pre-wrap">{stdout}</pre>
                ) : status === "Service Unavailable" ? (
                  <div className="text-amber-400 flex items-center gap-2 font-sans font-medium">
                    <AlertCircle className="h-4 w-4" /> Execution service unavailable
                  </div>
                ) : status === "Idle" ? (
                  <div className="text-slate-500 italic py-2 font-sans">
                    Run your code to see output.
                  </div>
                ) : (
                  <div className="text-slate-500 italic py-1 font-sans">
                    (No output produced)
                  </div>
                )}
              </div>
            )}

            {activeTab === "input" && (
              <label className="flex h-full flex-col gap-2 font-sans text-[12px] text-slate-400">
                Standard input passed to your program when it runs.
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  aria-label="Standard input"
                  placeholder="Enter input for your program"
                  className="min-h-24 flex-1 resize-y rounded border border-[#3c3c3c] bg-[#252526] p-2 font-mono text-[12px] text-slate-200 outline-none focus:border-blue-500"
                />
              </label>
            )}

            {activeTab === "errors" && (
              <div>
                {status === "Compilation Error" && (
                  <div className="text-red-400 font-sans font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" /> Compilation Error
                  </div>
                )}
                {status === "Runtime Error" && (
                  <div className="text-red-400 font-sans font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" /> Runtime Error
                  </div>
                )}
                {status === "Time Limit Exceeded" && (
                  <div className="text-amber-400 font-sans font-medium flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" /> Time Limit Exceeded
                  </div>
                )}
                {stderr ? (
                  <pre className="text-red-400 whitespace-pre-wrap">{stderr}</pre>
                ) : (
                  <div className="text-slate-500 italic py-2 font-sans">
                    No errors reported.
                  </div>
                )}
              </div>
            )}

            {activeTab === "tests" && (
              <div className="space-y-3 font-sans text-[12.5px]">
                {testResults ? (
                  <div className="space-y-2">
                    {results.map((test, i) => (
                      <div
                        key={i}
                        className={`p-2.5 border rounded-sm flex flex-col gap-1.5 ${
                          test.status === "Passed"
                            ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                            : "bg-red-950/30 border-red-800/60 text-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-[13px]">
                          {test.status === "Passed" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                          )}
                          <span>Test Case #{test.test_number}</span>
                          <span className="text-[11px] font-normal uppercase opacity-70 ml-2 border border-current px-1.5 rounded-sm">
                            {test.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-1 text-slate-300 font-mono text-[12px]">
                           {test.input !== undefined && (
                             <div><span className="opacity-50 select-none">Input: </span><br/>{test.input || "(empty)"}</div>
                           )}
                           {test.expected_output !== undefined && (
                             <div><span className="opacity-50 select-none">Expected: </span><br/>{test.expected_output}</div>
                           )}
                           {test.actual_output !== undefined && (
                             <div><span className="opacity-50 select-none">Actual: </span><br/>{test.actual_output}</div>
                           )}
                           {test.input === undefined && test.expected_output === undefined && (
                             <div className="text-slate-400 italic text-[11px] font-sans">Hidden test case data is not displayed.</div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic py-2">
                    Click "Run Tests" to evaluate your solution against the automated test cases.
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
