import os

# Update StudentIDE.jsx
ide_content = r"""import { useState, useEffect, useCallback, useRef } from "react";
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
  c: #include <stdio.h>\n\nint main() {\n    // Write your C program here\n    printf("LabFlow C Program\\n");\n    return 0;\n}\n,
  java: public class Main {\n    public static void main(String[] args) {\n        // Write your Java program here\n        System.out.println("LabFlow Java Program");\n    }\n}\n,
  python: def main():\n    # Write your Python program here\n    print("LabFlow Python Program")\n\nif __name__ == "__main__":\n    main()\n,
};

function getDraftStorageKey(studentId, courseId, exerciseId) {
  const sId = (studentId || "default").toLowerCase();
  const cId = (courseId || "default").toLowerCase();
  const eId = (exerciseId || "default").toLowerCase();
  return labflow:ide:::;
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
          toast.error(You are not enrolled in laboratory ''.);
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
          navigate(/student/laboratory/);
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
        comments: Submitted via LabFlow Monaco IDE,
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
}
"""

with open("src/pages/student/StudentIDE.jsx", "w", encoding="utf-8") as f:
    f.write(ide_content)

print("Updated StudentIDE.jsx correctly")
