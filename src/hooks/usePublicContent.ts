import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { PUBLIC_ENDPOINTS, PUBLIC_QUERY_KEYS } from "@/data/constants/publicEndpoints";

export interface PublicBlog {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  image_signed_url?: string | null;
  author: string;
  author_id?: number | null;
  author_name?: string | null;
  category: string;
  category_label?: string;
  language: string;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
}

export interface PublicStudentSuccess {
  id: number;
  student_code?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string | null;
  success_story_image_url?: string | null;
  grade?: string | null;
  result?: string | null;
}

export function usePublicBlogs(params?: Record<string, unknown>) {
  return useQueryApi<PublicBlog[]>({
    queryKey: [...PUBLIC_QUERY_KEYS.blogs, params],
    url: PUBLIC_ENDPOINTS.BLOGS,
    method: RequestMethod.GET,
    params,
    options: { staleTime: 60_000 },
  });
}

export function usePublicBlog(id: number) {
  return useQueryApi<PublicBlog>({
    queryKey: PUBLIC_QUERY_KEYS.blog(id),
    url: PUBLIC_ENDPOINTS.BLOG_BY_ID(id),
    method: RequestMethod.GET,
    options: { enabled: !!id },
  });
}

export function usePublicStudentSuccess(limit = 4) {
  return useQueryApi<PublicStudentSuccess[]>({
    queryKey: [...PUBLIC_QUERY_KEYS.studentSuccess, limit],
    url: PUBLIC_ENDPOINTS.STUDENT_SUCCESS,
    method: RequestMethod.GET,
    params: { limit },
    options: { staleTime: 60_000 },
  });
}

export function usePublicStudentSuccessAll(params?: Record<string, unknown>) {
  return useQueryApi<PublicStudentSuccess[]>({
    queryKey: [...PUBLIC_QUERY_KEYS.studentSuccessAll, params],
    url: PUBLIC_ENDPOINTS.STUDENT_SUCCESS_ALL,
    method: RequestMethod.GET,
    params,
    options: { staleTime: 60_000 },
  });
}

export function getPublicListFromResponse<T>(response: unknown): T[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: T[] | { data?: T[] } }).data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: T[] }).data))
    return (data as { data: T[] }).data;
  return [];
}

export function getPublicItemFromResponse<T>(response: unknown): T | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: T }).data;
  return data ?? null;
}

export function getPublicPaginationFromResponse(response: unknown) {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: unknown } }).meta?.pagination ?? null;
}
