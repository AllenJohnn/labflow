import { RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import fisatLogo from "../../assets/fisat-logo.jpeg";

export default function MaintenanceScreen({
  message = "The system is temporarily unavailable while maintenance is being performed. Please try again later.",
  expectedReturn = "Shortly",
  onRefresh = () => window.location.reload(),
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8fa] p-4 text-slate-700">
      <div className="w-full max-w-lg border border-slate-200/90 bg-white p-8 shadow-xs text-center">
        <div className="flex items-center justify-center gap-3">
          <img src={fisatLogo} alt="FISAT" className="h-11 w-auto object-contain" />
          <div className="text-left leading-tight">
            <div className="flex items-baseline gap-1">
              <span className="font-brand text-[20px] font-bold tracking-tight text-[#164a9c]">
                FISAT
              </span>
              <span className="text-[12px] font-semibold text-[#159447]">
                CAMPUS
              </span>
            </div>
            <div className="font-brand text-[13px] font-semibold text-slate-600">
              LabFlow Platform
            </div>
          </div>
        </div>

        <div className="mt-8 inline-flex items-center gap-2 border border-amber-200 bg-amber-50 px-3.5 py-1 text-[12px] font-semibold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          <span>System Maintenance Active</span>
        </div>

        <h1 className="mt-4 text-[22px] font-bold text-slate-800 tracking-tight">
          Maintenance in Progress
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          {message}
        </p>

        {expectedReturn && (
          <div className="mt-5 border border-slate-100 bg-slate-50/80 p-3.5 text-[13px] text-slate-600">
            <span className="font-medium text-slate-400 block text-[11px] uppercase tracking-wider">
              Expected System Availability
            </span>
            <span className="mt-0.5 font-semibold text-[#164a9c]">
              {expectedReturn}
            </span>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
            <span>Check Availability</span>
          </button>

          <Link
            to="/admin/login"
            className="flex items-center justify-center gap-2 bg-[#164a9c] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#123e85] focus:outline-none"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Administrator Access</span>
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
          Federal Institute of Science and Technology (FISAT) — Academic Infrastructure
        </div>
      </div>
    </div>
  );
}
