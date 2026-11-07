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
