import { useState, useEffect } from "react";
import {
  Activity,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  Save,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getSystemSettings,
  setMaintenanceMode,
} from "../../services/adminService";

export default function Maintenance() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [message, setMessage] = useState(
    "Maintenance in progress. The system is temporarily unavailable while maintenance is being performed. Please try again later."
  );
  const [expectedReturn, setExpectedReturn] = useState("Shortly");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getSystemSettings();
        if (isMounted) {
          setSettings(data);
          setMaintenanceActive(Boolean(data.maintenance_mode));
          if (data.maintenance_message) setMessage(data.maintenance_message);
          if (data.expected_return) setExpectedReturn(data.expected_return);
        }
      } catch (err) {
        console.error("Error loading maintenance settings:", err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyMaintenance = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ text: "", type: "" });

    try {
      const res = await setMaintenanceMode({
        maintenance_mode: maintenanceActive,
        maintenance_message: message,
        expected_return: expectedReturn,
      });
      setSettings(res);
      setStatusMessage({
        text: `System maintenance mode has been ${
          maintenanceActive ? "ENABLED" : "DISABLED"
        }.`,
        type: "success",
      });
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to update maintenance settings.",
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
                System Availability & Maintenance Mode
              </h1>
              <p className="text-[13px] text-slate-500">
                Control application-level access gates for scheduled maintenance windows and infrastructure upgrades.
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
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live System Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                System Status
              </span>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  maintenanceActive ? "bg-amber-500 animate-ping" : "bg-[#159447]"
                }`}
              />
              <span className="text-[18px] font-bold text-slate-800">
                {maintenanceActive ? "Maintenance Active" : "Operational"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {maintenanceActive ? "Student & Faculty access gated" : "All services operational"}
            </p>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Database Engine
              </span>
              <Database className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#159447]" />
              <span className="text-[18px] font-bold text-slate-800">
                {settings?.database_status || "Connected"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              MongoDB Atlas cluster connected
            </p>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Maintenance State
              </span>
              <Power className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 text-[12px] font-bold font-mono ${
                  maintenanceActive
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                MAINTENANCE: {maintenanceActive ? "ON" : "OFF"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Persisted in database configuration
            </p>
          </div>
        </div>

        {/* Maintenance Mode Controller Form */}
        <div className="border border-slate-200/80 bg-white p-6 shadow-xs">
          <h2 className="text-[16px] font-bold text-slate-800 border-b border-slate-100 pb-3">
            Configure Maintenance Mode
          </h2>

          <form onSubmit={handleApplyMaintenance} className="mt-5 space-y-5">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between border border-slate-100 bg-[#f8fafc] p-4">
              <div>
                <span className="text-[14px] font-bold text-slate-800 block">
                  Enable Maintenance Mode Gate
                </span>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  When enabled, all student and faculty requests will return 503 Service Unavailable and display the maintenance page.
                  Administrative portal remains fully operational.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMaintenanceActive(!maintenanceActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  maintenanceActive ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    maintenanceActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Custom Maintenance Message */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500">
                Maintenance Notice Message
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the notice message displayed to students and faculty..."
                className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
              />
            </div>

            {/* Expected Return Time */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500">
                  Expected Return Availability
                </label>
                <input
                  type="text"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  placeholder="e.g. In 45 minutes, Today at 6:00 PM"
                  className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                />
              </div>

              <div className="flex items-center">
                <div className="border border-slate-100 bg-slate-50 p-3 text-[12px] text-slate-500">
                  <strong>Admin Exemption:</strong> Administrators are exempted from maintenance interception to allow system restoration.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-[#164a9c] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Apply Maintenance Settings"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
