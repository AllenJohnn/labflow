import api from "./api";
import { setLocalExerciseAssigned } from "./studentService";

let cachedFacultyProfile = null;
let cachedFacultyLabs = null;
let cachedLabDetails = {};
let cachedExercises = {};
let cachedSubmissions = {};
let cachedStudents = {};
let cachedAnnouncements = {};

export const clearFacultyCache = () => {
  cachedFacultyProfile = null;
  cachedFacultyLabs = null;
  cachedLabDetails = {};
  cachedExercises = {};
  cachedSubmissions = {};
  cachedStudents = {};
  cachedAnnouncements = {};
};

export const getCachedFacultyProfile = () => cachedFacultyProfile;
export const getCachedFacultyLabs = () => cachedFacultyLabs;
export const getCachedLabDetail = (courseId) => cachedLabDetails[courseId?.toLowerCase()];
export const getCachedExercises = (courseId) => cachedExercises[courseId?.toLowerCase()];

export const getFacultyProfile = async (forceRefresh = false) => {
  if (cachedFacultyProfile && !forceRefresh) {
    return cachedFacultyProfile;
  }
  try {
    const res = await api.get("/faculty/me");
    if (res.data && res.data.data) {
      cachedFacultyProfile = res.data.data;
    }
    return cachedFacultyProfile;
  } catch {
    if (!cachedFacultyProfile) {
      cachedFacultyProfile = {
        name: "Rakhi",
        email: "faculty@fisat.ac.in",
        faculty_id: "FAC-MCA-001",
        department: "MCA",
        designation: "Associate Professor",
        assigned_labs: ["nsa"],
      };
    }
    return cachedFacultyProfile;
  }
};

export const updateFacultyProfile = async (profileData) => {
  try {
    const res = await api.put("/faculty/profile", profileData);
    if (res.data && res.data.data) {
      cachedFacultyProfile = { ...cachedFacultyProfile, ...res.data.data };
    }
  } catch {
    cachedFacultyProfile = {
      ...(cachedFacultyProfile || {}),
      ...profileData,
    };
  }
  return cachedFacultyProfile;
};

export const getFacultyLaboratories = async (forceRefresh = false) => {
  if (cachedFacultyLabs && !forceRefresh) {
    return cachedFacultyLabs;
  }
  try {
    const res = await api.get("/faculty/laboratories");
    if (res.data && res.data.data) {
      cachedFacultyLabs = res.data.data;
      return cachedFacultyLabs;
    }
  } catch (err) {
    console.error("Error fetching faculty laboratories from API:", err);
  }

  // Fallback default labs
  if (!cachedFacultyLabs) {
    cachedFacultyLabs = [
      {
        id: "nsa",
        course_id: "nsa",
        code: "NSA",
        name: "Network Security & Applications",
        faculty: "Rakhi",
        department: "Computer Applications",
        semester: "S3",
        total_students: 60,
        assigned_exercises_count: 1,
        total_exercises_count: 4,
        syllabus_url: "/syllabi/NSA_Syllabus.pdf",
      },
    ];
  }
  return cachedFacultyLabs;
};

export const getFacultyLaboratoryDetail = async (courseId, forceRefresh = false) => {
  const cid = (courseId || "nsa").toLowerCase();
  if (cachedLabDetails[cid] && !forceRefresh) {
    return cachedLabDetails[cid];
  }
  try {
    const res = await api.get(`/faculty/laboratories/${cid}`);
    if (res.data && res.data.data) {
      cachedLabDetails[cid] = res.data.data;
      return cachedLabDetails[cid];
    }
  } catch (err) {
    console.error(`Error fetching lab ${cid} detail:`, err);
  }

  // Fallback operational summary
  const defaultLab = {
    id: cid,
    course_id: cid,
    code: cid.toUpperCase(),
    name: cid === "nsa" ? "Network Security & Applications" : (cid === "adbms" || cid === "dbms" ? "Advanced Database Management Systems" : "Object Oriented Programming Lab (Java)"),
    faculty: cid === "nsa" ? "Rakhi" : (cid === "adbms" || cid === "dbms" ? "Shidha" : "Rosemary Mathew"),
    department: "MCA",
    semester: "S3",
    total_students: 60,
    syllabus_url: `/syllabi/${cid.toUpperCase()}_Syllabus.pdf`,
    assigned_count: 1,
    total_exercises: 4,
    current_exercise: {
      id: `${cid}-ex1`,
      exercise_number: "01",
      title: cid === "nsa" ? "Directory Tree & Linux File Operations" : (cid === "adbms" || cid === "dbms" ? "Relational Database Schema Design, DDL & DML" : "Classes, Objects, Constructors & Nested Classes"),
      status: "Assigned",
    },
    stats: {
      total_students: 60,
      submitted: 52,
      reviewed: 36,
      pending_review: 16,
    },
  };
  cachedLabDetails[cid] = defaultLab;
  return defaultLab;
};

export const getFacultyExercises = async (courseId, forceRefresh = false) => {
  const cid = (courseId || "nsa").toLowerCase();
  if (cachedExercises[cid] && !forceRefresh) {
    return cachedExercises[cid];
  }
  try {
    const res = await api.get(`/faculty/laboratories/${cid}/exercises`);
    if (res.data && res.data.data) {
      cachedExercises[cid] = res.data.data;
      return cachedExercises[cid];
    }
  } catch (err) {
    console.error(`Error fetching exercises for ${cid}:`, err);
  }

  // Default fallback
  const fallbackNSA = [
    {
      id: "nsa-ex1",
      exercise_id: "nsa-ex1",
      course_id: "nsa",
      exercise_number: "01",
      title: "Directory Tree & Linux File Operations",
      description: "Create hierarchical directory structure Project34, copy, merge files with cat, sort pay records, and inspect file counts using Linux utilities.",
      faculty: "Rakhi",
      is_assigned: true,
      assigned_date: "2026-08-10",
      status: "Assigned",
      due_date: "2026-08-20",
    },
    {
      id: "nsa-ex2",
      exercise_id: "nsa-ex2",
      course_id: "nsa",
      exercise_number: "02",
      title: "Advanced Linux Filters, Find & Text Processing",
      description: "Implement sort on employee records, locate largest file, parse file permissions with pipeline, rename files using find -exec, and ROT13 text encryption with tr.",
      faculty: "Rakhi",
      is_assigned: false,
      assigned_date: null,
      status: "Not Assigned",
      due_date: null,
    },
    {
      id: "nsa-ex3",
      exercise_id: "nsa-ex3",
      course_id: "nsa",
      exercise_number: "03",
      title: "Shell Scripting & Regular Expressions",
      description: "Develop shell scripts with grep/sed/awk pattern matching, conditional execution, and automated report generation.",
      faculty: "Rakhi",
      is_assigned: false,
      assigned_date: null,
      status: "Not Assigned",
      due_date: null,
    },
    {
      id: "nsa-ex4",
      exercise_id: "nsa-ex4",
      course_id: "nsa",
      exercise_number: "04",
      title: "Linux Network Administration & Socket Testing",
      description: "Configure networking utilities, packet analysis, client-server socket testing, and firewall access control rules.",
      faculty: "Rakhi",
      is_assigned: false,
      assigned_date: null,
      status: "Not Assigned",
      due_date: null,
    },
  ];
  cachedExercises[cid] = fallbackNSA;
  return fallbackNSA;
};

export const assignFacultyExercise = async (exerciseId, courseId) => {
  const cid = (courseId || "nsa").toLowerCase();
  try {
    const res = await api.patch(`/faculty/exercises/${exerciseId}/assign`);
    if (res.data && res.data.data) {
      // Invalidate and refresh cache
      delete cachedExercises[cid];
      delete cachedLabDetails[cid];
      cachedFacultyLabs = null;
      setLocalExerciseAssigned(exerciseId);
      return res.data.data;
    }
  } catch (err) {
    console.error("Error assigning exercise on backend:", err);
  }

  // Fallback optimistic update
  setLocalExerciseAssigned(exerciseId);
  if (cachedExercises[cid]) {
    cachedExercises[cid] = cachedExercises[cid].map((ex) => {
      if (ex.id === exerciseId || ex.exercise_id === exerciseId) {
        return {
          ...ex,
          is_assigned: true,
          isAssigned: true,
          assigned_date: new Date().toISOString().split("T")[0],
          status: "Assigned",
        };
      }
      return ex;
    });
  }
  if (cachedLabDetails[cid]) {
    cachedLabDetails[cid].assigned_count = (cachedLabDetails[cid].assigned_count || 1) + 1;
  }
  return { id: exerciseId, is_assigned: true };
};

export const getFacultySubmissions = async (courseId, exerciseId = null, forceRefresh = false) => {
  const cid = (courseId || "nsa").toLowerCase();
  const cacheKey = `${cid}_${exerciseId || "all"}`;
  if (cachedSubmissions[cacheKey] && !forceRefresh) {
    return cachedSubmissions[cacheKey];
  }

  try {
    const url = exerciseId
      ? `/faculty/laboratories/${cid}/submissions?exercise_id=${exerciseId}`
      : `/faculty/laboratories/${cid}/submissions`;
    const res = await api.get(url);
    if (res.data && res.data.data) {
      cachedSubmissions[cacheKey] = res.data.data;
      return cachedSubmissions[cacheKey];
    }
  } catch (err) {
    console.error("Error fetching submissions:", err);
  }

  // Demo fallback submissions
  const students = [
    { name: "Allen John", student_id: "FIT25MCA-2008", status: "Submitted", time: "Today, 10:30 AM" },
    { name: "Anjali Nair", student_id: "FIT25MCA-2001", status: "Evaluated", time: "Yesterday", marks: "19/20" },
    { name: "Basil Eldhose", student_id: "FIT25MCA-2002", status: "Reviewed", time: "Yesterday" },
    { name: "Devika R", student_id: "FIT25MCA-2003", status: "Submitted", time: "Aug 11" },
    { name: "Gokul Krishna", student_id: "FIT25MCA-2004", status: "Not Submitted", time: "—" },
    { name: "Hanna Mary", student_id: "FIT25MCA-2005", status: "Evaluated", time: "Aug 10", marks: "18/20" },
    { name: "Kiran Varma", student_id: "FIT25MCA-2006", status: "Reviewed", time: "Aug 10" },
    { name: "Meera S", student_id: "FIT25MCA-2007", status: "Submitted", time: "Aug 09" },
    { name: "Naveen Paul", student_id: "FIT25MCA-2009", status: "Not Submitted", time: "—" },
    { name: "Parvathy S", student_id: "FIT25MCA-2010", status: "Evaluated", time: "Aug 09", marks: "20/20" },
  ];

  cachedSubmissions[cacheKey] = students.map((s, idx) => ({
    id: `sub-${idx + 1}`,
    student_name: s.name,
    student_id: s.student_id,
    exercise_number: "01",
    status: s.status,
    submitted_at: s.time,
    marks: s.marks || null,
  }));

  return cachedSubmissions[cacheKey];
};

export const getFacultyStudents = async (courseId, forceRefresh = false) => {
  const cid = (courseId || "nsa").toLowerCase();
  if (cachedStudents[cid] && !forceRefresh) {
    return cachedStudents[cid];
  }
  try {
    const res = await api.get(`/faculty/laboratories/${cid}/students`);
    if (res.data && res.data.data) {
      cachedStudents[cid] = res.data.data;
      return cachedStudents[cid];
    }
  } catch (err) {
    console.error("Error fetching students roster:", err);
  }

  const roster = [
    { id: "1", student_id: "FIT25MCA-2001", name: "ADRIAN ANTONY", email: "adrian.antony@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "2", student_id: "FIT25MCA-2002", name: "AFLAH MUJEEB", email: "aflah.m@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "3", student_id: "FIT25MCA-2003", name: "AGNAN KEN RODRIGUES", email: "agnan.k@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "4", student_id: "FIT25MCA-2004", name: "AGNET JOSEPH", email: "agnet.j@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "5", student_id: "FIT25MCA-2005", name: "AKSHARA A", email: "akshara.a@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "6", student_id: "FIT25MCA-2006", name: "ALANT SAJI", email: "alant.s@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "7", student_id: "FIT25MCA-2007", name: "ALEENA DOMINIC", email: "aleena.d@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "8", student_id: "FIT25MCA-2008", name: "ALLEN JOHN JOY", email: "allenjohnjoy2004@gmail.com", submissions_completed: "2 / 2" },
    { id: "9", student_id: "FIT25MCA-2009", name: "AMRITHA", email: "amritha@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "10", student_id: "FIT25MCA-2010", name: "ANAGHA AJIDEV", email: "anagha.a@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "11", student_id: "FIT25MCA-2011", name: "ANANTHU UNNITHAN", email: "ananthu.u@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "12", student_id: "FIT25MCA-2012", name: "ANANYA T", email: "ananya.t@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "13", student_id: "FIT25MCA-2013", name: "ANGEL WILSON", email: "angel.w@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "14", student_id: "FIT25MCA-2014", name: "ANIRUDH A MENON", email: "anirudh.m@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "15", student_id: "FIT25MCA-2015", name: "ANNET PAUL T", email: "annet.p@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "16", student_id: "FIT25MCA-2016", name: "ANN MARIYA VARGHESE", email: "ann.mariya@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "17", student_id: "FIT25MCA-2017", name: "ANU MARIYA VARGHESE", email: "anu.mariya@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "18", student_id: "FIT25MCA-2018", name: "ANURAG T S", email: "anurag.ts@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "19", student_id: "FIT25MCA-2019", name: "ARATHI R NAIR", email: "arathi.r@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "20", student_id: "FIT25MCA-2020", name: "ARCHANA M", email: "archana.m@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "21", student_id: "FIT25MCA-2021", name: "ARYA A", email: "arya.a@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "22", student_id: "FIT25MCA-2022", name: "ARYA P S", email: "arya.ps@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "23", student_id: "FIT25MCA-2023", name: "ASHIL ANTO", email: "ashil.a@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "24", student_id: "FIT25MCA-2024", name: "ASWATHY G R", email: "aswathy.gr@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "25", student_id: "FIT25MCA-2025", name: "AVANY C MURALIDHARAN", email: "avany.c@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "26", student_id: "FIT25MCA-2026", name: "AYYAPPAHARI P R", email: "ayyappahari.pr@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "27", student_id: "FIT25MCA-2027", name: "BIMI GIJO", email: "bimi.g@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "28", student_id: "FIT25MCA-2028", name: "CIBIN VINCENT", email: "cibin.v@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "29", student_id: "FIT25MCA-2029", name: "GOUTHAM M", email: "goutham.m@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "30", student_id: "FIT25MCA-2030", name: "HIRAN JOY", email: "hiran.j@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "31", student_id: "FIT25MCA-2031", name: "JOEL JACOB", email: "joel.j@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "32", student_id: "FIT25MCA-2032", name: "JOSHUA J", email: "joshua.j@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "33", student_id: "FIT25MCA-2033", name: "JOSIN K RAJAN", email: "josin.k@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "34", student_id: "FIT25MCA-2034", name: "JYOTHIKA K T", email: "jyothika.kt@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "35", student_id: "FIT25MCA-2035", name: "KRISHNAGADHA U G", email: "krishnagadha.ug@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "36", student_id: "FIT25MCA-2036", name: "LAKSHMI KRISHNA K K", email: "lakshmi.kk@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "37", student_id: "FIT25MCA-2037", name: "LIYA SEBASTIAN", email: "liya.s@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "38", student_id: "FIT25MCA-2038", name: "MAHENDRAN D M", email: "mahendran.dm@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "39", student_id: "FIT25MCA-2039", name: "MERIN THOMAS", email: "merin.t@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "40", student_id: "FIT25MCA-2040", name: "MOHAMED SHADAD", email: "mohamed.s@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "41", student_id: "FIT25MCA-2041", name: "MUHAMMED IRFAN S", email: "muhammed.irfan@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "42", student_id: "FIT25MCA-2042", name: "NEEHA NAZER", email: "neeha.n@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "43", student_id: "FIT25MCA-2043", name: "NIKHIL EASHY P", email: "nikhil.ep@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "44", student_id: "FIT25MCA-2044", name: "P U ATHUL KRISHNA", email: "athul.krishna@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "45", student_id: "FIT25MCA-2045", name: "SAI KRISHNA DINESAN", email: "sai.krishna@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "46", student_id: "FIT25MCA-2046", name: "SAJANA S KUTTIYIL", email: "sajana.sk@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "47", student_id: "FIT25MCA-2047", name: "SANDRA JOSEPH", email: "sandra.j@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "48", student_id: "FIT25MCA-2048", name: "SANJAY S NAIR", email: "sanjay.sn@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "49", student_id: "FIT25MCA-2049", name: "SHANIYA SHAJU", email: "shaniya.s@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "50", student_id: "FIT25MCA-2050", name: "SHAUN PETER ANTONY", email: "shaun.pa@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "51", student_id: "FIT25MCA-2051", name: "SIVAGANGA S NAIR", email: "sivaganga.sn@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "52", student_id: "FIT25MCA-2052", name: "SIVANI R ANIL", email: "sivani.ra@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "53", student_id: "FIT25MCA-2053", name: "SREEDEV KAILAS", email: "sreedev.k@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "54", student_id: "FIT25MCA-2054", name: "STEPHANO BENNY", email: "stephano.b@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "55", student_id: "FIT25MCA-2055", name: "SUMEDHA C P", email: "sumedha.cp@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "56", student_id: "FIT25MCA-2056", name: "SURUMI K A", email: "surumi.ka@fisat.ac.in", submissions_completed: "1 / 2" },
    { id: "57", student_id: "FIT25MCA-2057", name: "TANIYA MARIA JAISON", email: "taniya.mj@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "58", student_id: "FIT25MCA-2058", name: "VARSHA JOHNSON", email: "varsha.j@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "59", student_id: "FIT25MCA-2059", name: "VISAKH S", email: "visakh.s@fisat.ac.in", submissions_completed: "2 / 2" },
    { id: "60", student_id: "FIT25MCA-2060", name: "V S HIBA", email: "hiba.vs@fisat.ac.in", submissions_completed: "2 / 2" },
  ];
  cachedStudents[cid] = roster;
  return roster;
};

export const getFacultyAnnouncements = async (courseId, forceRefresh = false) => {
  const cid = (courseId || "nsa").toLowerCase();
  if (cachedAnnouncements[cid] && !forceRefresh) {
    return cachedAnnouncements[cid];
  }
  try {
    const res = await api.get(`/faculty/laboratories/${cid}/announcements`);
    if (res.data && res.data.data) {
      cachedAnnouncements[cid] = res.data.data;
      return cachedAnnouncements[cid];
    }
  } catch (err) {
    console.error("Error fetching announcements:", err);
  }

  const fallback = [
    {
      id: "ann-1",
      title: `${cid.toUpperCase()} Lab 01 assignment is now live`,
      content: "Complete the socket programming exercise before the deadline.",
      time: "Today",
      author: "Rakhi",
    },
  ];
  cachedAnnouncements[cid] = fallback;
  return fallback;
};

export const createFacultyAnnouncement = async (courseId, announcementData) => {
  const cid = (courseId || "nsa").toLowerCase();
  try {
    const res = await api.post(`/faculty/laboratories/${cid}/announcements`, announcementData);
    if (res.data && res.data.data) {
      delete cachedAnnouncements[cid];
      return res.data.data;
    }
  } catch (err) {
    console.error("Error creating announcement on backend:", err);
  }

  const newAnn = {
    id: `ann-${Date.now()}`,
    title: announcementData.title,
    content: announcementData.content || "",
    time: "Just now",
    author: cachedFacultyProfile?.name || "Faculty Member",
  };
  if (cachedAnnouncements[cid]) {
    cachedAnnouncements[cid] = [newAnn, ...cachedAnnouncements[cid]];
  }
  return newAnn;
};

export const uploadFacultySyllabus = async (courseId, file) => {
  const cid = (courseId || "nsa").toLowerCase();
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post(`/faculty/laboratories/${cid}/syllabus`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (res.data && res.data.data) {
      delete cachedLabDetails[cid];
      cachedFacultyLabs = null;
      return res.data.data;
    }
  } catch (err) {
    console.error("Error uploading syllabus on backend:", err);
  }

  // Fallback optimistic update
  const newUrl = `/syllabi/${cid.toUpperCase()}-Syllabus.pdf?v=${Date.now()}`;
  if (cachedLabDetails[cid]) {
    cachedLabDetails[cid].syllabus_url = newUrl;
  }
  return { course_id: cid, syllabus_url: newUrl };
};

export const getFacultyAttendanceOverview = async () => {
  try {
    const res = await api.get("/faculty/attendance");
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.error("Error fetching faculty attendance overview:", err);
  }
  return null;
};

export const getFacultySessionAttendance = async (courseId, sessionDate) => {
  const cid = (courseId || "nsa").toLowerCase();
  try {
    const res = await api.get(`/faculty/attendance/${cid}/date/${sessionDate}`);
    if (res.data && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.error("Error fetching session attendance:", err);
  }
  return null;
};

export const updateStudentAttendance = async (courseId, studentId, sessionDate, newStatus) => {
  const cid = (courseId || "nsa").toLowerCase();
  try {
    const res = await api.put(`/faculty/attendance/${cid}/student/${studentId}`, {
      date: sessionDate,
      status: newStatus,
    });
    return res.data;
  } catch (err) {
    console.error("Error updating student attendance:", err);
    throw err;
  }
};

export const batchUpdateAttendance = async (courseId, sessionDate, newStatus) => {
  const cid = (courseId || "nsa").toLowerCase();
  try {
    const res = await api.post(`/faculty/attendance/${cid}/batch`, {
      date: sessionDate,
      status: newStatus,
    });
    return res.data;
  } catch (err) {
    console.error("Error batch updating attendance:", err);
    throw err;
  }
};


