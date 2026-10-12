import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, ClipboardList, Clock3, Plus, Save, Users } from "lucide-react";
import FacultyLayout from "../../components/layout/FacultyLayout";
import { getFacultyLaboratories, getFacultyProfile } from "../../services/facultyService";
import {
  createFacultyExam,
  getExamAttempts,
  getFacultyExams,
  gradeExamAttempt,
} from "../../services/examService";

const blankQuestion = () => ({
  prompt: "",
  type: "coding",
  points: 5,
  optionsText: "",
  correct_answer: "",
  language: "python",
  starter_code: "",
});

const panelClass = "border border-slate-200 bg-white shadow-sm";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const inputClass = "w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function FacultyExams() {
  const [profile, setProfile] = useState(null);
  const [labs, setLabs] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [form, setForm] = useState({ title: "", course_id: "", duration_minutes: 45 });
  const [feedbackByAttempt, setFeedbackByAttempt] = useState({});
  const [scoreByAttempt, setScoreByAttempt] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId),
    [exams, selectedExamId],
  );

  const loadData = useCallback(async () => {
    try {
      const [nextProfile, nextLabs, nextExams] = await Promise.all([
        getFacultyProfile(),
        getFacultyLaboratories(true),
        getFacultyExams(),
      ]);
      setError("");
      setProfile(nextProfile);
      setLabs(nextLabs || []);
      setExams(nextExams);
      setForm((current) => ({
        ...current,
        course_id: current.course_id || nextLabs?.[0]?.course_id || nextLabs?.[0]?.id || "",
      }));
      setSelectedExamId((current) => current || nextExams[0]?.id || "");
    } catch (loadError) {
      setError(loadError.response?.data?.detail || "Could not load exams. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttempts = useCallback(async () => {
    if (!selectedExamId) return;
    try {
      const result = await getExamAttempts(selectedExamId);
      setAttempts(result);
      setScoreByAttempt((current) => {
        const next = { ...current };
        result.forEach((attempt) => {
          next[attempt.id] ||= Object.fromEntries(
            (attempt.questions || []).map((question) => [question.id, question.awarded_points || 0]),
          );
        });
        return next;
      });
    } catch (loadError) {
      setError(loadError.response?.data?.detail || "Could not load exam submissions.");
    }
  }, [selectedExamId]);

  useEffect(() => {
    const task = window.setTimeout(() => { loadData(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadData]);
  useEffect(() => {
    const task = window.setTimeout(() => { loadAttempts(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadAttempts]);

  const updateQuestion = (index, key, value) => {
    setQuestions((current) => current.map((question, itemIndex) => (
      itemIndex === index ? { ...question, [key]: value } : question
    )));
  };

  const publishExam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const exam = await createFacultyExam({
        title: form.title.trim(),
        course_id: form.course_id,
        duration_minutes: Number(form.duration_minutes),
        questions: questions.map((question) => ({
          prompt: question.prompt.trim(),
          type: question.type,
          points: Number(question.points),
          language: question.type === "coding" ? question.language : null,
          starter_code: question.type === "coding" ? question.starter_code : "",
          options: question.type === "multiple_choice"
            ? question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean)
            : [],
          correct_answer: question.type === "multiple_choice" ? question.correct_answer : null,
        })),
      });
      setExams((current) => [exam, ...current]);
      setSelectedExamId(exam.id);
      setForm((current) => ({ ...current, title: "" }));
      setQuestions([blankQuestion()]);
      setMessage("Exam published. Students in this course can start now.");
    } catch (saveError) {
      setError(saveError.response?.data?.detail || "The exam could not be published. Review the questions and try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateScore = (attemptId, questionId, value) => {
    setScoreByAttempt((current) => ({
      ...current,
      [attemptId]: { ...current[attemptId], [questionId]: value },
    }));
  };

  const saveGrade = async (attempt) => {
    setError("");
    setMessage("");
    try {
      await gradeExamAttempt(selectedExamId, attempt.id, {
        scores: Object.fromEntries(
          (attempt.questions || []).map((question) => [
            question.id,
            Number(scoreByAttempt[attempt.id]?.[question.id] ?? question.awarded_points ?? 0),
          ]),
        ),
        feedback: feedbackByAttempt[attempt.id] || "",
      });
      setMessage(`Assessment saved for ${attempt.student_name}.`);
      await Promise.all([loadAttempts(), loadData()]);
    } catch (gradeError) {
      setError(gradeError.response?.data?.detail || "The assessment could not be saved.");
    }
  };

  const courseName = (courseId) => {
    const lab = labs.find((item) => (item.course_id || item.id) === courseId);
    return lab?.name || lab?.code || courseId?.toUpperCase();
  };

  return (
    <FacultyLayout profile={profile}>
      <div className="space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <BookOpenCheck className="h-4 w-4" /> Assessment studio
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Exams</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Build a timed assessment, publish it to a course, then review each student’s work.</p>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Users className="h-4 w-4 text-blue-700" />
            <span><strong className="text-slate-900">{exams.length}</strong> published</span>
          </div>
        </header>

        {(message || error) && (
          <div role="status" className={`border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {error || message}
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.35fr)]">
          <section className={`${panelClass} p-5 sm:p-6`}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">New assessment</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Create and publish</h2>
              </div>
              <span className="bg-blue-50 p-2 text-blue-700"><Plus className="h-5 w-5" /></span>
            </div>

            <form onSubmit={publishExam} className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="exam-title">Exam title</label>
                <input id="exam-title" className={inputClass} required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Data structures screening" />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_145px]">
                <div>
                  <label className={labelClass} htmlFor="exam-course">Course</label>
                  <select id="exam-course" className={inputClass} required value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })}>
                    {labs.map((lab) => {
                      const courseId = lab.course_id || lab.id;
                      return <option key={courseId} value={courseId}>{lab.code || courseId.toUpperCase()} · {lab.name}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="exam-duration">Time limit · minutes</label>
                  <input id="exam-duration" type="number" min="1" max="300" required className={inputClass} value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value })} />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
                    <p className="text-xs text-slate-500">Code submissions are reviewed by you. Multiple choice is auto-graded.</p>
                  </div>
                  <button type="button" onClick={() => setQuestions((current) => [...current, blankQuestion()])} className="inline-flex items-center gap-1.5 border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                <div className="max-h-[540px] space-y-4 overflow-y-auto pr-1">
                  {questions.map((question, index) => (
                    <div key={index} className="border border-slate-200 bg-slate-50/70 p-3.5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-blue-700">Q{String(index + 1).padStart(2, "0")}</span>
                        <div className="flex items-center gap-2">
                          <select aria-label={`Question ${index + 1} type`} className="border border-slate-300 bg-white px-2 py-1.5 text-xs" value={question.type} onChange={(event) => updateQuestion(index, "type", event.target.value)}>
                            <option value="multiple_choice">Multiple choice</option>
                            <option value="coding">Coding</option>
                            <option value="short_answer">Short answer</option>
                            <option value="essay">Written response</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs text-slate-500">Pts <input aria-label={`Question ${index + 1} points`} className="w-14 border border-slate-300 px-1.5 py-1 text-center" type="number" min="1" max="100" value={question.points} onChange={(event) => updateQuestion(index, "points", event.target.value)} /></label>
                          {questions.length > 1 && <button type="button" aria-label={`Remove question ${index + 1}`} onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="px-1 text-slate-400 hover:text-rose-700">×</button>}
                        </div>
                      </div>
                      <textarea required minLength={5} maxLength={5000} rows={2} className={`${inputClass} resize-y`} value={question.prompt} onChange={(event) => updateQuestion(index, "prompt", event.target.value)} placeholder="Write the question prompt" />
                      {question.type === "coding" && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                          <label className="text-xs font-semibold text-slate-500" htmlFor={`question-language-${index}`}>Language
                            <select id={`question-language-${index}`} className={`${inputClass} mt-1`} value={question.language} onChange={(event) => updateQuestion(index, "language", event.target.value)}>
                              <option value="python">Python</option>
                              <option value="c">C</option>
                              <option value="java">Java</option>
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-500" htmlFor={`question-starter-${index}`}>Starter code
                            <textarea id={`question-starter-${index}`} rows={5} maxLength={20000} className={`${inputClass} mt-1 resize-y font-mono text-xs`} value={question.starter_code} onChange={(event) => updateQuestion(index, "starter_code", event.target.value)} placeholder="Optional code shown in the student editor" />
                          </label>
                        </div>
                      )}
                      {question.type === "multiple_choice" && (
                        <div className="mt-3 space-y-2">
                          <textarea required rows={3} className={`${inputClass} resize-y`} value={question.optionsText} onChange={(event) => updateQuestion(index, "optionsText", event.target.value)} placeholder="One answer option per line (at least two)" />
                          <select required className={inputClass} aria-label={`Question ${index + 1} correct answer`} value={question.correct_answer} onChange={(event) => updateQuestion(index, "correct_answer", event.target.value)}>
                            <option value="">Choose the correct option</option>
                            {question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean).map((option, optionIndex) => <option key={`${option}-${optionIndex}`} value={option}>{option}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving || !labs.length} className="flex w-full items-center justify-center gap-2 bg-[#164a9c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#103a7b] disabled:cursor-not-allowed disabled:opacity-50">
                <BookOpenCheck className="h-4 w-4" /> {saving ? "Publishing…" : "Publish exam now"}
              </button>
              <p className="text-center text-xs text-slate-500">Students can start as soon as it is published.</p>
            </form>
          </section>

          <section className="space-y-5">
            <div className={`${panelClass} p-5 sm:p-6`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Your assessments</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Published exams</h2>
                </div>
                <ClipboardList className="h-5 w-5 text-blue-700" />
              </div>
              {loading ? <p className="py-6 text-sm text-slate-500">Loading your exams…</p> : exams.length === 0 ? (
                <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-slate-800">No exams published yet</p>
                  <p className="mt-1 text-xs text-slate-500">Create one here; it will appear in the students’ Exams menu.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {exams.map((exam) => (
                    <button key={exam.id} type="button" onClick={() => setSelectedExamId(exam.id)} className={`border p-4 text-left transition ${selectedExamId === exam.id ? "border-blue-700 bg-blue-50/70 ring-1 ring-blue-700" : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">{courseName(exam.course_id)}</span>
                        {exam.review_count > 0 && <span className="bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{exam.review_count} to review</span>}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{exam.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {exam.duration_minutes} min</span>
                        <span>{exam.question_count} questions</span>
                        <span>{exam.attempt_count} attempts</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${panelClass} p-5 sm:p-6`}>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Assessment desk</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Review submissions</h2>
                </div>
                <select aria-label="Choose exam to review" className="max-w-full border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
                  <option value="">Choose an exam</option>
                  {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                </select>
              </div>

              {!selectedExam ? <p className="border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-500">Select an exam to see student attempts.</p> : attempts.length === 0 ? (
                <p className="border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-500">No students have submitted this exam yet.</p>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <article key={attempt.id} className="border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{attempt.student_name || "Student"}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{attempt.student_number || attempt.student_email} · {attempt.status.replaceAll("_", " ")}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{attempt.grading_status === "graded" ? "Graded" : "Awaiting review"}</p>
                          <p className="mt-0.5">Focus warnings: {attempt.violation_count || 0}</p>
                        </div>
                      </div>
                      <div className="space-y-4 p-4">
                        {(attempt.questions || []).map((question, index) => (
                          <div key={question.id} className="grid gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:grid-cols-[1fr_100px]">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Question {index + 1} · {question.points} points</p>
                              <p className="mt-1 text-sm font-medium leading-6 text-slate-800">{question.prompt}</p>
                              {question.type === "coding" ? question.answer ? (
                                <div className="mt-3 overflow-hidden border border-slate-700 bg-[#1e1e1e]">
                                  <div className="border-b border-[#373737] bg-[#252526] px-3 py-2 text-[11px] font-medium text-slate-300">{question.language?.toUpperCase() || "CODE"} · submitted solution</div>
                                  <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-5 text-slate-200"><code>{question.answer}</code></pre>
                                </div>
                              ) : <p className="mt-2 text-sm italic text-slate-400">No code submitted</p> : (
                                <div className="mt-2 whitespace-pre-wrap border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-700">
                                  {question.answer || <span className="italic text-slate-400">No answer provided</span>}
                                </div>
                              )}
                              {question.type === "multiple_choice" && <p className="mt-1 text-xs text-slate-500">Correct answer: {question.correct_answer}</p>}
                            </div>
                            <label className="text-xs font-semibold text-slate-500">Score / {question.points}
                              <input aria-label={`Score for question ${index + 1}`} type="number" min="0" max={question.points} step="0.5" className="mt-1 w-full border border-slate-300 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" value={scoreByAttempt[attempt.id]?.[question.id] ?? question.awarded_points ?? 0} onChange={(event) => updateScore(attempt.id, question.id, event.target.value)} />
                            </label>
                          </div>
                        ))}
                        <label className="block text-xs font-semibold text-slate-500">Feedback for student
                          <textarea rows={2} className={`${inputClass} mt-1 resize-y normal-case font-normal tracking-normal`} value={feedbackByAttempt[attempt.id] ?? attempt.feedback ?? ""} onChange={(event) => setFeedbackByAttempt((current) => ({ ...current, [attempt.id]: event.target.value }))} placeholder="Add useful feedback" />
                        </label>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-slate-500">Current score <strong className="text-slate-800">{attempt.score ?? 0} / {attempt.total_points}</strong></p>
                          <button type="button" disabled={attempt.status === "in_progress"} onClick={() => saveGrade(attempt)} className="inline-flex items-center gap-2 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Save className="h-3.5 w-3.5" />{attempt.status === "in_progress" ? "Awaiting submission" : "Save assessment"}</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </FacultyLayout>
  );
}
