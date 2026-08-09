import api from "./api";

export const getAdminProfile = async () => {
  const res = await api.get("/admin/me");
  return res.data.data;
};

export const getAdminStats = async () => {
  const res = await api.get("/admin/stats");
  return res.data.data;
};
