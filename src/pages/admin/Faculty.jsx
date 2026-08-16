import { useState, useEffect } from "react";
import {
  UserPlus,
  Edit2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getFaculty,
  createFaculty,
  updateFaculty,
  assignFacultyToCourse,
  getLaboratories,
} from "../../services/adminService";

export default function Faculty() {
  const [facultyList, setFacultyList] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    faculty_id: "",
    department: "MCA",
    designation: "Assistant Professor",
    phone: "+91 94470 12345",
    assigned_labs: [],
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("nsa");
  const [selectedTargetFaculty, setSelectedTargetFaculty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const [facData, labData] = await Promise.all([
          getFaculty(),
          getLaboratories(),
        ]);
        if (isMounted) {
          setFacultyList(facData || []);
          setLaboratories(labData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching faculty data:", err);
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
      const [facData, labData] = await Promise.all([
        getFaculty(),
        getLaboratories(),
      ]);
      setFacultyList(facData || []);
      setLaboratories(labData || []);
    } catch (err) {
      console.error("Error refreshing faculty data:", err);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.email) return;

    setSubmitting(true);
    try {
      await createFaculty(newFaculty);
      setStatusMessage({
        text: `Faculty member ${newFaculty.name} registered successfully.`,
        type: "success",
      });
      setAddModalOpen(false);
      setNewFaculty({
        name: "",
        email: "",
        faculty_id: "",
        department: "MCA",
        designation: "Assistant Professor",
        phone: "+91 94470 12345",
        assigned_labs: [],
      });
      await refreshData();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to register faculty.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;

    setSubmitting(true);
    try {
      await updateFaculty(editingFaculty.id || editingFaculty.faculty_id, editingFaculty);
      setStatusMessage({
        text: `Faculty details for ${editingFaculty.name} updated.`,
        type: "success",
      });
      setEditModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to update faculty.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedTargetFaculty) return;

    setSubmitting(true);
    try {
      const res = await assignFacultyToCourse(selectedCourseId, selectedTargetFaculty);
      setStatusMessage({
        text: res.message || `Course ${selectedCourseId.toUpperCase()} successfully reassigned.`,
        type: "success",
      });
      setReassignModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to reassign course.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (fac) => {
    const newStatus = !fac.is_active;
    try {
      await updateFaculty(fac.id || fac.faculty_id, { is_active: newStatus });
      setStatusMessage({
        text: `Faculty ${fac.name} is now ${newStatus ? "Active" : "Inactive"}.`,
        type: "success",
      });
      await refreshData();
    } catch {
      setStatusMessage({
        text: "Failed to update faculty status.",
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
                Faculty Management & Allocation
              </h1>
              <p className="text-[13px] text-slate-500">
                Manage teaching faculty profiles, department designations, and course-to-faculty allocations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setReassignModalOpen(true)}
                className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-[#164a9c] hover:text-[#164a9c]"
              >
                <BookOpen className="h-4 w-4" />
                <span>Reassign Lab Course</span>
              </button>

              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#164a9c] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Faculty Member</span>
              </button>
            </div>
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

        <div className="overflow-x-auto border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Faculty ID</th>
                <th className="px-4 py-3">Faculty Name</th>
                <th className="px-4 py-3">Department & Designation</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Laboratories</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading faculty roster...
                  </td>
                </tr>
              ) : (
                facultyList.map((fac) => (
                  <tr key={fac.id || fac.email} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-[#164a9c]">
                      {fac.faculty_id || "FAC-MCA-001"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {fac.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{fac.designation || "Assistant Professor"}</div>
                      <div className="text-[11px] text-slate-400">{fac.department || "MCA"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fac.email}
                    </td>
                    <td className="px-4 py-3">
                      {fac.assigned_labs && fac.assigned_labs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {fac.assigned_labs.map((lab) => (
                            <span
                              key={lab}
                              className="bg-[#f0f4fa] text-[#164a9c] px-2 py-0.5 text-[11px] font-mono font-bold border border-[#164a9c]/20"
                            >
                              {String(lab).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No assigned labs</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(fac)}
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                          fac.is_active !== false
                            ? "bg-emerald-50 text-[#159447] border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {fac.is_active !== false ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaculty(fac);
                            setEditModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#164a9c] hover:text-[#164a9c]"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Register Faculty Member
                </h3>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFaculty} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rosemary Mathew"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Faculty ID
                    </label>
                    <input
                      type="text"
                      placeholder="FAC-MCA-004"
                      value={newFaculty.faculty_id}
                      onChange={(e) => setNewFaculty({ ...newFaculty, faculty_id: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 font-mono focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 94470 00000"
                      value={newFaculty.phone}
                      onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="faculty@fisat.ac.in"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Department
                    </label>
                    <select
                      value={newFaculty.department}
                      onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    >
                      <option value="MCA">MCA</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Designation
                    </label>
                    <select
                      value={newFaculty.designation}
                      onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Head of Department">Head of Department</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {submitting ? "Registering..." : "Register Faculty"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editModalOpen && editingFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Edit Faculty Details
                </h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateFaculty} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFaculty.name || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editingFaculty.email || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                    className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.department || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.designation || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
                      className="mt-1 w-full border border-slate-200 p-2 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {reassignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-bold text-slate-800">
                  Reassign Laboratory Course
                </h3>
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleReassignCourse} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Select Course / Laboratory
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none font-medium"
                  >
                    {laboratories.map((lab) => (
                      <option key={lab.course_id} value={lab.course_id}>
                        {lab.code} — {lab.name} (Current: {lab.faculty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Assign To Faculty Member
                  </label>
                  <select
                    value={selectedTargetFaculty}
                    onChange={(e) => setSelectedTargetFaculty(e.target.value)}
                    required
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  >
                    <option value="">-- Choose New Faculty Member --</option>
                    {facultyList.map((f) => (
                      <option key={f.id || f.email} value={f.email}>
                        {f.name} ({f.department} · {f.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 leading-snug">
                  <strong>Backend Security Policy:</strong> When reassigned, the chosen faculty will immediately gain management rights to this laboratory. The previous faculty will receive a 403 Forbidden error if attempting to manage it.
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
                    disabled={submitting || !selectedTargetFaculty}
                    className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                  >
                    {submitting ? "Reassigning..." : "Execute Reassignment"}
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
