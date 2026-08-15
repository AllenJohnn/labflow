import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { getAuditLogs } from "../../services/adminService";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getAuditLogs({ action: actionFilter, limit: 100 });
        if (isMounted) {
          setLogs(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      log.action?.toLowerCase().includes(term) ||
      log.target?.toLowerCase().includes(term) ||
      log.summary?.toLowerCase().includes(term) ||
      log.admin?.toLowerCase().includes(term)
    );
  });

  const getActionBadgeClass = (action) => {
    const act = (action || "").toUpperCase();
    if (act.includes("MAINTENANCE")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (act.includes("CREATE")) {
      return "bg-emerald-50 text-[#159447] border-emerald-200";
    }
    if (act.includes("REASSIGN") || act.includes("ALLOCATE")) {
      return "bg-[#f0f4fa] text-[#164a9c] border-[#164a9c]/20";
    }
    if (act.includes("DELETE") || act.includes("DEACTIVATE")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
                System Audit & Accountability Log
              </h1>
              <p className="text-[13px] text-slate-500">
                Immutable trace of administrative operations, faculty reassignments, and student institutional updates.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by keyword, target, admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-[13px] text-slate-800 placeholder-slate-400 focus:border-[#164a9c] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] font-semibold text-slate-500">Filter Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 focus:border-[#164a9c] focus:outline-none"
            >
              <option value="all">All Administrative Actions</option>
              <option value="UPDATE_STUDENT">Student Updates</option>
              <option value="REASSIGN_LABORATORY_COURSE">Faculty Reassignments</option>
              <option value="CREATE_STUDENT">Student Registrations</option>
              <option value="CREATE_FACULTY">Faculty Registrations</option>
              <option value="ENABLE_MAINTENANCE">Maintenance Events</option>
              <option value="CREATE_ANNOUNCEMENT">Announcements</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Responsible Admin</th>
                <th className="px-4 py-3">Change Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records match the criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[12px] font-mono">
                      {new Date(entry.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold border ${getActionBadgeClass(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {entry.target}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[12px]">
                      {entry.admin}
                    </td>
                    <td className="px-4 py-3 text-slate-600 leading-snug">
                      {entry.summary}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
