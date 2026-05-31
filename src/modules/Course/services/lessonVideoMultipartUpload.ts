import apiClient from "@/services/apiClient";
import { fetchCsrfCookie } from "@/services/callApi";
import type { ApiResponse } from "@/types/api";

export type LessonMultipartUploadOptions = {
  onProgress?: (loadedBytes: number, totalBytes: number) => void;
  signal?: AbortSignal;
};

type InitPayload = {
  upload_id: string;
  key: string;
  recommended_part_size_bytes: number;
};

type PresignBatchPayload = {
  parts: Array<{ part_number: number; url: string }>;
  expires_in_seconds: number;
};

function readApiMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const m = "message" in data ? (data as { message?: unknown }).message : undefined;
  return typeof m === "string" ? m : "";
}

function parseApiData<T>(body: unknown): T {
  if (!body || typeof body !== "object") throw new Error("Invalid API response");
  const envelope = body as ApiResponse<T>;
  if (!envelope.success) {
    throw new Error(
      typeof envelope.message === "string" ? envelope.message : "Request failed"
    );
  }
  return envelope.data as T;
}

function putPart(
  url: string,
  blob: Blob,
  contentType: string,
  onPartLoaded: (loaded: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onPartLoaded(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const raw = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
        if (!raw) {
          reject(
            new Error(
              "Part upload succeeded but ETag was missing. Ensure CORS exposes the ETag header."
            )
          );
          return;
        }
        resolve(raw.replace(/"/g, ""));
        return;
      }
      reject(new Error(`Part upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading a part"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.setRequestHeader("Content-Type", contentType || "application/octet-stream");
    if (signal) {
      if (signal.aborted) {
        reject(new Error("Upload cancelled"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(blob);
  });
}

/**
 * Sliding-window concurrency: always keeps up to `concurrency` tasks running.
 * Unlike batching, a new task starts as soon as any slot opens — no waiting for
 * a full batch to finish before the next one begins.
 */
async function slidingWindow<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
  signal?: AbortSignal
): Promise<void> {
  const queue = [...items];
  let active = 0;
  let firstError: unknown;

  await new Promise<void>((resolve, reject) => {
    function next() {
      if (firstError) return;
      if (signal?.aborted) {
        reject(new Error("Upload cancelled"));
        return;
      }

      while (active < concurrency && queue.length > 0) {
        const item = queue.shift()!;
        active++;
        worker(item)
          .then(() => {
            active--;
            next();
          })
          .catch((err) => {
            firstError = err;
            reject(err);
          });
      }

      if (active === 0 && queue.length === 0) resolve();
    }

    next();
  });
}

// 8 concurrent part uploads — good balance of throughput vs. connection overhead.
const CONCURRENT_PARTS = 8;

/**
 * Browser → Garage/S3 multipart upload.
 *
 * All presigned URLs are fetched in a single batch API call before any upload
 * begins, eliminating per-part API roundtrip latency. Parts then upload via a
 * sliding window for maximum throughput.
 */
export async function uploadLessonVideoMultipart(
  lessonId: number,
  file: File,
  options: LessonMultipartUploadOptions = {}
): Promise<void> {
  const { onProgress, signal } = options;
  const totalBytes = file.size;

  await fetchCsrfCookie();

  // ── 1. Initiate multipart upload ─────────────────────────────────────────
  const initRes = await apiClient.post<ApiResponse<InitPayload>>(
    `/lessons/${lessonId}/video/multipart/init`,
    {
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    }
  );
  if (!initRes.ok || !initRes.data) {
    throw new Error(readApiMessage(initRes.data) || "Could not start video upload");
  }
  const init = parseApiData<InitPayload>(initRes.data);
  const partSize = Math.max(
    5 * 1024 * 1024,
    init.recommended_part_size_bytes || 50 * 1024 * 1024
  );
  const totalParts = Math.ceil(totalBytes / partSize);

  // ── 2. Batch-presign all parts in one API call ───────────────────────────
  const presignRes = await apiClient.post<ApiResponse<PresignBatchPayload>>(
    `/lessons/${lessonId}/video/multipart/presign-batch`,
    { total_parts: totalParts }
  );
  if (!presignRes.ok || !presignRes.data) {
    throw new Error(readApiMessage(presignRes.data) || "Could not presign upload parts");
  }
  const { parts: partUrls } = parseApiData<PresignBatchPayload>(presignRes.data);

  // ── 3. Upload all parts concurrently via sliding window ──────────────────
  const results: Array<{ part_number: number; etag: string }> = new Array(totalParts);
  const loadedPerPart = new Array<number>(totalParts).fill(0);

  function reportProgress() {
    if (!onProgress) return;
    const loaded = loadedPerPart.reduce((sum, n) => sum + n, 0);
    onProgress(loaded, totalBytes);
  }

  await slidingWindow(
    partUrls,
    async ({ part_number, url }) => {
      const partIndex = part_number - 1;
      const offset = partIndex * partSize;
      const blob = file.slice(offset, Math.min(offset + partSize, totalBytes));

      const etag = await putPart(
        url,
        blob,
        file.type || "application/octet-stream",
        (loaded) => {
          loadedPerPart[partIndex] = loaded;
          reportProgress();
        },
        signal
      );

      loadedPerPart[partIndex] = blob.size;
      results[partIndex] = { part_number, etag };
      reportProgress();
    },
    CONCURRENT_PARTS,
    signal
  );

  onProgress?.(totalBytes, totalBytes);

  // ── 4. Complete the multipart upload ─────────────────────────────────────
  const completeRes = await apiClient.post(
    `/lessons/${lessonId}/video/multipart/complete`,
    { parts: results.filter(Boolean) }
  );
  if (!completeRes.ok) {
    const msg = readApiMessage(completeRes.data);
    throw new Error(msg || `Could not finalize video upload (HTTP ${completeRes.status})`);
  }
}

export async function abortLessonMultipartUpload(lessonId: number): Promise<void> {
  await fetchCsrfCookie();
  const res = await apiClient.post(`/lessons/${lessonId}/video/multipart/abort`);
  if (!res.ok && res.status !== 404) {
    throw new Error(readApiMessage(res.data) || "Abort failed");
  }
}
