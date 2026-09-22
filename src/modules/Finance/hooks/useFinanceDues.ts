import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import {
  FINANCE_ENDPOINTS,
  FINANCE_QUERY_KEYS,
  FINANCE_STALE_TIME,
} from "../data/constants/endpoints";
import type { DuesBucket, DuesCounts, UpcomingInstallmentRow } from "../data/models/FinanceReport";

export interface FinanceDuesParams extends Record<string, unknown> {
  bucket: DuesBucket;
  search?: string;
  page?: number;
  per_page?: number;
  sort_dir?: string;
}

export function useFinanceDues(params: FinanceDuesParams) {
  return useQueryApi<UpcomingInstallmentRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.dues, params],
    url: FINANCE_ENDPOINTS.DUES,
    method: RequestMethod.GET,
    params,
    options: { staleTime: FINANCE_STALE_TIME, refetchOnMount: "always" },
  });
}

export function extractDuesRows(response: unknown): UpcomingInstallmentRow[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  return Array.isArray(data) ? (data as UpcomingInstallmentRow[]) : [];
}

export function extractDuesMeta(response: unknown): {
  pagination?: DataTablePaginationMeta;
  counts?: DuesCounts;
} {
  if (!response || typeof response !== "object") return {};
  return (
    (response as { meta?: { pagination?: DataTablePaginationMeta; counts?: DuesCounts } }).meta ??
    {}
  );
}
