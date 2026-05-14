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
              "Part upload succeeded but ETag was missing. If uploads go to Garage/S3 on another origin, ensure CORS exposes the ETag header."
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

const CONCURRENT_PARTS = 5;

/**
 * Browser → Garage/S3 multipart upload using Laravel presign endpoints.
 * Uploads CONCURRENT_PARTS parts in parallel for faster throughput on large files.
 */
export async function uploadLessonVideoMultipart(
  lessonId: number,
  file: File,
  options: LessonMultipartUploadOptions = {}
): Promise<void> {
  const { onProgress, signal } = options;
  const totalBytes = file.size;

  await fetchCsrfCookie();

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
    init.recommended_part_size_bytes || 10 * 1024 * 1024
  );

  const totalParts = Math.ceil(totalBytes / partSize);
  const results: Array<{ part_number: number; etag: string }> = new Array(totalParts);
  const loadedPerPart = new Array<number>(totalParts).fill(0);

  function reportProgress() {
    if (!onProgress) return;
    const loaded = loadedPerPart.reduce((sum, n) => sum + n, 0);
    onProgress(loaded, totalBytes);
  }

  async function uploadOnePart(partIndex: number): Promise<void> {
    if (signal?.aborted) throw new Error("Upload cancelled");

    const partNumber = partIndex + 1;
    const offset = partIndex * partSize;
    const end = Math.min(offset + partSize, totalBytes);
    const blob = file.slice(offset, end);

    const presignRes = await apiClient.post<ApiResponse<{ url: string }>>(
      `/lessons/${lessonId}/video/multipart/presign`,
      { part_number: partNumber }
    );
    if (!presignRes.ok || !presignRes.data) {
      throw new Error(readApiMessage(presignRes.data) || "Could not prepare upload chunk");
    }
    const presignPayload = parseApiData<{ url: string }>(presignRes.data);
    const url = presignPayload.url;
    if (!url) throw new Error("Presign URL missing");

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
    results[partIndex] = { part_number: partNumber, etag };
    reportProgress();
  }

  for (let batchStart = 0; batchStart < totalParts; batchStart += CONCURRENT_PARTS) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    const batchPromises: Promise<void>[] = [];
    for (
      let i = batchStart;
      i < Math.min(batchStart + CONCURRENT_PARTS, totalParts);
      i++
    ) {
      batchPromises.push(uploadOnePart(i));
    }
    await Promise.all(batchPromises);
  }

  onProgress?.(totalBytes, totalBytes);

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
