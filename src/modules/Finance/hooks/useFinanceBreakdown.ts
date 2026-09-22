import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import {
  FINANCE_ENDPOINTS,
  FINANCE_QUERY_KEYS,
  FINANCE_STALE_TIME,
} from "../data/constants/endpoints";
import type {
  FinanceBreakdownEnrollmentRow,
  FinanceBreakdownMeta,
  FinanceBreakdownMetric,
  FinancialTransactionRow,
} from "../data/models/FinanceReport";

export interface FinanceBreakdownParams extends Record<string, unknown> {
  metric: FinanceBreakdownMetric;
  search?: string;
  page?: number;
  per_page?: number;
}

export function useFinanceBreakdown(params: FinanceBreakdownParams | null) {
  return useQueryApi<Array<FinanceBreakdownEnrollmentRow | FinancialTransactionRow>>({
    queryKey: [...FINANCE_QUERY_KEYS.breakdown, params],
    url: FINANCE_ENDPOINTS.REPORT_BREAKDOWN,
    method: RequestMethod.GET,
    params: params ?? undefined,
    options: { enabled: params != null, staleTime: FINANCE_STALE_TIME },
  });
}

export function extractBreakdownRows(
  response: unknown
): Array<FinanceBreakdownEnrollmentRow | FinancialTransactionRow> {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  return Array.isArray(data)
    ? (data as Array<FinanceBreakdownEnrollmentRow | FinancialTransactionRow>)
    : [];
}

export function extractBreakdownMeta(
  response: unknown
): (FinanceBreakdownMeta & { pagination?: DataTablePaginationMeta }) | null {
  if (!response || typeof response !== "object") return null;
  return (
    (response as { meta?: FinanceBreakdownMeta & { pagination?: DataTablePaginationMeta } }).meta ??
    null
  );
}
