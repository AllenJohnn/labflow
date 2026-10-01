import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  BookOpen,
  MapPin,
} from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import { getStudentAttendance } from "../../services/studentService";

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDateSessions, setSelectedDateSessions] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState("2026-08-15");

  const currentMonth = new Date(2026, 7, 1);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getStudentAttendance();
        if (isMounted && res) {
          setData(res);
          const defaultDate = "2026-08-15";
          setSelectedDateStr(defaultDate);
          const matching = (res.calendar_records || []).filter((r) => r.date === defaultDate);
          setSelectedDateSessions(matching.length > 0 ? matching : (res.calendar_records?.slice(-1) || []));
        }
      } catch (err) {
        console.error("Error loading attendance:", err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getRecordsForDay = (dayNum) => {
    if (!dayNum || !data?.calendar_records) return [];
    const formatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return data.calendar_records.filter((r) => r.date === formatted);
  };

  const handleSelectDay = (dayNum) => {
    if (!dayNum) return;
    const formatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    setSelectedDateStr(formatted);
    const sessions = getRecordsForDay(dayNum);
    setSelectedDateSessions(sessions);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "absent":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const getStatusDot = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-emerald-500";
      case "absent":
        return "bg-rose-500";
      default:
        return "bg-slate-300";
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="border-b border-slate-200/80 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#164a9c] font-brand">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your laboratory attendance and session history.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Overall Attendance</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 font-brand">
                {data ? `${data.overall_percentage}%` : "--%"}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Sessions Attended</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 font-brand">
                {data ? data.total_attended : "-"}
              </span>
              <span className="text-[14px] text-slate-400 font-medium">
                / {data ? data.total_conducted : "-"}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${data?.overall_percentage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[12px] font-medium uppercase tracking-wider">Next Laboratory</span>
              <Clock className="h-4 w-4 text-[#164a9c]" />
            </div>
            <div className="mt-3">
              <span className="text-[14px] font-bold text-slate-900 line-clamp-1">
                {data ? (data.upcoming_classes?.[0]?.name || "No upcoming classes") : "Loading..."}
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500">
                <span className="font-semibold text-[#164a9c]">
                  {data?.upcoming_classes?.[0]?.day_label || "-"}
                </span>
                <span>•</span>
                <span>
                  {data?.upcoming_classes?.[0]?.start_time ? `${data?.upcoming_classes?.[0]?.start_time} - ${data?.upcoming_classes?.[0]?.end_time}` : "-"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Location: {data?.upcoming_classes?.[0]?.location || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-[16px] font-semibold text-slate-900">
              Attendance by Laboratory
            </h2>
            <p className="text-[12px] text-slate-400">
              Per-course session breakdown
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {data?.courses_breakdown?.map((course) => (
              <div
                key={course.course_id}
                className="rounded-lg border border-slate-200/70 bg-[#fafbfc] p-4 transition hover:border-[#164a9c]/30 hover:bg-white"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-[#164a9c]/10 px-2 py-0.5 text-[11px] font-semibold text-[#164a9c] font-mono">
                      {course.code}
                    </span>
                    <h3 className="mt-2 text-[14px] font-bold text-slate-900 line-clamp-1">
                      {course.name}
                    </h3>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {course.percentage}%
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-[12px] text-slate-500">
                  <span>Sessions: <strong className="text-slate-800">{course.attended} / {course.total}</strong></span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full transition-all bg-[#164a9c]"
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[14px] font-semibold transition cursor-pointer ${
              activeTab === "calendar"
                ? "border-[#164a9c] text-[#164a9c]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Monthly Attendance Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[14px] font-semibold transition cursor-pointer ${
              activeTab === "timetable"
                ? "border-[#164a9c] text-[#164a9c]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Weekly Academic Timetable</span>
          </button>
        </div>

        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-8">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-[#164a9c]" />
                  <h2 className="text-[16px] font-bold text-slate-900 font-brand">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 border-b border-slate-100 pb-2 text-center text-[12px] font-bold text-slate-400 uppercase">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {calendarDays.map((dayNum, idx) => {
                  if (!dayNum) {
                    return <div key={`empty-${idx}`} className="h-16 rounded-lg bg-slate-50/50" />;
                  }

                  const daySessions = getRecordsForDay(dayNum);
                  const formatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const isSelected = selectedDateStr === formatted;
                  const hasSessions = daySessions.length > 0;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => handleSelectDay(dayNum)}
                      className={`relative flex h-16 flex-col items-center justify-center rounded-lg border p-2 transition ${
                        isSelected
                          ? "border-[#164a9c] ring-2 ring-[#164a9c]/20 bg-blue-50/30"
                          : hasSessions
                          ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 cursor-pointer shadow-2xs"
                          : "border-slate-100 bg-slate-50/40 text-slate-300 cursor-pointer"
                      }`}
                    >
                      <span className={`text-[13px] font-bold ${hasSessions ? "text-slate-800" : "text-slate-400"}`}>
                        {dayNum}
                      </span>
                      {hasSessions && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          {daySessions.slice(0, 3).map((s, si) => (
                            <span
                              key={`dot-${si}`}
                              className={`h-2 w-2 rounded-full ${getStatusDot(s.status)}`}
                              title={`${s.code}: ${s.status}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-[12px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Absent</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#164a9c]" />
                    <span>{formatDateLabel(selectedDateStr)}</span>
                  </h3>
                </div>

                {selectedDateSessions.length > 0 ? (
                  <div className="mt-3.5 space-y-3">
                    {selectedDateSessions.map((session, sidx) => (
                      <div key={`sess-${sidx}`} className="rounded-lg bg-slate-50/80 p-3.5 border border-slate-200/60">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[12px] font-bold text-[#164a9c]">
                            {session.code}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-[13px] font-bold text-slate-900">
                          {session.course_name}
                        </h4>
                        <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{session.time}</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{session.location}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-[13px] font-medium text-slate-700">No laboratory sessions</p>
                    <p className="mt-1 text-[12px] text-slate-400">
                      No attendance recorded for this date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "timetable" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">
                  Master Weekly Laboratory Schedule
                </h2>
                <p className="text-[12px] text-slate-400">
                  Standard batch schedule for MCA Semester 3
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700 border border-slate-200">
                Official Timetable • 2026
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {data?.timetable?.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-[#fafbfc] p-4 transition hover:bg-white hover:border-[#164a9c]/40 hover:shadow-2xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-[#164a9c] text-white">
                      <span className="text-[13px] font-bold tracking-tight">{slot.day}</span>
                      <span className="text-[10px] text-blue-200 font-mono">{slot.code}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#164a9c] font-mono">
                          {slot.code}
                        </span>
                        <h3 className="text-[14px] font-bold text-slate-900">
                          {slot.name}
                        </h3>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {slot.location}
                        </span>
                        <span className="flex items-center gap-1 text-[#159447] font-medium">
                          Faculty: {slot.faculty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                      Scheduled Session
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
