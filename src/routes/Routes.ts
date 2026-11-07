import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";
import { ActivityLogRoutes } from "@/modules/ActivityLog";
import { FinanceRoutes } from "@/modules/Finance/routes";
import { ReportRoutes } from "@/modules/Reports";

const routes: {
  userManagement: ProtectedRouteType[];
  course: ProtectedRouteType[];
  activityLog: ProtectedRouteType[];
  finance: ProtectedRouteType[];
  reports: ProtectedRouteType[];
} = {
  userManagement: UserManagementRoutes,
  course: CourseModuleRoutes,
  activityLog: ActivityLogRoutes,
  finance: FinanceRoutes,
  reports: ReportRoutes,
};

export default routes;
