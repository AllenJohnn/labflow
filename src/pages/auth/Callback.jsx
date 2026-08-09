import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      login(token);

      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = JSON.parse(atob(base64));

          if (decoded.role === "admin") {
            navigate("/admin/dashboard", { replace: true });
            return;
          } else if (decoded.role === "faculty") {
            navigate("/faculty/dashboard", { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error("Error parsing callback token:", err);
      }

      navigate("/student/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8fa] text-slate-700">
      <div className="flex flex-col items-center gap-3 bg-white p-8 border border-slate-200/80 shadow-xs">
        <svg className="h-6 w-6 animate-spin text-[#164a9c]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-[13px] font-medium text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}
