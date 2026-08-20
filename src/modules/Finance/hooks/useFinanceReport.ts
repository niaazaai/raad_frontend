import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";
import type {
  FinanceClassRow,
  FinanceCourseRow,
  FinancePeriodMeta,
  FinanceReportParams,
  FinanceSummary,
} from "../data/models/FinanceReport";

export function useFinanceReport(params: FinanceReportParams) {
  return useQueryApi<FinanceClassRow[] | FinanceCourseRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.report, params],
    url: FINANCE_ENDPOINTS.REPORT,
    method: RequestMethod.GET,
    params,
  });
}

export function extractFinanceRows(response: unknown): Array<FinanceClassRow | FinanceCourseRow> {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as Array<FinanceClassRow | FinanceCourseRow>;
  return [];
}

export function extractFinancePagination(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}

export function extractFinanceSummary(response: unknown): FinanceSummary | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { summary?: FinanceSummary } }).meta?.summary ?? null;
}

export function extractFinancePeriod(response: unknown): FinancePeriodMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { period?: FinancePeriodMeta } }).meta?.period ?? null;
}
