import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Award,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../services/adminService";

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    academic_year: "2025-2026",
    default_semester: "S3",
    institution_name: "Federal Institute of Science and Technology (FISAT)",
    department: "Department of Computer Applications",
    required_attendance_threshold: 75.0,
    late_grace_period_minutes: 10,
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getSystemSettings();
        if (isMounted && data) {
          setFormData({
            academic_year: data.academic_year || "2025-2026",
            default_semester: data.default_semester || "S3",
            institution_name: data.institution_name || "Federal Institute of Science and Technology (FISAT)",
            department: data.department || "Department of Computer Applications",
            required_attendance_threshold: data.required_attendance_threshold ?? 75.0,
            late_grace_period_minutes: data.late_grace_period_minutes ?? 10,
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ text: "", type: "" });

    try {
      await updateSystemSettings(formData);
      setStatusMessage({
        text: "Institutional & attendance settings saved successfully.",
        type: "success",
      });
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to update settings.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
                Institutional Academic & Attendance Settings
              </h1>
              <p className="text-[13px] text-slate-500">
                Configure academic term parameters, required attendance thresholds, and session grace periods.
              </p>
            </div>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage.text && (
          <div
            className={`flex items-center justify-between p-3.5 text-[13px] border ${
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
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Settings Form */}
        <div className="border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-100 bg-[#fbfcfd] px-6 py-4">
            <h2 className="text-[15px] font-bold text-slate-800">
              General Academic Configuration
            </h2>
            <p className="text-[12px] text-slate-500">
              System-wide baseline for active batches and laboratory enrollment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500">
                  Active Academic Year
                </label>
                <input
                  type="text"
                  required
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500">
                  Default Active Semester
                </label>
                <select
                  value={formData.default_semester}
                  onChange={(e) => setFormData({ ...formData, default_semester: e.target.value })}
                  className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                >
                  <option value="S1">Semester 1 (S1)</option>
                  <option value="S2">Semester 2 (S2)</option>
                  <option value="S3">Semester 3 (S3)</option>
                  <option value="S4">Semester 4 (S4)</option>
                  <option value="S5">Semester 5 (S5)</option>
                  <option value="S6">Semester 6 (S6)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500">
                  Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                />
              </div>
            </div>

            {/* Attendance Configuration Section */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-[#164a9c]" />
                <span>Attendance Policies & Session Thresholds</span>
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Configured attendance requirements applied across Student, Faculty, and Admin analytics.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Required Attendance Threshold (%)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.5"
                      min="50"
                      max="100"
                      required
                      value={formData.required_attendance_threshold}
                      onChange={(e) => setFormData({ ...formData, required_attendance_threshold: parseFloat(e.target.value) || 75.0 })}
                      className="w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-semibold">%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Students below this percentage receive an Attendance Warning badge.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Late Check-in Grace Period (Minutes)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      required
                      value={formData.late_grace_period_minutes}
                      onChange={(e) => setFormData({ ...formData, late_grace_period_minutes: parseInt(e.target.value, 10) || 10 })}
                      className="w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-semibold">min</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Students checking in after this grace period are recorded as 'Late'.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-[#164a9c] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* System Diagnostics Info */}
        <div className="border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider text-slate-400 text-[11px]">
            Platform Infrastructure Metadata
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
            <div className="border border-slate-100 bg-[#f8fafc] p-3">
              <span className="block text-[10px] font-semibold uppercase text-slate-400">
                Application Version
              </span>
              <span className="mt-0.5 block font-mono text-[13px] font-semibold text-slate-800">
                LabFlow v1.0.0
              </span>
            </div>

            <div className="border border-slate-100 bg-[#f8fafc] p-3">
              <span className="block text-[10px] font-semibold uppercase text-slate-400">
                Database Engine
              </span>
              <span className="mt-0.5 block font-mono text-[13px] font-semibold text-slate-800">
                MongoDB Atlas ReplicaSet
              </span>
            </div>

            <div className="border border-slate-100 bg-[#f8fafc] p-3">
              <span className="block text-[10px] font-semibold uppercase text-slate-400">
                Execution Framework
              </span>
              <span className="mt-0.5 block font-mono text-[13px] font-semibold text-slate-800">
                FastAPI / Python 3.12
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
