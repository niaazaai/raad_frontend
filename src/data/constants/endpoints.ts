/**
 * API endpoint definitions (relative to /api/v1).
 * CSRF is handled by Sanctum's built-in /sanctum/csrf-cookie — not listed here.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    REGISTER: "/auth/register",
    EMAIL_RESEND: "/auth/email/resend",
    PREFERENCES: "/auth/preferences",
  },

  NOTIFICATIONS: {
    BASE: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
  },
} as const;
