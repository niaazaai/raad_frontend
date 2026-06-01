import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";

export interface DashboardSparkPoint {
  date: string;
  value: number;
}

export interface DashboardStats {
  active_users_count?: number;
  total_users_count?: number;
  total_students_count?: number;
  total_instructors_count?: number;
  total_courses_count?: number;
  total_classes_count?: number;
  total_earnings?: number;
  monthly_revenue?: number;
  monthly_revenue_change_percent?: number;
  monthly_revenue_sparkline?: DashboardSparkPoint[];
}

export interface DashboardChartPoint {
  month: string;
  label: string;
  value: number;
}

export interface DashboardAnalytics {
  earnings_over_time?: DashboardChartPoint[];
  enrollments_over_time?: DashboardChartPoint[];
  classes_over_time?: DashboardChartPoint[];
  user_registrations_over_time?: DashboardChartPoint[];
}

export function useDashboardStats() {
  return useQueryApi<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    url: "/dashboard/stats",
    method: RequestMethod.GET,
    options: {
      staleTime: 60 * 1000,
    },
  });
}

export function useDashboardAnalytics() {
  return useQueryApi<DashboardAnalytics>({
    queryKey: ["dashboard", "analytics"],
    url: "/dashboard/analytics",
    method: RequestMethod.GET,
    options: {
      staleTime: 60 * 1000,
    },
  });
}
