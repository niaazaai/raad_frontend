import { useMutationApi, useQueryApi } from "./common/useQueryApi";
import { RequestMethod } from "@/data/constants/methods";
import type { ApiResponse } from "@/types/api";

export interface CourseLearnSummary {
  id: number;
  title: string;
  short_description: string | null;
  long_description: string | null;
  prerequisites: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  language: string | null;
  level: string | null;
}

export interface CourseLearnModule {
  id: number;
  title: string;
}

export interface CourseLearnLesson {
  id: number;
  course_module_id: number;
  title: string;
  description: string | null;
  video_status: string | null;
  video_duration: number | null;
  thumbnail_url: string | null;
  watched: boolean;
  watch_count: number;
}

export interface CourseLearnFile {
  id: number;
  title: string;
  description: string | null;
  download_url: string | null;
  file_extension?: string | null;
  /** Bytes from storage; may arrive as a numeric string from JSON. */
  file_size?: number | string | null;
}

export interface CourseLearnChapterFile extends CourseLearnFile {
  course_module_id: number | null;
}

export interface CourseLearnQuizFile {
  id: number;
  lesson_id: number | null;
  title: string;
  description: string | null;
  download_url: string | null;
  file_extension?: string | null;
  file_size?: number | string | null;
  uploaded_at: string | null;
}

/** Mock tests belong to the course (not a specific lesson). */
export interface CourseLearnMockTest {
  id: number;
  title: string;
  description: string | null;
  download_url: string | null;
  file_extension?: string | null;
  file_size?: number | string | null;
  uploaded_at: string | null;
}

export interface CourseLearnPayload {
  course: CourseLearnSummary;
  modules: CourseLearnModule[];
  lessons: CourseLearnLesson[];
  chapter_files: CourseLearnChapterFile[];
  downloadable_resources: CourseLearnFile[];
  quiz_files: CourseLearnQuizFile[];
  mock_tests: CourseLearnMockTest[];
}

export function getCourseLearnFromResponse(
  res: ApiResponse<CourseLearnPayload> | undefined,
): CourseLearnPayload | null {
  const d = res?.data as CourseLearnPayload | undefined;
  if (d && typeof d === "object" && "course" in d && "lessons" in d) {
    return d;
  }
  return null;
}

export function useCourseLearn(courseId: number | null, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && courseId != null;
  return useQueryApi<CourseLearnPayload>({
    queryKey: ["course", "learn", courseId],
    url: courseId != null ? `/courses/${courseId}/learn` : "/courses/0/learn",
    method: RequestMethod.GET,
    options: {
      enabled,
      retry: false,
    },
  });
}

export interface MyEnrollmentItem {
  id: number;
  course_id: number;
  plan_id: number;
  course_title: string | null;
  course_short_description: string | null;
  course_thumbnail_url: string | null;
  course_language: string | null;
  course_level: string | null;
  course_main_category: string | null;
  course_sub_category: string | null;
  plan_name: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_status: string | null;
  lessons_total: number;
  lessons_watched: number;
  progress_percent: number;
  resume_lesson_id?: number | null;
  resume_lesson_title?: string | null;
  resume_position_seconds?: number | null;
}

export function useRecordLessonWatch() {
  return useMutationApi<
    { watched: boolean; watch_count: number; lesson_id: number },
    { lesson_id: number; session_id: string; position_seconds?: number }
  >({
    url: "/me/lesson-watches",
    method: RequestMethod.POST,
    shouldPopSuccess: false,
    shouldPopError: false,
    invalidateKeys: [["me", "enrollments"], ["course", "learn"]],
  });
}

export interface MyEnrollmentsPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  has_more_pages: boolean;
}

export function useMyEnrollments(params?: {
  page?: number;
  per_page?: number;
  course_id?: number | null;
  enabled?: boolean;
}) {
  const courseId = params?.course_id;
  const page = params?.page ?? 1;
  const perPage = params?.per_page ?? 12;
  const enabled = params?.enabled ?? true;

  return useQueryApi<MyEnrollmentItem[]>({
    queryKey: ["me", "enrollments", page, perPage, courseId ?? "all"],
    url: "/me/enrollments",
    method: RequestMethod.GET,
    params: {
      page,
      per_page: perPage,
      ...(courseId != null ? { course_id: courseId } : {}),
    },
    options: {
      staleTime: 30_000,
      enabled,
    },
  });
}

export function getMyEnrollmentsFromResponse(
  res: ApiResponse<MyEnrollmentItem[] | { data?: MyEnrollmentItem[] }> | undefined,
): MyEnrollmentItem[] {
  if (!res?.data) return [];
  const d = res.data as unknown;
  if (Array.isArray(d)) return d as MyEnrollmentItem[];
  if (d && typeof d === "object" && "data" in d && Array.isArray((d as { data: MyEnrollmentItem[] }).data)) {
    return (d as { data: MyEnrollmentItem[] }).data;
  }
  return [];
}

export function getMyEnrollmentsPagination(res: ApiResponse<unknown> | undefined): MyEnrollmentsPagination | null {
  const meta = res?.meta as { pagination?: MyEnrollmentsPagination } | undefined;
  return meta?.pagination ?? null;
}
