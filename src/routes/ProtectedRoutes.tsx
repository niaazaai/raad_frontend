import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";
import { FinanceRoutes } from "@/modules/Finance/routes";

import { ActivityLogRoutes } from "@/modules/ActivityLog";
import { BlogRoutes } from "@/modules/Blog/routes";

const HomeRedirect = lazy(() => import("@/pages/HomeRedirect"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const CoursePlayerPage = lazy(() => import("@/modules/Course/features/CoursePlayerPage/CoursePlayerPage"));

const ProtectedRoutes: ProtectedRouteType[] = [
  {
    path: "/dashboard",
    component: <HomeRedirect />,
    permission: "",
  },
  {
    path: "/student",
    component: <StudentDashboard />,
    permission: "",
    anyRole: ["student"],
  },
  {
    path: "/learn/course/:courseId",
    component: <CoursePlayerPage />,
    permission: "",
  },
  {
    path: "/settings",
    component: <SettingsPage />,
    permission: "",
  },
  ...UserManagementRoutes,
  ...ActivityLogRoutes,
  ...BlogRoutes,
  ...FinanceRoutes,
  ...CourseModuleRoutes,
];

export default ProtectedRoutes;
