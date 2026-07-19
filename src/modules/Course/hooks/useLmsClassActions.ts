import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import { courseQueryKeys } from "../data/constants/queryKeys";

export function useNextClassCode(enabled = false) {
  return useQueryApi<{ class_code: string }>({
    queryKey: ["lms-classes", "next-class-code"],
    url: "/lms-classes/next-class-code",
    method: RequestMethod.GET,
    options: { enabled },
  });
}

export function useNextStudentCode(enabled = false) {
  return useQueryApi<{ student_code: string }>({
    queryKey: ["students", "next-student-code"],
    url: "/students/next-student-code",
    method: RequestMethod.GET,
    options: { enabled },
  });
}

function useLmsClassActionMutation(pathSuffix: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, end_date }: { id: number; end_date?: string }) => {
      const response = await callApi({
        url: `/lms-classes/${id}/${pathSuffix}`,
        method: RequestMethod.POST,
        data: end_date ? { end_date } : undefined,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Request failed");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", "entity", "lms-classes"] });
    },
  });
}

export function useArchiveLmsClassMutation() {
  return useLmsClassActionMutation("archive");
}

export function useRestoreLmsClassMutation() {
  return useLmsClassActionMutation("restore");
}

export function useCompleteLmsClassMutation() {
  return useLmsClassActionMutation("complete");
}
