import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  BookStack,
  CheckCircle,
  Clock,
  CreditCard,
  Dollar,
  Flash,
  Gift,
  GraduationCap,
  Label,
  ListSelect,
  MediaVideo,
  NavArrowRight,
  NumberedListLeft,
  OpenBook,
  Prohibition,
  Sparks,
  Star,
  TaskList,
  Timer,
  UserBadgeCheck,
  UserCart,
} from "iconoir-react";
import { Button, PageBreadcrumb, Skeleton } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useFormatMessage } from "@/i18n/useConfirmPresets";
import { cn } from "@/lib/utils";
import {
  COURSE_ENTITY_REGISTRY,
  COURSE_ENTITY_SLUGS,
  type CourseEntitySlug,
} from "../../data/courseRegistry";
import { COURSE_SIDEBAR_ORDER } from "../../data/courseSidebarNav";
import { parseCourseOverviewStats, type CourseOverviewStats } from "../../data/models";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import { useCourseOverviewStats } from "../../hooks/useCourseOverviewStats";

type StatColor = "primary" | "success" | "warning" | "info" | "danger" | "auxiliary";

interface OverviewStat {
  key: keyof CourseOverviewStats;
  titleKey:
    | "course.overview.mainCategories"
    | "course.overview.subCategories"
    | "course.overview.courses"
    | "course.overview.activeCourses"
    | "course.overview.featuredCourses"
    | "course.overview.popularCourses"
    | "course.overview.newCourses"
    | "course.overview.freeCourses"
    | "course.overview.lessons"
    | "course.overview.modules"
    | "course.overview.assignments"
    | "course.overview.instructors"
    | "course.overview.plans"
    | "course.overview.subscriptions"
    | "course.overview.activeSubscriptions"
    | "course.overview.pendingSubscriptions"
    | "course.overview.inactiveSubscriptions"
    | "course.overview.expiredSubscriptions"
    | "course.overview.cancelledSubscriptions"
    | "course.overview.payingStudents";
  icon: ReactNode;
  color: StatColor;
  to: string;
}

const CATALOG_STATS: OverviewStat[] = [
  {
    key: "main_categories_count",
    titleKey: "course.overview.mainCategories",
    icon: <Label className="h-5 w-5" />,
    color: "info",
    to: "/course/main-categories",
  },
  {
    key: "sub_categories_count",
    titleKey: "course.overview.subCategories",
    icon: <ListSelect className="h-5 w-5" />,
    color: "auxiliary",
    to: "/course/sub-categories",
  },
  {
    key: "courses_count",
    titleKey: "course.overview.courses",
    icon: <OpenBook className="h-5 w-5" />,
    color: "primary",
    to: "/course/courses",
  },
  {
    key: "subscription_plans_count",
    titleKey: "course.overview.plans",
    icon: <CreditCard className="h-5 w-5" />,
    color: "warning",
    to: "/course/subscription-plans",
  },
];

const COURSE_MIX_STATS: OverviewStat[] = [
  {
    key: "active_courses_count",
    titleKey: "course.overview.activeCourses",
    icon: <BookStack className="h-5 w-5" />,
    color: "success",
    to: "/course/courses",
  },
  {
    key: "featured_courses_count",
    titleKey: "course.overview.featuredCourses",
    icon: <Star className="h-5 w-5" />,
    color: "warning",
    to: "/course/courses",
  },
  {
    key: "popular_courses_count",
    titleKey: "course.overview.popularCourses",
    icon: <Sparks className="h-5 w-5" />,
    color: "auxiliary",
    to: "/course/courses",
  },
  {
    key: "new_courses_count",
    titleKey: "course.overview.newCourses",
    icon: <Flash className="h-5 w-5" />,
    color: "info",
    to: "/course/courses",
  },
  {
    key: "free_courses_count",
    titleKey: "course.overview.freeCourses",
    icon: <Gift className="h-5 w-5" />,
    color: "success",
    to: "/course/courses",
  },
];

const CONTENT_STATS: OverviewStat[] = [
  {
    key: "lessons_count",
    titleKey: "course.overview.lessons",
    icon: <MediaVideo className="h-5 w-5" />,
    color: "primary",
    to: "/course/lessons",
  },
  {
    key: "modules_count",
    titleKey: "course.overview.modules",
    icon: <NumberedListLeft className="h-5 w-5" />,
    color: "info",
    to: "/course/course-faasls",
  },
  {
    key: "assignments_count",
    titleKey: "course.overview.assignments",
    icon: <TaskList className="h-5 w-5" />,
    color: "warning",
    to: "/course/assignments",
  },
  {
    key: "instructors_count",
    titleKey: "course.overview.instructors",
    icon: <UserBadgeCheck className="h-5 w-5" />,
    color: "success",
    to: "/course/instructors",
  },
];

const COMMERCE_STATS: OverviewStat[] = [
  {
    key: "paying_students_count",
    titleKey: "course.overview.payingStudents",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "primary",
    to: "/course/student-subscriptions",
  },
  {
    key: "active_subscriptions_count",
    titleKey: "course.overview.activeSubscriptions",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "success",
    to: "/course/student-subscriptions",
  },
  {
    key: "pending_subscriptions_count",
    titleKey: "course.overview.pendingSubscriptions",
    icon: <Clock className="h-5 w-5" />,
    color: "warning",
    to: "/course/student-subscriptions",
  },
];

const PIPELINE_STATS: OverviewStat[] = [
  {
    key: "subscriptions_count",
    titleKey: "course.overview.subscriptions",
    icon: <UserCart className="h-5 w-5" />,
    color: "info",
    to: "/course/student-subscriptions",
  },
  {
    key: "inactive_subscriptions_count",
    titleKey: "course.overview.inactiveSubscriptions",
    icon: <Archive className="h-5 w-5" />,
    color: "auxiliary",
    to: "/course/student-subscriptions",
  },
  {
    key: "expired_subscriptions_count",
    titleKey: "course.overview.expiredSubscriptions",
    icon: <Timer className="h-5 w-5" />,
    color: "danger",
    to: "/course/student-subscriptions",
  },
  {
    key: "cancelled_subscriptions_count",
    titleKey: "course.overview.cancelledSubscriptions",
    icon: <Prohibition className="h-5 w-5" />,
    color: "danger",
    to: "/course/student-subscriptions",
  },
];

const CourseHub = () => {
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription, t } = useCourseI18n();
  const fmt = useFormatMessage();
  const { data, isLoading, isError, refetch } = useCourseOverviewStats(true);
  const stats = parseCourseOverviewStats(data?.data);

  const visible = COURSE_ENTITY_SLUGS.filter(
    (slug) =>
      COURSE_SIDEBAR_ORDER.includes(slug) && hasPermission(COURSE_ENTITY_REGISTRY[slug].permission)
  );

  const formatCount = (value: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

  const formatMoney = (value: number) =>
    `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value)} ${stats.currency ?? "AFN"}`;

  const visibleStats = (items: OverviewStat[]) =>
    items.filter((item) => typeof stats[item.key] === "number");

  const commerceItems = visibleStats(COMMERCE_STATS);
  const catalogItems = visibleStats(CATALOG_STATS);
  const mixItems = visibleStats(COURSE_MIX_STATS);
  const contentItems = visibleStats(CONTENT_STATS);
  const pipelineItems = visibleStats(PIPELINE_STATS);
  const showRevenue = typeof stats.total_revenue === "number";

  if (visible.length === 0) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-3">
          <div className="hidden rounded-xl bg-primary/10 p-2.5 text-primary sm:block">
            <BookStack className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("course.hubTitle")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("course.hubSubtitle")}
            </p>
            <div className="mt-2">
              <PageBreadcrumb
                items={[
                  { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                  { label: t("breadcrumb.course") },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("course.overview.loadError")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            {t("course.overview.retry")}
          </Button>
        </div>
      ) : (
        <>
          {(showRevenue || commerceItems.length > 0) && (
            <StatSection title={t("course.overview.commerce")}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {showRevenue && (
                  <RevenueStatCard
                    title={t("course.overview.totalRevenue")}
                    amount={formatMoney(stats.total_revenue as number)}
                    monthHint={
                      typeof stats.monthly_revenue === "number"
                        ? fmt("course.overview.thisMonth", { amount: formatMoney(stats.monthly_revenue) })
                        : undefined
                    }
                    pendingHint={
                      typeof stats.pending_revenue === "number" && stats.pending_revenue > 0
                        ? fmt("course.overview.awaitingApproval", {
                            amount: formatMoney(stats.pending_revenue),
                          })
                        : undefined
                    }
                  />
                )}
                {commerceItems.map((item) => (
                  <StatCard
                    key={item.key}
                    title={t(item.titleKey)}
                    value={formatCount(stats[item.key] as number)}
                    icon={item.icon}
                    color={item.color}
                    to={item.to}
                    hint={
                      item.key === "pending_subscriptions_count" &&
                      typeof stats.pending_revenue === "number" &&
                      stats.pending_revenue > 0
                        ? fmt("course.overview.awaitingApproval", {
                            amount: formatMoney(stats.pending_revenue),
                          })
                        : undefined
                    }
                  />
                ))}
              </div>
            </StatSection>
          )}

          {(catalogItems.length > 0 || mixItems.length > 0) && (
            <StatSection title={t("course.overview.catalog")}>
              {catalogItems.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {catalogItems.map((item) => (
                    <StatCard
                      key={item.key}
                      title={t(item.titleKey)}
                      value={formatCount(stats[item.key] as number)}
                      icon={item.icon}
                      color={item.color}
                      to={item.to}
                    />
                  ))}
                </div>
              )}
              {mixItems.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {mixItems.map((item) => (
                    <StatCard
                      key={item.key}
                      title={t(item.titleKey)}
                      value={formatCount(stats[item.key] as number)}
                      icon={item.icon}
                      color={item.color}
                      to={item.to}
                    />
                  ))}
                </div>
              )}
            </StatSection>
          )}

          {contentItems.length > 0 && (
            <StatSection title={t("course.overview.content")}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {contentItems.map((item) => (
                  <StatCard
                    key={item.key}
                    title={t(item.titleKey)}
                    value={formatCount(stats[item.key] as number)}
                    icon={item.icon}
                    color={item.color}
                    to={item.to}
                  />
                ))}
              </div>
            </StatSection>
          )}

          {pipelineItems.length > 0 && (
            <StatSection title={t("course.overview.pipeline")}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {pipelineItems.map((item) => (
                  <StatCard
                    key={item.key}
                    title={t(item.titleKey)}
                    value={formatCount(stats[item.key] as number)}
                    icon={item.icon}
                    color={item.color}
                    to={item.to}
                  />
                ))}
              </div>
            </StatSection>
          )}
        </>
      )}

      <StatSection title={t("course.overview.shortcuts")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((slug) => (
            <Link
              key={slug}
              to={slug === "courses" ? "/course/courses" : `/course/${slug}`}
              className="block h-full"
            >
              <div className="h-full rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">
                    {entityTitle(slug as CourseEntitySlug)}
                  </h3>
                  <NavArrowRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                </div>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">
                  {entityDescription(slug as CourseEntitySlug)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </StatSection>
    </div>
  );
};

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

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: StatColor;
  to?: string;
  hint?: string;
}

const StatCard = ({ title, value, icon, color, to, hint }: StatCardProps) => {
  const theme = CARD_THEMES[color];
  const card = (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-xl border bg-gradient-to-br p-5",
        theme.border,
        theme.bg,
        to && "transition-colors hover:border-primary/40"
      )}
    >
      <div className={cn("absolute end-4 top-4 rounded-lg p-2", theme.icon)}>{icon}</div>
      <p className="pe-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums xl:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  if (!to) return card;

  return (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  );
};

interface RevenueStatCardProps {
  title: string;
  amount: string;
  monthHint?: string;
  pendingHint?: string;
}

const RevenueStatCard = ({ title, amount, monthHint, pendingHint }: RevenueStatCardProps) => {
  return (
    <Link to="/course/student-subscriptions" className="block h-full sm:col-span-2 xl:col-span-1">
      <div className="relative h-full overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/5 via-card to-card p-5 transition-colors hover:border-success/40">
        <div className="absolute end-4 top-4 rounded-lg bg-success/15 p-2 text-success">
          <Dollar className="h-5 w-5" />
        </div>
        <p className="pe-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums xl:text-3xl">
          {amount}
        </p>
        <div className="mt-2 flex flex-col gap-1">
          {monthHint ? <p className="text-xs text-muted-foreground">{monthHint}</p> : null}
          {pendingHint ? <p className="text-xs font-medium text-warning">{pendingHint}</p> : null}
        </div>
      </div>
    </Link>
  );
};

interface StatSectionProps {
  title: string;
  children: ReactNode;
}

const StatSection = ({ title, children }: StatSectionProps) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {children}
  </section>
);

const OverviewSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, section) => (
      <div key={section} className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default CourseHub;
