import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  Maximize2,
  Play,
  Send,
  ShieldCheck,
} from "lucide-react";
import CodeEditor from "../../components/ide/CodeEditor";
import OutputPanel from "../../components/ide/OutputPanel";
import { runCode } from "../../services/executionService";
import {
  getStudentExamRoom,
  recordExamViolation,
  saveExamAnswer,
  startStudentExam,
  submitStudentExam,
} from "../../services/examService";

const formatTime = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

const FOCUS_GUARD_ENABLED = import.meta.env.VITE_EXAM_FOCUS_GUARD_ENABLED !== "false";
const languageName = (language) => ({ python: "Python", c: "C", java: "Java" }[language] || language);
const restoreAnswers = (questions = [], savedAnswers = {}) => Object.fromEntries(
  questions.map((question) => [
    question.id,
    savedAnswers[question.id] ?? (question.type === "coding" ? question.starter_code || "" : ""),
  ]),
);

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [now, setNow] = useState(0);
  const [violationMessage, setViolationMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(FOCUS_GUARD_ENABLED && Boolean(document.fullscreenElement));
  const [stdin, setStdin] = useState("");
  const [outputResult, setOutputResult] = useState(null);
  const [activeOutputTab, setActiveOutputTab] = useState("output");
  const [isRunning, setIsRunning] = useState(false);
  const saveTimers = useRef(new Map());
  const pendingAnswers = useRef(new Map());
  const lastViolationAt = useRef(0);
  const finishing = useRef(false);

  const loadRoom = useCallback(async () => {
    try {
      const data = await getStudentExamRoom(examId);
      setError("");
      setRoom(data);
      setAnswers(restoreAnswers(data.exam?.questions, data.attempt?.answers));
      setNow(Date.now());
    } catch (loadError) {
      setError(loadError.response?.data?.detail || "This exam could not be opened.");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    const task = window.setTimeout(() => { loadRoom(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadRoom]);

  const attempt = room?.attempt;
  const exam = room?.exam;
  const isActive = attempt?.status === "in_progress";
  const questions = useMemo(() => exam?.questions ?? [], [exam?.questions]);
  const activeQuestion = questions[activeIndex];
  const deadline = attempt?.deadline_at ? new Date(attempt.deadline_at).getTime() : null;
  const remaining = deadline ? deadline - now : 0;
  const answeredCount = useMemo(
    () => questions.filter((question) => String(answers[question.id] || "").trim()).length,
    [answers, questions],
  );
  const isCodeQuestion = activeQuestion?.type === "coding";
  const activeAnswer = activeQuestion ? answers[activeQuestion.id] || "" : "";

  const flushPendingAnswers = useCallback(async () => {
    const entries = [...pendingAnswers.current.entries()];
    entries.forEach(([questionId]) => {
      const timer = saveTimers.current.get(questionId);
      if (timer) window.clearTimeout(timer);
      saveTimers.current.delete(questionId);
    });
    if (!entries.length) return;
    setSavingAnswer(true);
    try {
      await Promise.all(entries.map(([questionId, answer]) => saveExamAnswer(examId, questionId, answer)));
      entries.forEach(([questionId]) => pendingAnswers.current.delete(questionId));
    } finally {
      setSavingAnswer(pendingAnswers.current.size > 0);
    }
  }, [examId]);

  const endAttempt = useCallback(async (automatic = false) => {
    if (finishing.current || !isActive) return;
    finishing.current = true;
    setSubmitting(true);
    setError("");
    try {
      if (pendingAnswers.current.size) await flushPendingAnswers();
      const finishedAttempt = await submitStudentExam(examId);
      setRoom((current) => current ? { ...current, attempt: finishedAttempt } : current);
      setConfirmSubmit(false);
      if (automatic && finishedAttempt.status === "expired") {
        setViolationMessage("Time is up. Your saved answers have been submitted.");
      }
      if (FOCUS_GUARD_ENABLED && document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    } catch (submitError) {
      setError(submitError.response?.data?.detail || "Submission could not be confirmed. Reconnect and try again.");
      finishing.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [examId, flushPendingAnswers, isActive]);

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (isActive && remaining <= 0 && !finishing.current) endAttempt(true);
  }, [endAttempt, isActive, remaining]);

  const handleViolation = useCallback(async (kind) => {
    if (!FOCUS_GUARD_ENABLED || !isActive || finishing.current || Date.now() - lastViolationAt.current < 1800) return;
    lastViolationAt.current = Date.now();
    try {
      const result = await recordExamViolation(examId, kind);
      const count = result.violation_count || 0;
      if (result.terminated) {
        finishing.current = true;
        setRoom((current) => current ? { ...current, attempt: result.attempt } : current);
        setViolationMessage("This attempt ended after three focus violations. Your saved answers were submitted.");
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      } else {
        setRoom((current) => current ? { ...current, attempt: { ...current.attempt, violation_count: count } } : current);
        setViolationMessage(`Focus change recorded (${count} of 3). Return to the exam; the third detected change ends your attempt.`);
      }
    } catch (violationError) {
      setError(violationError.response?.data?.detail || "Your focus change could not be recorded. Stay on this page and reconnect.");
    }
  }, [examId, isActive]);

  useEffect(() => {
    if (!isActive || !FOCUS_GUARD_ENABLED) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleViolation("tab_hidden");
    };
    const onBlur = () => {
      if (document.visibilityState === "visible") handleViolation("window_blur");
    };
    const onFullscreenChange = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(fullscreen);
      if (!fullscreen) handleViolation("fullscreen_exit");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [handleViolation, isActive]);

  useEffect(() => () => {
    saveTimers.current.forEach((timer) => window.clearTimeout(timer));
    saveTimers.current.clear();
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      return true;
    } catch {
      setError("Fullscreen is required for this assessment. Allow it in your browser, then try again.");
      return false;
    }
  };

  const beginExam = async () => {
    setError("");
    try {
      if (FOCUS_GUARD_ENABLED && !(await enterFullscreen())) return;
      const nextAttempt = await startStudentExam(examId);
      finishing.current = false;
      setViolationMessage("");
      setOutputResult(null);
      setRoom((current) => current ? { ...current, attempt: nextAttempt } : current);
      setAnswers(restoreAnswers(questions, nextAttempt.answers));
      setNow(Date.now());
    } catch (startError) {
      setError(startError.response?.data?.detail || "The exam could not be started.");
    }
  };

  const changeAnswer = (questionId, answer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    pendingAnswers.current.set(questionId, answer);
    const previousTimer = saveTimers.current.get(questionId);
    if (previousTimer) window.clearTimeout(previousTimer);
    saveTimers.current.set(questionId, window.setTimeout(async () => {
      setSavingAnswer(true);
      try {
        await saveExamAnswer(examId, questionId, answer);
        pendingAnswers.current.delete(questionId);
        setError("");
      } catch (saveError) {
        setError(saveError.response?.data?.detail || "An answer could not be saved. Check the connection before submitting.");
      } finally {
        saveTimers.current.delete(questionId);
        setSavingAnswer(pendingAnswers.current.size > 0);
      }
    }, 500));
  };

  const handleRun = useCallback(async () => {
    if (!activeQuestion || !isCodeQuestion || !activeAnswer.trim() || isRunning || !isActive) return;
    setIsRunning(true);
    setOutputResult(null);
    setActiveOutputTab("output");
    try {
      const result = await runCode({
        language: activeQuestion.language || "python",
        code: activeAnswer,
        examId,
        questionId: activeQuestion.id,
        stdin,
      });
      setOutputResult(result);
      if (["Compilation Error", "Runtime Error", "Execution Error"].includes(result.status)) {
        setActiveOutputTab("errors");
      }
    } catch (runError) {
      setOutputResult({
        status: "Execution Error",
        stdout: "",
        stderr: runError.response?.data?.detail || runError.message,
        executionTime: "—",
      });
      setActiveOutputTab("errors");
    } finally {
      setIsRunning(false);
    }
  }, [activeAnswer, activeQuestion, examId, isActive, isCodeQuestion, isRunning, stdin]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-medium text-slate-600">Opening assessment…</main>;
  }
  if (error && !exam) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
        <section className="w-full max-w-lg border border-slate-200 bg-white p-7 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-7 w-7 text-amber-600" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Exam unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <button type="button" onClick={() => navigate("/student/exams")} className="mt-5 border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Return to exams</button>
        </section>
      </main>
    );
  }
  if (!exam) return null;

  if (!attempt || attempt.status !== "in_progress") {
    const finalAttempt = attempt && attempt.status !== "in_progress";
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <button type="button" onClick={() => navigate("/student/exams")} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to exams</button>
          <section className="mt-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700"><BookOpenCheck className="h-4 w-4" /> {exam.course_id.toUpperCase()} · Timed assessment</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{exam.title}</h1>
              </div>
              <span className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-700"><Clock3 className="h-4 w-4 text-blue-700" /> {exam.duration_minutes} min</span>
            </div>
            {finalAttempt ? (
              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div><h2 className="text-sm font-semibold capitalize text-emerald-900">Attempt {attempt.status.replaceAll("_", " ")}</h2><p className="mt-1 text-sm leading-6 text-emerald-800">{attempt.grading_status === "graded" ? `Score: ${attempt.score} / ${attempt.total_points}` : "Your code is saved. Your instructor will review your submission."}</p></div>
                </div>
                {attempt.feedback && <p className="mt-4 text-sm leading-6 text-slate-700"><strong>Instructor feedback:</strong> {attempt.feedback}</p>}
                {exam.allow_retake && <div className="mt-5"><p className="text-sm text-slate-600">Testing mode is on. Your previous attempt remains available to your instructor.</p><button type="button" onClick={beginExam} className="mt-3 min-h-11 bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">Start another attempt</button>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}</div>}
              </div>
            ) : (
              <div className="grid gap-x-8 gap-y-6 px-6 py-6 sm:grid-cols-[1fr_270px] sm:px-8 sm:py-8">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Before you begin</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Your timer starts when you begin. Code runs in the LabFlow IDE and saves automatically as you work. Your final code is sent to your instructor when you submit.</p>
                  {FOCUS_GUARD_ENABLED ? (
                    <div className="mt-5 flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <span>Stay in this window. Three detected focus changes end the attempt.</span>
                    </div>
                  ) : (
                    <p className="mt-5 border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">Testing mode: tab switching and fullscreen are unrestricted.</p>
                  )}
                  {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
                  <button type="button" onClick={beginExam} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{FOCUS_GUARD_ENABLED && <Maximize2 className="h-4 w-4" />} {FOCUS_GUARD_ENABLED ? "Enter fullscreen and begin" : "Begin exam"}</button>
                </div>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                <div className="border border-slate-200 bg-slate-50 px-4 py-3"><dt className="text-xs font-medium text-slate-500">Questions</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{questions.length}</dd></div>
                <div className="border border-slate-200 bg-slate-50 px-4 py-3"><dt className="text-xs font-medium text-slate-500">Total points</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{exam.total_points}</dd></div>
                </dl>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  const secondsRemaining = Math.max(0, Math.floor(remaining / 1000));
  const timeIsLow = remaining < 5 * 60 * 1000;

  return (
    <main className="flex min-h-screen flex-col bg-slate-100 text-slate-900 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <header className="relative z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center bg-blue-700 text-white"><Code2 className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">LabFlow exam room</p>
            <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{exam.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden text-right text-xs text-slate-500 sm:block"><span className="font-semibold text-slate-800">{answeredCount}/{questions.length}</span> answered</div>
          <span className={`inline-flex min-h-10 items-center gap-2 border px-3 font-mono text-sm font-bold tabular-nums ${timeIsLow ? "border-rose-300 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-800"}`} aria-live="polite" aria-label={`${Math.ceil(secondsRemaining / 60)} minutes ${secondsRemaining % 60} seconds remaining`}><Clock3 className="h-4 w-4" /> {formatTime(remaining)}</span>
          <button type="button" disabled={submitting} onClick={() => setConfirmSubmit(true)} className="inline-flex min-h-10 items-center gap-2 bg-emerald-700 px-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50 sm:px-4"><Send className="h-4 w-4" /><span className="hidden sm:inline">Submit exam</span><span className="sm:hidden">Submit</span></button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100" aria-hidden="true"><div className="h-full bg-blue-700 transition-[width] duration-200" style={{ width: `${Math.max(0, Math.min(100, (answeredCount / Math.max(questions.length, 1)) * 100))}%` }} /></div>
      </header>

      <div className="grid flex-1 items-start lg:min-h-0 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <section className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Questions</h2>
              <span className="text-xs text-slate-500">{answeredCount} of {questions.length} answered</span>
            </div>
            <nav aria-label="Exam questions" className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-4">
              {questions.map((question, index) => {
                const selected = activeIndex === index;
                const answered = Boolean(String(answers[question.id] || "").trim());
                return (
                  <button key={question.id} type="button" aria-current={selected ? "step" : undefined} aria-label={`Question ${index + 1}${answered ? ", answered" : ", not answered"}`} onClick={() => { setActiveIndex(index); setOutputResult(null); }} className={`relative grid min-h-11 place-items-center border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${selected ? "border-blue-700 bg-blue-700 text-white" : answered ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500" : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"}`}>
                    {answered && !selected ? <Check className="absolute right-1 top-1 h-3 w-3" aria-hidden="true" /> : null}{index + 1}
                  </button>
                );
              })}
            </nav>
          </section>

          <section className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">Question {String(activeIndex + 1).padStart(2, "0")}</span>
              <span className="text-xs font-medium text-slate-500">{activeQuestion?.points} points</span>
            </div>
            <div className="mt-3 max-h-52 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-410px)]">
              <h2 className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{activeQuestion?.prompt}</h2>
            </div>
            {isCodeQuestion && <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500"><Code2 className="h-3.5 w-3.5 text-blue-700" /> {languageName(activeQuestion.language)} coding question</p>}
            {isCodeQuestion && <p className="mt-2 text-xs leading-5 text-slate-500">Use Run to check your output. Your code saves as you type.</p>}
          </section>

          <section className="border-t border-slate-200 px-4 py-3 sm:px-5">
            {violationMessage && <div role="alert" className="mb-3 flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span>{violationMessage}</span><button type="button" className="ml-auto min-h-8 min-w-8 text-amber-800" aria-label="Dismiss warning" onClick={() => setViolationMessage("")}>×</button></div>}
            {error && <div role="alert" className="mb-3 border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">{error}</div>}
            {FOCUS_GUARD_ENABLED ? (
              <>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-600" /> Focus warnings</span><span className={`font-semibold tabular-nums ${(attempt.violation_count || 0) > 0 ? "text-amber-800" : "text-slate-700"}`}>{attempt.violation_count || 0} / 3</span></div>
                <p className="mt-1.5 pl-6 text-[11px] leading-4 text-slate-500">{isFullscreen ? "Fullscreen active" : "Fullscreen is recommended"}</p>
              </>
            ) : <p className="text-xs text-slate-500">Testing mode · tab switching allowed</p>}
          </section>
        </aside>

        <section className="flex min-h-[72vh] flex-col bg-[#e7e9ed] p-3 sm:p-4 lg:h-full lg:min-h-0 lg:p-5">
          {isCodeQuestion ? (
            <div className="flex min-h-[68vh] flex-1 flex-col overflow-hidden border border-slate-300 bg-[#1e1e1e] shadow-sm lg:min-h-0">
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-[#373737] bg-[#252526] px-3 sm:px-4">
                <div className="flex items-center gap-2 text-xs text-slate-300"><Code2 className="h-4 w-4 text-sky-400" /><span className="font-medium">Solution</span><span className="text-slate-500">·</span><span>{languageName(activeQuestion.language)}</span></div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400" aria-live="polite">
                  <span>{savingAnswer ? "Saving code…" : activeAnswer ? "Code saved" : "Ready"}</span>
                  <button type="button" onClick={handleRun} disabled={!activeAnswer.trim() || isRunning} className="inline-flex min-h-8 items-center gap-1.5 bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-3.5 w-3.5" />{isRunning ? "Running…" : "Run code"}</button>
                </div>
              </div>
              <div className="min-h-[300px] flex-1 lg:min-h-0">
                <CodeEditor code={activeAnswer} language={activeQuestion.language || "python"} onChange={(code) => changeAnswer(activeQuestion.id, code.slice(0, 20000))} />
              </div>
              <div className="h-56 shrink-0 border-t border-[#373737] sm:h-52">
                <OutputPanel
                  outputResult={outputResult}
                  testResults={null}
                  isRunning={isRunning}
                  isRunningTests={false}
                  activeTab={activeOutputTab}
                  setActiveTab={setActiveOutputTab}
                  stdin={stdin}
                  setStdin={setStdin}
                  onClear={() => setOutputResult(null)}
                  hasTests={false}
                />
              </div>
            </div>
          ) : (
            <section className="flex min-h-[55vh] flex-1 flex-col border border-slate-200 bg-white shadow-sm lg:min-h-0">
              <div className="border-b border-slate-200 px-4 py-3 text-xs text-slate-500">{savingAnswer ? "Saving response…" : activeAnswer ? "Response saved" : "No response yet"}</div>
              {activeQuestion?.type === "multiple_choice" ? (
                <div className="space-y-3 p-4 sm:p-6">
                  {(activeQuestion.options || []).map((option, index) => {
                    const checked = activeAnswer === option;
                    return <label key={`${option}-${index}`} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition ${checked ? "border-blue-700 bg-blue-50 text-slate-900" : "border-slate-200 text-slate-700 hover:border-slate-400"}`}><input type="radio" name={activeQuestion.id} value={option} checked={checked} onChange={() => changeAnswer(activeQuestion.id, option)} className="h-4 w-4 accent-blue-700" />{option}</label>;
                  })}
                </div>
              ) : (
                <textarea value={activeAnswer} onChange={(event) => changeAnswer(activeQuestion.id, event.target.value.slice(0, 20000))} rows={activeQuestion?.type === "essay" ? 14 : 7} maxLength={20000} aria-label="Your answer" className="m-4 min-h-48 flex-1 resize-y border border-slate-300 p-4 font-mono text-sm leading-6 text-slate-800 outline-none focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 sm:m-6" placeholder="Write your answer here…" />
              )}
            </section>
          )}

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white px-3 py-2.5 sm:px-4">
            <button type="button" disabled={activeIndex === 0} onClick={() => { setActiveIndex((index) => Math.max(index - 1, 0)); setOutputResult(null); }} className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Previous</button>
            <span className="hidden text-xs text-slate-500 sm:inline">{savingAnswer ? "Saving your work…" : `${answeredCount} of ${questions.length} answered`}</span>
            {activeIndex < questions.length - 1 ? (
              <button type="button" onClick={() => { setActiveIndex((index) => Math.min(index + 1, questions.length - 1)); setOutputResult(null); }} className="inline-flex min-h-10 items-center gap-2 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Next question <ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={() => setConfirmSubmit(true)} className="inline-flex min-h-10 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><Send className="h-4 w-4" /> Submit exam</button>
            )}
          </footer>
        </section>
      </div>

      {confirmSubmit && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/55 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl"><h2 id="submit-title" className="text-lg font-semibold text-slate-900">Submit this exam?</h2><p className="mt-2 text-sm leading-6 text-slate-600">You answered {answeredCount} of {questions.length} questions. Your saved code and answers cannot be changed after submission.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmSubmit(false)} className="min-h-10 border border-slate-300 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Keep working</button><button type="button" disabled={submitting} onClick={() => endAttempt(false)} className="min-h-10 bg-emerald-700 px-3.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{submitting ? "Submitting…" : "Confirm submit"}</button></div></section></div>}
    </main>
  );
}
