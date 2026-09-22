import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import {
  FINANCE_ENDPOINTS,
  FINANCE_QUERY_KEYS,
  FINANCE_STALE_TIME,
} from "../data/constants/endpoints";
import type { FinanceInvoiceRow } from "../data/models/FinanceReport";

export function useFinanceInvoices(params: {
  search?: string;
  page?: number;
  per_page?: number;
  from?: string;
  to?: string;
  all_time?: 0 | 1;
}) {
  return useQueryApi<FinanceInvoiceRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.invoices, params],
    url: FINANCE_ENDPOINTS.INVOICES,
    method: RequestMethod.GET,
    params,
    options: { staleTime: FINANCE_STALE_TIME, refetchOnMount: "always" },
  });
}

export function extractFinanceInvoices(response: unknown): FinanceInvoiceRow[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as FinanceInvoiceRow[];
  return [];
}

export function extractFinanceInvoicesPagination(
  response: unknown
): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}
