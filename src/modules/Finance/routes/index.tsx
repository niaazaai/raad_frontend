import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const FinanceReportPage = lazy(() => import("../features/FinanceReportPage/FinanceReportPage"));

export const FinanceRoutes: ProtectedRouteType[] = [
  {
    path: "/finance",
    component: <FinanceReportPage />,
    permission: "finance.read",
  },
];

export default FinanceRoutes;
