import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const StudentReportPage = lazy(() => import("../features/StudentReportPage/StudentReportPage"));

export const ReportRoutes: ProtectedRouteType[] = [
  {
    path: "/reports/students",
    component: <StudentReportPage />,
    permission: "course.class_students.read",
  },
];
