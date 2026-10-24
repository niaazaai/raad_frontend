import { useEffect, useMemo, useState } from "react";
import { courseLevelLabel } from "@/data/enums/courseWizard";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Library as BookStack, CircleCheck as CheckCircle, Clock, Coins, GraduationCap, Hash as Hashtag, Info as InfoCircle, Languages as Language, Medal, Phone, Play, ShoppingBag, User, LayoutGrid as ViewGrid } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  ImageDropzone,
  Label,
} from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { CONTACT_INFO } from "@/components/website/websiteData";
import { useAuth } from "@/features/auth";
import { AuthStatus } from "@/data/enums";
import { cn } from "@/lib/utils";
import { RequestMethod } from "@/data/constants/methods";
import { useMutationApi } from "@/hooks";
import {
  getPublicCourseDetailFromResponse,
  getPreviewPlaybackFromResponse,
  PUBLIC_COURSES_QUERY_KEY,
  getPublicCoursesFromResponse,
  usePublicCourseDetail,
  usePublicCoursePreviewPlayback,
  usePublicCourses,
} from "@/hooks/usePublicCourses";
import { getMyEnrollmentsFromResponse, useMyEnrollments } from "@/hooks/useStudentLearning";
import { toast } from "sonner";
import type { PublicSubscriptionPlan } from "@/hooks/usePublicCourses";
import LessonVideoPlayer from "./LessonVideoPlayer";

function formatMoney(amount: string | number | null | undefined): string {
  if (amount == null || String(amount).trim() === "") return "—";
  const n = Number.parseFloat(String(amount));
  if (Number.isNaN(n)) return `${amount} AFN`;
  const whole = Math.abs(n - Math.round(n)) < 0.001;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2,
  }).format(n);
  return `${formatted} AFN`;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeRichText(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

/** API may send strings or numbers (e.g. decimal duration). */
function formatOptionalDisplay(value: unknown): string {
  if (value == null) return "—";
  const s = String(value).trim();
  return s === "" ? "—" : s;
}

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

const EnrollmentSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  national_id: z.string().min(1, "National ID is required"),
  email: z.string().email("Valid email is required"),
});

type EnrollmentData = z.infer<typeof EnrollmentSchema>;

const CourseViewPage = () => {
  const navigate = useNavigate();
  const { user, status, isAuthenticated, fetchUser } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : NaN;
  const validId = !Number.isNaN(id) ? id : null;

  const detailQuery = usePublicCourseDetail(validId, { enabled: validId != null });
  const previewQuery = usePublicCoursePreviewPlayback(validId, { enabled: validId != null });
  const myEnrollmentsQuery = useMyEnrollments({
    course_id: validId ?? undefined,
    per_page: 48,
    enabled: Boolean(isAuthenticated && validId != null),
  });
  const latestQuery = usePublicCourses({
    page: 1,
    per_page: 10,
    exclude_id: validId ?? undefined,
    enabled: validId != null,
  });

  useEffect(() => {
    if (status === AuthStatus.IDLE) {
      void fetchUser();
    }
  }, [status, fetchUser]);

  const payload = useMemo(
    () => getPublicCourseDetailFromResponse(detailQuery.data),
    [detailQuery.data],
  );

  const previewPlayback = useMemo(
    () => getPreviewPlaybackFromResponse(previewQuery.data),
    [previewQuery.data],
  );

  const course = payload;
  const modules = course?.modules ?? [];
  const plans: PublicSubscriptionPlan[] = course?.subscription_plans ?? [];

  const myEnrollmentsForCourse = useMemo(
    () => getMyEnrollmentsFromResponse(myEnrollmentsQuery.data),
    [myEnrollmentsQuery.data],
  );

  const isPlanBlocked = useMemo(() => {
    const blocked = new Set<number>();
    for (const row of myEnrollmentsForCourse) {
      const st = row.subscription_status;
      if (st === "pending" || st === "active") {
        blocked.add(row.plan_id);
      }
    }
    return (planId: number) => blocked.has(planId);
  }, [myEnrollmentsForCourse]);

  const lowestPlanPrice = useMemo(() => {
    if (plans.length === 0 || course?.is_free) return course?.price ?? "0";
    const prices = plans
      .map((p) => Number(p.price || 0))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices).toString() : (course?.price ?? "0");
  }, [plans, course]);

  const loading = validId == null || detailQuery.isLoading;
  const isError = detailQuery.isError || (!loading && !course);

  const latestCourses = useMemo(
    () => getPublicCoursesFromResponse(latestQuery.data).filter((row) => row.id !== validId).slice(0, 10),
    [latestQuery.data, validId],
  );

  const backHref = isAuthenticated ? "/course/courses" : "/explore-courses";
  const isSignedIn = isAuthenticated;
  const authPending = status === AuthStatus.IDLE || status === AuthStatus.LOADING;

  const [plansOpen, setPlansOpen] = useState(false);
  const [authRequiredModalOpen, setAuthRequiredModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSelectedPlanId((prev) => {
      if (prev == null) return prev;
      return isPlanBlocked(prev) ? null : prev;
    });
  }, [isPlanBlocked, myEnrollmentsForCourse]);

  const loginHref = `/login?redirect=${encodeURIComponent(`/course/courses/${validId ?? 0}/view`)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(`/course/courses/${validId ?? 0}/view`)}`;

  useEffect(() => {
    if (!authRequiredModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthRequiredModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authRequiredModalOpen]);

  // Prefill form with user data if signed in
  const defaultFormValues: Partial<EnrollmentData> = useMemo(() => ({
    first_name: user?.name?.split(" ")[0] || "",
    last_name: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone_number: "",
    national_id: "",
  }), [user]);

  const enrollmentForm = useForm<EnrollmentData>({
    resolver: zodResolver(EnrollmentSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (!user) return;
    enrollmentForm.reset({
      first_name: user.name?.split(" ")[0] || "",
      last_name: user.name?.split(" ").slice(1).join(" ") || "",
      email: user.email || "",
      phone_number: enrollmentForm.getValues("phone_number") || "",
      national_id: enrollmentForm.getValues("national_id") || "",
    });
  }, [user, enrollmentForm]);

  const createSubscriptionMutation = useMutationApi({
    url: "/student-subscriptions",
    method: RequestMethod.POST,
    hasFiles: true,
    invalidateKeys: [
      ["course", "entity", "student-subscriptions"],
      [...PUBLIC_COURSES_QUERY_KEY],
      ["me", "enrollments"],
    ],
  });

  if (validId == null) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Invalid course.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
        Courses
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Course not found or not available.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          Courses
        </Button>
      </div>
    );
  }

  const title = String(course.title ?? "Course");
  const shortDesc = String(course.short_description ?? "").trim();
  const longDesc = String(course.long_description ?? "").trim();
  const prerequisites = String(course.prerequisites ?? "").trim();
  const bannerUrl =
    typeof course.banner_url === "string" && course.banner_url ? course.banner_url : null;
  const language = String(course.language ?? "—");
  const level = courseLevelLabel(course.level);

  const lessons = course.lessons ?? [];
  const lectureCount = lessons.length;
  const previewLesson =
    lessons.find((lesson) => lesson.id === course.preview_lesson_id) ?? lessons[0] ?? null;
  const mainCategory = course.main_category?.title || "Category";
  const courseType = course.is_free ? "Free" : "Paid";
  const startingPrice = course.is_free ? "Free" : formatMoney(lowestPlanPrice);
  const durationLabel = formatOptionalDisplay(course.estimated_duration);

  const flagBadges: { key: string; label: string }[] = [];
  if (course.is_popular) flagBadges.push({ key: "popular", label: "Popular" });
  flagBadges.push({ key: "type", label: courseType });
  if (course.is_featured) flagBadges.push({ key: "featured", label: "Featured" });
  if (course.is_new) flagBadges.push({ key: "new", label: "New" });

  const purchaseDisabled = authPending || (plans.length === 0 && !course.is_free);
  const openPurchase = () => {
    if (purchaseDisabled) return;
    if (!isAuthenticated) {
      setAuthRequiredModalOpen(true);
      return;
    }
    setPlansOpen(true);
  };

  const showPreviewPlayer =
    previewPlayback &&
    previewPlayback.src &&
    previewPlayback.src.length > 0 &&
    previewPlayback.lesson_id != null;

  const factRows: { icon: typeof Language; label: string; value: string }[] = [
    { icon: ViewGrid, label: "Main category", value: course.main_category?.title || "—" },
    { icon: Hashtag, label: "Sub category", value: course.sub_category?.title || "—" },
    { icon: Language, label: "Language", value: language },
    { icon: Medal, label: "Level", value: level },
    { icon: Clock, label: "Duration", value: durationLabel },
    { icon: ShoppingBag, label: "Type", value: courseType },
    { icon: Play, label: "Lecture count", value: String(lectureCount) },
    { icon: Coins, label: "Price starting", value: startingPrice },
  ];

  const statTiles = [
    {
      key: "category",
      icon: BookStack,
      label: mainCategory,
      hint: "Main category",
      iconClass: "bg-primary/10 text-primary",
    },
    {
      key: "lessons",
      icon: Play,
      label: `${lectureCount} lecture${lectureCount === 1 ? "" : "s"}`,
      hint: "Lessons",
      iconClass: "bg-auxiliary/10 text-auxiliary",
    },
    {
      key: "duration",
      icon: Clock,
      label: durationLabel,
      hint: "Duration",
      iconClass: "bg-warning/10 text-warning",
    },
    {
      key: "level",
      icon: GraduationCap,
      label: level,
      hint: "Level",
      iconClass: "bg-success/10 text-success",
    },
  ] as const;

  return (
    <div className="min-h-0 bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div dir="ltr" className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
          <h1 className="min-w-0 flex-1 truncate text-[1.17rem] font-bold leading-tight text-foreground sm:text-[1.3rem]">
            {title}
          </h1>
          <a
            href={CONTACT_INFO.phoneHref}
            dir="ltr"
            className="inline-flex shrink-0 items-center gap-2.5 text-foreground"
          >
            <Phone className="h-7 w-7 text-primary" strokeWidth={1.6} />
            <span className="hidden items-baseline gap-1.5 sm:inline-flex">
              <span className="text-xs font-medium text-muted-foreground">Call us</span>
              <span className="text-sm font-semibold tabular-nums">{CONTACT_INFO.phone}</span>
            </span>
          </a>
        </div>
      </header>

      <section className="relative">
        <div className="h-[35vh] min-h-[220px] w-full overflow-hidden bg-muted">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
              Course banner
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div dir="ltr" className="pointer-events-auto grid translate-y-1/2 grid-cols-2 gap-3 lg:grid-cols-4">
              {statTiles.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.key}
                    className="flex h-36 w-full flex-col items-center justify-center rounded-md border border-border bg-card px-3 text-center shadow-sm"
                  >
                    <span
                      className={cn(
                        "mb-2 flex h-12 w-12 items-center justify-center rounded-full",
                        stat.iconClass
                      )}
                    >
                      <StatIcon className="h-7 w-7" strokeWidth={1.5} />
                    </span>
                    <span className="line-clamp-2 text-sm font-semibold text-foreground">{stat.label}</span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">{stat.hint}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-6 pt-[calc(4.5rem+0.75rem)] md:px-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,300px)]">
          <div className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-muted">
              {previewQuery.isLoading ? (
                <div className="flex h-56 items-center justify-center sm:h-72">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              ) : showPreviewPlayer ? (
                <LessonVideoPlayer
                  src={previewPlayback.src}
                  playbackType={previewPlayback.type === "hls" ? "hls" : "progressive"}
                  className="w-full max-w-full"
                />
              ) : (
                <div className="flex h-56 items-center justify-center sm:h-72">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary">
                    <Play className="h-6 w-6" />
                  </span>
                </div>
              )}
            </div>
            {previewLesson ? (
              <div>
                <p className="text-base font-semibold text-foreground">{previewLesson.title}</p>
                {previewLesson.description ? (
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {stripHtml(previewLesson.description)}
                  </p>
                ) : null}
              </div>
            ) : null}
            <Button
              type="button"
              className="h-11 w-full rounded-md text-base font-semibold"
              disabled={purchaseDisabled}
              onClick={openPurchase}
            >
              {authPending ? <Spinner className="me-2 h-4 w-4" /> : <ShoppingBag className="me-2 h-4 w-4" />}
              Admit to this course
            </Button>

            <section className="space-y-3 pt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Course details</p>
              <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
              {shortDesc ? (
                looksLikeHtml(shortDesc) ? (
                  <div
                    className="prose-custom max-w-none text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(shortDesc) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{shortDesc}</p>
                )
              ) : null}
              {longDesc ? (
                looksLikeHtml(longDesc) ? (
                  <div
                    className="prose-custom max-w-none text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(longDesc) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{longDesc}</p>
                )
              ) : null}
            </section>

            {prerequisites ? (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Course prerequisites</h2>
                {looksLikeHtml(prerequisites) ? (
                  <div
                    className="prose-custom max-w-none text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(prerequisites) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{prerequisites}</p>
                )}
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Course curriculum</h2>
              {modules.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No modules published yet.
                </p>
              ) : (
                <Accordion dir="ltr" className="overflow-hidden rounded-md border border-border" defaultValue={[]} multiple>
                  {modules.map((mod) => {
                    const chapterLessons = lessons.filter((lesson) => lesson.course_module_id === mod.id);
                    return (
                      <AccordionItem key={mod.id} value={String(mod.id)}>
                        <AccordionTrigger className="bg-muted/80">
                          <span className="flex min-w-0 items-center gap-2">
                            <BookStack className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate">{String(mod.title ?? "Chapter")}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/30">
                          {chapterLessons.length === 0 ? (
                            <p className="py-1 text-sm text-muted-foreground">No lessons in this chapter yet.</p>
                          ) : (
                            <ul className="divide-y divide-border">
                              {chapterLessons.map((lesson) => (
                                <li key={lesson.id} className="py-2.5 first:pt-1 last:pb-1">
                                  <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                                  {lesson.description ? (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                      {stripHtml(lesson.description)}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
            <div dir="ltr" className="rounded-md border border-border bg-card p-3">
              <dl>
                {factRows.map((row, index) => {
                  const FactIcon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className={cn(
                        "flex items-center justify-between gap-3 py-2 text-sm",
                        index > 0 && "border-t border-border"
                      )}
                    >
                      <dt className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                        <FactIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{row.label}</span>
                      </dt>
                      <dd
                        className="max-w-[55%] truncate text-end font-semibold text-foreground"
                        dir={row.label === "Price starting" ? "ltr" : undefined}
                      >
                        {row.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {flagBadges.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {flagBadges.map((badge) => (
                    <span
                      key={badge.key}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div dir="ltr" className="rounded-md border border-border bg-card p-3">
              <h2 className="text-sm font-semibold text-foreground">Latest courses</h2>
              {latestQuery.isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner className="h-5 w-5 text-primary" />
                </div>
              ) : latestCourses.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No other courses yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {latestCourses.map((row) => (
                    <li key={row.id}>
                      <Link
                        to={`/course/courses/${row.id}/view`}
                        className="flex items-center gap-2.5 py-2 transition-colors hover:bg-muted/50"
                      >
                        {row.thumbnail_url ? (
                          <img
                            src={row.thumbnail_url}
                            alt=""
                            className="h-11 w-16 shrink-0 rounded-md object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                            <BookStack className="h-4 w-4" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                            {row.title}
                          </span>
                          {row.short_description ? (
                            <span className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                              {stripHtml(row.short_description)}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>

      {authRequiredModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-auth-required-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setAuthRequiredModalOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-md border-border shadow-lg">
            <CardHeader className="space-y-3 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <InfoCircle className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle id="course-auth-required-title" className="text-lg leading-snug">
                Sign in or sign up to continue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <p className="text-sm leading-relaxed text-muted-foreground">
                To buy this course you need an account. Please sign in if you already have one, or create
                a new account first. After that you can choose a plan, upload your payment voucher, and
                submit it for review.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setAuthRequiredModalOpen(false)}
                >
                  Not now
                </Button>
                <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to={registerHref} onClick={() => setAuthRequiredModalOpen(false)}>
                    Sign up
                  </Link>
                </Button>
                <Button type="button" className="w-full sm:w-auto" asChild>
                  <Link to={loginHref} onClick={() => setAuthRequiredModalOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Drawer
        open={plansOpen}
        swipeDirection="down"
        showSwipeHandle
        onClose={() => {
          setPlansOpen(false);
          setShowSuccess(false);
          setSelectedPlanId(null);
          setVoucherFile(null);
          enrollmentForm.reset(defaultFormValues);
        }}
      >
        <DrawerOverlay />
        <DrawerContent className="mx-auto w-full max-w-5xl">
          <DrawerHeader>
            <DrawerTitle>Course Subscription</DrawerTitle>
            <DrawerDescription>
              Choose a plan, upload your payment voucher, and submit for review. Access dates are set when
              your payment is approved.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-6">
            {/* Bank Payment Explanation */}
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Phone className="h-4 w-4 text-warning" /> Payment Instructions
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                Pay the selected plan amount to:
                <span className="mt-2 block rounded-md bg-card px-3 py-2 font-mono text-xs">
                  Raad Institute • A/C: 1234567890 • IBAN: AE12 3456 7890 1234 5678
                </span>
                <span className="mt-2 block text-muted-foreground">
                  Upload the bank voucher (image or PDF) below. Your subscription will be reviewed and activated within 24-48 hours. Support: {CONTACT_INFO.phone}
                </span>
              </p>
            </div>

            {!showSuccess ? (
              plans.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No subscription plans are configured for this course yet.
                </p>
              ) : (
                <>
                  <div>
                    <p className="mb-4 text-sm font-medium text-foreground">Select a Subscription Plan</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {plans.map((p) => {
                        const isSelected = selectedPlanId === p.id;
                        const blocked = isPlanBlocked(p.id);
                        const planPrice = formatMoney(String(p.price));
                        const description = p.plan_description ? stripHtml(p.plan_description) : "";
                        return (
                          <div
                            key={p.id}
                            role="button"
                            tabIndex={blocked ? -1 : 0}
                            onClick={() => {
                              if (blocked) return;
                              setSelectedPlanId(isSelected ? null : p.id);
                            }}
                            onKeyDown={(e) => {
                              if (blocked) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedPlanId(isSelected ? null : p.id);
                              }
                            }}
                            className={cn(
                              "flex h-full flex-col rounded-2xl border bg-card p-5 text-start transition-colors",
                              blocked
                                ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
                                : "cursor-pointer hover:border-primary/50",
                              !blocked && isSelected && "border-primary ring-2 ring-primary/25",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-base font-semibold text-foreground">{p.plan_name}</p>
                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
                                {p.subscription_type}
                              </span>
                            </div>
                            <p dir="ltr" className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                              {planPrice}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {p.duration_in_days} days
                            </p>
                            {description ? (
                              <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                                {description}
                              </p>
                            ) : (
                              <span className="flex-1" />
                            )}
                            <div className="mt-4">
                              {blocked ? (
                                <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                  Already pending or active
                                </span>
                              ) : isSelected ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                                  <CheckCircle className="h-3.5 w-3.5" /> Selected
                                </span>
                              ) : (
                                <span className="text-sm font-medium text-primary">Select plan</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedPlanId && (
                    <div className="space-y-8 border-t border-border pt-8">
                      <div>
                        <p className="mb-4 text-sm font-medium text-foreground flex items-center gap-2">
                          <User className="h-4 w-4" /> Student Information
                          {isSignedIn && <span className="text-xs text-emerald-600 font-normal">(Prefilled from your profile)</span>}
                        </p>
                        <form onSubmit={enrollmentForm.handleSubmit(() => {})} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="first_name">First Name <span className="text-destructive">*</span></Label>
                            <input
                              id="first_name"
                              {...enrollmentForm.register("first_name")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="First name"
                            />
                            {enrollmentForm.formState.errors.first_name && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.first_name.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="last_name">Last Name <span className="text-destructive">*</span></Label>
                            <input
                              id="last_name"
                              {...enrollmentForm.register("last_name")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="Last name"
                            />
                            {enrollmentForm.formState.errors.last_name && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.last_name.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone_number">Phone Number <span className="text-destructive">*</span></Label>
                            <input
                              id="phone_number"
                              {...enrollmentForm.register("phone_number")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="+971 50 123 4567"
                            />
                            {enrollmentForm.formState.errors.phone_number && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.phone_number.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="national_id">National ID / Passport <span className="text-destructive">*</span></Label>
                            <input
                              id="national_id"
                              {...enrollmentForm.register("national_id")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="1234567890"
                            />
                            {enrollmentForm.formState.errors.national_id && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.national_id.message}</p>
                            )}
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                            <input
                              id="email"
                              type="email"
                              {...enrollmentForm.register("email")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="your@email.com"
                            />
                            {enrollmentForm.formState.errors.email && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.email.message}</p>
                            )}
                          </div>
                        </form>
                      </div>

                      <div>
                        <ImageDropzone
                          accept="image/*,application/pdf"
                          label="Upload bank voucher (image or PDF)"
                          hint="JPG, PNG, or PDF · max 10 MB · proof of payment"
                          value={voucherFile}
                          onSelect={setVoucherFile}
                          previewMode="wide"
                          mediaPreview="file"
                        />
                      </div>

                      <Button
                        type="button"
                        className="w-full py-6 text-base font-semibold"
                        disabled={
                          createSubscriptionMutation.isPending ||
                          !selectedPlanId ||
                          !voucherFile ||
                          (selectedPlanId != null && isPlanBlocked(selectedPlanId))
                        }
                        onClick={async () => {
                          const isValid = await enrollmentForm.trigger();
                          if (!isValid || !selectedPlanId || !voucherFile || validId == null) {
                            return;
                          }

                          if (!user?.id) {
                            toast.error("Please sign in to complete your subscription.");
                            return;
                          }

                          if (isPlanBlocked(selectedPlanId)) {
                            toast.error("You already have a pending or active subscription for this plan.");
                            return;
                          }

                          try {
                            await createSubscriptionMutation.mutateAsync({
                              plan_id: String(selectedPlanId),
                              course_id: String(validId),
                              user_id: String(user.id),
                              voucher_file: voucherFile,
                            });
                            setShowSuccess(true);
                          } catch {
                            // Errors surfaced by callApi / global handler
                          }
                        }}
                      >
                        {createSubscriptionMutation.isPending ? (
                          <Spinner className="mr-2 h-5 w-5" />
                        ) : null}
                        Buy Now & Submit Voucher for Review
                      </Button>
                    </div>
                  )}
                </>
              )
            ) : (
              /* Success View */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-8 rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/50">
                  <CheckCircle className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Thank You for Your Subscription!</h3>
                <p className="max-w-md text-muted-foreground mb-8">
                  Your voucher has been received. We will review your payment and activate the course subscription shortly.
                  You will receive a confirmation email from Raad Institute.
                </p>
                <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30 text-left w-full max-w-md">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">Need help?</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Support: <span className="font-mono">{CONTACT_INFO.phone}</span>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPlansOpen(false);
                    setShowSuccess(false);
                    setSelectedPlanId(null);
                    setVoucherFile(null);
                    enrollmentForm.reset();
                  }}
                  className="min-w-[200px]"
                >
                  Return to Course
                </Button>
              </div>
            )}
          </DrawerBody>

          {!showSuccess && (
            <DrawerFooter>
              <Button type="button" variant="outline" onClick={() => {
                setPlansOpen(false);
                setShowSuccess(false);
                setSelectedPlanId(null);
                setVoucherFile(null);
                enrollmentForm.reset(defaultFormValues);
              }}>
                Cancel
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CourseViewPage;
