import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import { courseQueryKeys } from "../data/constants/queryKeys";
import { PUBLIC_QUERY_KEYS } from "@/data/constants/publicEndpoints";

export interface StudentSuccessStory {
  id: number;
  student_id: number;
  image_url?: string | null;
  sort_order?: number;
}

function extractStories(response: unknown): StudentSuccessStory[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (Array.isArray(data)) return data as StudentSuccessStory[];
  return [];
}

export function useStudentSuccessStories(studentId: number | null, enabled = true) {
  return useQueryApi<StudentSuccessStory[]>({
    queryKey: ["students", studentId, "success-stories"],
    url: `/students/${studentId ?? 0}/success-stories`,
    method: RequestMethod.GET,
    options: {
      enabled: enabled && studentId != null,
    },
  });
}

export function useCreateStudentSuccessStory(studentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await callApi({
        url: `/students/${studentId}/success-stories`,
        method: RequestMethod.POST,
        data: { success_story_image_file: file },
        hasFiles: true,
        shouldPopError: false,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to add success story");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", studentId, "success-stories"] });
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.entity("lms-class-students") });
      queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccess });
      queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccessAll });
    },
  });
}

export function useDeleteStudentSuccessStory(studentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: number) => {
      const response = await callApi({
        url: `/students/${studentId}/success-stories/${storyId}`,
        method: RequestMethod.DELETE,
        shouldPopError: false,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to remove success story");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", studentId, "success-stories"] });
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.entity("lms-class-students") });
      queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccess });
      queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccessAll });
    },
  });
}

export { extractStories as extractStudentSuccessStoriesFromResponse };
