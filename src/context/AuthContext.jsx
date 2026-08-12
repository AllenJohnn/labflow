import { createContext, useContext, useState } from "react";
import { clearStudentCache } from "../services/studentService";

const AuthContext = createContext(null);

function parseJwtToken(token) {
  if (!token) return null;
  try {
    const payloadBase64 = token.split(".")[1];
    if (payloadBase64) {
      const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    }
  } catch (err) {
    console.error("Token decoding error:", err);
    localStorage.removeItem("labflow_token");
    clearStudentCache();
  }
  return null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("labflow_token"));
  const user = parseJwtToken(token);

  const login = (newToken) => {
    localStorage.setItem("labflow_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("labflow_token");
    clearStudentCache();
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || "student",
        loading: false,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

