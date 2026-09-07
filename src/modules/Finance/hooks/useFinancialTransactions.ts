import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";
import type { FinancialTransactionFilter, FinancialTransactionRow } from "../data/models/FinanceReport";

export interface FinancialTransactionListParams {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
  filter?: FinancialTransactionFilter;
  from?: string;
  to?: string;
  all_time?: 0 | 1;
}

export function useFinancialTransactions(params: FinancialTransactionListParams) {
  return useQueryApi<FinancialTransactionRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.transactions, params],
    url: FINANCE_ENDPOINTS.TRANSACTIONS,
    method: RequestMethod.GET,
    params,
  });
}

export function extractFinancialTransactions(response: unknown): FinancialTransactionRow[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as FinancialTransactionRow[];
  return [];
}

export function extractFinancialTransactionsPagination(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}
