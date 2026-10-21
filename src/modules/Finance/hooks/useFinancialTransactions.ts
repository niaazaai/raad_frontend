import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import type { DataTablePaginationMeta } from "@/types/datatable";
import {
  FINANCE_ENDPOINTS,
  FINANCE_QUERY_KEYS,
  FINANCE_RELATED_QUERY_KEYS,
  FINANCE_STALE_TIME,
} from "../data/constants/endpoints";
import type {
  FinancialTransactionFilter,
  FinancialTransactionRow,
  FinancialTransactionTotals,
  TransactionPayer,
} from "../data/models/FinanceReport";

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
  payer?: TransactionPayer;
}

export function useFinancialTransactions(params: FinancialTransactionListParams) {
  return useQueryApi<FinancialTransactionRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.transactions, params],
    url: FINANCE_ENDPOINTS.TRANSACTIONS,
    method: RequestMethod.GET,
    params,
    options: { staleTime: FINANCE_STALE_TIME, refetchOnMount: "always" },
  });
}

export function useDeleteFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await callApi({
        url: `${FINANCE_ENDPOINTS.TRANSACTIONS}/${id}`,
        method: RequestMethod.DELETE,
        shouldPopError: false,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Delete failed");
      }
      return response.data;
    },
    onSuccess: () => {
      FINANCE_RELATED_QUERY_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [...key] });
      });
    },
  });
}

export function extractFinancialTransactions(response: unknown): FinancialTransactionRow[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as FinancialTransactionRow[];
  return [];
}

export function extractFinancialTransactionsPagination(
  response: unknown
): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}

export function extractFinancialTransactionTotals(
  response: unknown
): FinancialTransactionTotals | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { totals?: FinancialTransactionTotals } }).meta?.totals ?? null;
}
