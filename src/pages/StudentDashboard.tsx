import { useState } from "react";
import { Link } from "react-router-dom";
import { Library, Play } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { courseLevelLabel } from "@/data/enums/courseWizard";
import { Button, Card, CardContent } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import RenewSubscriptionDrawer from "@/modules/Course/features/CourseViewPage/RenewSubscriptionDrawer";
import { cn } from "@/lib/utils";
import {
  getMyEnrollmentsFromResponse,
  useMyEnrollments,
  type MyEnrollmentItem,
} from "@/hooks/useStudentLearning";

function daysUntil(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

function isSubscriptionExpired(endDate: string | null): boolean {
  const diff = daysUntil(endDate);
  return diff != null && diff <= 0;
}

function accessLabel(endDate: string | null): string | null {
  const diff = daysUntil(endDate);
  if (diff == null) return null;
  if (diff <= 0) return "Subscription expired";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

function OutlineBadge({ children, tone = "default" }: { children: string; tone?: "default" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        tone === "danger"
          ? "border border-red-600 bg-red-600 text-white"
          : "border border-foreground/50 bg-transparent text-foreground",
      )}
    >
      {children}
    </span>
  );
}

function CourseCard({
  row,
  onRenew,
}: {
  row: MyEnrollmentItem;
  onRenew: (courseId: number, title: string) => void;
}) {
  const { t } = useTranslation();
  const courseId = Number(row.course_id);
  const title = row.course_title ?? "Course";
  const description = String(row.course_short_description ?? "").trim();
  const expired = isSubscriptionExpired(row.subscription_end_date);
  const learnPath = Number.isFinite(courseId) ? `/learn/course/${courseId}` : "/student";
  const resumeLessonId = Number(row.resume_lesson_id);
  const resumeAt = Math.max(0, Math.floor(Number(row.resume_position_seconds) || 0));
  const hasResume = Number.isFinite(resumeLessonId) && resumeLessonId > 0;
  const resumePath = hasResume
    ? `/learn/course/${courseId}?lesson=${resumeLessonId}${resumeAt > 0 ? `&t=${resumeAt}` : ""}`
    : learnPath;
  const canLearn = !expired && row.subscription_status !== "pending";
  const access = accessLabel(row.subscription_end_date);
  const level = String(row.course_level ?? "").trim();
  const category = [row.course_main_category, row.course_sub_category].filter(Boolean).join(" - ");
  const percent = Math.max(0, Math.min(100, Number(row.progress_percent) || 0));
  const watched = Number(row.lessons_watched) || 0;
  const total = Number(row.lessons_total) || 0;

  const card = (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden",
        expired
          ? "border-red-600"
          : "border-border/80 transition-shadow group-hover:border-primary/30 group-hover:shadow-md",
      )}
    >
      {canLearn ? (
      <Link
        to={learnPath}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open course: ${title}`}
      >
      <div className="relative aspect-video w-full bg-muted">
        {row.course_thumbnail_url ? (
          <img src={row.course_thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Library className="h-12 w-12 opacity-40" />
          </div>
        )}
        {category ? (
          <span className="absolute end-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white">
            {category}
          </span>
        ) : null}
      </div>
      </Link>
      ) : (
      <div className="relative aspect-video w-full bg-muted">
        {row.course_thumbnail_url ? (
          <img src={row.course_thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Library className="h-12 w-12 opacity-40" />
          </div>
        )}
        {category ? (
          <span className="absolute end-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white">
            {category}
          </span>
        ) : null}
      </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
            {canLearn ? (
              <Link to={learnPath} className="hover:text-primary">
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          {description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {level ? <OutlineBadge>{courseLevelLabel(level)}</OutlineBadge> : null}
          {row.course_language ? <OutlineBadge>{row.course_language}</OutlineBadge> : null}
          {access ? <OutlineBadge tone={expired ? "danger" : "default"}>{access}</OutlineBadge> : null}
        </div>

        {row.subscription_status === "pending" && !expired ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Awaiting approval — lessons unlock once active.
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground">
              {percent}% <span className="font-normal text-muted-foreground">Progress</span>
            </span>
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percent}% progress, ${watched} of ${total} lessons`}
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            {total > 0 ? (
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {watched}/{total}
              </span>
            ) : null}
          </div>
          {canLearn ? (
            <Button asChild size="sm" className="h-9 w-full">
              <Link to={resumePath}>
                <Play className="h-3.5 w-3.5" />
                {hasResume ? t("studentLearning.resumeLesson") : t("studentLearning.startLesson")}
              </Link>
            </Button>
          ) : null}
          {expired ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto w-full whitespace-normal border-red-600 py-2 text-center text-xs leading-snug text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
              onClick={() => onRenew(courseId, title)}
            >
              Renew subscription to continue with course
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="group h-full">
      {card}
    </div>
  );
}

function CourseGrid({
  rows,
  onRenew,
}: {
  rows: MyEnrollmentItem[];
  onRenew: (courseId: number, title: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {rows.map((row) => (
        <CourseCard key={row.id} row={row} onRenew={onRenew} />
      ))}
    </div>
  );
}

const StudentDashboardPage = () => {
  const { data, isLoading, isError } = useMyEnrollments({ page: 1, per_page: 48 });
  const enrollments = getMyEnrollmentsFromResponse(data);
  const active = enrollments.filter((row) => !isSubscriptionExpired(row.subscription_end_date));
  const expired = enrollments.filter((row) => isSubscriptionExpired(row.subscription_end_date));
  const [renewCourse, setRenewCourse] = useState<{ id: number; title: string } | null>(null);

  const openRenew = (courseId: number, title: string) => {
    if (!Number.isFinite(courseId)) return;
    setRenewCourse({ id: courseId, title });
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner className="h-10 w-10 text-primary" />
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Could not load your courses. Try again later.</p>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <Library className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            You don&apos;t have any enrollments yet. Browse the catalog to find a course.
          </p>
          <Button type="button" className="mt-6" asChild>
            <Link to="/explore-courses">Explore courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 ? <CourseGrid rows={active} onRenew={openRenew} /> : null}
          {expired.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Expired</h2>
              <CourseGrid rows={expired} onRenew={openRenew} />
            </section>
          ) : null}
        </div>
      )}
      <RenewSubscriptionDrawer
        open={renewCourse != null}
        courseId={renewCourse?.id ?? null}
        courseTitle={renewCourse?.title ?? ""}
        onClose={() => setRenewCourse(null)}
      />
    </div>
  );
};

export default StudentDashboardPage;
