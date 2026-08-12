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
    title: "Socket Programming & TCP Handshake Analysis",
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
    title: "Symmetric Encryption using AES & DES",
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
    title: "Public Key Infrastructure & RSA Key Generation",
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
    title: "Firewall Configuration & Packet Filtering Rules",
    faculty: "Rakhi",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "dbms-ex1",
    courseId: "dbms",
    exerciseNumber: "01",
    title: "ER Diagram to Relational Schema Mapping",
    faculty: "Shidha",
    isAssigned: true,
    assignedDate: "2026-08-01",
    status: "Evaluated",
    dueDate: "2026-08-10",
  },
  {
    id: "dbms-ex2",
    courseId: "dbms",
    exerciseNumber: "02",
    title: "Complex SQL Joins & Subqueries",
    faculty: "Shidha",
    isAssigned: true,
    assignedDate: "2026-08-05",
    status: "Evaluated",
    dueDate: "2026-08-15",
  },
  {
    id: "dbms-ex3",
    courseId: "dbms",
    exerciseNumber: "03",
    title: "Database Triggers & Stored Procedures",
    faculty: "Shidha",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "dbms-ex4",
    courseId: "dbms",
    exerciseNumber: "04",
    title: "Transaction Isolation & Concurrency Control",
    faculty: "Shidha",
    isAssigned: false,
    assignedDate: null,
    status: "Not Started",
    dueDate: null,
  },
  {
    id: "dbms-ex5",
    courseId: "dbms",
    exerciseNumber: "05",
    title: "B-Tree Indexing & Query Optimization",
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
    title: "Multithreaded Producer-Consumer Problem",
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
    title: "Custom Exception Handling & File I/O Operations",
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
    title: "Java Collections Framework & Stream API",
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
    title: "Network Socket Communication with Threads",
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
    title: "GUI Event Handling using JavaFX",
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
    title: "JDBC Database Connectivity & CRUD Operations",
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
        name: "Allen John",
        email: "allenjohnjoy2004@gmail.com",
        student_id: "FIT25MCA-2008",
        department: "MCA",
        semester: 2,
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
      semester: "S2",
      exercisesCount: 1,
      totalExercises: 4,
      syllabusUrl: "/syllabi/NSA-Syllabus-Demo.pdf",
    },
    {
      id: "dbms",
      code: "DBMS",
      name: "Database Management Systems",
      faculty: "Shidha",
      department: "Computer Applications",
      semester: "S2",
      exercisesCount: 2,
      totalExercises: 5,
      syllabusUrl: "/syllabi/DBMS-Syllabus-Demo.pdf",
    },
    {
      id: "java",
      code: "JAVA",
      name: "Java Programming Laboratory",
      faculty: "Rosemary Mathew",
      department: "Computer Applications",
      semester: "S2",
      exercisesCount: 2,
      totalExercises: 6,
      syllabusUrl: "/syllabi/JAVA-Syllabus-Demo.pdf",
    },
  ];
  return cachedLabs;
};

export const getAssignedExercisesByCourse = async (courseId) => {
  const normalizedId = (courseId || "").toLowerCase();
  return ALL_EXERCISES.filter(
    (ex) => ex.courseId.toLowerCase() === normalizedId && ex.isAssigned
  );
};

export const getAllAssignedExercises = async () => {
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



