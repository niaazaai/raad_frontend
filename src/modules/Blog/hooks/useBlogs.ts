import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryApi, useMutationApi } from "@/hooks";
import { callApi } from "@/services";
import { RequestMethod } from "@/data/constants/methods";
import { BLOG_ENDPOINTS, BLOG_QUERY_KEYS } from "../data/constants/endpoints";
import type { Blog, BlogStatus, CreateBlogData, UpdateBlogData } from "../data/models";

export function useBlogs(params?: Record<string, unknown>) {
  return useQueryApi<Blog[]>({
    queryKey: [...BLOG_QUERY_KEYS.blogs, params],
    url: BLOG_ENDPOINTS.BASE,
    method: RequestMethod.GET,
    params,
  });
}

export function useBlog(id: number) {
  return useQueryApi<Blog>({
    queryKey: BLOG_QUERY_KEYS.blog(id),
    url: BLOG_ENDPOINTS.BY_ID(id),
    method: RequestMethod.GET,
    options: { enabled: !!id },
  });
}

export function useCreateBlog() {
  return useMutationApi<Blog, CreateBlogData | Record<string, unknown>>({
    url: BLOG_ENDPOINTS.BASE,
    method: RequestMethod.POST,
    hasFiles: true,
    invalidateKeys: [BLOG_QUERY_KEYS.blogs],
  });
}

export function useUpdateBlog(id: number) {
  return useMutationApi<Blog, UpdateBlogData | Record<string, unknown>>({
    url: BLOG_ENDPOINTS.BY_ID(id),
    method: RequestMethod.PUT,
    hasFiles: true,
    invalidateKeys: [BLOG_QUERY_KEYS.blogs, BLOG_QUERY_KEYS.blog(id)],
  });
}

export function useDeleteBlogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await callApi({
        url: BLOG_ENDPOINTS.BY_ID(id),
        method: RequestMethod.DELETE,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.blogs });
    },
  });
}

export function useSetBlogStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BlogStatus }) => {
      const res = await callApi({
        url: BLOG_ENDPOINTS.BY_ID(id),
        method: RequestMethod.PUT,
        data: { status },
      });
      if (!res.ok) {
        const message = (res.data as { message?: string } | undefined)?.message;
        throw new Error(message ?? "Update failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.blogs });
    },
  });
}

export function useSaveBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: string) => {
      const res = await callApi<{ value: string; label: string }>({
        url: BLOG_ENDPOINTS.CATEGORIES,
        method: RequestMethod.POST,
        data: { category },
        shouldPopSuccess: false,
      });
      if (!res?.ok) {
        throw new Error("Could not save category");
      }
      const payload = res.data as { data?: { value?: string } } | undefined;
      return payload?.data?.value ?? category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.blogs });
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: string) => {
      const res = await callApi({
        url: BLOG_ENDPOINTS.CATEGORY(category),
        method: RequestMethod.DELETE,
      });
      if (!res?.ok) {
        throw new Error("Could not remove category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.blogs });
    },
  });
}

export function useToggleBlogPublishedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await callApi<Blog>({
        url: BLOG_ENDPOINTS.TOGGLE_PUBLISHED(id),
        method: RequestMethod.POST,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.blogs });
    },
  });
}
