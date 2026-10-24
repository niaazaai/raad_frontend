import { create, ApisauceInstance } from "apisauce";

/**
 * API base path (same-origin). Using a relative path avoids Vite/Rollup evaluating
 * `window` at build time and baking `http://localhost:8000` into the production bundle.
 */
export const API_V1_BASE = "/api/v1";

/** Sanctum CSRF endpoint (same-origin). */
export const CSRF_COOKIE_PATH = "/sanctum/csrf-cookie";

/**
 * Absolute origin for rare cases (e.g. debugging). Prefer relative paths in the UI.
 * No hard-coded host: a missing env var outside the browser fails the build/start.
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  throw new Error(
    "VITE_API_BASE_URL is not set and window is unavailable. Refusing to call a hard-coded host."
  );
}

function isCrossOriginRequest(url: string | undefined): boolean {
  if (!url || typeof window === "undefined") return false;
  try {
    return new URL(url, window.location.origin).origin !== window.location.origin;
  } catch {
    return false;
  }
}

const apiClient: ApisauceInstance = create({
  baseURL: API_V1_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

/** Attach the XSRF-TOKEN cookie value on same-origin requests only. */
apiClient.addRequestTransform((request) => {
  if (isCrossOriginRequest(request.url)) return;
  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken && request.headers) {
    request.headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
  }
});

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default apiClient;
