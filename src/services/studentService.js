import api from "./api";

let cachedProfile = null;
let cachedLabs = null;
let cachedAnnouncements = null;
let cachedActivity = null;

const ALL_EXERCISES = [
  {
    id: "nsa-ex1",
    courseId: "nsa",
    exerciseNumber: "01",
    title: "Directory Tree & Linux File Operations",
    faculty: "Rakhi",
    isAssigned: true,
    assignedDate: "2026-08-10",
    status: "Not Started",
    dueDate: "2026-08-20",
  },
  {
    id: "nsa-ex2",
    courseId: "nsa",
    exerciseNumber: "02",
    title: "Advanced Linux Filters, Find & Text Processing",
    faculty: "Rakhi",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "nsa-ex3",
    courseId: "nsa",
    exerciseNumber: "03",
    title: "Shell Scripting & Regular Expressions",
    faculty: "Rakhi",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "nsa-ex4",
    courseId: "nsa",
    exerciseNumber: "04",
    title: "Linux Network Administration & Socket Testing",
    faculty: "Rakhi",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "adbms-ex1",
    courseId: "adbms",
    exerciseNumber: "01",
    title: "Relational Database Schema Design, DDL & DML",
    faculty: "Shidha",
    isAssigned: true,
    assignedDate: "2026-08-01",
    status: "Evaluated",
    dueDate: "2026-08-10",
  },
  {
    id: "adbms-ex2",
    courseId: "adbms",
    exerciseNumber: "02",
    title: "PL/SQL Programs, Cursors, Triggers & Procedures",
    faculty: "Shidha",
    isAssigned: true,
    assignedDate: "2026-08-05",
    status: "Evaluated",
    dueDate: "2026-08-15",
  },
  {
    id: "adbms-ex3",
    courseId: "adbms",
    exerciseNumber: "03",
    title: "NoSQL Database Installation & CRUD Operations",
    faculty: "Shidha",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "adbms-ex4",
    courseId: "adbms",
    exerciseNumber: "04",
    title: "NoSQL Administration, Indexing & Sharding",
    faculty: "Shidha",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "java-ex1",
    courseId: "java",
    exerciseNumber: "01",
    title: "Classes, Objects, Constructors & Nested Classes",
    faculty: "Rosemary Mathew",
    isAssigned: true,
    assignedDate: "2026-08-02",
    status: "Evaluated",
    dueDate: "2026-08-12",
  },
  {
    id: "java-ex2",
    courseId: "java",
    exerciseNumber: "02",
    title: "Arrays, String Manipulations & Array of Objects",
    faculty: "Rosemary Mathew",
    isAssigned: true,
    assignedDate: "2026-08-08",
    status: "Reviewed",
    dueDate: "2026-08-18",
  },
  {
    id: "java-ex3",
    courseId: "java",
    exerciseNumber: "03",
    title: "Inheritance, Method Overloading & Interfaces",
    faculty: "Rosemary Mathew",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "java-ex4",
    courseId: "java",
    exerciseNumber: "04",
    title: "Packages, User Exceptions, Multithreading & Collections",
    faculty: "Rosemary Mathew",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "java-ex5",
    courseId: "java",
    exerciseNumber: "05",
    title: "AWT Event Handling & 2D Graphics",
    faculty: "Rosemary Mathew",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "java-ex6",
    courseId: "java",
    exerciseNumber: "06",
    title: "File I/O Operations & Socket Programming",
    faculty: "Rosemary Mathew",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
];

export const getCachedProfile = () => cachedProfile;
export const getCachedLaboratories = () => cachedLabs;
export const getCachedAnnouncements = () => cachedAnnouncements;

export const clearStudentCache = () => {
  cachedProfile = null;
  cachedLabs = null;
  cachedAnnouncements = null;
  cachedActivity = null;
};

export const setLocalExerciseAssigned = (exerciseId) => {
  const target = ALL_EXERCISES.find(
    (e) => e.id === exerciseId || e.exercise_id === exerciseId
  );
  if (target) {
    target.isAssigned = true;
    target.assignedDate = new Date().toISOString().split("T")[0];
    target.status = "Not Started";
  }
  clearStudentCache();
};

export const getStudentProfile = async (forceRefresh = false) => {
  if (cachedProfile && !forceRefresh) {
    return cachedProfile;
  }
  try {
    const res = await api.get("/student/me");
    if (res.data && res.data.data) {
      cachedProfile = res.data.data;
    }
    return cachedProfile;
  } catch {
    if (!cachedProfile) {
      cachedProfile = {
        name: "ALLEN JOHN JOY",
        email: "allenjohnjoy2004@gmail.com",
        student_id: "FIT25MCA-2008",
        department: "MCA",
        semester: 3,
        github_username: "allenjohn",
        onboarding_completed: true,
      };
    }
    return cachedProfile;
  }
};

export const updateStudentProfile = async (profileData) => {
  const payload = { github_username: profileData.github_username };
  try {
    const res = await api.put("/student/profile", payload);
    if (res.data && res.data.data) {
      cachedProfile = { ...cachedProfile, ...res.data.data };
    }
  } catch {
    cachedProfile = {
      ...(cachedProfile || {}),
      github_username: profileData.github_username,
    };
  }
  return cachedProfile;
};

export const getStudentLaboratories = async () => {
  try {
    const res = await api.get("/student/laboratories");
    if (res.data && res.data.data && res.data.data.length > 0) {
      cachedLabs = res.data.data;
      return cachedLabs;
    }
  } catch (err) {
    void err;
  }
  if (cachedLabs) {
    return cachedLabs;
  }
  cachedLabs = [
    {
      id: "nsa",
      code: "NSA",
      name: "Network Security & Applications",
      faculty: "Rakhi",
      department: "Computer Applications",
      semester: "S3",
      exercisesCount: 1,
      totalExercises: 4,
      syllabusUrl: "/syllabi/NSA_Syllabus.pdf",
    },
    {
      id: "adbms",
      code: "ADBMS",
      name: "Advanced Database Management Systems",
      faculty: "Shidha",
      department: "Computer Applications",
      semester: "S3",
      exercisesCount: 2,
      totalExercises: 4,
      syllabusUrl: "/syllabi/ADBMS_Syllabus.pdf",
    },
    {
      id: "java",
      code: "JAVA",
      name: "Object Oriented Programming Lab (Java)",
      faculty: "Rosemary Mathew",
      department: "Computer Applications",
      semester: "S3",
      exercisesCount: 2,
      totalExercises: 6,
      syllabusUrl: "/syllabi/JAVA_Syllabus.pdf",
    },
  ];
  return cachedLabs;
};

export const getAssignedExercisesByCourse = async (courseId) => {
  const normalizedId = (courseId || "").toLowerCase();
  try {
    const res = await api.get(`/student/laboratories/${normalizedId}/exercises`);
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    void err;
  }
  return ALL_EXERCISES.filter(
    (ex) => ex.courseId.toLowerCase() === normalizedId && ex.isAssigned
  );
};

export const getAllAssignedExercises = async () => {
  try {
    const res = await api.get("/student/exercises");
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    void err;
  }
  return ALL_EXERCISES.filter((ex) => ex.isAssigned);
};

export const getStudentAnnouncements = async () => {
  if (cachedAnnouncements) {
    return cachedAnnouncements;
  }
  cachedAnnouncements = [
    {
      id: "ann-1",
      title: "NSA Lab 01 exercise assigned by Rakhi",
      time: "Today",
      author: "Rakhi",
      unread: true,
    },
    {
      id: "ann-2",
      title: "DBMS submission evaluation completed for Exercise 02",
      time: "Yesterday",
      author: "Shidha",
      unread: true,
    },
    {
      id: "ann-3",
      title: "Java Lab 02 instructions updated",
      time: "Aug 08",
      author: "Rosemary Mathew",
      unread: false,
    },
  ];
  return cachedAnnouncements;
};

export const getStudentRecentActivity = async () => {
  if (cachedActivity) {
    return cachedActivity;
  }
  cachedActivity = [
    {
      id: "act-1",
      subjectCode: "DBMS",
      title: "Exercise 02: Complex SQL Joins & Subqueries",
      timestamp: "Yesterday",
      status: "Evaluated",
    },
    {
      id: "act-2",
      subjectCode: "JAVA",
      title: "Exercise 02: Custom Exception Handling",
      timestamp: "Aug 10",
      status: "Reviewed",
    },
    {
      id: "act-3",
      subjectCode: "JAVA",
      title: "Exercise 01: Multithreaded Producer-Consumer",
      timestamp: "Aug 05",
      status: "Evaluated",
    },
  ];
  return cachedActivity;
};

export const getStudentAttendance = async () => {
  try {
    const res = await api.get("/student/attendance");
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.error("Error fetching student attendance:", err);
  }
  return null;
};

export const recordLabEntryAttendance = async (courseId) => {
  try {
    const res = await api.post(`/student/laboratories/${courseId}/enter`);
    return res.data;
  } catch (err) {
    console.log(`[Attendance] Lab entry check notice for ${courseId}:`, err.response?.data?.detail || err.message);
    return null;
  }
};

export const checkInStudentAttendance = async (courseId = null) => {
  try {
    const res = await api.post("/student/attendance/check-in", courseId ? { course_id: courseId } : {});
    return res.data;
  } catch (err) {
    console.error("Error checking in attendance:", err);
    throw err;
  }
};
