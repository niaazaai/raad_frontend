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
  /** Legacy single category; prefer `type` (comma-joined). */
  filter?: FinancialTransactionFilter | string;
  /** Comma-joined category keys (`payment,refund`). */
  type?: string;
  /** Comma-joined LMS class ids. */
  class_id?: string;
  from?: string;
  to?: string;
  all_time?: 0 | 1 | string;
  /** Single payer or comma-joined (`student,mof`). */
  payer?: TransactionPayer | string;
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

export interface UpdateFinancialTransactionBody {
  amount?: number;
  currency?: string;
  exchange_rate?: number | null;
  transaction_date?: string;
  next_installment_date?: string | null;
  payer?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  service_name?: string | null;
  service_cost?: number | null;
}

export function useUpdateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateFinancialTransactionBody }) => {
      const response = await callApi({
        url: `${FINANCE_ENDPOINTS.TRANSACTIONS}/${id}`,
        method: RequestMethod.PUT,
        data: body,
        shouldPopError: false,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Update failed");
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
