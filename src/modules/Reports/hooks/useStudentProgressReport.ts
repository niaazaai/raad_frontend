import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import { REPORT_ENDPOINTS, REPORT_QUERY_KEYS } from "../data/constants/endpoints";
import type { ReportFilterOption, StudentProgressReportRow } from "../data/models";

export interface StudentProgressParams extends Record<string, unknown> {
  search?: string;
  class_id?: number;
  course_id?: number;
  student_id?: number;
  result?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
}

export function useStudentProgressReport(params: StudentProgressParams) {
  return useQueryApi<StudentProgressReportRow[]>({
    queryKey: [...REPORT_QUERY_KEYS.students, params],
    url: REPORT_ENDPOINTS.STUDENTS,
    method: RequestMethod.GET,
    params,
  });
}

export function extractStudentProgressRows(response: unknown): StudentProgressReportRow[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  return Array.isArray(data) ? (data as StudentProgressReportRow[]) : [];
}

export interface StudentReportCatalogOption {
  id: number;
  title: string | null;
  name: string | null;
  class_code: string | null;
  main_category_id: number | null;
}

export interface StudentReportCatalog {
  courses: StudentReportCatalogOption[];
  classes: StudentReportCatalogOption[];
  main_categories: StudentReportCatalogOption[];
  sub_categories: StudentReportCatalogOption[];
}

const EMPTY_CATALOG: StudentReportCatalog = {
  courses: [],
  classes: [],
  main_categories: [],
  sub_categories: [],
};

export function useStudentProgressCatalog() {
  return useQueryApi<StudentReportCatalog>({
    queryKey: [...REPORT_QUERY_KEYS.students, "catalog"],
    url: REPORT_ENDPOINTS.STUDENTS,
    method: RequestMethod.GET,
    params: { catalog: 1 },
    options: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });
}

function asCatalogOption(value: unknown): StudentReportCatalogOption | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const rawId = record.id;
  const id = typeof rawId === "number"
    ? rawId
    : typeof rawId === "string" && /^\d+$/.test(rawId)
      ? Number(rawId)
      : null;
  if (id == null) return null;
  const text = (key: string): string | null => (typeof record[key] === "string" ? record[key] : null);
  const main = record.main_category_id;
  return {
    id,
    title: text("title"),
    name: text("name"),
    class_code: text("class_code"),
    main_category_id: typeof main === "number" ? main : null,
  };
}

function asCatalogList(value: unknown): StudentReportCatalogOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const option = asCatalogOption(item);
    return option ? [option] : [];
  });
}

export function extractStudentProgressCatalog(response: unknown): StudentReportCatalog {
  if (!response || typeof response !== "object") return EMPTY_CATALOG;
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") return EMPTY_CATALOG;
  const record = data as Record<string, unknown>;
  return {
    courses: asCatalogList(record.courses),
    classes: asCatalogList(record.classes),
    main_categories: asCatalogList(record.main_categories),
    sub_categories: asCatalogList(record.sub_categories),
  };
}

export function extractStudentProgressMeta(response: unknown): {
  pagination?: DataTablePaginationMeta;
  courses: ReportFilterOption[];
  classes: ReportFilterOption[];
} {
  if (!response || typeof response !== "object") {
    return { courses: [], classes: [] };
  }
  const meta = (response as {
    meta?: {
      pagination?: DataTablePaginationMeta;
      filters?: { courses?: ReportFilterOption[]; classes?: ReportFilterOption[] };
    };
  }).meta;
  return {
    pagination: meta?.pagination,
    courses: meta?.filters?.courses ?? [],
    classes: meta?.filters?.classes ?? [],
  };
}
