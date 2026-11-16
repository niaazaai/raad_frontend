export const REPORT_ENDPOINTS = {
  STUDENTS: "/reports/student-progress",
} as const;

export const REPORT_QUERY_KEYS = {
  students: ["reports", "student-progress"] as const,
};
