import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Search,
  Users,
  ShieldAlert,
  Award,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import FacultyLayout from "../../components/layout/FacultyLayout";
import {
  getFacultyAttendanceOverview,
  getFacultySessionAttendance,
  updateStudentAttendance,
  batchUpdateAttendance,
} from "../../services/facultyService";

export default function FacultyAttendance() {
  const [overview, setOverview] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState("nsa");
  const [selectedDate, setSelectedDate] = useState("2026-08-15");
  
  // Session Roster State
  const [sessionData, setSessionData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [updatingStudentId, setUpdatingStudentId] = useState(null);

  // Batch Confirmation Modal
  const [batchConfirmModal, setBatchConfirmModal] = useState({
    isOpen: false,
    statusToApply: "Present",
  });

  // Student History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getFacultyAttendanceOverview();
        if (isMounted && res) {
          setOverview(res);
          if (res.assigned_labs?.length > 0) {
            setSelectedCourseId(res.assigned_labs[0].course_id);
          }
          if (res.historical_dates?.length > 0) {
            setSelectedDate(res.historical_dates[res.historical_dates.length - 1]);
          }
        }
      } catch (err) {
        console.error("Error loading faculty attendance overview:", err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadSession() {
      if (!selectedCourseId || !selectedDate) return;
      try {
        setLoadingSession(true);
        const res = await getFacultySessionAttendance(selectedCourseId, selectedDate);
        if (isMounted) {
          setSessionData(res);
          setLoadingSession(false);
        }
      } catch (err) {
        console.error("Error loading session roster:", err);
        if (isMounted) setLoadingSession(false);
      }
    }
    loadSession();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, selectedDate]);

  const refreshSession = async () => {
    if (!selectedCourseId || !selectedDate) return;
    try {
      setLoadingSession(true);
      const res = await getFacultySessionAttendance(selectedCourseId, selectedDate);
      setSessionData(res);
    } catch (err) {
      console.error("Error refreshing session roster:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    setUpdatingStudentId(studentId);
    try {
      await updateStudentAttendance(selectedCourseId, studentId, selectedDate, newStatus);
      // Optimistic local update
      if (sessionData?.students) {
        const updated = sessionData.students.map((s) => {
          if (s.student_id === studentId) {
            return { ...s, status: newStatus, marked_by: "Faculty Override" };
          }
          return s;
        });
        const presentCnt = updated.filter((r) => r.status === "Present").length;
        const absentCnt = updated.filter((r) => r.status === "Absent").length;
        const lateCnt = updated.filter((r) => r.status === "Late").length;
        const excusedCnt = updated.filter((r) => r.status === "Excused").length;
        setSessionData({
          ...sessionData,
          students: updated,
          present_count: presentCnt,
          absent_count: absentCnt,
          late_count: lateCnt,
          excused_count: excusedCnt,
        });
      }
      setStatusMessage({
        text: `Student ${studentId} marked as ${newStatus}.`,
        type: "success",
      });
    } catch {
      setStatusMessage({
        text: `Failed to update attendance for ${studentId}.`,
        type: "error",
      });
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const executeBatchUpdate = async () => {
    const statusToApply = batchConfirmModal.statusToApply;
    setBatchConfirmModal({ isOpen: false, statusToApply: "Present" });
    try {
      setLoadingSession(true);
      await batchUpdateAttendance(selectedCourseId, selectedDate, statusToApply);
      await refreshSession();
      setStatusMessage({
        text: `All enrolled students marked as ${statusToApply} for session on ${selectedDate}.`,
        type: "success",
      });
    } catch {
      setStatusMessage({
        text: "Failed to apply batch attendance.",
        type: "error",
      });
    } finally {
      setLoadingSession(false);
    }
  };

  const currentLab = overview?.assigned_labs?.find((l) => l.course_id === selectedCourseId) || overview?.assigned_labs?.[0];
  const requiredThreshold = currentLab?.required_threshold ?? 75.0;

  const filteredStudents = sessionData?.students?.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no?.includes(search);
    const matchesStatus = statusFilter === "all" || s.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#159447]">
                Laboratory Academic Operations
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#164a9c] font-brand">
              Class Attendance & Roster Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review student lab session entries, record session attendance, and apply faculty overrides.
            </p>
          </div>

          {/* Course Selector Tabs */}
          <div className="flex items-center gap-2">
            {overview?.assigned_labs?.map((lab) => (
              <button
                key={lab.course_id}
                onClick={() => setSelectedCourseId(lab.course_id)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-bold transition shadow-xs cursor-pointer ${
                  selectedCourseId === lab.course_id
                    ? "bg-[#164a9c] text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {lab.code} Lab
              </button>
            ))}
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage.text && (
          <div
            className={`flex items-center justify-between rounded-lg border p-4 text-[13px] ${
              statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage({ text: "", type: "" })}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Course Analytics Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Class Average Attendance</span>
              <Award className="h-4 w-4 text-[#164a9c]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 font-brand">
                {currentLab?.avg_attendance_percentage || 93.4}%
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                Above Required Threshold
              </span>
            </div>
            <p className="mt-2 text-[12px] text-slate-400">
              {currentLab?.total_sessions || 11} laboratory sessions conducted
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Today's Presence</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-emerald-600 font-brand">
                {sessionData?.present_count ?? 56}
              </span>
              <span className="text-[14px] text-slate-400 font-medium">
                / {sessionData?.total_enrolled ?? 60} present
              </span>
            </div>
            <p className="mt-2 text-[12px] text-slate-400">
              {sessionData?.absent_count ?? 4} students absent / on leave
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Attendance Warnings</span>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-amber-600 font-brand">
                {currentLab?.shortage_count || 2}
              </span>
              <span className="text-[13px] text-slate-400 font-medium">students &lt; {requiredThreshold}%</span>
            </div>
            <p className="mt-2 text-[12px] text-slate-400">
              Below configured required threshold ({requiredThreshold}%)
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Total Enrolled</span>
              <Users className="h-4 w-4 text-[#159447]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 font-brand">
                {currentLab?.total_students || 60}
              </span>
              <span className="text-[13px] text-slate-500">MCA S3 Students</span>
            </div>
            <p className="mt-2 text-[12px] text-slate-400">
              Assigned batch roster for {currentLab?.code || "NSA"}
            </p>
          </div>
        </div>

        {/* Session Selector & Batch Action Bar */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Date Picker / Session Selection */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#164a9c]" />
                <label className="text-[13px] font-bold text-slate-700">
                  Select Session Date:
                </label>
              </div>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 shadow-2xs focus:border-[#164a9c] focus:outline-none"
              >
                {overview?.historical_dates?.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt} (Lab Session)
                  </option>
                ))}
              </select>

              <span className="text-[12px] text-slate-400">
                • {sessionData?.attendance_percentage ?? 93.3}% Session Attendance Rate
              </span>
            </div>

            {/* Quick Batch Actions with Confirmation Safeguards */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-slate-400 mr-1">Batch Actions:</span>
              <button
                onClick={() => setBatchConfirmModal({ isOpen: true, statusToApply: "Present" })}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer"
              >
                ✓ Mark All Present
              </button>
              <button
                onClick={() => setBatchConfirmModal({ isOpen: true, statusToApply: "Absent" })}
                className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-800 transition hover:bg-rose-100 cursor-pointer"
              >
                ✕ Mark All Absent
              </button>
            </div>
          </div>

          {/* Search & Filter Subbar */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student name, roll number, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#164a9c] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-400">Filter Status:</span>
              {["all", "Present", "Absent", "Late", "Excused"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition cursor-pointer ${
                    statusFilter.toLowerCase() === st.toLowerCase()
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "all" ? "All" : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Attendance Roster Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-slate-900 font-brand">
              Class Attendance Roster — {selectedDate} ({currentLab?.name})
            </h2>
            <span className="text-[12px] font-medium text-slate-500">
              Showing {filteredStudents.length} of {sessionData?.total_enrolled || 60} enrolled students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Roll</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Logged By</th>
                  <th className="px-5 py-3 text-right">Faculty Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingSession ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#164a9c]" />
                      <p className="mt-2 text-[13px]">Loading class attendance records...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No matching students found for "{search}".
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const isCurrentUpdating = updatingStudentId === st.student_id;
                    return (
                      <tr
                        key={st.student_id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-3.5 font-mono text-[12px] font-bold text-slate-600">
                          {st.roll_no}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => {
                              setSelectedStudentForHistory(st);
                              setHistoryModalOpen(true);
                            }}
                            className="font-bold text-slate-900 hover:text-[#164a9c] hover:underline text-left cursor-pointer"
                          >
                            {st.name}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">
                          {st.student_id}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              st.status === "Present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : st.status === "Late"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : st.status === "Absent"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                st.status === "Present"
                                  ? "bg-emerald-600"
                                  : st.status === "Late"
                                  ? "bg-amber-600"
                                  : st.status === "Absent"
                                  ? "bg-rose-600"
                                  : "bg-sky-600"
                              }`}
                            />
                            {st.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-slate-500">
                          {st.marked_by}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50/60 p-1">
                            <button
                              onClick={() => handleStatusChange(st.student_id, "Present")}
                              disabled={isCurrentUpdating}
                              title="Mark Present"
                              className={`rounded px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                st.status === "Present"
                                  ? "bg-emerald-600 text-white"
                                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleStatusChange(st.student_id, "Late")}
                              disabled={isCurrentUpdating}
                              title="Mark Late"
                              className={`rounded px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                st.status === "Late"
                                  ? "bg-amber-600 text-white"
                                  : "text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                              }`}
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleStatusChange(st.student_id, "Absent")}
                              disabled={isCurrentUpdating}
                              title="Mark Absent"
                              className={`rounded px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                st.status === "Absent"
                                  ? "bg-rose-600 text-white"
                                  : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleStatusChange(st.student_id, "Excused")}
                              disabled={isCurrentUpdating}
                              title="Mark Excused"
                              className={`rounded px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                st.status === "Excused"
                                  ? "bg-sky-600 text-white"
                                  : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch Action Confirmation Modal */}
        {batchConfirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    batchConfirmModal.statusToApply === "Absent"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">
                    Confirm Batch Attendance Operation
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {currentLab?.name} • {selectedDate}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-3.5 text-[13px] text-slate-700 border border-slate-200/70">
                {batchConfirmModal.statusToApply === "Absent" ? (
                  <p className="text-rose-900 font-medium">
                    ⚠️ <strong>Warning:</strong> Are you sure you want to mark all <strong>{sessionData?.total_enrolled || 60} students</strong> as <span className="text-rose-600 font-bold">Absent</span> for this session? This will record unexcused absences and update attendance logs.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to mark all <strong>{sessionData?.total_enrolled || 60} students</strong> as <span className="text-emerald-700 font-bold">Present</span> for the session on <strong>{selectedDate}</strong>?
                  </p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  onClick={() => setBatchConfirmModal({ isOpen: false, statusToApply: "Present" })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBatchUpdate}
                  className={`rounded-lg px-4 py-2 text-[13px] font-semibold text-white cursor-pointer ${
                    batchConfirmModal.statusToApply === "Absent"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-[#164a9c] hover:bg-[#123e85]"
                  }`}
                >
                  Confirm & Apply to All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Multi-Week History Modal */}
        {historyModalOpen && selectedStudentForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 font-brand">
                    {selectedStudentForHistory.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 font-mono">
                    {selectedStudentForHistory.student_id} • Roll No: {selectedStudentForHistory.roll_no}
                  </p>
                </div>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                    <span className="text-[11px] font-medium text-slate-400 uppercase">Estimated Attendance</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900 font-brand">90.9%</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200/60">
                    <span className="text-[11px] font-medium text-emerald-800 uppercase">Attendance Status</span>
                    <p className="mt-1 text-[13px] font-bold text-emerald-900">Above Required Threshold</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">
                    Recent Session Records ({currentLab?.code} Lab)
                  </h4>
                  <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                    {overview?.historical_dates?.slice(-5).map((dt, i) => (
                      <div
                        key={dt}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-[#f9fafb] p-2.5 text-[12px]"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{dt}</span>
                          <p className="text-[11px] text-slate-400">Laboratory Session {i + 1}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          Present
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setHistoryModalOpen(false)}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-900 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
