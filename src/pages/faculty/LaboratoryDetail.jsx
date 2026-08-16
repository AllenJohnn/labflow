import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  User,
  CheckCircle2,
  Users,
  FileText,
  Clock,
  Plus,
  Send,
  Search,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import FacultyLayout from "../../components/layout/FacultyLayout";
import {
  getFacultyProfile,
  getFacultyLaboratoryDetail,
  getFacultyExercises,
  assignFacultyExercise,
  getFacultySubmissions,
  getFacultyStudents,
  getFacultyAnnouncements,
  createFacultyAnnouncement,
  uploadFacultySyllabus,
  getCachedLabDetail,
  getCachedExercises,
} from "../../services/facultyService";

export default function FacultyLaboratoryDetail() {
  const { courseId } = useParams();
  const normalizedId = (courseId || "nsa").toLowerCase();

  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [lab, setLab] = useState(() => getCachedLabDetail(normalizedId));
  const [exercises, setExercises] = useState(() => getCachedExercises(normalizedId) || []);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [syllabusUrl, setSyllabusUrl] = useState(() => `/syllabi/${normalizedId.toUpperCase()}_Syllabus.pdf`);
  const [isUploadingSyllabus, setIsUploadingSyllabus] = useState(false);
  const fileInputRef = useRef(null);

  const [submissionExerciseFilter, setSubmissionExerciseFilter] = useState("all");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("all");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentViewMode, setStudentViewMode] = useState("roster");
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

  const [assigningId, setAssigningId] = useState(null);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profData, labData, exData, subData, stuData, annData] = await Promise.all([
          getFacultyProfile(),
          getFacultyLaboratoryDetail(normalizedId),
          getFacultyExercises(normalizedId),
          getFacultySubmissions(normalizedId),
          getFacultyStudents(normalizedId),
          getFacultyAnnouncements(normalizedId),
        ]);
        if (isMounted) {
          setProfile(profData);
          setLab(labData);
          setExercises(exData);
          setSubmissions(subData);
          setStudents(stuData);
          setAnnouncements(annData);
          if (labData?.syllabus_url) {
            setSyllabusUrl(labData.syllabus_url);
          }
        }
      } catch (err) {
        console.error("Error loading laboratory detail:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [normalizedId]);

  const handleAssignExercise = async (ex) => {
    const exerciseIdentifier = ex.exercise_id || ex.id;
    setAssigningId(exerciseIdentifier);
    try {
      await assignFacultyExercise(exerciseIdentifier, normalizedId);

      setExercises((prev) =>
        prev.map((item) =>
          item.id === exerciseIdentifier || item.exercise_id === exerciseIdentifier
            ? { ...item, is_assigned: true, isAssigned: true, status: "Assigned", assigned_date: new Date().toISOString() }
            : item
        )
      );

      setLab((prev) => (prev ? { ...prev, assigned_count: (prev.assigned_count || 1) + 1 } : prev));

      toast.success(`Exercise ${ex.exercise_number}: "${ex.title}" assigned successfully`);
    } catch (err) {
      console.error("Failed to assign exercise:", err);
      toast.error("Failed to assign exercise. Please try again.");
    } finally {
      setAssigningId(null);
    }
  };

  const handleSyllabusFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }

    setIsUploadingSyllabus(true);
    try {
      const res = await uploadFacultySyllabus(normalizedId, file);
      const updatedUrl = res?.syllabus_url || `/syllabi/${normalizedId.toUpperCase()}-Syllabus.pdf?v=${Date.now()}`;
      setSyllabusUrl(updatedUrl);
      setLab((prev) => (prev ? { ...prev, syllabus_url: updatedUrl } : prev));
      toast.success(`Syllabus replaced successfully (${file.name})`);
    } catch (err) {
      console.error("Error replacing syllabus:", err);
      toast.error("Failed to replace syllabus");
    } finally {
      setIsUploadingSyllabus(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim()) {
      toast.error("Announcement title is required");
      return;
    }
    setPostingAnn(true);
    try {
      const created = await createFacultyAnnouncement(normalizedId, {
        title: annTitle.trim(),
        content: annContent.trim(),
      });
      setAnnouncements((prev) => [created, ...prev]);
      setAnnTitle("");
      setAnnContent("");
      setIsAnnModalOpen(false);
      toast.success("Announcement published successfully to laboratory students");
    } catch (err) {
      console.error("Error creating announcement:", err);
      toast.error("Failed to publish announcement");
    } finally {
      setPostingAnn(false);
    }
  };

  const assignedExercises = exercises.filter((ex) => ex.is_assigned || ex.isAssigned);
  const currentExercise = assignedExercises.length > 0 ? assignedExercises[assignedExercises.length - 1] : exercises[0];

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesEx =
      submissionExerciseFilter === "all" ||
      (sub.exercise_id || sub.exercise_number) === submissionExerciseFilter;

    const matchesStatus =
      submissionStatusFilter === "all" || sub.status === submissionStatusFilter;

    const q = submissionSearch.toLowerCase();
    const matchesQuery =
      !q ||
      (sub.student_name || "").toLowerCase().includes(q) ||
      (sub.student_id || "").toLowerCase().includes(q);

    return matchesEx && matchesStatus && matchesQuery;
  });

  const filteredStudents = students.filter((stu) => {
    const q = studentSearch.toLowerCase();
    return (
      (stu.name || "").toLowerCase().includes(q) ||
      (stu.student_id || "").toLowerCase().includes(q) ||
      (stu.email || "").toLowerCase().includes(q)
    );
  });

  const totalSubmissionsCount = submissions.length;
  const evaluatedCount = submissions.filter((s) => s.status === "Evaluated").length;
  const reviewedCount = submissions.filter((s) => s.status === "Reviewed").length;
  const submittedCount = submissions.filter((s) => s.status === "Submitted").length;
  const notSubmittedCount = submissions.filter((s) => s.status === "Not Submitted").length;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "exercises", label: `Exercises (${exercises.length})` },
    { id: "submissions", label: `Submissions (${submissions.length || 60})` },
    { id: "students", label: `Students (${students.length || 60})` },
    { id: "announcements", label: "Announcements" },
  ];

  return (
    <FacultyLayout profile={profile} announcements={announcements}>
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleSyllabusFileChange}
        />

        <div>
          <Link
            to="/faculty/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#164a9c] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block bg-[#f0f4fa] px-2.5 py-1 text-[11px] font-bold text-[#164a9c] tracking-wider uppercase border border-[#164a9c]/15">
                {lab?.code || normalizedId.toUpperCase()}
              </span>
              <h1 className="mt-2 text-[22px] font-bold text-slate-800 tracking-tight">
                {lab?.name || "Laboratory Subject"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-[#159447]" />
                  <span className="text-slate-400">Faculty:</span>
                  <span className="font-semibold text-slate-800">{lab?.faculty || profile?.name || "Rakhi"}</span>
                </div>
                <div className="h-3.5 w-[1px] bg-slate-200" />
                <div>
                  <span className="text-slate-400">Cohort:</span>{" "}
                  <span className="font-semibold text-slate-700">MCA S3 · 60 Students</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={syllabusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-[#164a9c] hover:text-[#164a9c] focus:outline-none"
              >
                <span>View Syllabus</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingSyllabus}
                className="inline-flex items-center gap-2 border border-[#164a9c]/30 bg-[#f0f4fa] px-3.5 py-2 text-[12px] font-semibold text-[#164a9c] transition hover:bg-[#164a9c] hover:text-white disabled:opacity-50 cursor-pointer"
                title="Upload and update current syllabus PDF"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploadingSyllabus ? "Uploading..." : "Update Syllabus"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-4">
          <nav className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-[13.5px] font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#164a9c] text-[#164a9c]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="border border-slate-200/80 bg-white p-6 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Active Exercise
                </span>
                <span className="bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#159447] border border-[#159447]/20">
                  Assigned to Students
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-[17px] font-bold text-slate-800">
                    Exercise {currentExercise?.exercise_number || "01"}: {currentExercise?.title || "Directory Tree & Linux File Operations"}
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500 max-w-[700px]">
                    {currentExercise?.description || "Create hierarchical directory structure Project34, copy, merge files with cat, sort pay records, and inspect file counts using Linux utilities."}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("exercises")}
                  className="border border-[#164a9c]/30 bg-[#f0f4fa] px-3.5 py-1.5 text-[12px] font-semibold text-[#164a9c] hover:bg-[#164a9c] hover:text-white transition cursor-pointer"
                >
                  Manage All Exercises
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-slate-800">
                  Laboratory Operations Summary (MCA S3)
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Click any metric to inspect details</span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div
                  onClick={() => {
                    setActiveTab("students");
                    setStudentSearch("");
                    setStudentViewMode("roster");
                  }}
                  className="group border border-slate-200/80 bg-white p-4.5 shadow-2xs hover:border-[#164a9c] hover:shadow-sm transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-[#164a9c]">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Enrolled</span>
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-[#164a9c] transition">→</span>
                  </div>
                  <div className="mt-2 text-[24px] font-bold text-slate-800 group-hover:text-[#164a9c] transition">
                    60
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">Total Batch Students</div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab("submissions");
                    setSubmissionStatusFilter("all");
                    setSubmissionExerciseFilter("all");
                    setSubmissionSearch("");
                  }}
                  className="group border border-slate-200/80 bg-white p-4.5 shadow-2xs hover:border-[#164a9c] hover:shadow-sm transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#164a9c]">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Submitted</span>
                    </div>
                    <span className="text-[11px] text-[#164a9c] transition">→</span>
                  </div>
                  <div className="mt-2 text-[24px] font-bold text-[#164a9c]">
                    52
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">Completed Code Runs</div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab("submissions");
                    setSubmissionStatusFilter("Evaluated");
                    setSubmissionSearch("");
                  }}
                  className="group border border-slate-200/80 bg-white p-4.5 shadow-2xs hover:border-[#159447] hover:shadow-sm transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#159447]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Reviewed</span>
                    </div>
                    <span className="text-[11px] text-[#159447] transition">→</span>
                  </div>
                  <div className="mt-2 text-[24px] font-bold text-[#159447]">
                    36
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">Evaluated Submissions</div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab("submissions");
                    setSubmissionStatusFilter("Submitted");
                    setSubmissionSearch("");
                  }}
                  className="group border border-slate-200/80 bg-white p-4.5 shadow-2xs hover:border-amber-600 hover:shadow-sm transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Review</span>
                    </div>
                    <span className="text-[11px] text-amber-600 transition">→</span>
                  </div>
                  <div className="mt-2 text-[24px] font-bold text-amber-600">
                    16
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">Awaiting Feedback</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-[13px] text-slate-600">
                Manage curriculum assignment, review pending submissions, or replace the syllabus PDF.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("exercises")}
                  className="bg-[#164a9c] px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#123877] cursor-pointer"
                >
                  Assign Exercises
                </button>
                <button
                  onClick={() => setActiveTab("submissions")}
                  className="border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 cursor-pointer"
                >
                  Review Submissions
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-3">
              <div>
                <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">
                  Curriculum Exercises
                </h2>
                <p className="text-[12px] text-slate-500">
                  Assign exercises to make them immediately visible to enrolled students.
                </p>
              </div>
              <span className="text-[12px] font-semibold text-[#164a9c] bg-[#f0f4fa] px-3 py-1 border border-[#164a9c]/15">
                {assignedExercises.length} of {exercises.length} Assigned
              </span>
            </div>

            <div className="border border-slate-200/80 bg-white divide-y divide-slate-100 shadow-2xs">
              {exercises.map((ex) => {
                const isAssigned = ex.is_assigned || ex.isAssigned;
                const exId = ex.exercise_id || ex.id;
                const isBusy = assigningId === exId;

                return (
                  <div
                    key={exId}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 transition hover:bg-slate-50/50"
                  >
                    <div className="flex items-start gap-3.5 max-w-[700px]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f0f4fa] border border-[#164a9c]/15 text-[12px] font-bold text-[#164a9c]">
                        {ex.exercise_number}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[15px] font-bold text-slate-800">
                            {ex.title}
                          </h4>
                          {isAssigned ? (
                            <span className="bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#159447] uppercase border border-[#159447]/20">
                              Assigned
                            </span>
                          ) : (
                            <span className="bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase border border-slate-200">
                              Not Assigned
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[12.5px] text-slate-500 leading-relaxed">
                          {ex.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAssigned ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#159447]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Visible to Students</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAssignExercise(ex)}
                          disabled={isBusy}
                          className="flex items-center gap-2 bg-[#164a9c] hover:bg-[#123877] text-white px-3.5 py-1.5 text-[12px] font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          {isBusy ? (
                            <span>Assigning...</span>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Assign Exercise</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-3">
              <div>
                <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">
                  Student Submissions Overview
                </h2>
                <p className="text-[12px] text-slate-500">
                  Track individual student submissions across the 60-student MCA S3 cohort.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-slate-500">Exercise:</span>
                  <select
                    value={submissionExerciseFilter}
                    onChange={(e) => setSubmissionExerciseFilter(e.target.value)}
                    className="border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-[#164a9c]"
                  >
                    <option value="all">All Exercises</option>
                    {exercises.map((ex) => (
                      <option key={ex.exercise_id || ex.id} value={ex.exercise_id || ex.id}>
                        Ex {ex.exercise_number}: {ex.title.slice(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-slate-500">Status:</span>
                  <select
                    value={submissionStatusFilter}
                    onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                    className="border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-[#164a9c]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Evaluated">Evaluated</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Submitted">Submitted (Pending Review)</option>
                    <option value="Not Submitted">Not Submitted</option>
                  </select>
                </div>

                <div className="relative w-52">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="w-full border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-[12px] text-slate-700 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                onClick={() => setSubmissionStatusFilter("all")}
                className={`border p-2.5 text-left transition cursor-pointer ${
                  submissionStatusFilter === "all"
                    ? "border-[#164a9c] bg-[#f0f4fa]"
                    : "border-slate-200/80 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 uppercase">All Cohort</div>
                <div className="text-[17px] font-bold text-slate-800">{totalSubmissionsCount}</div>
              </button>

              <button
                onClick={() => setSubmissionStatusFilter("Evaluated")}
                className={`border p-2.5 text-left transition cursor-pointer ${
                  submissionStatusFilter === "Evaluated"
                    ? "border-[#159447] bg-emerald-50"
                    : "border-slate-200/80 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-semibold text-[#159447] uppercase">Evaluated</div>
                <div className="text-[17px] font-bold text-[#159447]">{evaluatedCount}</div>
              </button>

              <button
                onClick={() => setSubmissionStatusFilter("Reviewed")}
                className={`border p-2.5 text-left transition cursor-pointer ${
                  submissionStatusFilter === "Reviewed"
                    ? "border-[#164a9c] bg-blue-50"
                    : "border-slate-200/80 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-semibold text-[#164a9c] uppercase">Reviewed</div>
                <div className="text-[17px] font-bold text-[#164a9c]">{reviewedCount}</div>
              </button>

              <button
                onClick={() => setSubmissionStatusFilter("Submitted")}
                className={`border p-2.5 text-left transition cursor-pointer ${
                  submissionStatusFilter === "Submitted"
                    ? "border-amber-600 bg-amber-50"
                    : "border-slate-200/80 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-semibold text-amber-700 uppercase">Pending Review</div>
                <div className="text-[17px] font-bold text-amber-700">{submittedCount}</div>
              </button>

              <button
                onClick={() => setSubmissionStatusFilter("Not Submitted")}
                className={`border p-2.5 text-left transition cursor-pointer ${
                  submissionStatusFilter === "Not Submitted"
                    ? "border-rose-600 bg-rose-50"
                    : "border-slate-200/80 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-semibold text-rose-600 uppercase">Not Submitted</div>
                <div className="text-[17px] font-bold text-rose-600">{notSubmittedCount}</div>
              </button>
            </div>

            <div className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Roll Number</th>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Exercise</th>
                    <th className="px-5 py-3">Submitted At</th>
                    <th className="px-5 py-3">Status / Marks</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-slate-400 text-[13px]">
                        No student records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-slate-700">
                          {sub.student_id}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {sub.student_name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          Ex {sub.exercise_number || "01"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                          {sub.submitted_at}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 text-[11px] font-semibold border ${
                              sub.status === "Evaluated"
                                ? "bg-emerald-50 text-[#159447] border-[#159447]/20"
                                : sub.status === "Reviewed"
                                ? "bg-blue-50 text-[#164a9c] border-[#164a9c]/20"
                                : sub.status === "Submitted"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {sub.status} {sub.marks ? `(${sub.marks})` : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const foundStudent = students.find((s) => s.student_id === sub.student_id);
                              if (foundStudent) setSelectedStudentForModal(foundStudent);
                            }}
                            className="text-[12px] font-medium text-[#164a9c] hover:underline cursor-pointer"
                          >
                            View Student History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-3">
              <div>
                <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">
                  Enrolled Students · MCA S3 ({students.length || 60})
                </h2>
                <p className="text-[12px] text-slate-500">
                  Batch roster for MCA S3 Computer Applications with per-exercise completion status.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex border border-slate-200 bg-white p-0.5 text-[12px] font-medium">
                  <button
                    type="button"
                    onClick={() => setStudentViewMode("roster")}
                    className={`px-3 py-1 transition cursor-pointer ${
                      studentViewMode === "roster"
                        ? "bg-[#164a9c] text-white font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Roster List
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentViewMode("matrix")}
                    className={`px-3 py-1 transition cursor-pointer ${
                      studentViewMode === "matrix"
                        ? "bg-[#164a9c] text-white font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Progress Matrix
                  </button>
                </div>

                <div className="relative w-60">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or roll number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-[12px] text-slate-700 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {studentViewMode === "roster" ? (
              <div className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Roll Number</th>
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Institutional Email</th>
                      <th className="px-5 py-3">Assigned Submissions</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr
                        key={s.id || s.student_id}
                        onClick={() => setSelectedStudentForModal(s)}
                        className="hover:bg-slate-50/60 transition cursor-pointer"
                      >
                        <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-slate-700">
                          {s.student_id}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {s.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                          {s.email}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">
                          {s.submissions_completed || "1 / 1"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#159447] border border-[#159447]/20">
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-[12px] font-semibold text-[#164a9c]">
                          View Progress →
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-200/80 bg-white shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-[#f8fafc] z-10">Roll No</th>
                      <th className="px-4 py-3 sticky left-28 bg-[#f8fafc] z-10">Student Name</th>
                      {exercises.map((ex) => (
                        <th key={ex.exercise_id || ex.id} className="px-4 py-3 text-center">
                          Ex {ex.exercise_number}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr
                        key={s.id || s.student_id}
                        onClick={() => setSelectedStudentForModal(s)}
                        className="hover:bg-slate-50/60 transition cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono text-[11.5px] font-semibold text-slate-700 sticky left-0 bg-white">
                          {s.student_id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 sticky left-28 bg-white whitespace-nowrap">
                          {s.name}
                        </td>
                        {exercises.map((ex) => {
                          const exProg = s.exercises_progress?.find(
                            (p) => p.exercise_number === ex.exercise_number
                          );
                          const st = exProg?.status || (ex.is_assigned ? "Not Submitted" : "Not Assigned");
                          const isAssigned = ex.is_assigned || ex.isAssigned;

                          return (
                            <td key={ex.exercise_id || ex.id} className="px-4 py-3 text-center">
                              {!isAssigned ? (
                                <span className="text-[10px] text-slate-300 font-mono">—</span>
                              ) : st === "Evaluated" ? (
                                <span className="inline-block bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#159447] border border-[#159447]/20">
                                  Evaluated
                                </span>
                              ) : st === "Reviewed" ? (
                                <span className="inline-block bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#164a9c] border-[#164a9c]/20">
                                  Reviewed
                                </span>
                              ) : st === "Submitted" ? (
                                <span className="inline-block bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border-amber-200">
                                  Submitted
                                </span>
                              ) : (
                                <span className="inline-block bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border-rose-200">
                                  Missing
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {s.submissions_completed || "1 / 1"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-3">
              <div>
                <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">
                  Laboratory Announcements
                </h2>
                <p className="text-[12px] text-slate-500">
                  Broadcast notices and guidelines to enrolled laboratory students.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAnnModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#164a9c] hover:bg-[#123877] text-white px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Announcement</span>
              </button>
            </div>

            <div className="border border-slate-200/80 bg-white divide-y divide-slate-100 shadow-2xs">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-slate-400">
                  No announcements have been published for this laboratory yet.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14.5px] font-bold text-slate-800">
                        {ann.title}
                      </h4>
                      <span className="text-[11px] text-slate-400">{ann.time || "Today"}</span>
                    </div>
                    {ann.content && (
                      <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
                        {ann.content}
                      </p>
                    )}
                    <div className="mt-3 text-[11px] text-slate-400">
                      Posted by <span className="font-semibold text-slate-600">{ann.author || lab?.faculty || "Faculty"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {selectedStudentForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-[650px] border border-slate-200 bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="bg-[#f0f4fa] px-2 py-0.5 text-[11px] font-bold font-mono text-[#164a9c]">
                    {selectedStudentForModal.student_id}
                  </span>
                  <h3 className="mt-1.5 text-[18px] font-bold text-slate-800">
                    {selectedStudentForModal.name}
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {selectedStudentForModal.email} · MCA S3
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Exercise Submission History
                </h4>
                <div className="border border-slate-200 divide-y divide-slate-100">
                  {exercises.map((ex) => {
                    const exProg = selectedStudentForModal.exercises_progress?.find(
                      (p) => p.exercise_number === ex.exercise_number
                    );
                    const isAssigned = ex.is_assigned || ex.isAssigned;
                    const st = exProg?.status || (isAssigned ? "Not Submitted" : "Not Assigned");

                    return (
                      <div key={ex.exercise_id || ex.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center bg-[#f0f4fa] border border-[#164a9c]/15 text-[11px] font-bold text-[#164a9c]">
                            {ex.exercise_number}
                          </span>
                          <div>
                            <div className="text-[13.5px] font-semibold text-slate-800">
                              {ex.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isAssigned ? "Assigned by Faculty" : "Upcoming (Not Assigned)"}
                            </div>
                          </div>
                        </div>

                        <div>
                          {!isAssigned ? (
                            <span className="bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Not Assigned
                            </span>
                          ) : st === "Evaluated" ? (
                            <span className="bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#159447] border border-[#159447]/20">
                              Evaluated {exProg?.marks ? `(${exProg.marks})` : ""}
                            </span>
                          ) : st === "Reviewed" ? (
                            <span className="bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#164a9c] border-[#164a9c]/20">
                              Reviewed
                            </span>
                          ) : st === "Submitted" ? (
                            <span className="bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border-amber-200">
                              Submitted
                            </span>
                          ) : (
                            <span className="bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 border-rose-200">
                              Not Submitted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 px-4 py-1.5 text-[12px] font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isAnnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-[500px] border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-[17px] font-bold text-slate-800">
                New Laboratory Announcement
              </h3>
              <p className="mt-1 text-[12px] text-slate-500">
                Publish a notice to all students enrolled in {lab?.code || normalizedId.toUpperCase()}.
              </p>

              <form onSubmit={handlePostAnnouncement} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700">
                    Announcement Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exercise 02 Submission Deadline Extended"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="mt-1.5 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700">
                    Notice Content
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Provide specific instructions, test inputs, or guidelines..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="mt-1.5 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnModalOpen(false)}
                    className="border border-slate-200 px-3.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postingAnn}
                    className="flex items-center gap-1.5 bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123877] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{postingAnn ? "Publishing..." : "Publish Announcement"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
