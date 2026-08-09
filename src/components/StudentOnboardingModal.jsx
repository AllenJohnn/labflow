import { useState } from "react";
import { updateStudentProfile } from "../services/studentService";

const DEPARTMENTS = [
  { code: "MCA", name: "Master of Computer Applications" },
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
];

const SEMESTERS = [
  { value: 1, label: "Semester 1 (S1)" },
  { value: 2, label: "Semester 2 (S2)" },
  { value: 3, label: "Semester 3 (S3)" },
  { value: 4, label: "Semester 4 (S4)" },
  { value: 5, label: "Semester 5 (S5)" },
  { value: 6, label: "Semester 6 (S6)" },
  { value: 7, label: "Semester 7 (S7)" },
  { value: 8, label: "Semester 8 (S8)" },
];

export default function StudentOnboardingModal({ currentProfile, onProfileSaved, isEditable = false, onClose }) {
  const [formData, setFormData] = useState({
    student_id: currentProfile?.student_id || "",
    department: currentProfile?.department || "MCA",
    semester: currentProfile?.semester || 1,
    github_username: currentProfile?.github_username || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.student_id.trim()) {
      setError("Please enter your Register / Roll Number.");
      return;
    }

    try {
      setLoading(true);
      const updated = await updateStudentProfile({
        student_id: formData.student_id.trim(),
        department: formData.department,
        semester: Number(formData.semester),
        github_username: formData.github_username.trim() || null,
      });
      onProfileSaved(updated);
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-[500px] border border-slate-200 bg-white p-6 shadow-2xl transition-all sm:p-8">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="inline-block bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#164a9c] uppercase">
              {isEditable ? "Edit Profile" : "Academic Setup"}
            </span>
            {isEditable && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none focus:outline-none"
              >
                &times;
              </button>
            )}
          </div>
          <h2 className="mt-2 text-[20px] font-semibold text-slate-800">
            {isEditable ? "Update Student Profile" : "Complete Your Profile"}
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Please enter your academic credentials for Federal Institute of Science and Technology.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xs border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-[13px]">
          <div>
            <label className="block font-medium text-slate-700">
              Register / Roll Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. FIT25MCA-2008"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="mt-1 w-full border border-slate-300 bg-white px-3.5 py-2 text-slate-800 placeholder-slate-400 transition focus:border-[#164a9c] focus:ring-1 focus:ring-[#164a9c] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="mt-1 w-full border border-slate-300 bg-white px-3.5 py-2 text-slate-800 transition focus:border-[#164a9c] focus:ring-1 focus:ring-[#164a9c] focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="mt-1 w-full border border-slate-300 bg-white px-3.5 py-2 text-slate-800 transition focus:border-[#164a9c] focus:ring-1 focus:ring-[#164a9c] focus:outline-none"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700">
              GitHub Username <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. octocat"
              value={formData.github_username}
              onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
              className="mt-1 w-full border border-slate-300 bg-white px-3.5 py-2 text-slate-800 placeholder-slate-400 transition focus:border-[#164a9c] focus:ring-1 focus:ring-[#164a9c] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Used to sync your lab repositories and code submissions.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            {isEditable && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:bg-slate-50 focus:outline-none"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#164a9c] px-5 py-2 font-medium text-white transition hover:bg-[#123b7a] disabled:opacity-50 focus:outline-none"
            >
              {loading ? "Saving Profile..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
