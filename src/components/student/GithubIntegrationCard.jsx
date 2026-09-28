import React, { useEffect, useState } from "react";
import { getGithubStatus, disconnectGithub } from "../../services/studentService";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";

const GithubIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.34 6.52-1.65 6.52-7.1a4.28 4.28 0 0 0-1.22-3.2 4.1 4.1 0 0 0-.12-3.1s-1-.3-3.3 1.2a11.5 11.5 0 0 0-6 0c-2.3-1.5-3.3-1.2-3.3-1.2a4.1 4.1 0 0 0-.12 3.1 4.28 4.28 0 0 0-1.22 3.2c0 5.4 3.3 6.7 6.5 7.1a4.8 4.8 0 0 0-1 3.03v4" />
  </svg>
);

export default function GithubIntegrationCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getGithubStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load GitHub status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const token = localStorage.getItem("labflow_token");
    if (!token) {
      toast.error("You must be logged in to connect GitHub.");
      return;
    }
    const baseURL = (api.defaults.baseURL || "http://localhost:8000/api/v1").replace("127.0.0.1", "localhost");
    window.location.href = `${baseURL}/auth/github/login?token=${token}`;
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      await disconnectGithub();
      setStatus({ connected: false });
      toast.success("GitHub disconnected successfully.");
    } catch (err) {
      toast.error("Failed to disconnect GitHub.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5 flex items-center justify-center min-h-[150px]">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="border border-slate-200/80 bg-white p-5 shadow-2xs">
        <h2 className="text-[14.5px] font-semibold text-slate-800 tracking-tight border-b border-slate-100 pb-2 flex items-center gap-2">
          <GithubIcon className="w-4 h-4 text-slate-700" />
          GitHub Integration
        </h2>
        
        <div className="pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-slate-100 p-2 rounded-full mt-0.5">
              <GithubIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">Connect your GitHub account</h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Link your GitHub account to automatically synchronize your laboratory submissions directly to your GitHub account.
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 bg-[#24292e] hover:bg-[#1b1f23] text-white px-4 py-2 text-[13px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#24292e] focus:ring-offset-2"
            >
              <GithubIcon className="w-4 h-4" />
              Connect GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200/80 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 className="text-[14.5px] font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          <GithubIcon className="w-4 h-4 text-slate-700" />
          GitHub Integration
        </h2>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-semibold border border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          Connected
        </span>
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Connected Account
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[14px] font-medium text-slate-800">
                @{status.username}
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-2 max-w-[400px] leading-relaxed">
              LabFlow automatically organizes your laboratory submissions into private GitHub repositories categorized by subject.
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="text-[12px] text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
