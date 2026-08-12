import { useState } from "react";
import StudentTopbar from "./StudentTopbar";
import StudentSidebar from "./StudentSidebar";

export default function StudentLayout({ profile, announcements, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-700 px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1350px] flex-col bg-white border border-slate-200/80 shadow-xs sm:min-h-[calc(100vh-48px)]">
        
        {/* Top Header */}
        <StudentTopbar
          profile={profile}
          announcements={announcements}
          onToggleMobileSidebar={() => setMobileOpen(true)}
        />

        {/* Content Area with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <StudentSidebar
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <main className="flex-1 overflow-y-auto bg-[#f8fafc]/50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1100px] space-y-6">
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-100 bg-[#fcfdfe] px-5 py-3 text-[12px] text-slate-400 sm:h-[46px] sm:px-8 sm:py-0">
          <div className="flex h-full flex-col items-center justify-between gap-1 text-center sm:flex-row sm:text-left">
            <span>Federal Institute of Science and Technology (FISAT)</span>
            <span className="font-mono text-[11px]">© 2026 LabFlow Platform</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
