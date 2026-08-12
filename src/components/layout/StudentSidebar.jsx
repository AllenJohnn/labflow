import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CheckSquare,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function StudentSidebar({ mobileOpen, setMobileOpen }) {
  const { logout } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      path: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Laboratories",
      path: "/student/laboratories",
      icon: BookOpen,
    },
    {
      name: "Exercises",
      path: "/student/exercises",
      icon: FileText,
    },
    {
      name: "Submissions",
      path: "/student/submissions",
      icon: CheckSquare,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200/80 py-6 px-4">
      <div className="space-y-6">
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-100">
          <span className="font-brand text-[15px] font-semibold text-[#164a9c]">Navigation</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <div className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-[#f0f4fa] text-[#164a9c] border-l-3 border-[#164a9c] font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Account Section */}
      <div className="space-y-1 border-t border-slate-100 pt-5">
        <div className="px-3 pb-2.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Account
        </div>
        <NavLink
          to="/student/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all ${
              isActive
                ? "bg-[#f0f4fa] text-[#164a9c] border-l-3 border-[#164a9c] font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <User className="h-4 w-4 shrink-0" />
          <span>Profile</span>
        </NavLink>

        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="flex w-full items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-64 max-w-full bg-white shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
