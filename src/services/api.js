import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("labflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 503 &&
      (error.response?.data?.status === "maintenance" || error.response?.data?.maintenance_mode)
    ) {
      const currentPath = window.location.pathname;
      // Do not redirect admin routes to maintenance page (admins manage the system)
      if (!currentPath.startsWith("/admin") && currentPath !== "/maintenance") {
        sessionStorage.setItem(
          "labflow_maintenance",
          JSON.stringify(error.response.data)
        );
        window.location.href = "/maintenance";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
