import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, FastArrowRight, NavArrowLeft, PageEdit, VideoCamera } from "iconoir-react";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getCourseLearnFromResponse,
  useCourseLearn,
  type CourseLearnLesson,
  type CourseLearnModule,
  type CourseLearnQuizFile,
} from "@/hooks/useStudentLearning";
import type { ApiResponse } from "@/types/api";
import LessonVideoPlayer from "@/modules/Course/features/CourseViewPage/LessonVideoPlayer";
import {
  useLessonPlayback,
  type LessonPlaybackPayload,
} from "@/modules/Course/features/CourseViewPage/useLessonPlayback";
import { cn } from "@/lib/utils";

function quizFilesForLesson(files: CourseLearnQuizFile[], lessonId: number): CourseLearnQuizFile[] {
  return files.filter((f) => f.lesson_id === lessonId);
}

const AUTO_ADVANCE_DELAY = 5;

const CoursePlayerPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : NaN;
  const validId = !Number.isNaN(id) ? id : null;

  const learnQuery = useCourseLearn(validId, { enabled: validId != null });
  const payload = useMemo(() => getCourseLearnFromResponse(learnQuery.data), [learnQuery.data]);

  const lessons = payload?.lessons ?? [];
  const modules = payload?.modules ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(0);

  useEffect(() => {
    if (lessons.length === 0) return;
    setSelectedId((prev) => {
      if (prev != null && lessons.some((l) => l.id === prev)) return prev;
      return lessons[0]?.id ?? null;
    });
  }, [lessons]);

  const selectedLesson: CourseLearnLesson | null = useMemo(
    () => lessons.find((l) => l.id === selectedId) ?? null,
    [lessons, selectedId],
  );

  // Anti-piracy: block DevTools shortcuts at page level
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F12") { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C", "U"].includes(e.key.toUpperCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, []);

  const currentIndex = useMemo(
    () => lessons.findIndex((l) => l.id === selectedId),
    [lessons, selectedId],
  );

  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1
    ? lessons[currentIndex + 1]
    : null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;

  const goToLesson = useCallback((lessonId: number) => {
    setSelectedId(lessonId);
    if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    setAutoAdvanceCountdown(null);
  }, []);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    setAutoAdvanceCountdown(null);
  }, []);

  const handleLessonEnded = useCallback(() => {
    if (selectedId != null) {
      setCompletedIds((prev) => new Set([...prev, selectedId]));
    }
    if (!nextLesson) return;

    countdownRef.current = AUTO_ADVANCE_DELAY;
    setAutoAdvanceCountdown(AUTO_ADVANCE_DELAY);

    autoAdvanceTimerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setAutoAdvanceCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
        setAutoAdvanceCountdown(null);
        setSelectedId((id) => {
          const idx = lessons.findIndex((l) => l.id === id);
          return lessons[idx + 1]?.id ?? id;
        });
      }
    }, 1000);
  }, [selectedId, nextLesson, lessons]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "n" || e.key === "N") {
        if (nextLesson) goToLesson(nextLesson.id);
      } else if (e.key === "p" || e.key === "P") {
        if (prevLesson) goToLesson(prevLesson.id);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [nextLesson, prevLesson, goToLesson]);

  const canPlay =
    selectedLesson != null &&
    (selectedLesson.video_status === "ready" || selectedLesson.video_status === "active");

  const playbackQuery = useLessonPlayback(selectedId, Boolean(canPlay && selectedId != null));
  const playbackEnvelope = playbackQuery.data as ApiResponse<LessonPlaybackPayload> | undefined;
  const playbackPayload = playbackEnvelope?.data;
  const src =
    playbackPayload && typeof playbackPayload.src === "string" && playbackPayload.src.length > 0
      ? playbackPayload.src
      : "";
  const pType = playbackPayload?.type === "hls" ? "hls" : "progressive";

  const quizFiles = payload?.quiz_files ?? [];

  const loading = validId == null || learnQuery.isLoading;
  const forbidden =
    learnQuery.isError &&
    learnQuery.error instanceof Error &&
    /enrolled|Forbidden|403/i.test(learnQuery.error.message);

  if (validId == null) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Invalid course.</p>
        <Button type="button" variant="outline" onClick={() => navigate("/student")}>
          My learning
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

  if (forbidden || learnQuery.isError || !payload) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          {forbidden
            ? "You don't have access to this course yet. Enroll from the catalog or contact support."
            : "Could not load this course."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to={`/course/courses/${validId}/view`}>Course details</Link>
          </Button>
          <Button type="button" onClick={() => navigate("/student")}>
            My learning
          </Button>
        </div>
      </div>
    );
  }

  const course = payload.course;
  const shortDesc = String(course.short_description ?? "").trim();
  const longDesc = String(course.long_description ?? "").trim();
  const prerequisites = String(course.prerequisites ?? "").trim();

  // Group lessons by module
  const moduleMap = new Map<number, CourseLearnModule>(modules.map((m) => [m.id, m]));
  const groupedLessons: { module: CourseLearnModule | null; lessons: CourseLearnLesson[] }[] = [];

  const seenModules = new Set<number>();
  for (const lesson of lessons) {
    const mod = moduleMap.get(lesson.course_module_id) ?? null;
    const modKey = mod?.id ?? -1;
    if (!seenModules.has(modKey)) {
      seenModules.add(modKey);
      groupedLessons.push({ module: mod, lessons: [] });
    }
    groupedLessons[groupedLessons.length - 1]?.lessons.push(lesson);
  }

  return (
    <div
      className="mx-auto max-w-7xl select-none px-4 py-6 md:px-6"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 gap-1 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/student")}
          >
            <NavArrowLeft className="h-4 w-4" />
            My learning
          </Button>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{course.title}</h1>
          {shortDesc ? (
            <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{shortDesc}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedIds.size}/{lessons.length} completed
          </span>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`/course/courses/${validId}/view`}>
              <PageEdit className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main content area */}
        <div className="min-w-0 space-y-4">
          {/* Video player */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-lg">
            {playbackQuery.isLoading ? (
              <div className="flex aspect-video items-center justify-center bg-black">
                <Spinner className="h-10 w-10 text-primary" />
              </div>
            ) : src ? (
              <LessonVideoPlayer
                src={src}
                playbackType={pType}
                watermarkText={undefined}
                onEnded={handleLessonEnded}
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-black/95 px-4 text-center">
                <VideoCamera className="h-10 w-10 text-white/20" />
                <p className="text-sm text-white/50">
                  {selectedLesson
                    ? "Video is not available for this lesson yet."
                    : "Select a lesson to start."}
                </p>
              </div>
            )}

            {/* Content protection badge */}
            <div className="absolute bottom-2 right-2 z-10 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/30">
              Protected by Raad LMS
            </div>
          </div>

          {/* Auto-advance banner */}
          {autoAdvanceCountdown !== null && nextLesson ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <FastArrowRight className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm">
                  <span className="font-medium">Up next:</span>{" "}
                  <span className="text-muted-foreground">{nextLesson.title}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {autoAdvanceCountdown}s
                </span>
                <Button type="button" size="sm" onClick={() => goToLesson(nextLesson.id)}>
                  Play now
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelAutoAdvance}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {/* Lesson navigation buttons */}
          {lessons.length > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!prevLesson}
                onClick={() => prevLesson && goToLesson(prevLesson.id)}
              >
                <NavArrowLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!nextLesson}
                onClick={() => nextLesson && goToLesson(nextLesson.id)}
              >
                Next
                <FastArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : null}

          {/* Course info */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">About this course</h2>
            {longDesc ? (
              longDesc.includes("<") ? (
                <div
                  className="prose-custom max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: longDesc }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{longDesc}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No extended description.</p>
            )}
            {prerequisites ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">Prerequisites</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{prerequisites}</p>
              </div>
            ) : null}
          </section>

          {/* Quiz files for selected lesson */}
          {selectedLesson && quizFilesForLesson(quizFiles, selectedLesson.id).length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-base font-semibold">Downloads for this lesson</h3>
              <ul className="space-y-2">
                {quizFilesForLesson(quizFiles, selectedLesson.id).map((qf) => (
                  <li
                    key={qf.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{qf.title}</span>
                    {qf.download_url ? (
                      <a
                        href={qf.download_url}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Course content
            </h2>
            <span className="text-xs text-muted-foreground">{lessons.length} lessons</span>
          </div>

          <div className="rounded-lg border border-border bg-card">
            {groupedLessons.map((group, gi) => (
              <div key={gi}>
                {group.module ? (
                  <div className="border-b border-border bg-muted/30 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.module.title}
                    </p>
                  </div>
                ) : null}
                <ul className={cn("p-1.5 space-y-0.5", gi < groupedLessons.length - 1 && group.module ? "border-b border-border" : "")}>
                  {group.lessons.map((lesson) => {
                    const isActive = lesson.id === selectedId;
                    const isDone = completedIds.has(lesson.id);
                    const isReady =
                      lesson.video_status === "ready" || lesson.video_status === "active";

                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => goToLesson(lesson.id)}
                          className={cn(
                            "group/item flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          {/* Completion / playing indicator */}
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                            {isActive ? (
                              <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
                            ) : isDone ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <div
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  isReady
                                    ? "bg-primary/60"
                                    : "bg-muted-foreground/30"
                                )}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate font-medium leading-snug",
                                isActive ? "text-primary-foreground" : "text-foreground"
                              )}
                            >
                              {lesson.title}
                            </span>
                            {isActive ? (
                              <span className="mt-0.5 block text-[10px] font-medium text-primary-foreground/70">
                                Now playing
                              </span>
                            ) : lesson.description?.trim() ? (
                              <span className="mt-0.5 block line-clamp-1 text-[11px] text-muted-foreground">
                                {lesson.description.trim()}
                              </span>
                            ) : null}
                          </div>

                          {!isReady && !isActive ? (
                            <span className="mt-0.5 shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                              {lesson.video_status === "processing" ? "Processing" : "Unavailable"}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-[10px] text-muted-foreground/50">
            N / P to navigate lessons
          </p>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
