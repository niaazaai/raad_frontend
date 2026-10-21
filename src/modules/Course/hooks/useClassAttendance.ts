import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { ApiResponse } from "@/types";
import type { DataTablePaginationMeta } from "@/types/datatable";

export type AttendanceMarkStatus = "present" | "absent" | "leave";

export function nextAttendanceStatus(current: string | null | undefined): AttendanceMarkStatus {
  if (current === "present") return "absent";
  if (current === "absent") return "leave";
  return "present";
}

export interface AttendanceDateCol {
  date: string;
  day: number;
  weekday?: string;
  month: string;
  month_key: string;
  week_key?: string;
  is_friday: boolean;
  is_past: boolean;
  is_today: boolean;
  is_future: boolean;
  week_separator?: boolean;
  editable: boolean;
}

export interface AttendanceCell {
  status: string | null;
  display: string;
  editable: boolean;
}

export interface AttendanceStudentRow {
  enrollment_id: number;
  student_id: number;
  student_code?: string;
  full_name?: string;
  father_name?: string | null;
  attendance: Record<string, AttendanceCell>;
  total_present: number;
  total_absent: number;
  total_leave?: number;
}

export interface AttendanceGrid {
  class: {
    id: number;
    name?: string;
    class_code?: string;
    status?: string | null;
    can_edit?: boolean;
    schedule_days?: string | null;
    schedule_days_label?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  dates: AttendanceDateCol[];
  students: AttendanceStudentRow[];
}

export interface AttendanceOverviewClass {
  id: number;
  class_code?: string | null;
  name: string;
  main_category_name?: string | null;
  sub_category_name?: string | null;
  instructor_name?: string | null;
  students_count?: number | null;
  present_rate?: number | null;
  absent_rate?: number | null;
  leave_rate?: number | null;
  schedule_days?: string | null;
  status?: string;
}

export type MarkAttendanceVars = {
  student_id: number;
  date: string;
  status: AttendanceMarkStatus;
};

type MarkAttendanceRecord = {
  student_id?: number;
  attendance_date?: string;
  status?: AttendanceMarkStatus | string;
};

export const classAttendanceQueryKey = (classId: number) =>
  ["lms-classes", classId, "attendance"] as const;

export const attendanceOverviewQueryKey = ["lms-classes", "attendance-overview"] as const;

export function attendanceCellKey(studentId: number, date: string): string {
  return `${studentId}|${date}`;
}

export function useClassAttendance(classId: number) {
  return useQueryApi<AttendanceGrid>({
    queryKey: classAttendanceQueryKey(classId),
    url: `/lms-classes/${classId}/attendance`,
    method: RequestMethod.GET,
    options: {
      enabled: classId > 0,
      refetchOnWindowFocus: true,
    },
  });
}

export function useAttendanceOverview(params?: Record<string, unknown>) {
  return useQueryApi<AttendanceOverviewClass[]>({
    queryKey: [...attendanceOverviewQueryKey, params],
    url: "/lms-classes/attendance-overview",
    method: RequestMethod.GET,
    params,
  });
}

function letterFor(status: AttendanceMarkStatus | null): string {
  if (status === "present") return "P";
  if (status === "leave") return "L";
  if (status === "absent") return "A";
  return "";
}

function normalizeStatus(status: string | null | undefined): AttendanceMarkStatus | null {
  if (status === "present" || status === "absent" || status === "leave") return status;
  return null;
}

/**
 * Set one cell's status (including null) and recompute that student's P/A/L totals.
 * Does not touch other students — safe for concurrent mark races.
 */
function applyCellStatus(
  response: ApiResponse<AttendanceGrid> | undefined,
  studentId: number,
  date: string,
  nextStatus: AttendanceMarkStatus | null
): ApiResponse<AttendanceGrid> | undefined {
  if (!response?.data?.students) return response;

  const students = response.data.students.map((student) => {
    if (student.student_id !== studentId) return student;

    const prev = student.attendance[date];
    const prevStatus = normalizeStatus(prev?.status);
    if (prevStatus === nextStatus) return student;

    let total_present = student.total_present;
    let total_absent = student.total_absent;
    let total_leave = student.total_leave ?? 0;

    if (prevStatus === "present") total_present = Math.max(0, total_present - 1);
    if (prevStatus === "absent") total_absent = Math.max(0, total_absent - 1);
    if (prevStatus === "leave") total_leave = Math.max(0, total_leave - 1);
    if (nextStatus === "present") total_present += 1;
    if (nextStatus === "absent") total_absent += 1;
    if (nextStatus === "leave") total_leave += 1;

    return {
      ...student,
      total_present,
      total_absent,
      total_leave,
      attendance: {
        ...student.attendance,
        [date]: {
          status: nextStatus,
          display: letterFor(nextStatus),
          editable: prev?.editable ?? true,
        },
      },
    };
  });

  return {
    ...response,
    data: {
      ...response.data,
      students,
    },
  };
}

function readCellStatus(
  response: ApiResponse<AttendanceGrid> | undefined,
  studentId: number,
  date: string
): AttendanceMarkStatus | null {
  const student = response?.data?.students?.find((s) => s.student_id === studentId);
  return normalizeStatus(student?.attendance?.[date]?.status);
}

/**
 * Instant cell UX: optimistic cache update, no full-grid refetch on every click.
 * Per-cell pending lock + cell-level rollback keep concurrent marks consistent.
 */
export function useMarkClassAttendance(classId: number) {
  const queryClient = useQueryClient();
  const queryKey = classAttendanceQueryKey(classId);
  const [pendingCells, setPendingCells] = useState<ReadonlySet<string>>(() => new Set());
  const pendingRef = useRef<Set<string>>(new Set());

  const mutation = useMutationApi<MarkAttendanceRecord, MarkAttendanceVars>({
    url: `/lms-classes/${classId}/attendance`,
    method: RequestMethod.POST,
    invalidateKeys: [],
    shouldPopSuccess: false,
    options: {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey });

        const snapshots = queryClient.getQueriesData<ApiResponse<AttendanceGrid>>({ queryKey });
        const prevStatus = readCellStatus(snapshots[0]?.[1], vars.student_id, vars.date);

        queryClient.setQueriesData<ApiResponse<AttendanceGrid>>({ queryKey }, (old) =>
          applyCellStatus(old, vars.student_id, vars.date, vars.status)
        );

        return { prevStatus };
      },
      onSuccess: (response, vars) => {
        const confirmed = normalizeStatus(response?.data?.status) ?? vars.status;
        queryClient.setQueriesData<ApiResponse<AttendanceGrid>>({ queryKey }, (old) =>
          applyCellStatus(old, vars.student_id, vars.date, confirmed)
        );
      },
      onError: (_err, vars, context) => {
        const prevStatus =
          (context as { prevStatus?: AttendanceMarkStatus | null } | undefined)?.prevStatus ?? null;
        queryClient.setQueriesData<ApiResponse<AttendanceGrid>>({ queryKey }, (old) =>
          applyCellStatus(old, vars.student_id, vars.date, prevStatus)
        );
      },
    },
  });

  const isCellPending = useCallback(
    (studentId: number, date: string) => pendingCells.has(attendanceCellKey(studentId, date)),
    [pendingCells]
  );

  const markCell = useCallback(
    (vars: MarkAttendanceVars) => {
      const key = attendanceCellKey(vars.student_id, vars.date);
      if (pendingRef.current.has(key)) return;

      pendingRef.current.add(key);
      setPendingCells(new Set(pendingRef.current));

      mutation.mutate(vars, {
        onSettled: () => {
          pendingRef.current.delete(key);
          setPendingCells(new Set(pendingRef.current));
        },
      });
    },
    [mutation]
  );

  return {
    ...mutation,
    markCell,
    isCellPending,
    pendingCells,
  };
}

export function extractAttendanceGrid(response: unknown): AttendanceGrid | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: AttendanceGrid }).data;
  if (!data || typeof data !== "object") return null;
  return data;
}

export function extractAttendanceOverview(response: unknown): AttendanceOverviewClass[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (Array.isArray(data)) return data as AttendanceOverviewClass[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: AttendanceOverviewClass[] }).data;
  }
  return [];
}

export function extractAttendanceOverviewPagination(
  response: unknown
): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}
