import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import fisatLogo from "../../assets/fisat-logo.jpeg";
import { getFacultyProfile } from "../../services/facultyService";

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getFacultyProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error loading faculty profile:", err);
      }
    }
    loadProfile();
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
              <p className="text-[11px] font-medium text-[#159447]">Faculty Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#164a9c] text-[13px] font-bold text-white uppercase">
              {(profile?.name || user?.name || "F")[0]}
            </div>
            <div className="text-right">
              <p className="text-[13px] font-medium text-slate-700">
                {profile?.name || user?.name || "Faculty Member"}
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
              <span className="inline-block bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#159447] uppercase tracking-wide">
                Faculty Control Center
              </span>
              <h2 className="mt-2 text-[22px] font-semibold text-slate-800">
                Welcome, {profile?.name || user?.name || "Professor"}
              </h2>
              <p className="mt-1 text-[14px] text-slate-500">
                Manage lab sessions, evaluate student assignments, and track submission progress.
              </p>
            </div>
          </div>

          {/* Academic Details Cards */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">
              Faculty Profile Details
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Faculty ID</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.faculty_id || "FAC-MCA-001"}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Department</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.department || "MCA"}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Designation</span>
                <span className="mt-0.5 block text-[14px] font-semibold text-slate-800">
                  {profile?.designation || "Associate Professor"}
                </span>
              </div>

              <div className="border border-slate-100 bg-[#f8fafc] p-3.5">
                <span className="block text-[11px] font-medium text-slate-400">Role Status</span>
                <span className="mt-0.5 inline-block text-[13px] font-semibold text-[#159447]">
                  ● Active Faculty
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Modules Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-[#164a9c]/50">
            <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-[#164a9c]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="mt-3 text-[15px] font-semibold text-slate-800">Lab Experiments</h4>
            <p className="mt-1 text-[13px] text-slate-500">
              Create, edit, and publish lab assignments and problem statements.
            </p>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-[#164a9c]/50">
            <div className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-[#159447]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="mt-3 text-[15px] font-semibold text-slate-800">Evaluation & Grading</h4>
            <p className="mt-1 text-[13px] text-slate-500">
              Review code submissions, run test suites, and award marks.
            </p>
          </div>

          <div className="border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-[#164a9c]/50">
            <div className="flex h-10 w-10 items-center justify-center bg-purple-50 text-purple-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="mt-3 text-[15px] font-semibold text-slate-800">Batch Roster</h4>
            <p className="mt-1 text-[13px] text-slate-500">
              View enrolled students by department, semester, and lab section.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
