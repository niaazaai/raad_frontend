import { useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CircleCheck as CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ServerDataTable,
  actionsColumn,
  useDataTable,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { attendanceOverviewQueryKey, type AttendanceOverviewClass } from "../../hooks/useClassAttendance";

const READ = "attendance.read";
const READ_CLASSES = "attendance.classes.read";

function rateText(value: number | null | undefined): string {
  return value == null ? "—" : `${value}%`;
}

function AttendanceHubList() {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const navigate = useNavigate();

  const openAttendance = useCallback(
    (row: AttendanceOverviewClass) => navigate(`/classes/${row.id}/attendance`),
    [navigate],
  );

  const columns = useMemo<ColumnDef<AttendanceOverviewClass, unknown>[]>(() => {
    const classCodeLabel = t("course.columns.class_code");
    const mainCategoryLabel = t("course.columns.main_category_name");
    const subCategoryLabel = t("course.columns.sub_category_name");
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
        id: "main_category_name",
        header: mainCategoryLabel,
        meta: {
          priority: 2,
          shortLabel: mainCategoryLabel,
          plainText: (row) => (row as AttendanceOverviewClass).main_category_name || "—",
          width: { default: 160, min: 120 },
        },
        cell: ({ row }) => row.original.main_category_name || "—",
      },
      {
        id: "sub_category_name",
        header: subCategoryLabel,
        meta: {
          priority: 3,
          shortLabel: subCategoryLabel,
          plainText: (row) => (row as AttendanceOverviewClass).sub_category_name || "—",
          width: { default: 160, min: 120 },
        },
        cell: ({ row }) => row.original.sub_category_name || "—",
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
            icon: <CheckCircle className="size-4" aria-hidden="true" />,
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
      onRowDoubleClick={openAttendance}
      stickyHeader
      toolsInHeader
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
