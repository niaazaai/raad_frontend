import { useQueryClient } from "@tanstack/react-query";
import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { ApiResponse } from "@/types";

export interface AttendanceDateCol {
  date: string;
  day: number;
  month: string;
  month_key: string;
  is_friday: boolean;
  is_past: boolean;
  is_today: boolean;
  is_future: boolean;
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
}

export interface AttendanceGrid {
  class: {
    id: number;
    name?: string;
    class_code?: string;
    start_date?: string | null;
    end_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  dates: AttendanceDateCol[];
  students: AttendanceStudentRow[];
}

type MarkAttendanceVars = {
  student_id: number;
  date: string;
  status: "present" | "absent";
};

type AttendanceCacheSnapshot = Array<[unknown, unknown]>;

export const classAttendanceQueryKey = (classId: number) =>
  ["lms-classes", classId, "attendance"] as const;

export function useClassAttendance(classId: number) {
  return useQueryApi<AttendanceGrid>({
    queryKey: classAttendanceQueryKey(classId),
    url: `/lms-classes/${classId}/attendance`,
    method: RequestMethod.GET,
    options: { enabled: classId > 0 },
  });
}

function applyOptimisticMark(
  response: ApiResponse<AttendanceGrid> | undefined,
  vars: MarkAttendanceVars
): ApiResponse<AttendanceGrid> | undefined {
  if (!response?.data?.students) return response;

  const students = response.data.students.map((student) => {
    if (student.student_id !== vars.student_id) return student;

    const prev = student.attendance[vars.date];
    const prevStatus = prev?.status ?? null;
    if (prevStatus === vars.status) return student;

    let total_present = student.total_present;
    let total_absent = student.total_absent;

    if (prevStatus === "present") total_present = Math.max(0, total_present - 1);
    if (prevStatus === "absent") total_absent = Math.max(0, total_absent - 1);
    if (vars.status === "present") total_present += 1;
    if (vars.status === "absent") total_absent += 1;

    return {
      ...student,
      total_present,
      total_absent,
      attendance: {
        ...student.attendance,
        [vars.date]: {
          status: vars.status,
          display: vars.status === "present" ? "P" : "A",
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

/**
 * Instant checkbox UX: optimistic cache update, no full-grid refetch on every click.
 */
export function useMarkClassAttendance(classId: number) {
  const queryClient = useQueryClient();
  const queryKey = classAttendanceQueryKey(classId);

  return useMutationApi<unknown, MarkAttendanceVars>({
    url: `/lms-classes/${classId}/attendance`,
    method: RequestMethod.POST,
    invalidateKeys: [],
    options: {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey });

        const previous = queryClient.getQueriesData<ApiResponse<AttendanceGrid>>({
          queryKey,
        }) as AttendanceCacheSnapshot;

        queryClient.setQueriesData<ApiResponse<AttendanceGrid>>({ queryKey }, (old) =>
          applyOptimisticMark(old, vars)
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        const snapshot = (context as { previous?: AttendanceCacheSnapshot } | undefined)
          ?.previous;
        snapshot?.forEach(([key, data]) => {
          queryClient.setQueryData(key as ReturnType<typeof classAttendanceQueryKey>, data);
        });
      },
    },
  });
}

export function extractAttendanceGrid(response: unknown): AttendanceGrid | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: AttendanceGrid }).data;
  if (!data || typeof data !== "object") return null;
  return data;
}
