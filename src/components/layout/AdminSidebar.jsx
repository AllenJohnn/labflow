import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  UserPlus,
  Megaphone,
  ClipboardList,
  Activity,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const { logout } = useAuth();

  const navSections = [
    {
      label: null,
      items: [
        {
          name: "Dashboard",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Academic",
      items: [
        {
          name: "Classes",
          path: "/admin/classes",
          icon: GraduationCap,
        },
        {
          name: "Students",
          path: "/admin/students",
          icon: Users,
        },
        {
          name: "Faculty",
          path: "/admin/faculty",
          icon: UserCheck,
        },
        {
          name: "Laboratories",
          path: "/admin/laboratories",
          icon: BookOpen,
        },
        {
          name: "Enrollments",
          path: "/admin/enrollments",
          icon: UserPlus,
        },
      ],
    },
    {
      label: "Communication",
      items: [
        {
          name: "Announcements",
          path: "/admin/announcements",
          icon: Megaphone,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          name: "Audit Log",
          path: "/admin/audit",
          icon: ClipboardList,
        },
        {
          name: "Maintenance",
          path: "/admin/maintenance",
          icon: Activity,
        },
        {
          name: "Settings",
          path: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200/80 py-5 px-3">
      <div className="space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-100 px-2">
          <span className="font-brand text-[14px] font-semibold text-[#164a9c]">Admin Navigation</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {navSections.map((section, sIdx) => (
          <nav key={sIdx} className="space-y-0.5">
            {section.label && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all ${
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
        ))}
      </div>

      <div className="space-y-1 border-t border-slate-100 pt-4">
        <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Session
        </div>
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
      <aside className="hidden w-56 shrink-0 lg:block">
        {sidebarContent}
      </aside>

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
