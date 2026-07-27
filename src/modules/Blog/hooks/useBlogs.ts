import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryApi, useMutationApi } from "@/hooks";
import { callApi } from "@/services";
import { RequestMethod } from "@/data/constants/methods";
import { BLOG_ENDPOINTS, BLOG_QUERY_KEYS } from "../data/constants/endpoints";
import type { Blog, CreateBlogData, UpdateBlogData } from "../data/models";

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
