export const FINANCE_ENDPOINTS = {
  REPORT: "/finance/report",
  REPORT_BREAKDOWN: "/finance/report/breakdown",
  DUES: "/finance/dues",
  INVOICES: "/finance/invoices",
  TRANSACTIONS: "/finance/transactions",
  UPCOMING_INSTALLMENTS: "/finance/upcoming-installments",
  MANUAL_INVOICES: "/finance/manual-invoices",
  MANUAL_INVOICE_NEXT_NUMBER: "/finance/next-invoice-number",
  STUDENT_ENROLLMENTS: (studentId: number) => `/finance/students/${studentId}/enrollments`,
  ENROLLMENT_ACCOUNT: (enrollmentId: number) => `/finance/enrollments/${enrollmentId}`,
  ENROLLMENT_TRANSACTIONS: (enrollmentId: number) =>
    `/finance/enrollments/${enrollmentId}/transactions`,
  WRITE_OFF_RECOVERY: (classId: number, enrollmentId: number) =>
    `/lms-classes/${classId}/students/${enrollmentId}/write-off-recoveries`,
  MOVE_ENROLLMENT: (classId: number, enrollmentId: number) =>
    `/lms-classes/${classId}/students/${enrollmentId}/move`,
  ENROLLMENT_MOVES: (classId: number, enrollmentId: number) =>
    `/lms-classes/${classId}/students/${enrollmentId}/moves`,
} as const;

export const FINANCE_QUERY_KEYS = {
  all: ["finance"] as const,
  report: ["finance", "report"] as const,
  breakdown: ["finance", "breakdown"] as const,
  dues: ["finance", "dues"] as const,
  enrollmentMoves: (enrollmentId: number) => ["finance", "enrollment-moves", enrollmentId] as const,
  enrollmentAccount: (enrollmentId: number) =>
    ["finance", "enrollment-account", enrollmentId] as const,
  invoices: ["finance", "invoices"] as const,
  transactions: ["finance", "transactions"] as const,
  manualInvoices: ["finance", "service-income"] as const,
  upcomingInstallments: ["finance", "upcoming-installments"] as const,
  studentEnrollments: ["finance", "student-enrollments"] as const,
  enrollmentTransactions: (enrollmentId: number) =>
    ["finance", "enrollment-transactions", enrollmentId] as const,
} as const;

/**
 * Everything that shows money or student data. Any finance/student mutation invalidates all of these
 * so no screen keeps showing stale numbers (the class list, finance pages, dashboard, student list).
 */
export const FINANCE_RELATED_QUERY_KEYS = [
  ["finance"],
  ["lms-classes"],
  ["course", "entity", "lms-class-students"],
  ["dashboard"],
] as const;

/** Finance screens always refetch on open and treat data older than 15 s as stale. */
export const FINANCE_STALE_TIME = 15_000;
