import { CheckCircle } from "iconoir-react";
import { useNavigate } from "react-router-dom";
import { Button, DataTable, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import type { DataTableConfig } from "@/types/datatable";
import {
  extractAttendanceOverview,
  extractAttendanceOverviewPagination,
  useAttendanceOverview,
  type AttendanceOverviewClass,
} from "../../hooks/useClassAttendance";

const AttendanceHubPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const { data, isLoading } = useAttendanceOverview({
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const rows = extractAttendanceOverview(data);
  const pagination = extractAttendanceOverviewPagination(data);

  if (!hasPermission("course.lms_classes.read")) {
    return <PermissionDeniedCard />;
  }

  const config: DataTableConfig<AttendanceOverviewClass> = {
    columns: [
      {
        key: "class_code",
        header: t("course.columns.class_code"),
        sortable: true,
        filterable: false,
        render: (row) => (
          <span className="font-mono text-sm font-medium text-primary">
            {row.class_code || row.id}
          </span>
        ),
      },
      {
        key: "main_category_name",
        header: t("course.columns.main_category_name"),
        sortable: false,
        filterable: false,
        render: (row) => row.main_category_name || "—",
      },
      {
        key: "sub_category_name",
        header: t("course.columns.sub_category_name"),
        sortable: false,
        filterable: false,
        render: (row) => row.sub_category_name || "—",
      },
      {
        key: "name",
        header: t("course.columns.name"),
        sortable: true,
        filterable: false,
        render: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        key: "instructor_name",
        header: t("course.columns.instructor_name"),
        sortable: false,
        filterable: false,
        render: (row) => row.instructor_name || "—",
      },
      {
        key: "students_count",
        header: t("course.attendance.students"),
        sortable: true,
        filterable: false,
        align: "center",
        render: (row) => (
          <span className="font-mono text-sm font-semibold tabular-nums">
            {row.students_count ?? 0}
          </span>
        ),
      },
      {
        key: "absent_rate",
        header: t("course.attendance.avgAbsent"),
        sortable: false,
        filterable: false,
        align: "center",
        render: (row) =>
          row.absent_rate == null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium tabular-nums text-danger">
              {row.absent_rate}%
            </span>
          ),
      },
      {
        key: "present_rate",
        header: t("course.attendance.avgPresent"),
        sortable: false,
        filterable: false,
        align: "center",
        render: (row) =>
          row.present_rate == null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium tabular-nums text-success">
              {row.present_rate}%
            </span>
          ),
      },
      {
        key: "action",
        header: t("dataTable.actions"),
        sortable: false,
        filterable: false,
        align: "right",
        render: (row) => (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(`/classes/${row.id}/attendance`)}
          >
            <CheckCircle className="h-4 w-4" />
            {t("course.attendance.openAttendance")}
          </Button>
        ),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("course.attendance.searchPlaceholder"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("course.attendance.empty"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("course.attendance.hubTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("course.attendance.hubSubtitle")}</p>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: t("course.attendance.hubTitle") },
            ]}
          />
        </div>
      </div>
      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AttendanceHubPage;
