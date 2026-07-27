export const BLOG_ENDPOINTS = {
  BASE: "/blogs",
  BY_ID: (id: number) => `/blogs/${id}`,
  TOGGLE_PUBLISHED: (id: number) => `/blogs/${id}/toggle-published`,
} as const;

export const BLOG_QUERY_KEYS = {
  blogs: ["blogs"] as const,
  blog: (id: number) => ["blogs", id] as const,
};
