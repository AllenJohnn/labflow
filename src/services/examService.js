import api from "./api";

export const getStudentExams = async () => {
  const response = await api.get("/student/exams");
  return response.data.data || [];
};

export const getStudentExamRoom = async (examId) => {
  const response = await api.get(`/student/exams/${examId}`);
  return response.data.data;
};

export const startStudentExam = async (examId) => {
  const response = await api.post(`/student/exams/${examId}/start`);
  return response.data.data;
};

export const saveExamAnswer = async (examId, questionId, answer) => {
  const response = await api.put(`/student/exams/${examId}/answer`, {
    question_id: questionId,
    answer,
  });
  return response.data.data;
};

export const recordExamViolation = async (examId, kind) => {
  const response = await api.post(`/student/exams/${examId}/violations`, { kind });
  return response.data.data;
};

export const submitStudentExam = async (examId) => {
  const response = await api.post(`/student/exams/${examId}/submit`);
  return response.data.data;
};

export const getFacultyExams = async () => {
  const response = await api.get("/faculty/exams");
  return response.data.data || [];
};

export const createFacultyExam = async (exam) => {
  const response = await api.post("/faculty/exams", exam);
  return response.data.data;
};

export const getExamAttempts = async (examId) => {
  const response = await api.get(`/faculty/exams/${examId}/attempts`);
  return response.data.data || [];
};

export const gradeExamAttempt = async (examId, attemptId, grade) => {
  const response = await api.put(
    `/faculty/exams/${examId}/attempts/${attemptId}/grade`,
    grade,
  );
  return response.data.data;
};
