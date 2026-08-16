import { useState } from "react";
import { Link } from "react-router-dom";
import fisatLogo from "../../assets/fisat-logo.jpeg";

export default function Login() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    window.location.href = `${apiBaseUrl}/api/v1/auth/student/google/login`;
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
              <div className="text-[12px] text-slate-400">
                Programming Laboratory
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 items-center overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-12 left-10 hidden select-none font-mono text-[13px] leading-6 text-[#164a9c] opacity-[0.06] xl:block"
          >
            <div>$ labflow auth --provider google</div>
            <div>&gt; resolving student.fisat.ac.in</div>
            <div>&gt; requesting institutional credentials</div>
            <div>&gt; awaiting sign-in<span className="animate-pulse">_</span></div>
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1080px] items-center gap-10 px-6 py-10 sm:gap-16 sm:px-10 sm:py-0 lg:grid-cols-[1fr_400px]">
            <section className="max-w-[520px]">
              <p className="text-[13px] font-medium tracking-wide uppercase text-[#159447]">
                Federal Institute of Science and Technology
              </p>

              <h1 className="mt-2 font-brand text-[36px] font-semibold tracking-tight text-[#164a9c] sm:text-[42px]">
                LabFlow
              </h1>

              <div className="mt-4 h-[2px] w-10 bg-[#159447]" />

              <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-slate-500 font-normal">
                Programming laboratory management platform for students and faculty of FISAT.
              </p>
            </section>

            <section className="w-full">
              <div className="bg-[#f9fafb] border border-slate-200/70 p-6 sm:p-8">
                <h2 className="text-[19px] font-medium text-slate-800">
                  Sign in
                </h2>

                <p className="mt-1 text-[12px] text-slate-400">
                  Access your LabFlow account
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isRedirecting}
                  aria-label="Sign in with Google"
                  className="group mt-6 flex h-[48px] w-full items-center justify-between bg-white border border-slate-200 px-4 text-[13px] font-medium text-slate-700 transition hover:border-[#164a9c]/50 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#164a9c] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isRedirecting ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <svg className="h-4 w-4 animate-spin text-[#164a9c]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>Redirecting to Google...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62z"/>
                          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
                          <path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33z"/>
                          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"/>
                        </svg>

                        <span>
                          Continue with Google
                        </span>
                      </div>

                      <span className="text-[16px] text-slate-400 transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-6 text-center text-[11px] text-slate-400">
                  Use your institutional Google account to continue.
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
                <Link to="/faculty/login" className="text-slate-400 transition hover:text-[#159447] hover:underline">
                  Faculty Login
                </Link>
                <span className="text-slate-300">•</span>
                <Link to="/admin/login" className="text-slate-400 transition hover:text-[#164a9c] hover:underline">
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
