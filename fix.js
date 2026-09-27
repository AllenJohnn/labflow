const fs = require('fs');

const ideCode = import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentLaboratories,
  getAssignedExercisesByCourse,
  getStudentExerciseSubmission,
  submitExerciseWork,
  runExerciseTests
} from "../../services/studentService";
import { runCode } from "../../services/executionService";
import IDEHeader from "../../components/ide/IDEHeader";
import ExercisePanel from "../../components/ide/ExercisePanel";
import CodeEditor from "../../components/ide/CodeEditor";
import OutputPanel from "../../components/ide/OutputPanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Loader2 } from "lucide-react";

const DEFAULT_STARTER_CODE = {
  c: \#include <stdio.h>\\n\\nint main() {\\n    // Write your C program here\\n    printf("LabFlow C Program\\\\n");\\n    return 0;\\n}\\n\,
  java: \public class Main {\\n    public static void main(String[] args) {\\n        // Write your Java program here\\n        System.out.println("LabFlow Java Program");\\n    }\\n}\\n\,
  python: \def main():\\n    # Write your Python program here\\n    print("LabFlow Python Program")\\n\\nif __name__ == "__main__":\\n    main()\\n\,
};

function getDraftStorageKey(studentId, courseId, exerciseId) {
  const sId = (studentId || "default").toLowerCase();
  const cId = (courseId || "default").toLowerCase();
  const eId = (exerciseId || "default").toLowerCase();
  return \labflow:ide:\:\:\\;
}

export default function StudentIDE() {
  const { courseId, exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exercise, setExercise] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputResult, setOutputResult] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [activeOutputTab, setActiveOutputTab] = useState("output");
  const [isExercisePanelCollapsed, setIsExercisePanelCollapsed] = useState(false);

  const studentIdentifier = user?.student_id || user?.id || user?.email || "student";
  const draftKey = getDraftStorageKey(studentIdentifier, courseId, exerciseId);

  useEffect(() => {
    let isMounted = true;
    async function loadIDEData() {
      try {
        const normCourseId = (courseId || "").toLowerCase();
        const normExId = (exerciseId || "").toLowerCase();

        const [labs, exList] = await Promise.all([
          getStudentLaboratories(),
          getAssignedExercisesByCourse(normCourseId),
        ]);

        const enrolledLab = labs?.find((l) => (l.id || l.course_id || "").toLowerCase() === normCourseId);
        if (!enrolledLab && labs && labs.length > 0) {
          toast.error(\You are not enrolled in laboratory '\'.\);
          navigate("/student/laboratories");
          return;
        }

        const currentEx = exList?.find(
          (e) =>
            (e.id || e.exercise_id || "").toLowerCase() === normExId ||
            (e.exerciseNumber || e.exercise_number || "") === normExId
        );

        if (!currentEx) {
          toast.error("The requested exercise is not available or has not been assigned.");
          navigate(\/student/laboratory/\\);
          return;
        }

        const subData = await getStudentExerciseSubmission(currentEx.id || currentEx.exercise_id);
        if (!isMounted) return;

        setExercise(currentEx);
        setSubmission(subData);

        const savedDraft = localStorage.getItem(draftKey);
        const lang = (currentEx.language || "c").toLowerCase();

        if (savedDraft !== null && savedDraft !== undefined) {
          setCode(savedDraft);
          setHasLocalDraft(true);
        } else if (subData?.submitted_code) {
          setCode(subData.submitted_code);
          setHasLocalDraft(false);
        } else if (currentEx.starter_code) {
          setCode(currentEx.starter_code);
          setHasLocalDraft(false);
        } else {
          setCode(DEFAULT_STARTER_CODE[lang] || DEFAULT_STARTER_CODE.c);
          setHasLocalDraft(false);
        }
      } catch (err) {
        toast.error("Failed to load laboratory exercise.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadIDEData();
    return () => { isMounted = false; };
  }, [courseId, exerciseId, draftKey, navigate]);

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    setHasLocalDraft(true);
    try {
      localStorage.setItem(draftKey, newCode);
    } catch (e) {}
  }, [draftKey]);

  const handleResetCode = () => {
    if (!exercise) return;
    const lang = (exercise.language || "c").toLowerCase();
    const defaultCode = exercise.starter_code || DEFAULT_STARTER_CODE[lang] || DEFAULT_STARTER_CODE.c;
    if (window.confirm("Reset editor to the original template? Your current local draft will be replaced.")) {
      handleCodeChange(defaultCode);
      toast.info("Editor reset to starter template.");
    }
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before executing.");
      return;
    }
    setIsRunning(true);
    setOutputResult(null);
    setActiveOutputTab("output");
    try {
      const result = await runCode({
        language: exercise?.language || "c",
        code,
        stdin,
        exerciseId: exercise?.id || exercise?.exercise_id || exerciseId,
      });
      setOutputResult(result);
      if (result.status === "Compilation Error" || result.status === "Runtime Error") {
         setActiveOutputTab("errors");
      }
    } catch (err) {
      setOutputResult({ status: "Execution Error", stdout: "", stderr: err.message, exitCode: 1, executionTime: "—", testResults: [] });
      setActiveOutputTab("errors");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before testing.");
      return;
    }
    setIsRunningTests(true);
    setTestResults(null);
    setActiveOutputTab("tests");
    try {
      const res = await runExerciseTests(exercise?.id || exercise?.exercise_id || exerciseId, {
        language: exercise?.language || "c",
        code
      });
      setTestResults(res.data);
    } catch (err) {
      toast.error("Failed to run automated tests.");
      setTestResults({ status: "Error", total_tests: 0, passed_tests: 0, results: [] });
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please write or complete your solution code before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        code: code.trim(),
        language: (exercise?.language || "c").toLowerCase(),
        comments: \Submitted via LabFlow Monaco IDE\,
        stdin,
      };
      const res = await submitExerciseWork(exercise?.id || exercise?.exercise_id || exerciseId, payload);
      setSubmission(res.data);
      toast.success("Solution submitted successfully.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit exercise.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toast.success("Draft saved");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning && !isRunningTests) {
           handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isRunningTests, code]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Preparing Developer Workspace...</p>
      </div>
    );
  }

  const exLanguage = (exercise?.language || "c").toLowerCase();
  const subStatus = submission?.status || exercise?.status || "Not Started";
  const hasTests = exercise?.test_cases && exercise.test_cases.length > 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground overflow-hidden">
      <IDEHeader
        courseId={courseId}
        exercise={exercise}
        language={exLanguage}
        onRun={handleRun}
        onRunTests={hasTests ? handleRunTests : null}
        onSubmit={handleSubmit}
        onResetCode={handleResetCode}
        isRunning={isRunning}
        isRunningTests={isRunningTests}
        isSubmitting={isSubmitting}
        submissionStatus={subStatus}
        hasLocalDraft={hasLocalDraft}
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel 
            defaultSize={25} 
            minSize={15} 
            collapsible={true} 
            onCollapse={() => setIsExercisePanelCollapsed(true)}
            onExpand={() => setIsExercisePanelCollapsed(false)}
            className="bg-card border-r"
          >
            <ExercisePanel exercise={exercise} submission={submission} courseId={courseId} />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize flex flex-col justify-center items-center"><div className="h-6 w-0.5 bg-muted-foreground/30 rounded-full" /></PanelResizeHandle>
          <Panel defaultSize={75} className="flex flex-col bg-[#1e1e1e]">
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <CodeEditor code={code} language={exLanguage} onChange={handleCodeChange} />
              </Panel>
              <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors cursor-row-resize z-10 flex flex-row justify-center items-center"><div className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" /></PanelResizeHandle>
              <Panel defaultSize={30} minSize={10} className="bg-background flex flex-col border-t">
                <OutputPanel 
                  outputResult={outputResult} 
                  testResults={testResults}
                  isRunning={isRunning} 
                  isRunningTests={isRunningTests}
                  activeTab={activeOutputTab}
                  setActiveTab={setActiveOutputTab}
                  stdin={stdin}
                  setStdin={setStdin}
                  onClear={() => { setOutputResult(null); setTestResults(null); }}
                  hasTests={hasTests}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
fs.writeFileSync('src/pages/student/StudentIDE.jsx', ideCode);

const outputPanelCode = import { AlertCircle, CheckCircle2, Clock, Info, Terminal, XCircle } from "lucide-react";
import * as React from "react";

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
  const exitCode = outputResult?.exitCode;
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
            className={\px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 \\}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Output</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("errors")}
            className={\px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 \\}
          >
            <AlertCircle className={\h-3.5 w-3.5 \\} />
            <span>Errors</span>
            {hasErrors && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 ml-0.5" />
            )}
          </button>

          {hasTests && (
            <button
              type="button"
              onClick={() => setActiveTab("tests")}
              className={\px-3 py-1.5 text-[11.5px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 \\}
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
                  className={\px-1.5 py-0.5 text-[10.5px] font-semibold uppercase rounded-sm \\}
                >
                  {status}
                </span>
              )}
              {testsRunStatus !== "Idle" && activeTab === "tests" && (
                <span
                  className={\px-1.5 py-0.5 text-[10.5px] font-semibold uppercase rounded-sm \\}
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
                        className={\p-2.5 border rounded-sm flex flex-col gap-1.5 \\}
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
};
fs.writeFileSync('src/components/ide/OutputPanel.jsx', outputPanelCode);

const testCasesCode = import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import api from "../../services/api";

export default function TestCasesDialog({ open, onOpenChange, exerciseId, initialTestCases = [], onSaved }) {
  const [testCases, setTestCases] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTestCases(initialTestCases.length > 0 ? JSON.parse(JSON.stringify(initialTestCases)) : []);
    }
  }, [open, initialTestCases]);

  const generateId = () => \	c-\\;

  const addTestCase = () => {
    setTestCases([...testCases, { id: generateId(), input: "", expected_output: "", is_hidden: false }]);
  };

  const removeTestCase = (id) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  const updateTestCase = (id, field, value) => {
    setTestCases(testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put(\/faculty/exercises/\/test-cases\, testCases);
      toast.success("Test cases saved successfully");
      if (onSaved) onSaved(res.data.data.test_cases || testCases);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save test cases", err);
      toast.error(err.response?.data?.detail || "Failed to save test cases");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Automated Test Cases</span>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {testCases.length} configured
            </span>
          </DialogTitle>
          <DialogDescription>
            Configure input and expected output for automated Judge0 execution. Leave blank if not applicable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          {testCases.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed border-border rounded-lg bg-background">
              <h3 className="text-sm font-semibold text-foreground">No test cases configured</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Students can still Run and Submit normally. Without test cases, the "Run Tests" button will be hidden.
              </p>
              <Button onClick={addTestCase} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add First Test Case
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div key={tc.id} className="border border-border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-muted-foreground">#{index + 1}</span>
                      <button
                        onClick={() => updateTestCase(tc.id, "is_hidden", !tc.is_hidden)}
                        className={\lex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors \\}
                      >
                        {tc.is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {tc.is_hidden ? "Hidden" : "Public"}
                      </button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeTestCase(tc.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Body */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Standard Input</label>
                      <Textarea 
                        value={tc.input} 
                        onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                        placeholder="e.g. 5 10" 
                        className="font-mono text-xs min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Expected Output</label>
                      <Textarea 
                        value={tc.expected_output} 
                        onChange={(e) => updateTestCase(tc.id, "expected_output", e.target.value)}
                        placeholder="e.g. 15" 
                        className="font-mono text-xs min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button onClick={addTestCase} variant="outline" className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Test Case
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-background">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Test Cases</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
fs.writeFileSync('src/components/faculty/TestCasesDialog.jsx', testCasesCode);
console.log("Fixed!");
