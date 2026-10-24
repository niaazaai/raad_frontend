import { useEffect, useState, type MouseEvent } from "react";
import { Download, File as Page, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadMedia, isPdfUrl, openMediaInNewTab } from "@/lib/openMedia";

interface MediaPreviewProps {
  url: string;
  alt: string;
  filename?: string;
  /** Visual variant for the image itself */
  imageClassName?: string;
  className?: string;
  /** When true, render a PDF link card instead of an image */
  preferPdfCard?: boolean;
}

/**
 * Normalize API media URLs (signed Garage/S3, absolute, or site-relative).
 */
export function resolveMediaSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const u = String(raw).trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("blob:") || u.startsWith("data:")) {
    return u;
  }
  if (u.startsWith("//")) {
    return `${window.location.protocol}${u}`;
  }
  if (u.startsWith("/")) {
    return `${window.location.origin}${u}`;
  }
  // Bare storage key — cannot sign in the browser; caller should use *_url from API.
  return null;
}

const MediaPreview = ({
  url,
  alt,
  filename,
  imageClassName,
  className,
  preferPdfCard,
}: MediaPreviewProps) => {
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = resolveMediaSrc(url);
  const pdf = preferPdfCard ?? isPdfUrl(src ?? url);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const handleDownload = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading || !src) return;
    setDownloading(true);
    try {
      await downloadMedia(src, filename);
    } finally {
      setDownloading(false);
    }
  };

  if (!src) {
    return (
      <div
        className={cn(
          "flex h-40 flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/10 text-sm text-muted-foreground",
          className
        )}
      >
        <ImageOff className="h-8 w-8 opacity-50" />
        <span>No media available</span>
      </div>
    );
  }

  if (pdf) {
    return (
      <div
        className={cn(
          "group relative flex min-h-36 flex-col items-center justify-center gap-2 border border-border bg-muted/10 p-4",
          className
        )}
      >
        <button
          type="button"
          onClick={() => openMediaInNewTab(src)}
          className="flex flex-col items-center gap-2 text-sm text-primary hover:underline"
        >
          <Page className="h-10 w-10" />
          View PDF
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="absolute end-2 top-2 rounded-md border border-border bg-background/95 p-1.5 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Download ${alt}`}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground",
          className
        )}
      >
        <ImageOff className="h-8 w-8 opacity-50" />
        <span>Image failed to load</span>
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => openMediaInNewTab(src)}
        >
          Open in new tab
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden border border-border bg-muted/10",
        className
      )}
    >
      <button
        type="button"
        onClick={() => openMediaInNewTab(src)}
        className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("mx-auto block object-cover", imageClassName)}
        />
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="absolute end-2 top-2 z-10 rounded-md border border-border bg-background/95 p-1.5 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Download ${alt}`}
        title="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default MediaPreview;
