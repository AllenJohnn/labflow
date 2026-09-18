import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentLaboratories,
  getAssignedExercisesByCourse,
  getStudentExerciseSubmission,
  submitExerciseWork,
} from "../../services/studentService";
import { runCode } from "../../services/executionService";
import IDEHeader from "../../components/ide/IDEHeader";
import ExercisePanel from "../../components/ide/ExercisePanel";
import CodeEditor from "../../components/ide/CodeEditor";
import OutputPanel from "../../components/ide/OutputPanel";

/**
 * Standard starter templates by language if exercise provides none.
 */
const DEFAULT_STARTER_CODE = {
  c: `#include <stdio.h>

int main() {
    // Write your C program here
    printf("LabFlow C Program\\n");
    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your Java program here
        System.out.println("LabFlow Java Program");
    }
}
`,
  python: `def main():
    # Write your Python program here
    print("LabFlow Python Program")

if __name__ == "__main__":
    main()
`,
};

/**
 * Generate a strict, collision-free local draft storage key.
 */
function getDraftStorageKey(studentId, courseId, exerciseId) {
  const sId = (studentId || "default").toLowerCase();
  const cId = (courseId || "default").toLowerCase();
  const eId = (exerciseId || "default").toLowerCase();
  return `labflow:ide:${sId}:${cId}:${eId}`;
}

export default function StudentIDE() {
  const { courseId, exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exercise, setExercise] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [isStdinOpen, setIsStdinOpen] = useState(false);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputResult, setOutputResult] = useState(null);
  const [mobileTab, setMobileTab] = useState("editor"); // 'info' | 'editor' | 'output'

  const studentIdentifier = user?.student_id || user?.id || user?.email || "student";
  const draftKey = getDraftStorageKey(studentIdentifier, courseId, exerciseId);

  // Parallelized Data Loading & Draft Resolution
  useEffect(() => {
    let isMounted = true;

    async function loadIDEData() {
      try {
        const normCourseId = (courseId || "").toLowerCase();
        const normExId = (exerciseId || "").toLowerCase();

        // Safe parallel dispatch of lab enrollment and course exercises
        const [labs, exList] = await Promise.all([
          getStudentLaboratories(),
          getAssignedExercisesByCourse(normCourseId),
        ]);

        const enrolledLab = labs?.find((l) => (l.id || l.course_id || "").toLowerCase() === normCourseId);
        if (!enrolledLab && labs && labs.length > 0) {
          toast.error(`You are not enrolled in laboratory '${courseId?.toUpperCase()}'.`);
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
          navigate(`/student/laboratory/${normCourseId}`);
          return;
        }

        // Fetch submission for this specific exercise
        const subData = await getStudentExerciseSubmission(currentEx.id || currentEx.exercise_id);

        if (!isMounted) return;

        setExercise(currentEx);
        setSubmission(subData);

        // Draft Resolution Priority:
        // 1. Local draft in localStorage
        // 2. Previously submitted code
        // 3. Exercise starter_code
        // 4. Default language template
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
        console.error("Error loading IDE:", err);
        toast.error("Failed to load laboratory exercise. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadIDEData();

    return () => {
      isMounted = false;
    };
  }, [courseId, exerciseId, draftKey, navigate]);

  // Local Draft Persistence on typing
  const handleCodeChange = useCallback(
    (newCode) => {
      setCode(newCode);
      setHasLocalDraft(true);
      try {
        localStorage.setItem(draftKey, newCode);
      } catch (e) {
        console.warn("Could not persist local draft to localStorage:", e);
      }
    },
    [draftKey]
  );

  // Reset to default starter code
  const handleResetCode = () => {
    if (!exercise) return;
    const lang = (exercise.language || "c").toLowerCase();
    const defaultCode = exercise.starter_code || DEFAULT_STARTER_CODE[lang] || DEFAULT_STARTER_CODE.c;
    if (window.confirm("Reset editor to the original template? Your current local draft will be replaced.")) {
      handleCodeChange(defaultCode);
      toast.info("Editor reset to starter template.");
    }
  };

  // Run Code Action
  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before executing.");
      return;
    }

    setIsRunning(true);
    setOutputResult(null);

    // Switch to output tab on mobile for immediate visibility
    if (window.innerWidth < 1024) {
      setMobileTab("output");
    }

    try {
      const result = await runCode({
        language: exercise?.language || "c",
        code,
        stdin,
        exerciseId: exercise?.id || exercise?.exercise_id || exerciseId,
      });
      setOutputResult(result);
    } catch (err) {
      setOutputResult({
        status: "Execution Error",
        stdout: "",
        stderr: err.message || "Failed to communicate with execution service.",
        exitCode: 1,
        executionTime: "—",
        testResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Exercise Work
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
        comments: `Submitted via LabFlow Monaco IDE`,
        stdin,
      };

      const res = await submitExerciseWork(
        exercise?.id || exercise?.exercise_id || exerciseId,
        payload
      );

      setSubmission(res.data);
      toast.success(
        `Exercise ${exercise?.exerciseNumber || exercise?.exercise_number || ""}: Solution submitted successfully.`
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to submit exercise. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exLanguage = (exercise?.language || "c").toLowerCase();
  const subStatus = submission?.status || exercise?.status || "Not Submitted";
  const subMarks = submission?.marks || exercise?.marks;
  const lastSubAt =
    submission?.submitted_date_display ||
    (submission?.submitted_at
      ? new Date(submission.submitted_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null);

  // Clean, Minimalist Production Skeleton & Loading State
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#f4f8fa] overflow-hidden select-none">
        {/* Top Header Placeholder */}
        <div className="h-14 bg-[#164a9c] text-white px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] text-white/80">← Laboratories</span>
            <span className="text-white/30">|</span>
            <span className="text-[13px] font-semibold text-white/90">
              {(courseId || "Laboratory").toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
            <span className="text-[12px] text-white/80 font-medium">Preparing your workspace...</span>
          </div>
        </div>

        {/* Work Area Skeleton */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Exercise Panel Skeleton */}
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 h-full">
            <ExercisePanel loading={true} courseId={courseId} />
          </div>

          {/* Right Editor & Console Skeleton */}
          <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-sans text-[13px] space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-[#164a9c] animate-pulse" />
                <span>Preparing your workspace</span>
              </div>
              <p className="text-[11.5px] text-slate-500 font-mono">
                Loading exercise details and Monaco editor...
              </p>
            </div>
            <div className="h-[220px] bg-[#252526] border-t border-[#333] px-4 py-2 text-[11px] text-slate-500 font-mono">
              Terminal console idle
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f4f8fa] overflow-hidden">
      {/* Top IDE Navigation Header */}
      <IDEHeader
        courseId={courseId}
        exercise={exercise}
        language={exLanguage}
        onRun={handleRun}
        onSubmit={handleSubmit}
        onResetCode={handleResetCode}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        submissionStatus={subStatus}
        submissionMarks={subMarks}
        lastSubmittedAt={lastSubSubAt(lastSubAt)}
        hasLocalDraft={hasLocalDraft}
      />

      {/* Mobile / Tablet Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white px-2 py-1 select-none text-[12px] font-semibold">
        <button
          onClick={() => setMobileTab("info")}
          className={`flex-1 py-1.5 text-center transition ${
            mobileTab === "info"
              ? "text-[#164a9c] border-b-2 border-[#164a9c]"
              : "text-slate-500"
          }`}
        >
          Exercise Info
        </button>
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 py-1.5 text-center transition ${
            mobileTab === "editor"
              ? "text-[#164a9c] border-b-2 border-[#164a9c]"
              : "text-slate-500"
          }`}
        >
          Monaco Editor
        </button>
        <button
          onClick={() => setMobileTab("output")}
          className={`flex-1 py-1.5 text-center transition ${
            mobileTab === "output"
              ? "text-[#164a9c] border-b-2 border-[#164a9c]"
              : "text-slate-500"
          }`}
        >
          Console Output
        </button>
      </div>

      {/* Desktop & Responsive Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Exercise Information Panel (Desktop: 340px, Mobile: conditional) */}
        <div
          className={`w-full lg:w-[360px] xl:w-[400px] shrink-0 h-full ${
            mobileTab === "info" ? "block" : "hidden lg:block"
          }`}
        >
          <ExercisePanel
            exercise={exercise}
            submission={submission}
            courseId={courseId}
          />
        </div>

        {/* Right Side: Monaco Editor & Bottom Output Area */}
        <div
          className={`flex-1 flex flex-col h-full min-w-0 ${
            mobileTab !== "info" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Top Half / Editor Canvas */}
          <div
            className={`flex-1 min-h-[300px] ${
              mobileTab === "output" ? "hidden lg:block" : "block"
            }`}
          >
            <CodeEditor
              code={code}
              language={exLanguage}
              onChange={handleCodeChange}
            />
          </div>

          {/* Bottom Half / Console Output Panel (Desktop: 220px fixed / resizable) */}
          <div
            className={`flex flex-col shrink-0 ${
              mobileTab === "editor" ? "hidden lg:flex lg:h-[220px]" : "flex h-full lg:h-[220px]"
            }`}
          >
            {/* Stdin Panel */}
            <div className="bg-[#1e1e1e] border-t border-[#333] px-4 py-1.5 flex flex-col">
              <button
                onClick={() => setIsStdinOpen(!isStdinOpen)}
                className="text-[12px] text-slate-300 font-medium flex items-center justify-between w-full hover:text-white transition-colors"
              >
                <span>Standard Input (stdin)</span>
                <span>{isStdinOpen ? "▼" : "▶"}</span>
              </button>
              {isStdinOpen && (
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input for your program here..."
                  className="w-full h-[60px] mt-2 bg-[#252526] text-slate-300 text-[13px] font-mono p-2 border border-[#444] rounded outline-none focus:border-[#164a9c] resize-y"
                  spellCheck={false}
                />
              )}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <OutputPanel
                outputResult={outputResult}
                isRunning={isRunning}
                onClear={() => setOutputResult(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function lastSubSubAt(dateStr) {
  return dateStr || null;
}
