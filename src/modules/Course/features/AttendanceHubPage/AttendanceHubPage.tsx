import { useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/i18n/useTranslation";
import { Archive, CircleCheck, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ServerDataTable,
  actionsColumn,
  useDataTable,
  useUrlFilters,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { attendanceOverviewQueryKey, type AttendanceOverviewClass } from "../../hooks/useClassAttendance";

const READ = "attendance.read";
const READ_CLASSES = "attendance.classes.read";
const FILTER_KEYS = ["status"] as const;

type AttendanceStatusTab = "active" | "archived" | "completed";

const statusTabs: { value: AttendanceStatusTab; label: TranslationKey; icon: LucideIcon }[] = [
  { value: "active", label: "common.active", icon: Play },
  { value: "archived", label: "common.archived", icon: Archive },
  { value: "completed", label: "common.completed", icon: CircleCheck },
];

function StatusTabs({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useTranslation();
  const value = (filters.values.status || "active") as AttendanceStatusTab;

  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      {statusTabs.map((tab) => {
        const Icon = tab.icon;
        const selected = value === tab.value;
        return (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "ghost"}
            onClick={() => filters.set("status", tab.value)}
            className="gap-1.5"
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t(tab.label)}</span>
          </Button>
        );
      })}
    </div>
  );
}

function rateText(value: number | null | undefined): string {
  return value == null ? "—" : `${value}%`;
}

function AttendanceHubList() {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const navigate = useNavigate();
  const filters = useUrlFilters(FILTER_KEYS);

  const openAttendance = useCallback(
    (row: AttendanceOverviewClass) => navigate(`/classes/${row.id}/attendance`),
    [navigate],
  );

  const columns = useMemo<ColumnDef<AttendanceOverviewClass, unknown>[]>(() => {
    const classCodeLabel = t("course.columns.class_code");
    const categoryLabel = t("common.category");
    const nameLabel = t("course.columns.name");
    const instructorLabel = t("course.columns.instructor_name");
    const studentsLabel = t("course.attendance.students");
    const absentLabel = t("course.attendance.avgAbsent");
    const presentLabel = t("course.attendance.avgPresent");
    const openLabel = t("course.attendance.openAttendance");

    return [
      {
        id: "class_code",
        header: classCodeLabel,
        meta: {
          priority: 1,
          sortKey: "class_code",
          shortLabel: classCodeLabel,
          plainText: (row) => {
            const value = row as AttendanceOverviewClass;
            return value.class_code || String(value.id);
          },
          width: { default: 130, min: 100 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-sm font-medium text-primary">
            {row.original.class_code || row.original.id}
          </bdi>
        ),
      },
      {
        id: "category",
        header: categoryLabel,
        meta: {
          priority: 1,
          shortLabel: categoryLabel,
          plainText: (row) => {
            const value = row as AttendanceOverviewClass;
            return [value.main_category_name, value.sub_category_name]
              .filter((v) => typeof v === "string" && v.length > 0)
              .join(" / ");
          },
          width: { default: 200, min: 140 },
        },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.main_category_name || "—"}</span>
            {row.original.sub_category_name ? (
              <span className="text-xs text-muted-foreground">{row.original.sub_category_name}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "name",
        header: nameLabel,
        meta: {
          priority: 1,
          sortKey: "name",
          shortLabel: nameLabel,
          plainText: (row) => (row as AttendanceOverviewClass).name,
          width: { default: 200, min: 140 },
        },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "instructor_name",
        header: instructorLabel,
        meta: {
          priority: 2,
          shortLabel: instructorLabel,
          plainText: (row) => (row as AttendanceOverviewClass).instructor_name || "—",
          width: { default: 160, min: 120 },
        },
        cell: ({ row }) => row.original.instructor_name || "—",
      },
      {
        id: "students_count",
        header: studentsLabel,
        meta: {
          priority: 1,
          sortKey: "students_count",
          numeric: true,
          shortLabel: studentsLabel,
          plainText: (row) => String((row as AttendanceOverviewClass).students_count ?? 0),
          width: { default: 110, min: 88 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-sm font-semibold tabular-nums">
            {row.original.students_count ?? 0}
          </bdi>
        ),
      },
      {
        id: "absent_rate",
        header: absentLabel,
        meta: {
          priority: 2,
          numeric: true,
          shortLabel: absentLabel,
          plainText: (row) => rateText((row as AttendanceOverviewClass).absent_rate),
          width: { default: 120, min: 96 },
        },
        cell: ({ row }) => {
          const value = row.original.absent_rate;
          if (value == null) return <span className="text-muted-foreground">—</span>;
          return (
            <bdi dir="ltr" className="rounded-full bg-danger/10 px-2 text-xs font-medium tabular-nums text-danger">
              {value}%
            </bdi>
          );
        },
      },
      {
        id: "present_rate",
        header: presentLabel,
        meta: {
          priority: 2,
          numeric: true,
          shortLabel: presentLabel,
          plainText: (row) => rateText((row as AttendanceOverviewClass).present_rate),
          width: { default: 110, min: 88 },
        },
        cell: ({ row }) => {
          const value = row.original.present_rate;
          if (value == null) return <span className="text-muted-foreground">—</span>;
          return (
            <bdi dir="ltr" className="rounded-full bg-success/10 px-2 text-xs font-medium tabular-nums text-success">
              {value}%
            </bdi>
          );
        },
      },
      actionsColumn<AttendanceOverviewClass>(
        gridT,
        () => [],
        true,
        undefined,
        (row) => [
          {
            id: "open-attendance",
            label: openLabel,
            icon: <CircleCheck className="size-4" aria-hidden="true" />,
            onSelect: () => openAttendance(row),
          },
        ],
      ),
    ];
  }, [gridT, openAttendance, t]);

  const table = useDataTable<AttendanceOverviewClass>({
    key: "course.attendance-hub",
    queryKey: (query) => [...attendanceOverviewQueryKey, query],
    endpoint: "/lms-classes/attendance-overview",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    exportTitle: t("course.attendance.hubTitle"),
    params: {
      status: filters.values.status || "active",
    },
    syncUrl: true,
    defaultSort: "-created_at",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  return (
    <ServerDataTable
      api={table}
      entityLabel={t("course.attendance.hubTitle")}
      searchPlaceholder={t("dt.attendance.search")}
      emptyTitle={t("dt.attendance.emptyTitle")}
      emptyBody={t("dt.attendance.emptyBody")}
      narrowed={filters.narrowed}
      onRowDoubleClick={openAttendance}
      stickyHeader
      toolsInHeader
      extra={<StatusTabs filters={filters} />}
    />
  );
}

const AttendanceHubPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  if (!hasPermission(READ) && !hasPermission(READ_CLASSES)) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("course.attendance.hubTitle")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {t("course.attendance.hubSubtitle")}
        </p>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: t("course.attendance.hubTitle") },
            ]}
          />
        </div>
      </div>
      <AttendanceHubList />
    </div>
  );
};

export default AttendanceHubPage;
