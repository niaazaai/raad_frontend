import { useMemo, useState } from "react";
import { DataTable, PageBreadcrumb, SearchableSelect } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import { cn } from "@/lib/utils";
import { REPORT_ENDPOINTS } from "../../data/constants/endpoints";
import type { StudentProgressReportRow } from "../../data/models";
import {
  extractStudentProgressMeta,
  extractStudentProgressRows,
  useStudentProgressReport,
} from "../../hooks/useStudentProgressReport";
import type { DataTableConfig } from "@/types/datatable";

function textOrDash(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function formatDay(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

function attendanceLabel(row: StudentProgressReportRow): string {
  if (row.enrollment_id == null) return "—";
  const marked = row.attendance_present + row.attendance_absent + row.attendance_leave;
  if (marked === 0) return "—";
  const rate = row.attendance_rate == null ? "" : ` · ${row.attendance_rate}%`;
  return `P ${row.attendance_present} · A ${row.attendance_absent} · L ${row.attendance_leave}${rate}`;
}

const RESULT_CLASS: Record<string, string> = {
  pass: "bg-success/10 text-success",
  fail: "bg-danger/10 text-danger",
  pending: "bg-secondary text-muted-foreground",
};

const StudentReportPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    searchDebounceMs: 400,
  });
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [result, setResult] = useState("");

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      class_id: classId ? Number(classId) : undefined,
      course_id: courseId ? Number(courseId) : undefined,
      result: result || undefined,
      page: params.page,
      per_page: params.per_page,
      sort_by: params.sort_by || undefined,
      sort_dir: params.sort_dir || undefined,
    }),
    [debouncedSearch, classId, courseId, result, params.page, params.per_page, params.sort_by, params.sort_dir]
  );

  const report = useStudentProgressReport(queryParams);
  const rows = extractStudentProgressRows(report.data);
  const meta = extractStudentProgressMeta(report.data);

  const classOptions = useMemo(
    () =>
      meta.classes.map((item) => ({
        value: String(item.id),
        label: [item.class_code, item.name].filter(Boolean).join(" · ") || `#${item.id}`,
      })),
    [meta.classes]
  );
  const courseOptions = useMemo(
    () =>
      meta.courses.map((item) => ({
        value: String(item.id),
        label: item.title?.trim() || `#${item.id}`,
      })),
    [meta.courses]
  );
  const resultOptions = useMemo(
    () => [
      { value: "pass", label: t("studentReport.pass") },
      { value: "fail", label: t("studentReport.fail") },
      { value: "pending", label: t("studentReport.pending") },
    ],
    [t]
  );

  const resultLabel = (value: string | null) => {
    if (value === "pass") return t("studentReport.pass");
    if (value === "fail") return t("studentReport.fail");
    if (value === "pending") return t("studentReport.pending");
    return "—";
  };

  const config: DataTableConfig<StudentProgressReportRow> = useMemo(
    () => ({
      columns: [
        { key: "student_code", header: t("studentReport.studentCode"), sortable: true, minWidth: "120px", render: (row) => textOrDash(row.student_code) },
        { key: "student_name", header: t("studentReport.student"), sortable: true, minWidth: "160px", render: (row) => textOrDash(row.student_name) },
        { key: "father_name", header: t("studentReport.fatherName"), sortable: false, minWidth: "140px", render: (row) => textOrDash(row.father_name) },
        { key: "phone_number", header: t("studentReport.phone"), sortable: false, minWidth: "130px", render: (row) => textOrDash(row.phone_number) },
        { key: "email", header: t("studentReport.email"), sortable: false, minWidth: "180px", render: (row) => textOrDash(row.email) },
        {
          key: "class_name",
          header: t("studentReport.className"),
          sortable: true,
          minWidth: "180px",
          render: (row) => textOrDash([row.class_code, row.class_name].filter(Boolean).join(" · ")),
          exportValue: (row) => [row.class_code, row.class_name].filter(Boolean).join(" · "),
        },
        { key: "class_type", header: t("studentReport.classType"), sortable: false, minWidth: "110px", render: (row) => textOrDash(row.class_type) },
        { key: "course_title", header: t("studentReport.courseTitle"), sortable: true, minWidth: "160px", render: (row) => textOrDash(row.course_title) },
        { key: "module_title", header: t("studentReport.module"), sortable: true, minWidth: "140px", render: (row) => textOrDash(row.module_title) },
        { key: "model", header: t("studentReport.model"), sortable: false, minWidth: "130px", render: (row) => textOrDash(row.model) },
        { key: "main_category", header: t("studentReport.category"), sortable: false, minWidth: "140px", render: (row) => textOrDash(row.main_category) },
        { key: "sub_category", header: t("studentReport.subCategory"), sortable: false, minWidth: "140px", render: (row) => textOrDash(row.sub_category) },
        { key: "grade", header: t("studentReport.grade"), sortable: true, minWidth: "90px", render: (row) => textOrDash(row.grade) },
        {
          key: "result",
          header: t("studentReport.result"),
          sortable: true,
          minWidth: "100px",
          exportValue: (row) => resultLabel(row.result),
          render: (row) =>
            row.result ? (
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", RESULT_CLASS[row.result])}>
                {resultLabel(row.result)}
              </span>
            ) : (
              "—"
            ),
        },
        { key: "marks", header: t("studentReport.marks"), sortable: false, minWidth: "80px", render: (row) => textOrDash(row.marks) },
        { key: "final_score", header: t("studentReport.finalScore"), sortable: false, minWidth: "100px", render: (row) => textOrDash(row.final_score) },
        {
          key: "attendance_rate",
          header: t("studentReport.attendance"),
          sortable: true,
          minWidth: "180px",
          exportValue: (row) => attendanceLabel(row),
          render: (row) => attendanceLabel(row),
        },
        { key: "enrollment_date", header: t("studentReport.enrollmentDate"), sortable: true, minWidth: "120px", render: (row) => formatDay(row.enrollment_date) },
        { key: "enrollment_status", header: t("studentReport.enrollmentStatus"), sortable: false, minWidth: "120px", render: (row) => textOrDash(row.enrollment_status) },
        { key: "student_status", header: t("studentReport.studentStatus"), sortable: false, minWidth: "110px", render: (row) => textOrDash(row.student_status) },
        { key: "registered_at", header: t("studentReport.registeredAt"), sortable: true, minWidth: "120px", render: (row) => formatDay(row.registered_at) },
      ],
      rowId: (row) => row.row_id,
      searchable: true,
      searchPlaceholder: t("studentReport.search"),
      filtersEnabled: false,
      paginationEnabled: true,
      emptyMessage: t("studentReport.empty"),
      exportFilename: "student-progress",
      exportDateKey: "registered_at",
      fetchExportRows: (query) =>
        fetchAllListPages({
          url: REPORT_ENDPOINTS.STUDENTS,
          params: {
            search: debouncedSearch || undefined,
            class_id: classId ? Number(classId) : undefined,
            course_id: courseId ? Number(courseId) : undefined,
            result: result || undefined,
            sort_by: params.sort_by || undefined,
            sort_dir: params.sort_dir || undefined,
          },
          query,
          extractRows: extractStudentProgressRows,
          extractPagination: (response) => extractStudentProgressMeta(response).pagination ?? null,
        }),
    }),
    [t, debouncedSearch, classId, courseId, result, params.sort_by, params.sort_dir]
  );

  if (!hasPermission("course.class_students.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("studentReport.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("studentReport.subtitle")}</p>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: t("sidebar.reports") },
              { label: t("studentReport.title") },
            ]}
          />
        </div>
      </div>

      {report.isError ? (
        <p className="text-sm text-destructive">{report.error instanceof Error ? report.error.message : t("studentReport.loadError")}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SearchableSelect
          id="student-report-class"
          label={t("studentReport.className")}
          options={classOptions}
          value={classId}
          clearable
          placeholder={t("studentReport.allClasses")}
          onChange={(next) => {
            setClassId(next);
            updateParams({ page: 1 });
          }}
        />
        <SearchableSelect
          id="student-report-course"
          label={t("studentReport.courseTitle")}
          options={courseOptions}
          value={courseId}
          clearable
          placeholder={t("studentReport.allCourses")}
          onChange={(next) => {
            setCourseId(next);
            updateParams({ page: 1 });
          }}
        />
        <SearchableSelect
          id="student-report-result"
          label={t("studentReport.result")}
          options={resultOptions}
          value={result}
          clearable
          placeholder={t("studentReport.allResults")}
          onChange={(next) => {
            setResult(next);
            updateParams({ page: 1 });
          }}
        />
      </div>

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={meta.pagination}
        isLoading={report.isLoading || report.isFetching}
      />
    </div>
  );
};

export default StudentReportPage;
