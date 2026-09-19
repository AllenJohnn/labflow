import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../../services/api";
import CodeEditor from "../../components/ide/CodeEditor";
import OutputPanel from "../../components/ide/OutputPanel";
import { Play, RotateCcw, MonitorPlay, ArrowLeft } from "lucide-react";

export default function StandaloneIDE() {
  const { user } = useAuth();
  
  // State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [stdin, setStdin] = useState("");
  const [isStdinOpen, setIsStdinOpen] = useState(false);
  const [outputResult, setOutputResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mobileTab, setMobileTab] = useState("editor");

  const draftKey = `ls_scratch_${user?.id || 'guest'}`;

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setCode(saved);
    } else {
      setCode("# Welcome to the LabFlow Sandbox Playground!\n# Write your code below and hit Run.\n\nprint('Hello Sandbox!')");
    }
  }, [draftKey]);

  // Save to localStorage on change
  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    try {
      localStorage.setItem(draftKey, newCode);
    } catch (e) {
      console.warn("Could not persist sandbox draft to localStorage:", e);
    }
  }, [draftKey]);

  // Reset Sandbox
  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear your sandbox code?")) {
      const defaultCode = language === "python" ? "print('Hello Sandbox!')" : "";
      handleCodeChange(defaultCode);
      toast.info("Sandbox cleared.");
    }
  };

  // Run Code
  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before executing.");
      return;
    }

    setIsRunning(true);
    setOutputResult(null);

    if (window.innerWidth < 1024) {
      setMobileTab("output");
    }

    try {
      // POST to the new sandbox run route
      const res = await api.post("/student/sandbox/run", {
        language,
        code,
        stdin
      });
      setOutputResult(res.data?.data);
    } catch (err) {
      setOutputResult({
        status: "Execution Error",
        stdout: "",
        stderr: err.message || "Failed to communicate with execution service.",
        exitCode: 1,
        executionTime: "--",
        testResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f4f8fa] overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#164a9c] text-white px-4 sm:px-6 flex items-center justify-between shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/70 hover:text-white transition shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          
          <div className="h-4 w-px bg-white/20 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-2">
            <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 text-white/90" />
            <span className="text-[13px] sm:text-[14px] font-semibold tracking-wide text-white truncate">Code Sandbox</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRunning}
            className="bg-[#0f3470] border border-[#2b59b5] text-white text-[12px] font-semibold px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer appearance-none rounded-none"
          >
            <option value="python">Python 3</option>
            <option value="c">C (GCC)</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java</option>
          </select>
          <button
            type="button"
            onClick={handleReset}
            disabled={isRunning}
            title="Reset code"
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50 cursor-pointer rounded"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 bg-white text-[#164a9c] hover:bg-slate-100 px-3.5 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs rounded-sm"
          >
            <Play className="h-3.5 w-3.5 text-[#159447] fill-[#159447]" />
            <span>{isRunning ? "Running..." : "Run"}</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white px-2 py-1 select-none text-[12px] font-semibold">
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 py-1.5 text-center transition ${
            mobileTab === "editor" ? "text-[#164a9c] border-b-2 border-[#164a9c]" : "text-slate-500"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileTab("output")}
          className={`flex-1 py-1.5 text-center transition ${
            mobileTab === "output" ? "text-[#164a9c] border-b-2 border-[#164a9c]" : "text-slate-500"
          }`}
        >
          Output
        </button>
      </div>

      {/* Main Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
        <div className={`flex-1 flex flex-col h-full bg-[#1e1e1e] ${mobileTab !== "output" ? "flex" : "hidden lg:flex"}`}>
          <div className="flex-1 min-h-[300px]">
            <CodeEditor code={code} language={language} onChange={handleCodeChange} />
          </div>
          
          {/* Stdin Area */}
          <div className="bg-[#1e1e1e] border-t border-[#333] px-4 py-1.5 flex flex-col">
            <button
              onClick={() => setIsStdinOpen(!isStdinOpen)}
              className="text-[12px] text-slate-300 font-medium flex items-center justify-between w-full hover:text-white transition-colors"
            >
              <span>Standard Input (stdin)</span>
              <span>{isStdinOpen ? "▼" : "▶"}</span>
            </button>
            {isStdinOpen && (
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your program here..."
                className="w-full h-[80px] bg-[#1e1e1e] text-slate-300 font-mono text-[12px] p-2 mt-2 border border-[#333] focus:border-[#164a9c] focus:outline-none resize-none placeholder:text-slate-600 rounded-sm shadow-inner"
              />
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className={`w-full lg:w-[450px] shrink-0 h-full border-l border-slate-200 bg-white ${mobileTab === "output" ? "block" : "hidden lg:block"}`}>
          <OutputPanel outputResult={outputResult} isRunning={isRunning} isStandalone={true} />
        </div>
      </div>
    </div>
  );
}
