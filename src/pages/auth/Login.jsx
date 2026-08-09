import fisatLogo from "../../assets/fisat-logo.jpeg";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href =
      "http://127.0.0.1:8000/api/v1/auth/student/google/login";
  };

  return (
    <div className="min-h-screen bg-[#edf8fb] px-3 py-3 text-slate-700 sm:px-5 sm:py-5">

      <div className="relative mx-auto flex min-h-[calc(100vh-24px)] max-w-[1280px] flex-col border border-[#d9e2e6] bg-white sm:min-h-[calc(100vh-40px)]">

        {/* Blueprint corner ticks */}
        <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#164a9c]" />
        <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#164a9c]" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#164a9c]" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#164a9c]" />

        {/* Header */}
        <header className="shrink-0 border-b border-[#e1e7ea]">
          <div className="flex flex-wrap items-center gap-y-3 px-4 py-4 sm:h-[92px] sm:flex-nowrap sm:px-8 sm:py-0">

            <div className="flex items-center gap-3">
              <img
                src={fisatLogo}
                alt="FISAT"
                className="h-11 w-auto object-contain sm:h-[58px]"
              />

              <div className="leading-tight">
                <div className="flex items-baseline gap-2">
                  <span className="text-[19px] font-medium tracking-tight text-[#164a9c] sm:text-[23px]">
                    FISAT
                  </span>

                  <span className="text-[11px] font-semibold text-[#159447] sm:text-[13px]">
                    CAMPUS
                  </span>
                </div>

                <div className="text-[11px] font-semibold tracking-wide text-[#159447] sm:text-[13px]">
                  AUTOMATION SYSTEM
                </div>

                <div className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">
                  Federal Institute of Science and Technology (FISAT)
                </div>
              </div>
            </div>

            <div className="ml-auto text-right">
              <div className="font-mono text-[17px] font-medium text-[#164a9c] sm:text-[20px]">
                LabFlow
              </div>

              <div className="text-[11px] text-slate-500">
                Programming Laboratory
              </div>
            </div>

          </div>
        </header>

        {/* Main */}
        <main className="relative flex flex-1 items-center overflow-hidden">

          {/* Terminal-snippet signature motif */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-10 left-6 hidden select-none font-mono text-[13px] leading-6 text-[#164a9c] opacity-[0.08] sm:block"
          >
            <div>$ labflow auth --provider google</div>
            <div>&gt; resolving student.fisat.ac.in</div>
            <div>&gt; requesting institutional credentials</div>
            <div>&gt; awaiting sign-in<span className="animate-pulse">_</span></div>
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1050px] items-center gap-10 px-5 py-10 sm:gap-20 sm:px-10 sm:py-0 lg:grid-cols-[1fr_390px]">

            {/* Left */}
            <section className="max-w-[520px]">

              <p className="text-[13px] font-medium text-[#159447]">
                FISAT
              </p>

              <h1 className="mt-2 font-mono text-[32px] font-semibold tracking-tight text-[#164a9c] sm:text-[38px]">
                LabFlow
              </h1>

              <div className="mt-4 h-[2px] w-10 bg-[#159447]" />

              <p className="mt-5 max-w-[480px] text-[14px] leading-6 text-slate-500">
                Programming laboratory management platform
                for students and faculty of the Federal Institute
                of Science and Technology.
              </p>

            </section>

            {/* Login */}
            <section className="w-full">

              <div className="border border-[#d8e0e4] bg-white">

                <div className="border-b border-[#e1e7ea] px-6 py-5">

                  <h2 className="text-[18px] font-medium text-slate-800">
                    Sign in
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Access your LabFlow account
                  </p>

                </div>

                <div className="px-6 py-6">

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex h-[44px] w-full items-center justify-between border border-[#d6dfe4] bg-white px-3 text-[12px] text-slate-700 transition hover:border-[#164a9c] hover:bg-[#fafcfd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#164a9c] group"
                  >

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

                    <span className="text-[17px] text-slate-400 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>

                  </button>

                  <p className="mt-6 text-center text-[10px] text-slate-400">
                    Use your institutional Google account to continue.
                  </p>

                </div>

              </div>

            </section>

          </div>

        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-[#e1e7ea] bg-[#fbfcfd] px-4 py-2 sm:h-[45px] sm:px-7 sm:py-0">

          <div className="flex h-full flex-col items-center gap-1 text-center text-[10px] text-slate-400 sm:flex-row sm:justify-between sm:text-left">

            <span>
              Federal Institute of Science and Technology
            </span>

            <span className="font-mono">
              Focus on Excellence
              <span className="mx-2">•</span>
              © 2026 LabFlow
            </span>

          </div>

        </footer>

      </div>

    </div>
  );
}