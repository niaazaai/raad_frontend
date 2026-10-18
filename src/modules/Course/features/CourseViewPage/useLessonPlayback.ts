import { useQueryApi } from "@/hooks/common/useQueryApi";

export type LessonPlaybackPayload = {
  type: "hls" | "progressive";
  src: string;
  qualities?: { label: string; src: string }[] | null;
  /** Protected playback session; must be sent as the player header on every HLS request. */
  session?: string | null;
};

/**
 * Fresh playback info for a lesson (GET /lessons/:id/playback).
 */
export function useLessonPlayback(lessonId: number | null, enabled: boolean) {
  return useQueryApi<LessonPlaybackPayload>({
    queryKey: ["course", "lesson-playback", lessonId],
    url: lessonId != null ? `/lessons/${lessonId}/playback` : `/lessons/0/playback`,
    options: {
      enabled: enabled && lessonId != null,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
}
