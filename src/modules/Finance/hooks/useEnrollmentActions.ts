import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { ClassStudentInvoice, ClassStudentRow } from "@/modules/Course/hooks/useClassStudents";
import {
  FINANCE_ENDPOINTS,
  FINANCE_QUERY_KEYS,
  FINANCE_RELATED_QUERY_KEYS,
} from "../data/constants/endpoints";
import type {
  ClassStudentMoveRow,
  FinanceClassRow,
  TransactionPayer,
} from "../data/models/FinanceReport";

const relatedKeys = FINANCE_RELATED_QUERY_KEYS.map((key) => [...key]);

export interface RecoverWriteOffPayload {
  amount: number;
  transaction_date?: string;
  currency?: string;
  exchange_rate?: number;
  payer?: TransactionPayer;
  notes?: string;
}

/** Collect money that was written off as irrecoverable (recorded as new income + write-off reversal). */
export function useRecoverWriteOff(classId: number, enrollmentId: number) {
  return useMutationApi<
    { enrollment: ClassStudentRow; invoice?: ClassStudentInvoice | null },
    RecoverWriteOffPayload
  >({
    url: FINANCE_ENDPOINTS.WRITE_OFF_RECOVERY(classId, enrollmentId),
    method: RequestMethod.POST,
    invalidateKeys: relatedKeys,
  });
}

export interface MoveEnrollmentPayload {
  target_class_id: number;
  move_date?: string;
  reason?: string;
}

export function useMoveClassStudent(classId: number, enrollmentId: number) {
  return useMutationApi<
    { enrollment: ClassStudentRow; move: ClassStudentMoveRow },
    MoveEnrollmentPayload
  >({
    url: FINANCE_ENDPOINTS.MOVE_ENROLLMENT(classId, enrollmentId),
    method: RequestMethod.POST,
    invalidateKeys: relatedKeys,
  });
}

export function useEnrollmentMoves(
  classId: number | null | undefined,
  enrollmentId: number | null | undefined
) {
  const enabled = Boolean(classId && enrollmentId);
  return useQueryApi<ClassStudentMoveRow[]>({
    queryKey: FINANCE_QUERY_KEYS.enrollmentMoves(enrollmentId ?? 0),
    url: FINANCE_ENDPOINTS.ENROLLMENT_MOVES(classId ?? 0, enrollmentId ?? 0),
    method: RequestMethod.GET,
    options: { enabled },
  });
}

export function extractMoves(response: unknown): ClassStudentMoveRow[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  return Array.isArray(data) ? (data as ClassStudentMoveRow[]) : [];
}

/** One enrollment's account (same shape as a finance report row), always fetched fresh. */
export function useEnrollmentAccount(enrollmentId: number | null | undefined) {
  return useQueryApi<FinanceClassRow>({
    queryKey: FINANCE_QUERY_KEYS.enrollmentAccount(enrollmentId ?? 0),
    url: FINANCE_ENDPOINTS.ENROLLMENT_ACCOUNT(enrollmentId ?? 0),
    method: RequestMethod.GET,
    options: { enabled: Boolean(enrollmentId), staleTime: 0, refetchOnMount: "always" },
  });
}

export function extractEnrollmentAccount(response: unknown): FinanceClassRow | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: unknown }).data;
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as FinanceClassRow)
    : null;
}
