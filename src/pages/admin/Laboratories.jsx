import { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ExternalLink,
  Shield,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getLaboratories,
  getFaculty,
  assignFacultyToCourse,
  updateLaboratory,
} from "../../services/adminService";

export default function Laboratories() {
  const [laboratories, setLaboratories] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [targetFacultyEmail, setTargetFacultyEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const [labs, faculty] = await Promise.all([
          getLaboratories(),
          getFaculty(),
        ]);
        if (isMounted) {
          setLaboratories(labs || []);
          setFacultyList(faculty || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading laboratories:", err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshData = async () => {
    try {
      const [labs, faculty] = await Promise.all([
        getLaboratories(),
        getFaculty(),
      ]);
      setLaboratories(labs || []);
      setFacultyList(faculty || []);
    } catch (err) {
      console.error("Error refreshing laboratory data:", err);
    }
  };

  const handleOpenReassign = (lab) => {
    setSelectedLab(lab);
    setTargetFacultyEmail(lab.faculty_email || "");
    setReassignModalOpen(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLab || !targetFacultyEmail) return;

    setSubmitting(true);
    try {
      await assignFacultyToCourse(selectedLab.course_id, targetFacultyEmail);
      setStatusMessage({
        text: `Laboratory ${selectedLab.code} successfully reassigned.`,
        type: "success",
      });
      setReassignModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to reassign laboratory.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (lab) => {
    const newStatus = !lab.is_active;
    try {
      await updateLaboratory(lab.course_id, { is_active: newStatus });
      setStatusMessage({
        text: `Laboratory ${lab.code} status updated to ${newStatus ? "Active" : "Inactive"}.`,
        type: "success",
      });
      await refreshData();
    } catch {
      setStatusMessage({
        text: "Failed to update laboratory status.",
        type: "error",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
                Institutional Laboratories & Courses
              </h1>
              <p className="text-[13px] text-slate-500">
                Institutional oversight of course syllabi, faculty allocations, and student enrollments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 border border-slate-200 bg-[#f0f4fa] p-4 text-[13px] text-slate-700">
          <Shield className="h-5 w-5 shrink-0 text-[#164a9c] mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-[#164a9c]">Institutional Role Boundary: </span>
            Administrator manages laboratory course allocation, academic settings, and faculty assignments.
            Laboratory exercise authoring, test case creation, code evaluations, and day-to-day lab workflows are reserved for teaching Faculty.
          </div>
        </div>

        {statusMessage.text && (
          <div
            className={`flex items-center justify-between p-4 text-[13px] border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-[#159447] border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage({ text: "", type: "" })}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading && laboratories.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 border border-slate-200 bg-white p-5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {laboratories.map((lab) => (
              <div
                key={lab.id || lab.course_id}
                className="flex flex-col justify-between border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-[#164a9c]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[14px] font-bold text-[#164a9c] bg-[#f0f4fa] px-2.5 py-0.5 border border-[#164a9c]/20">
                      {lab.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(lab)}
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                        lab.is_active !== false
                          ? "bg-emerald-50 text-[#159447] border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {lab.is_active !== false ? "Active Lab" : "Inactive"}
                    </button>
                  </div>

                  <h3 className="mt-3 text-[16px] font-bold text-slate-800 leading-snug">
                    {lab.name}
                  </h3>

                  <div className="mt-2 text-[12px] text-slate-500">
                    {lab.department} · {lab.semester} · {lab.total_students || 60} Enrolled
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Assigned Faculty
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center bg-[#159447] text-[11px] font-bold text-white uppercase">
                        {lab.faculty ? lab.faculty[0] : "F"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-[13px]">
                          {lab.faculty}
                        </span>
                        {lab.faculty_email && (
                          <span className="block text-[11px] text-slate-400">
                            {lab.faculty_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2">
                  {lab.syllabus_url ? (
                    <a
                      href={lab.syllabus_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 hover:text-[#164a9c]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>View Syllabus</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  ) : (
                    <span className="text-[12px] text-slate-400">No syllabus file</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenReassign(lab)}
                    className="inline-flex items-center gap-1 bg-[#164a9c] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Reassign Faculty</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {reassignModalOpen && selectedLab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Reassign Faculty Allocation
                </h3>
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleReassignSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Laboratory Course
                  </label>
                  <div className="mt-1 border border-slate-200 bg-slate-50 p-2.5 text-[13px] font-semibold text-slate-800">
                    {selectedLab.code} — {selectedLab.name}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Select New Faculty Member
                  </label>
                  <select
                    value={targetFacultyEmail}
                    onChange={(e) => setTargetFacultyEmail(e.target.value)}
                    required
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  >
                    <option value="">-- Select Faculty --</option>
                    {facultyList.map((f) => (
                      <option key={f.id || f.email} value={f.email}>
                        {f.name} ({f.department} · {f.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 leading-snug">
                  <strong>Authorization Note:</strong> The selected faculty will immediately see this lab on their dashboard. The previous faculty will have their access revoked.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReassignModalOpen(false)}
                    className="border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !targetFacultyEmail}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
