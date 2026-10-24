import apiClient from "@/services/apiClient";

/**
 * Open / download helpers for signed Garage/S3 media URLs and same-origin files.
 * Same-origin requests go through the Apisauce client (cookies + XSRF).
 * Cross-origin signed URLs must not send cookies: Garage CORS is `*`, which
 * rejects credentialed requests.
 */

function pathnameFromUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function isCrossOrigin(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin !== window.location.origin;
  } catch {
    return true;
  }
}

function isHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url, window.location.origin).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return pathnameFromUrl(url).toLowerCase().endsWith(".pdf");
}

export function openMediaInNewTab(url: string): void {
  if (!url || !isHttpUrl(url)) return;
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
 * Falls back to opening the URL if the request fails (for example CORS).
 */
export async function downloadMedia(url: string, filename?: string): Promise<void> {
  if (!url || !isHttpUrl(url)) return;

  const name = filename ?? filenameFromUrl(url, "download");
  const crossOrigin = isCrossOrigin(url);

  try {
    const response = await apiClient.get<Blob>(url, undefined, {
      responseType: "blob",
      withCredentials: !crossOrigin,
      headers: { Accept: "*/*" },
      transformRequest: [
        (data, headers) => {
          if (crossOrigin && headers && typeof headers === "object") {
            const bag = headers as { delete?: (name: string) => void };
            bag.delete?.("Content-Type");
            bag.delete?.("X-XSRF-TOKEN");
          }
          return data;
        },
      ],
    });

    if (!response.ok || !(response.data instanceof Blob)) {
      openMediaInNewTab(url);
      return;
    }

    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch {
    openMediaInNewTab(url);
  }
}
