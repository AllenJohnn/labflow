import { Menu } from "lucide-react";
import fisatLogo from "../../assets/fisat-logo.jpeg";
import AnnouncementPopover from "../dashboard/AnnouncementPopover";
import { useAuth } from "../../context/AuthContext";

export default function FacultyTopbar({ profile, announcements, onToggleMobileSidebar }) {
  const { user } = useAuth();

  const displayName = profile?.name || user?.name || "Rakhi";
  const avatarUrl = profile?.profile_picture || user?.picture;

  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex h-[72px] items-center justify-between px-4 sm:px-8">
        {/* Left: FISAT & LabFlow Institutional Branding */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-[#164a9c]"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={fisatLogo}
              alt="FISAT"
              className="h-10 w-auto object-contain sm:h-[44px]"
            />
            <div className="leading-tight">
              <div className="flex items-baseline gap-1">
                <span className="font-brand text-[17px] font-bold tracking-tight text-[#164a9c] sm:text-[18px]">
                  FISAT
                </span>
                <span className="text-[11px] font-semibold text-[#159447] sm:text-[12px]">
                  CAMPUS
                </span>
              </div>
              <div className="text-[10px] font-semibold tracking-wide text-[#159447] sm:text-[11px]">
                AUTOMATION SYSTEM
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-[1px] bg-slate-200 mx-2" />

          <div className="hidden sm:block leading-tight">
            <div className="font-brand text-[15px] font-semibold tracking-tight text-[#164a9c]">
              LabFlow
            </div>
            <div className="text-[11px] font-semibold text-[#159447]">
              Faculty Portal
            </div>
          </div>
        </div>

        {/* Right Actions: Notification Bell & Faculty Avatar + Name */}
        <div className="flex items-center gap-4">
          <AnnouncementPopover announcements={announcements} />

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center bg-[#164a9c] text-[12px] font-bold text-white uppercase border border-[#164a9c]">
                {displayName[0] || "F"}
              </div>
            )}

            <span className="hidden sm:block text-[13px] font-semibold text-slate-800">
              {displayName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
