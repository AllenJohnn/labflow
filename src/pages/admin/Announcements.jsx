import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../../services/adminService";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  // New Announcement Form State
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "Everyone",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getAnnouncements();
        if (isMounted) {
          setAnnouncements(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading announcements:", err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Error refreshing announcements:", err);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    setSubmitting(true);
    try {
      await createAnnouncement(formData);
      setStatusMessage({
        text: "Institutional announcement published successfully.",
        type: "success",
      });
      setFormOpen(false);
      setFormData({
        title: "",
        content: "",
        audience: "Everyone",
      });
      await refreshAnnouncements();
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.detail || "Failed to publish announcement.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this announcement?")) return;

    try {
      await deleteAnnouncement(id);
      setStatusMessage({
        text: "Announcement removed.",
        type: "success",
      });
      await refreshAnnouncements();
    } catch {
      setStatusMessage({
        text: "Failed to delete announcement.",
        type: "error",
      });
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
                Institutional Announcements
              </h1>
              <p className="text-[13px] text-slate-500">
                Broadcast administrative notices to students, faculty, or the entire institution.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormOpen(!formOpen)}
              className="inline-flex items-center gap-1.5 bg-[#164a9c] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
            >
              <Plus className="h-4 w-4" />
              <span>{formOpen ? "Close Form" : "Publish Announcement"}</span>
            </button>
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

        {/* Publish Announcement Form Card */}
        {formOpen && (
          <div className="border border-slate-200/90 bg-white p-5 shadow-xs">
            <h2 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-2.5">
              Draft New Institutional Notice
            </h2>

            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Even Semester 2026 Programming Lab Term Schedule"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500">
                    Target Audience
                  </label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                  >
                    <option value="Everyone">Everyone (All Roles)</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Members Only</option>
                    <option value="MCA">MCA Department</option>
                    <option value="IMCA">IMCA Department</option>
                    <option value="CSE">CSE Department</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500">
                  Notice Content *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the full institutional announcement text..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-1 w-full border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 focus:border-[#164a9c] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="border border-slate-200 px-3.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#164a9c] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#123e85] disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="border border-slate-200/80 bg-white p-8 text-center text-[13px] text-slate-400">
              No institutional announcements published yet.
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#f0f4fa] text-[#164a9c] px-2 py-0.5 text-[11px] font-semibold border border-[#164a9c]/20">
                        Audience: {ann.audience || "Everyone"}
                      </span>
                      <span className="text-[12px] text-slate-400">
                        {ann.time || "Recently"}
                      </span>
                    </div>

                    <h3 className="mt-2 text-[16px] font-bold text-slate-800">
                      {ann.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                      {ann.content}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Published by:</span>
                      <span className="font-semibold text-slate-600">{ann.author || "System Administrator"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(ann.id)}
                    title="Remove announcement"
                    className="p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
