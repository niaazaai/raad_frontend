/**
 * Safe in-app path from ?redirect= (open-redirect hardening).
 * Only same-origin relative paths are returned.
 */
export function getSafeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }
  if (trimmed.includes("\\") || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed, "https://raad.local");
    if (url.origin !== "https://raad.local") return null;
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
