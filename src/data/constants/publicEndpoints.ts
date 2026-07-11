export const PUBLIC_ENDPOINTS = {
  STATS: "/public/stats",
  CONTACT: "/public/contact",
} as const;

export const PUBLIC_QUERY_KEYS = {
  stats: ["public", "stats"] as const,
};
