export const PUBLIC_ENDPOINTS = {
  STATS: "/public/stats",
  CONTACT: "/public/contact",
  BLOGS: "/public/blogs",
  BLOG_BY_ID: (id: number) => `/public/blogs/${id}`,
  STUDENT_SUCCESS: "/public/student-success",
  STUDENT_SUCCESS_ALL: "/public/student-success/all",
} as const;

export const PUBLIC_QUERY_KEYS = {
  stats: ["public", "stats"] as const,
  blogs: ["public", "blogs"] as const,
  blog: (id: number) => ["public", "blogs", id] as const,
  studentSuccess: ["public", "student-success"] as const,
  studentSuccessAll: ["public", "student-success", "all"] as const,
};
