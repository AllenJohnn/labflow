import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

export default function AnnouncementPopover({ announcements = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const popoverRef = useRef(null);

  const items = announcements.map((item) => ({
    ...item,
    unread: readIds.has(item.id) ? false : item.unread,
  }));

  const hasUnread = items.some((item) => item.unread);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setReadIds(new Set(announcements.map((item) => item.id)));
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Announcements"
        className="relative flex h-9 w-9 items-center justify-center rounded bg-white border border-slate-200 text-slate-600 transition hover:border-[#164a9c]/50 hover:bg-slate-50 focus:outline-none"
      >
        <Bell className="h-4 w-4 text-slate-600" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#159447] ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 rounded-none border border-slate-200/90 bg-white p-4 shadow-md text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-semibold text-slate-800">Announcements</h4>
              {hasUnread && (
                <span className="bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#159447]">
                  New
                </span>
              )}
            </div>
            {hasUnread && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[#164a9c] hover:underline focus:outline-none"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-slate-400">
                No recent announcements.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`py-3 transition ${
                    item.unread ? "bg-slate-50/70 -mx-4 px-4" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-slate-800 leading-snug">
                      {item.title}
                    </p>
                    {item.unread && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#159447]" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{item.time}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-500">{item.author}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

