import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import fisatLogo from "../../assets/fisat-logo.jpeg";
import { useAuth } from "../../context/AuthContext";
import { loginAdmin } from "../../services/authService";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginAdmin(email, password);
      login(res.access_token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fa] px-4 py-4 text-slate-700 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1300px] flex-col bg-white sm:min-h-[calc(100vh-48px)] border border-slate-200/80 shadow-xs">

        <header className="shrink-0 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-y-4 px-5 py-4 sm:h-[96px] sm:flex-nowrap sm:px-10 sm:py-0">
            <div className="flex items-center gap-3.5">
              <img
                src={fisatLogo}
                alt="FISAT"
                className="h-10 w-auto object-contain sm:h-[54px]"
              />

              <div className="leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[20px] font-semibold tracking-tight text-[#164a9c] sm:text-[23px]">
                    FISAT
                  </span>
                  <span className="text-[12px] font-medium text-[#159447] sm:text-[14px]">
                    CAMPUS
                  </span>
                </div>

                <div className="text-[12px] font-medium tracking-wide text-[#159447] sm:text-[13px]">
                  AUTOMATION SYSTEM
                </div>

                <div className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
                  Federal Institute of Science and Technology (FISAT)
                </div>
              </div>
            </div>

            <div className="ml-auto text-right">
              <div className="font-brand text-[18px] font-semibold tracking-tight text-[#164a9c] sm:text-[20px]">
                LabFlow
              </div>
              <div className="text-[12px] font-medium text-slate-700">
                System Administration
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 items-center overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-12 left-10 hidden select-none font-mono text-[13px] leading-6 text-slate-800 opacity-[0.06] xl:block"
          >
            <div>$ labflow auth --role admin</div>
            <div>&gt; resolving admin.fisat.ac.in</div>
            <div>&gt; verifying administrator permissions</div>
            <div>&gt; awaiting sign-in<span className="animate-pulse">_</span></div>
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1080px] items-center gap-10 px-6 py-10 sm:gap-16 sm:px-10 sm:py-0 lg:grid-cols-[1fr_400px]">
            <section className="max-w-[520px]">
              <p className="text-[13px] font-medium tracking-wide uppercase text-[#159447]">
                Federal Institute of Science and Technology
              </p>

              <h1 className="mt-2 font-brand text-[36px] font-semibold tracking-tight text-[#164a9c] sm:text-[42px]">
                Admin Console
              </h1>

              <div className="mt-4 h-[2px] w-10 bg-[#159447]" />

              <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-slate-500 font-normal">
                System management and administrative portal for LabFlow platform maintainers.
              </p>
            </section>

            <section className="w-full">
              <div className="bg-[#f9fafb] border border-slate-200/70 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-[19px] font-medium text-slate-800">
                    Administrator Sign in
                  </h2>
                  <span className="bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-800 uppercase">
                    Admin
                  </span>
                </div>

                <p className="mt-1 text-[12px] text-slate-400">
                  Restricted access for system administrators
                </p>

                {error && (
                  <div className="mt-3 border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700">Administrator Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@fisat.ac.in"
                      className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-[42px] w-full items-center justify-center bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-75"
                  >
                    {loading ? "Authenticating..." : "Sign in to Admin Console"}
                  </button>
                </form>

                <p className="mt-6 text-center text-[11px] text-slate-400">
                  Federal Institute of Science and Technology Security Policy.
                </p>
              </div>
            </section>
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-100 bg-[#fcfdfe] px-5 py-3 text-[12px] text-slate-400 sm:h-[50px] sm:px-10 sm:py-0">
          <div className="flex h-full flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
            <span>
              Federal Institute of Science and Technology
            </span>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px]">© 2026 LabFlow</span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-2 text-[11px] font-medium">
                <Link to="/login" className="text-slate-400 transition hover:text-[#164a9c] hover:underline">
                  Student Login
                </Link>
                <span className="text-slate-300">•</span>
                <Link to="/faculty/login" className="text-slate-400 transition hover:text-[#159447] hover:underline">
                  Faculty Login
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
