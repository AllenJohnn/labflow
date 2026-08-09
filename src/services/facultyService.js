import api from "./api";

export const getFacultyProfile = async () => {
  const res = await api.get("/faculty/me");
  return res.data.data;
};

export const updateFacultyProfile = async (profileData) => {
  const res = await api.put("/faculty/profile", profileData);
  return res.data.data;
};
