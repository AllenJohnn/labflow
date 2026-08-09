import api from "./api";

export const loginStudent = async (email, password) => {
  const res = await api.post("/auth/student/login", { email, password });
  return res.data;
};

export const loginFaculty = async (email, password) => {
  const res = await api.post("/auth/faculty/login", { email, password });
  return res.data;
};

export const loginAdmin = async (email, password) => {
  const res = await api.post("/auth/admin/login", { email, password });
  return res.data;
};

export const getCurrentUserProfile = async () => {
  const res = await api.get("/auth/me");
  return res.data.data;
};
