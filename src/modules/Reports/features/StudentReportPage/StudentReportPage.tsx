import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ColumnFunnel,
  ServerDataTable,
  actionsColumn,
  useDataTable,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { REPORT_QUERY_KEYS } from "../../data/constants/endpoints";
import type { StudentProgressReportRow } from "../../data/models";
import {
  extractStudentProgressCatalog,
  useStudentProgressCatalog,
  type StudentReportCatalogOption,
} from "../../hooks/useStudentProgressReport";

const FILTER_KEYS = [
  "class_id",
  "course_id",
  "model",
  "main_category_id",
  "sub_category_id",
  "result",
] as const;

const READ = "reports.students.read";

type ReportFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function day(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

function classLabel(row: StudentProgressReportRow): string {
  const text = [row.class_code, row.class_name].filter((part) => part && part.trim() !== "").join(" · ");
  return text === "" ? "—" : text;
}

function attendanceLabel(row: StudentProgressReportRow): string {
  if (row.enrollment_id == null) return "—";
  const marked = row.attendance_present + row.attendance_absent + row.attendance_leave;
  if (marked === 0) return "—";
  const rate = row.attendance_rate == null ? "" : ` · ${row.attendance_rate}%`;
  return `P ${row.attendance_present} · A ${row.attendance_absent} · L ${row.attendance_leave}${rate}`;
}

function optionLabel(item: StudentReportCatalogOption): string {
  const titled = [item.class_code, item.name ?? item.title].filter((part) => part && part.trim() !== "").join(" · ");
  return titled === "" ? `#${item.id}` : titled;
}

function Ltr({ value }: { value: string }) {
  if (value === "—") return value;
  return <bdi dir="ltr">{value}</bdi>;
}

function textColumn(
  id: string,
  header: string,
  priority: 1 | 2 | 3,
  read: (row: StudentProgressReportRow) => string,
  options?: { sortKey?: string; numeric?: boolean; width?: number },
): ColumnDef<StudentProgressReportRow, unknown> {
  const width = options?.width ?? 150;
  return {
    id,
    header,
    meta: {
      priority,
      shortLabel: header,
      sortKey: options?.sortKey,
      numeric: options?.numeric,
      plainText: (row) => read(row as StudentProgressReportRow),
      width: { default: width, min: Math.min(width, 110) },
    },
    cell: ({ row }) => {
      const text = read(row.original);
      return options?.numeric ? <Ltr value={text} /> : text;
    },
  };
}

function StudentReportList({ filters }: { filters: ReportFilters }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const catalogQuery = useStudentProgressCatalog();
  const catalog = useMemo(
    () => extractStudentProgressCatalog(catalogQuery.data),
    [catalogQuery.data],
  );

  const mainSelected = useMemo(
    () => new Set(filters.values.main_category_id.split(",").filter((piece) => piece !== "")),
    [filters.values.main_category_id],
  );

  const columns = useMemo<ColumnDef<StudentProgressReportRow, unknown>[]>(() => {
    const choices = (
      anyLabel: string,
      items: StudentReportCatalogOption[],
    ): { value: string; label: string }[] => [
      { value: "", label: anyLabel },
      ...items.map((item) => ({ value: String(item.id), label: optionLabel(item) })),
    ];

    const modelText = (value: string | null): string => {
      if (value === "Odd days") return t("studentReport.modelOdd");
      if (value === "Even days") return t("studentReport.modelEven");
      if (value === "Both odd & even") return t("studentReport.modelBoth");
      return shown(value);
    };

    const resultText = (value: string | null): string => {
      if (value === "pass") return t("studentReport.pass");
      if (value === "fail") return t("studentReport.fail");
      if (value === "pending") return t("studentReport.pending");
      return "—";
    };

    const subs = mainSelected.size === 0
      ? catalog.sub_categories
      : catalog.sub_categories.filter(
        (item) => item.main_category_id != null && mainSelected.has(String(item.main_category_id)),
      );

    const funnel = (
      column: ColumnDef<StudentProgressReportRow, unknown>,
      key: (typeof FILTER_KEYS)[number],
      label: string,
      options: { value: string; label: string }[],
    ): ColumnDef<StudentProgressReportRow, unknown> => withHeaderAddon(
      column,
      <ColumnFunnel
        label={label}
        value={filters.values[key]}
        onChange={(next) => filters.set(key, next)}
        options={options}
      />,
    );

    const actions = actionsColumn<StudentProgressReportRow>(gridT, () => [], true);

    return [
      textColumn("student_code", t("studentReport.studentCode"), 1, (row) => shown(row.student_code), {
        sortKey: "student_code",
        numeric: true,
        width: 130,
      }),
      textColumn("student_name", t("studentReport.student"), 1, (row) => shown(row.student_name), {
        sortKey: "student_name",
        width: 180,
      }),
      textColumn("father_name", t("studentReport.fatherName"), 3, (row) => shown(row.father_name), { width: 150 }),
      textColumn("phone_number", t("studentReport.phone"), 3, (row) => shown(row.phone_number), {
        numeric: true,
        width: 140,
      }),
      textColumn("email", t("studentReport.email"), 3, (row) => shown(row.email), { numeric: true, width: 200 }),
      funnel(
        textColumn("class_name", t("studentReport.className"), 2, classLabel, { sortKey: "class_name", width: 200 }),
        "class_id",
        t("studentReport.className"),
        choices(t("studentReport.allClasses"), catalog.classes),
      ),
      textColumn("class_type", t("studentReport.classType"), 3, (row) => shown(row.class_type), { width: 120 }),
      funnel(
        textColumn("course_title", t("studentReport.courseTitle"), 2, (row) => shown(row.course_title), {
          sortKey: "course_title",
          width: 180,
        }),
        "course_id",
        t("studentReport.courseTitle"),
        choices(t("studentReport.allCourses"), catalog.courses),
      ),
      textColumn("module_title", t("studentReport.module"), 2, (row) => shown(row.module_title), {
        sortKey: "module_title",
        width: 160,
      }),
      funnel(
        textColumn("model", t("studentReport.model"), 2, (row) => modelText(row.model), { width: 150 }),
        "model",
        t("studentReport.model"),
        [
          { value: "", label: t("studentReport.allModels") },
          { value: "odd", label: t("studentReport.modelOdd") },
          { value: "even", label: t("studentReport.modelEven") },
          { value: "both", label: t("studentReport.modelBoth") },
        ],
      ),
      funnel(
        textColumn("main_category", t("studentReport.category"), 2, (row) => shown(row.main_category), { width: 160 }),
        "main_category_id",
        t("studentReport.category"),
        choices(t("studentReport.allCategories"), catalog.main_categories),
      ),
      funnel(
        textColumn("sub_category", t("studentReport.subCategory"), 2, (row) => shown(row.sub_category), { width: 160 }),
        "sub_category_id",
        t("studentReport.subCategory"),
        choices(t("studentReport.allSubCategories"), subs),
      ),
      textColumn("grade", t("studentReport.grade"), 2, (row) => shown(row.grade), {
        sortKey: "grade",
        numeric: true,
        width: 100,
      }),
      funnel(
        {
          id: "result",
          header: t("studentReport.result"),
          meta: {
            priority: 1,
            shortLabel: t("studentReport.result"),
            sortKey: "result",
            plainText: (row) => resultText((row as StudentProgressReportRow).result),
            width: { default: 120, min: 100 },
          },
          cell: ({ row }) => {
            const value = row.original.result;
            if (!value) return "—";
            const variant = value === "pass" ? "success" : value === "fail" ? "destructive" : "secondary";
            return <Badge variant={variant}>{resultText(value)}</Badge>;
          },
        },
        "result",
        t("studentReport.result"),
        [
          { value: "", label: t("studentReport.allResults") },
          { value: "pass", label: t("studentReport.pass") },
          { value: "fail", label: t("studentReport.fail") },
          { value: "pending", label: t("studentReport.pending") },
        ],
      ),
      textColumn("marks", t("studentReport.marks"), 3, (row) => shown(row.marks), { numeric: true, width: 90 }),
      textColumn("final_score", t("studentReport.finalScore"), 3, (row) => shown(row.final_score), {
        numeric: true,
        width: 110,
      }),
      textColumn("attendance_rate", t("studentReport.attendance"), 2, attendanceLabel, {
        sortKey: "attendance_rate",
        numeric: true,
        width: 200,
      }),
      textColumn("enrollment_date", t("studentReport.enrollmentDate"), 3, (row) => day(row.enrollment_date), {
        sortKey: "enrollment_date",
        numeric: true,
        width: 120,
      }),
      textColumn("enrollment_status", t("studentReport.enrollmentStatus"), 3, (row) => shown(row.enrollment_status), {
        width: 130,
      }),
      textColumn("student_status", t("studentReport.studentStatus"), 3, (row) => shown(row.student_status), {
        width: 130,
      }),
      textColumn("registered_at", t("studentReport.registeredAt"), 3, (row) => day(row.registered_at), {
        sortKey: "registered_at",
        numeric: true,
        width: 120,
      }),
      {
        ...actions,
        meta: { ...actions.meta, width: { default: 132, min: 120 } },
      },
    ];
  }, [catalog, filters, gridT, mainSelected, t]);

  const table = useDataTable<StudentProgressReportRow>({
    key: "reports.student-progress",
    queryKey: (query) => [...REPORT_QUERY_KEYS.students, query],
    endpoint: "/reports/student-progress",
    readPermission: "reports.students.export",
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    exportTitle: t("studentReport.title"),
    params: filters.params,
    syncUrl: true,
    defaultSort: "-registered_at",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    searchDebounceMs: 120,
    getRowId: (row) => row.row_id,
  });

  return (
    <ServerDataTable
      api={table}
      entityLabel={t("studentReport.title")}
      searchPlaceholder={t("studentReport.search")}
      emptyTitle={t("studentReport.empty")}
      emptyBody={t("studentReport.subtitle")}
      narrowed={filters.narrowed}
      stickyHeader
      toolsInHeader
    />
  );
}

const StudentReportPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const filters = useUrlFilters(FILTER_KEYS);

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("studentReport.title")}</h1>
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
      <StudentReportList filters={filters} />
    </div>
  );
};

export default StudentReportPage;
