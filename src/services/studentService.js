import api from "./api";

export const getStudentProfile = async () => {
  const res = await api.get("/student/me");
  return res.data.data;
};

export const updateStudentProfile = async (profileData) => {
  const res = await api.put("/student/profile", profileData);
  return res.data.data;
};
