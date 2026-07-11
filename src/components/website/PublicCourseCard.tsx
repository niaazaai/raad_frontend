import { Button } from "@/components/ui";
import { BookStack } from "iconoir-react";
import { Link } from "react-router-dom";
import type { PublicCourseListItem } from "@/hooks/usePublicCourses";
import { cn } from "@/lib/utils";

interface PublicCourseCardProps {
  course: PublicCourseListItem;
  enrollHref: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function formatEstimatedHours(raw: string | number | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const t = String(raw).trim();
  const lower = t.toLowerCase();
  const fromWords = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)\b/);
  if (fromWords) return `${Math.floor(parseFloat(fromWords[1]))} hr`;
  if (/^\d+(\.\d+)?$/.test(t)) return `${Math.floor(parseFloat(t))} hr`;
  const hms = /^(\d+):(\d{2})(?::(\d{2}))?/.exec(t);
  if (hms) return `${Math.floor(parseInt(hms[1], 10) + parseInt(hms[2], 10) / 60)} hr`;
  const digits = t.match(/(\d+(?:\.\d+)?)/);
  if (digits) return `${Math.floor(parseFloat(digits[1]))} hr`;
  return t;
}

function formatPrice(course: PublicCourseListItem): string {
  if (course.is_free) return "Free";
  if (course.price != null && String(course.price).trim() !== "") {
    const n = Number(course.price);
    if (!Number.isNaN(n)) return `$${n.toFixed(2)}`;
    return String(course.price);
  }
  return "—";
}

const PublicCourseCard = ({ course, enrollHref }: PublicCourseCardProps) => {
  const subtitle = course.short_description ? stripHtml(course.short_description) : "";
  const title = course.title || "Course";
  const durationLabel = formatEstimatedHours(course.estimated_duration);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <BookStack className="h-14 w-14" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground md:text-xl">
            {title}
          </h3>
          {subtitle ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground/80">Explore the full curriculum after signing in.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {course.level ? (
            <span className="rounded-full border border-border bg-primary/10 px-2.5 py-1 font-medium text-primary">
              {course.level}
            </span>
          ) : null}
          {course.language ? (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-medium text-muted-foreground">
              {course.language}
            </span>
          ) : null}
          {durationLabel ? (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-medium text-foreground">
              {durationLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</span>
            <span className={cn("text-xl font-bold tabular-nums", course.is_free ? "text-primary" : "text-foreground")}>
              {formatPrice(course)}
            </span>
          </div>
          <Button asChild className="h-11 w-full rounded-full font-semibold">
            <Link to={enrollHref} className="inline-flex w-full items-center justify-center">
              View
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default PublicCourseCard;
