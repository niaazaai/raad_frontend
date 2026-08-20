import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";
import { ActivityLogRoutes } from "@/modules/ActivityLog";
import { FinanceRoutes } from "@/modules/Finance/routes";

const routes: {
  userManagement: ProtectedRouteType[];
  course: ProtectedRouteType[];
  activityLog: ProtectedRouteType[];
  finance: ProtectedRouteType[];
} = {
  userManagement: UserManagementRoutes,
  course: CourseModuleRoutes,
  activityLog: ActivityLogRoutes,
  finance: FinanceRoutes,
};

export default routes;
