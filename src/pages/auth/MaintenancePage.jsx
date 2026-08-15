import { useState, useEffect } from "react";
import MaintenanceScreen from "../../components/common/MaintenanceScreen";
import api from "../../services/api";

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState(() => {
    try {
      const stored = sessionStorage.getItem("labflow_maintenance");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    async function check() {
      try {
        const res = await api.get("/health");
        if (res.status === 200) {
          sessionStorage.removeItem("labflow_maintenance");
          window.location.href = "/login";
        }
      } catch (err) {
        if (isMounted && err.response?.status === 503 && err.response?.data) {
          setMaintenanceInfo(err.response.data);
        }
      }
    }
    check();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    try {
      const res = await api.get("/health");
      if (res.status === 200) {
        sessionStorage.removeItem("labflow_maintenance");
        window.location.href = "/login";
      }
    } catch (err) {
      if (err.response?.status === 503 && err.response?.data) {
        setMaintenanceInfo(err.response.data);
      }
    }
  };

  return (
    <MaintenanceScreen
      message={maintenanceInfo?.detail || "Maintenance in progress. The system is temporarily unavailable while maintenance is being performed. Please try again later."}
      expectedReturn={maintenanceInfo?.expected_return || "Shortly"}
      onRefresh={handleRefresh}
    />
  );
}
