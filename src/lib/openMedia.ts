/**
 * Open / download helpers for signed Garage/S3 media URLs.
 */

function pathnameFromUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return pathnameFromUrl(url).toLowerCase().endsWith(".pdf");
}

export function openMediaInNewTab(url: string): void {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function filenameFromUrl(url: string, fallback: string): string {
  const path = pathnameFromUrl(url);
  const last = path.split("/").pop();
  if (last && last.includes(".")) {
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }
  return fallback;
}

/**
 * Download media via blob when possible (works with temporary signed URLs).
 * Falls back to opening the URL if fetch fails (e.g. CORS).
 */
export async function downloadMedia(url: string, filename?: string): Promise<void> {
  if (!url) return;

  const name = filename ?? filenameFromUrl(url, "download");

  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) {
      openMediaInNewTab(url);
      return;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    openMediaInNewTab(url);
  }
}
