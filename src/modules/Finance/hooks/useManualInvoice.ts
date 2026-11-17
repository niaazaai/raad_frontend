import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import {
  FINANCE_ENDPOINTS,
  FINANCE_QUERY_KEYS,
  FINANCE_RELATED_QUERY_KEYS,
} from "../data/constants/endpoints";
import type { FinanceInvoiceRow } from "../data/models/FinanceReport";
import type { ServiceNameOption } from "../data/models/ManualInvoiceForm";

export interface ManualInvoicePayload {
  class_student_id?: number;
  amount: number;
  currency: string;
  exchange_rate?: number;
  transaction_date?: string;
  customer_name?: string;
  customer_national_id?: string;
  customer_phone?: string;
  customer_email?: string;
  service_name?: string;
  cost?: number;
  notes?: string;
}

function extractInvoiceNumberPayload(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const envelope = response as { data?: { invoice_number?: string } | string };
  if (typeof envelope.data === "object" && envelope.data?.invoice_number) {
    return envelope.data.invoice_number;
  }
  return null;
}

export function useNextManualInvoiceNumber(enabled = true) {
  const primary = useQueryApi<{ invoice_number: string }>({
    queryKey: [...FINANCE_QUERY_KEYS.invoices, "next-number", "primary"] as const,
    url: FINANCE_ENDPOINTS.MANUAL_INVOICE_NEXT_NUMBER,
    method: RequestMethod.GET,
    options: { enabled },
  });

  const fallback = useQueryApi<{ invoice_number: string }>({
    queryKey: [...FINANCE_QUERY_KEYS.invoices, "next-number", "fallback"] as const,
    url: FINANCE_ENDPOINTS.INVOICES,
    method: RequestMethod.GET,
    params: { preview_next_number: 1 },
    options: {
      enabled:
        enabled &&
        (primary.isError || (primary.isSuccess && !extractInvoiceNumberPayload(primary.data))),
    },
  });

  const active = !primary.isError ? primary : fallback;

  return {
    ...active,
    data: extractInvoiceNumberPayload(primary.data) ? primary.data : fallback.data,
    isLoading: primary.isLoading || (primary.isError && fallback.isLoading),
    refetch: async () => {
      const primaryResult = await primary.refetch();
      if (extractInvoiceNumberPayload(primaryResult.data)) {
        return primaryResult;
      }
      return fallback.refetch();
    },
  };
}

export function extractNextInvoiceNumber(response: unknown): string | null {
  return extractInvoiceNumberPayload(response);
}

export function useCreateManualInvoice() {
  return useMutationApi<FinanceInvoiceRow, ManualInvoicePayload>({
    url: FINANCE_ENDPOINTS.MANUAL_INVOICES,
    method: RequestMethod.POST,
    invalidateKeys: FINANCE_RELATED_QUERY_KEYS.map((key) => [...key]),
  });
}

export function extractManualInvoice(response: unknown): FinanceInvoiceRow | null {
  if (!response || typeof response !== "object") return null;
  const envelope = response as { data?: FinanceInvoiceRow };
  return envelope.data ?? null;
}

export function useServiceNames(enabled = true) {
  return useQueryApi<ServiceNameOption[]>({
    queryKey: [...FINANCE_QUERY_KEYS.serviceNames] as const,
    url: FINANCE_ENDPOINTS.SERVICE_NAMES,
    method: RequestMethod.GET,
    options: { enabled },
  });
}

export function extractServiceNames(response: unknown): ServiceNameOption[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is ServiceNameOption =>
      !!row && typeof row === "object" && typeof (row as ServiceNameOption).value === "string",
  );
}

export function useSaveServiceName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceName: string) => {
      const res = await callApi<{ value: string; label: string }>({
        url: FINANCE_ENDPOINTS.SERVICE_NAMES,
        method: RequestMethod.POST,
        data: { service_name: serviceName },
        shouldPopSuccess: false,
      });
      if (!res?.ok) {
        throw new Error("Could not save service name");
      }
      const payload = res.data as { data?: { value?: string } } | undefined;
      return payload?.data?.value ?? serviceName;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.serviceNames });
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.manualInvoices });
    },
  });
}

export function useDeleteServiceName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceName: string) => {
      const res = await callApi({
        url: FINANCE_ENDPOINTS.SERVICE_NAMES,
        method: RequestMethod.DELETE,
        params: { name: serviceName },
      });
      if (!res?.ok) {
        throw new Error("Could not remove service name");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.serviceNames });
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.manualInvoices });
    },
  });
}
