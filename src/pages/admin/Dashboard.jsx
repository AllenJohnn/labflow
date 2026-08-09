import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import fisatLogo from "../../assets/fisat-logo.jpeg";
import { getAdminProfile, getAdminStats } from "../../services/adminService";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, statsData] = await Promise.all([
          getAdminProfile(),
          getAdminStats()
        ]);
        setProfile(profData);
        setStats(statsData);
      } catch (err) {
        console.error("Error loading admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-700">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={fisatLogo} alt="FISAT" className="h-9 w-auto" />
            <div>
              <h1 className="font-brand text-[18px] font-semibold text-[#164a9c]">LabFlow</h1>
              <p className="text-[11px] font-medium text-slate-500">System Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[13px] font-bold text-white uppercase">
              A
            </div>
            <div className="text-right">
              <p className="text-[13px] font-medium text-slate-800">
                {profile?.name || user?.name || "System Administrator"}
              </p>
              <p className="text-[11px] text-slate-400">{profile?.email || user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                Admin Console
              </span>
              <h2 className="mt-2 text-[22px] font-semibold text-slate-800">
                System Overview
              </h2>
              <p className="mt-1 text-[14px] text-slate-500">
                Federal Institute of Science and Technology — Programming Laboratory Infrastructure.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-[#159447]">
              <span className="h-2 w-2 rounded-full bg-[#159447] animate-pulse" />
              <span>{stats?.system_status || "System Operational"}</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">
              Global Platform Metrics
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-slate-100 bg-[#f8fafc] p-4">
                <span className="block text-[11px] font-medium text-slate-400">Total Registered Students</span>
                <span className="mt-1 block text-[24px] font-bold text-[#164a9c]">
                  {stats?.total_students ?? (loading ? "..." : 0)}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-4">
                <span className="block text-[11px] font-medium text-slate-400">Faculty Members</span>
                <span className="mt-1 block text-[24px] font-bold text-[#159447]">
                  {stats?.total_faculty ?? (loading ? "..." : 0)}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-4">
                <span className="block text-[11px] font-medium text-slate-400">System Administrators</span>
                <span className="mt-1 block text-[24px] font-bold text-slate-800">
                  {stats?.total_admins ?? (loading ? "..." : 0)}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-4">
                <span className="block text-[11px] font-medium text-slate-400">Active Term</span>
                <span className="mt-1 block text-[13px] font-semibold text-slate-700">
                  {stats?.active_term || "Academic Year 2025-2026"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-400">
            <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h4 className="mt-3 text-[15px] font-semibold text-slate-800">User Management</h4>
            <p className="mt-1 text-[13px] text-slate-500">
              Manage student accounts, faculty roles, and permission assignments.
            </p>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-400">
            <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="mt-3 text-[15px] font-semibold text-slate-800">Department & Labs</h4>
            <p className="mt-1 text-[13px] text-slate-500">
              Configure course tracks, lab allocations, and execution environments.
            </p>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-400">
            <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="mt-3 text-[15px] font-semibold text-slate-800">System Logs & Audit</h4>
            <p className="mt-1 text-[13px] text-slate-500">
              Inspect access logs, database state, and background code execution metrics.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
