import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Group,
  Shield,
  NavArrowRight,
  Dollar,
  GraduationCap,
  Book,
  Calendar,
  User,
  StatsUpSquare,
} from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth";
import { useDashboardStats, useDashboardAnalytics } from "@/hooks";
import { AnalyticsLineChart, Sparkline } from "@/components/dashboard/DashboardCharts";
import { cn } from "@/lib/utils";

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (searchParams.get("from") === "google") {
      const next = new URLSearchParams(searchParams);
      next.delete("from");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: statsRes, isLoading: loadingStats } = useDashboardStats();
  const { data: analyticsRes, isLoading: loadingAnalytics } = useDashboardAnalytics();

  const stats = statsRes?.data ?? {};
  const analytics = analyticsRes?.data ?? {};

  const hasDashboardPermission = hasPermission("dashboard.read");
  const hasAnalyticsPermission =
    hasPermission("dashboard.analytics.read") || hasDashboardPermission;
  const hasUsersPermission = hasPermission("users.read");
  const hasRolesPermission = hasPermission("roles.read");

  const hasAdminDashboard =
    hasDashboardPermission || hasUsersPermission || hasRolesPermission || hasAnalyticsPermission;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004d87] via-primary to-[#0080d6] p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name || "User"}!</h1>
          <p className="mt-2 text-white/90">{"Hope you're having a great day!"}</p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -left-4 bottom-4 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {hasAdminDashboard && (
        <>
          {loadingStats ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex h-36 items-center justify-center rounded-xl border border-border bg-card"
                >
                  <Spinner className="h-8 w-8 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hasAnalyticsPermission && stats.monthly_revenue != null && (
                <RevenueStatCard
                  monthlyRevenue={stats.monthly_revenue}
                  changePercent={stats.monthly_revenue_change_percent ?? 0}
                  sparkline={stats.monthly_revenue_sparkline ?? []}
                />
              )}
              {hasAnalyticsPermission && stats.total_earnings != null && (
                <StatCard
                  title="Total Earnings"
                  value={formatCurrency(stats.total_earnings)}
                  icon={<Dollar className="h-5 w-5" />}
                  color="success"
                />
              )}
              {stats.total_users_count != null && (
                <StatCard
                  title="Total Users"
                  value={String(stats.total_users_count)}
                  icon={<Group className="h-5 w-5" />}
                  color="info"
                />
              )}
              {stats.total_students_count != null && (
                <StatCard
                  title="Total Students"
                  value={String(stats.total_students_count)}
                  icon={<GraduationCap className="h-5 w-5" />}
                  color="primary"
                />
              )}
              {stats.total_courses_count != null && (
                <StatCard
                  title="Total Courses"
                  value={String(stats.total_courses_count)}
                  icon={<Book className="h-5 w-5" />}
                  color="auxiliary"
                />
              )}
              {stats.total_classes_count != null && (
                <StatCard
                  title="Total Classes"
                  value={String(stats.total_classes_count)}
                  icon={<Calendar className="h-5 w-5" />}
                  color="warning"
                />
              )}
              {stats.total_instructors_count != null && (
                <StatCard
                  title="Total Instructors"
                  value={String(stats.total_instructors_count)}
                  icon={<User className="h-5 w-5" />}
                  color="info"
                />
              )}
              {hasUsersPermission && stats.active_users_count != null && (
                <StatCard
                  title="Active Users"
                  value={String(stats.active_users_count)}
                  icon={<StatsUpSquare className="h-5 w-5" />}
                  color="success"
                />
              )}
            </div>
          )}

          {hasAnalyticsPermission && (
            <>
              {loadingAnalytics ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex h-64 items-center justify-center rounded-xl border border-border bg-card"
                    >
                      <Spinner className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <AnalyticsLineChart
                    title="Total Earnings Over Time"
                    subtitle="Paid subscriptions — last 12 months"
                    data={analytics.earnings_over_time ?? []}
                    valuePrefix="$"
                    colorClass="text-primary"
                  />
                  <AnalyticsLineChart
                    title="Student Enrolments Over Time"
                    subtitle="New subscription records — last 12 months"
                    data={analytics.enrollments_over_time ?? []}
                    colorClass="text-success"
                  />
                  <AnalyticsLineChart
                    title="Classes Conducted Over Time"
                    subtitle="New LMS classes — last 12 months"
                    data={analytics.classes_over_time ?? []}
                    colorClass="text-auxiliary"
                  />
                  <AnalyticsLineChart
                    title="User Registrations Over Time"
                    subtitle="New user accounts — last 12 months"
                    data={analytics.user_registrations_over_time ?? []}
                    colorClass="text-info"
                  />
                </div>
              )}
            </>
          )}

          {(hasUsersPermission || hasRolesPermission) && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold text-foreground">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                {hasUsersPermission && (
                  <QuickAction
                    icon={<Group className="h-4 w-4" />}
                    label="Manage Users"
                    href="/users"
                  />
                )}
                {hasRolesPermission && (
                  <QuickAction
                    icon={<Shield className="h-4 w-4" />}
                    label="Manage Roles"
                    href="/roles"
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!hasAdminDashboard && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Welcome to the dashboard. Use the sidebar to navigate.
          </p>
        </div>
      )}
    </div>
  );
};

interface RevenueStatCardProps {
  monthlyRevenue: number;
  changePercent: number;
  sparkline: { date: string; value: number }[];
}

const RevenueStatCard = ({ monthlyRevenue, changePercent, sparkline }: RevenueStatCardProps) => {
  const isPositive = changePercent >= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Dollar className="h-5 w-5" />
        </div>
        {sparkline.length > 0 && <Sparkline data={sparkline} className="h-10 w-28 shrink-0" />}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(monthlyRevenue)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">Monthly Revenue</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          {isPositive ? "+" : ""}
          {changePercent}% vs last month
        </span>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "info" | "danger" | "auxiliary";
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    danger: "bg-danger/10 text-danger",
    auxiliary: "bg-auxiliary/10 text-auxiliary",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className={cn("rounded-lg p-2", colorClasses[color])}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{title}</p>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const QuickAction = ({ icon, label, href }: QuickActionProps) => (
  <Link
    to={href}
    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <span className="text-sm font-medium text-foreground">{label}</span>
    <NavArrowRight className="h-4 w-4 text-muted-foreground" />
  </Link>
);

export default DashboardPage;
