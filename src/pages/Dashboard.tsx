import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Group,
  Dollar,
  GraduationCap,
  BookStack,
  Calendar,
  User,
} from "iconoir-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth";
import { useDashboardStats, useDashboardAnalytics } from "@/hooks";
import {
  Sparkline,
  EarningsBarChart,
  ServiceIncomeCostBarChart,
  EnrolmentsPieChart,
  ClassesStatusRadial,
} from "@/components/dashboard/DashboardCharts";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { useFormatMessage } from "@/i18n/useConfirmPresets";

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  const hasDashboardPermission = hasPermission("dashboard.read");
  const hasAnalyticsPermission =
    hasPermission("dashboard.analytics.read") || hasDashboardPermission;

  const hasAdminDashboard = hasDashboardPermission || hasAnalyticsPermission;

  useEffect(() => {
    if (searchParams.get("from") === "google") {
      const next = new URLSearchParams(searchParams);
      next.delete("from");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: statsRes, isLoading: loadingStats } = useDashboardStats(hasDashboardPermission);
  const { data: analyticsRes, isLoading: loadingAnalytics } = useDashboardAnalytics(
    hasAnalyticsPermission
  );

  const stats = statsRes?.data ?? {};
  const analytics = analyticsRes?.data ?? {};
  const year = analytics.year ?? new Date().getFullYear();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + " AFN";

  return (
    <div className="space-y-6">
      {hasAdminDashboard && (
        <>
          {loadingStats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                  <Skeleton className="mt-4 h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {hasAnalyticsPermission && stats.total_earnings != null && (
                <EarningsStatCard
                  totalEarnings={stats.total_earnings}
                  changePercent={stats.monthly_revenue_change_percent ?? 0}
                  sparkline={stats.monthly_revenue_sparkline ?? []}
                  formatCurrency={formatCurrency}
                />
              )}
              {stats.total_users_count != null && (
                <StatCard
                  title={t("dashboard.totalUsers")}
                  value={String(stats.total_users_count)}
                  icon={<Group className="h-5 w-5" />}
                  color="info"
                />
              )}
              {stats.total_students_count != null && (
                <StatCard
                  title={t("dashboard.totalStudents")}
                  value={String(stats.total_students_count)}
                  icon={<GraduationCap className="h-5 w-5" />}
                  color="primary"
                />
              )}
              {stats.total_courses_count != null && (
                <StatCard
                  title={t("dashboard.totalCourses")}
                  value={String(stats.total_courses_count)}
                  icon={<BookStack className="h-5 w-5" />}
                  color="auxiliary"
                />
              )}
              {stats.total_classes_count != null && (
                <StatCard
                  title={t("dashboard.totalClasses")}
                  value={String(stats.total_classes_count)}
                  icon={<Calendar className="h-5 w-5" />}
                  color="warning"
                />
              )}
              {stats.total_instructors_count != null && (
                <StatCard
                  title={t("dashboard.totalInstructors")}
                  value={String(stats.total_instructors_count)}
                  icon={<User className="h-5 w-5" />}
                  color="success"
                />
              )}
            </div>
          )}

          {hasAnalyticsPermission && (
            <>
              {loadingAnalytics ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-2 h-3 w-48" />
                      <Skeleton className="mt-6 h-40 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <EarningsBarChart
                    title={t("dashboard.classEarningsOverTime")}
                    subtitle={t("dashboard.ytdSubtitle").replace("{year}", String(year))}
                    data={analytics.class_earnings_ytd ?? []}
                  />
                  <ServiceIncomeCostBarChart
                    title={t("dashboard.serviceIncomeOverTime")}
                    subtitle={t("dashboard.ytdSubtitle").replace("{year}", String(year))}
                    income={analytics.service_income_ytd ?? []}
                    cost={analytics.service_cost_ytd ?? []}
                  />
                  <EnrolmentsPieChart
                    title={t("dashboard.enrolmentsAndRegistrations")}
                    subtitle={t("dashboard.ytdSubtitle").replace("{year}", String(year))}
                    enrollments={analytics.enrollments_ytd ?? []}
                    registrations={analytics.registrations_ytd ?? []}
                  />
                  <ClassesStatusRadial
                    title={t("dashboard.classesStatusOverTime")}
                    subtitle={t("dashboard.ytdSubtitle").replace("{year}", String(year))}
                    active={analytics.classes_status_ytd?.active ?? 0}
                    completed={analytics.classes_status_ytd?.completed ?? 0}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {!hasAdminDashboard && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">{t("dashboard.noAdminAccess")}</p>
        </div>
      )}
    </div>
  );
};

interface EarningsStatCardProps {
  totalEarnings: number;
  changePercent: number;
  sparkline: { date: string; value: number }[];
  formatCurrency: (value: number) => string;
}

const EarningsStatCard = ({
  totalEarnings,
  changePercent,
  sparkline,
  formatCurrency,
}: EarningsStatCardProps) => {
  const { t } = useTranslation();
  const fmt = useFormatMessage();
  const isPositive = changePercent >= 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/5 via-card to-card p-5">
      <div className="absolute right-4 top-4 rounded-lg bg-success/15 p-2 text-success">
        <Dollar className="h-5 w-5" />
      </div>
      <p className="pr-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("dashboard.totalEarnings")}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
        {formatCurrency(totalEarnings)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          {isPositive ? "+" : ""}
          {fmt("dashboard.monthlyChange", { percent: String(changePercent) })}
        </span>
      </div>
      {sparkline.length > 0 && (
        <div className="mt-3 border-t border-success/10 pt-3">
          <Sparkline data={sparkline} className="h-9 w-full text-success" />
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "info" | "danger" | "auxiliary";
}

const CARD_THEMES = {
  primary: {
    border: "border-primary/20",
    bg: "from-primary/8 via-card to-card",
    icon: "bg-primary/15 text-primary",
  },
  success: {
    border: "border-success/20",
    bg: "from-success/8 via-card to-card",
    icon: "bg-success/15 text-success",
  },
  warning: {
    border: "border-warning/20",
    bg: "from-warning/8 via-card to-card",
    icon: "bg-warning/15 text-warning",
  },
  info: {
    border: "border-info/20",
    bg: "from-info/8 via-card to-card",
    icon: "bg-info/15 text-info",
  },
  danger: {
    border: "border-danger/20",
    bg: "from-danger/8 via-card to-card",
    icon: "bg-danger/15 text-danger",
  },
  auxiliary: {
    border: "border-auxiliary/20",
    bg: "from-auxiliary/8 via-card to-card",
    icon: "bg-auxiliary/15 text-auxiliary",
  },
} as const;

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const theme = CARD_THEMES[color];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5",
        theme.border,
        theme.bg
      )}
    >
      <div className={cn("absolute right-4 top-4 rounded-lg p-2", theme.icon)}>{icon}</div>
      <p className="pr-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">{value}</p>
    </div>
  );
};

export default DashboardPage;
