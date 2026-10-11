import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Download, ChevronsRight as FastArrowRight, ExternalLink as OpenNewWindow, Video as VideoCamera } from "lucide-react";
import { Button } from "@/components/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import {
  getCourseLearnFromResponse,
  useCourseLearn,
  useRecordLessonWatch,
  type CourseLearnFile,
  type CourseLearnLesson,
  type CourseLearnModule,
} from "@/hooks/useStudentLearning";
import type { ApiResponse } from "@/types/api";
import LessonVideoPlayer from "@/modules/Course/features/CourseViewPage/LessonVideoPlayer";
import {
  useLessonPlayback,
  type LessonPlaybackPayload,
} from "@/modules/Course/features/CourseViewPage/useLessonPlayback";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_DELAY = 5;

function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function FileList({
  title,
  empty,
  files,
}: {
  title: string;
  empty: string;
  files: CourseLearnFile[];
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      {files.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">{file.title}</p>
              {file.download_url ? (
                <a
                  href={file.download_url}
                  className="inline-flex shrink-0 items-center justify-center text-foreground transition-colors hover:text-primary"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Download ${file.title}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">Unavailable</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function plainText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function PlaylistLesson({
  lesson,
  isActive,
  thumbnailUrl,
  onSelect,
}: {
  lesson: CourseLearnLesson;
  isActive: boolean;
  thumbnailUrl: string | null | undefined;
  onSelect: (lessonId: number) => void;
}) {
  const isReady = lesson.video_status === "ready" || lesson.video_status === "active";
  const duration = formatDuration(lesson.video_duration);
  const description = plainText(lesson.description);
  const poster = lesson.thumbnail_url || thumbnailUrl;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(lesson.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
          isActive ? "bg-primary/10" : "hover:bg-muted",
        )}
      >
        <span className="relative h-14 w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
          {poster ? (
            <img src={poster} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground">
              <VideoCamera className="h-5 w-5" />
            </span>
          )}
          {duration ? (
            <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium tabular-nums text-white">
              {duration}
            </span>
          ) : null}
          {lesson.watched ? (
            <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block line-clamp-2 text-sm font-medium leading-snug", isActive && "text-primary")}>
            {lesson.title}
          </span>
          {description ? (
            <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-muted-foreground">
              {description}
            </span>
          ) : !isReady ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {lesson.video_status === "processing" ? "Processing" : "Unavailable"}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

const CoursePlayerPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : NaN;
  const validId = !Number.isNaN(id) ? id : null;

  const learnQuery = useCourseLearn(validId, { enabled: validId != null });
  const payload = useMemo(() => getCourseLearnFromResponse(learnQuery.data), [learnQuery.data]);
  const recordWatch = useRecordLessonWatch();

  const lessons = payload?.lessons ?? [];
  const modules = payload?.modules ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);
  const [watchSession, setWatchSession] = useState("");
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(0);
  const didInitModule = useRef(false);
  const reportedSessions = useRef<Set<string>>(new Set());

  useEffect(() => {
    didInitModule.current = false;
    setOpenModuleId(null);
    setSelectedId(null);
  }, [validId]);

  useEffect(() => {
    if (lessons.length === 0) return;
    setSelectedId((prev) => {
      if (prev != null && lessons.some((lesson) => lesson.id === prev)) return prev;
      return lessons[0]?.id ?? null;
    });
  }, [lessons]);

  useEffect(() => {
    if (didInitModule.current || modules.length === 0) return;
    setOpenModuleId(modules[0]?.id ?? null);
    didInitModule.current = true;
  }, [modules]);

  useEffect(() => {
    if (selectedId == null) return;
    setWatchSession(crypto.randomUUID());
  }, [selectedId]);

  const selectedLesson: CourseLearnLesson | null = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedId) ?? null,
    [lessons, selectedId],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F12") {
        event.preventDefault();
        return;
      }
      if (event.ctrlKey && event.shiftKey && ["I", "J", "C", "U"].includes(event.key.toUpperCase())) {
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, []);

  const currentIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === selectedId),
    [lessons, selectedId],
  );

  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;

  const goToLesson = useCallback((lessonId: number) => {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (lesson) setOpenModuleId(lesson.course_module_id);
    setSelectedId(lessonId);
    if (lessonId === selectedId) setWatchSession(crypto.randomUUID());
    if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    setAutoAdvanceCountdown(null);
  }, [lessons, selectedId]);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    setAutoAdvanceCountdown(null);
  }, []);

  const handleLessonEnded = useCallback(() => {
    if (!nextLesson) return;
    countdownRef.current = AUTO_ADVANCE_DELAY;
    setAutoAdvanceCountdown(AUTO_ADVANCE_DELAY);
    const upcoming = nextLesson;
    autoAdvanceTimerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setAutoAdvanceCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
        setAutoAdvanceCountdown(null);
        setOpenModuleId(upcoming.course_module_id);
        setSelectedId(upcoming.id);
      }
    }, 1000);
  }, [nextLesson, lessons]);

  const handleEngaged = useCallback(() => {
    if (selectedId == null || watchSession === "") return;
    const key = `${selectedId}:${watchSession}`;
    if (reportedSessions.current.has(key)) return;
    reportedSessions.current.add(key);
    recordWatch.mutate({ lesson_id: selectedId, session_id: watchSession });
  }, [recordWatch, selectedId, watchSession]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.key === "n" || event.key === "N") {
        if (nextLesson) goToLesson(nextLesson.id);
      } else if (event.key === "p" || event.key === "P") {
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
            ? "You don't have access to this course. Your subscription may have ended, or you are not enrolled."
            : "Could not load this course."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to={`/course/courses/${validId}/view`}>View course details</Link>
          </Button>
          <Button type="button" onClick={() => navigate("/student")}>
            My learning
          </Button>
        </div>
      </div>
    );
  }

  const course = payload.course;
  const moduleMap = new Map<number, CourseLearnModule>(modules.map((module) => [module.id, module]));
  const groupedLessons: { module: CourseLearnModule | null; lessons: CourseLearnLesson[] }[] = [];
  for (const lesson of lessons) {
    const mod = moduleMap.get(lesson.course_module_id) ?? null;
    const modKey = mod?.id ?? -1;
    let group = groupedLessons.find((item) => (item.module?.id ?? -1) === modKey);
    if (!group) {
      group = { module: mod, lessons: [] };
      groupedLessons.push(group);
    }
    group.lessons.push(lesson);
  }

  const openModule = modules.find((module) => module.id === openModuleId) ?? null;
  const chapterFiles = (payload.chapter_files ?? []).filter(
    (file) => openModuleId != null && file.course_module_id === openModuleId,
  );
  const resources = payload.downloadable_resources ?? [];
  const mockTests = payload.mock_tests ?? [];
  const quizFiles = payload.quiz_files ?? [];
  const lessonDescription = plainText(selectedLesson?.description);

  return (
    <div
      className="mx-auto max-w-7xl select-none px-4 py-6 md:px-6"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight md:text-2xl">{course.title}</h1>
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" asChild>
          <Link to={`/course/courses/${validId}/view`}>
            <OpenNewWindow className="h-4 w-4" />
            View course details
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-xl border-2 border-neutral-900 bg-black dark:border-transparent">
            {playbackQuery.isLoading ? (
              <div className="flex aspect-video items-center justify-center bg-black">
                <Spinner className="h-10 w-10 text-primary" />
              </div>
            ) : src ? (
              <LessonVideoPlayer
                key={watchSession || String(selectedId)}
                className="rounded-none"
                src={src}
                playbackType={pType}
                onEnded={handleLessonEnded}
                onEngaged={handleEngaged}
                onPrevious={() => prevLesson && goToLesson(prevLesson.id)}
                onNext={() => nextLesson && goToLesson(nextLesson.id)}
                hasPrevious={prevLesson != null}
                hasNext={nextLesson != null}
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-black px-4 text-center">
                <VideoCamera className="h-10 w-10 text-white/20" />
                <p className="text-sm text-white/50">
                  {selectedLesson ? "Video is not available for this lesson yet." : "Select a lesson to start."}
                </p>
              </div>
            )}
          </div>

          {autoAdvanceCountdown !== null && nextLesson ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <FastArrowRight className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm">
                  <span className="font-medium">Up next:</span>{" "}
                  <span className="text-muted-foreground">{nextLesson.title}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm tabular-nums text-muted-foreground">{autoAdvanceCountdown}s</span>
                <Button type="button" size="sm" onClick={() => goToLesson(nextLesson.id)}>
                  Play now
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelAutoAdvance}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {selectedLesson?.title ?? "Lesson"}
            </h2>
            {lessonDescription ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{lessonDescription}</p>
            ) : null}
          </section>

          <FileList
            title={openModule ? `${openModule.title} files` : "Chapter files"}
            empty="No files for this chapter."
            files={chapterFiles}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <FileList
              title="Downloadable resources"
              empty="No downloadable resources for this course."
              files={resources}
            />
            <FileList
              title="Mock test files"
              empty="No mock tests for this course."
              files={mockTests}
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {groupedLessons
              .filter((group) => group.module == null)
              .map((group, groupIndex) => (
                <ul key={`ungrouped-${groupIndex}`} className="space-y-1 border-b border-border px-2 py-2">
                  {group.lessons.map((lesson) => (
                    <PlaylistLesson
                      key={lesson.id}
                      lesson={lesson}
                      isActive={lesson.id === selectedId}
                      thumbnailUrl={course.thumbnail_url}
                      onSelect={goToLesson}
                    />
                  ))}
                </ul>
              ))}
            <Accordion
              className="w-full"
              value={openModuleId != null ? [String(openModuleId)] : []}
              onValueChange={(next) => {
                const raw = next[0];
                setOpenModuleId(raw == null || raw === "" ? null : Number(raw));
              }}
            >
              {groupedLessons
                .filter((group) => group.module != null)
                .map((group) => (
                  <AccordionItem key={group.module!.id} value={String(group.module!.id)}>
                    <AccordionTrigger className="px-3">
                      <span className="truncate">{group.module!.title}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {group.lessons.map((lesson) => (
                          <PlaylistLesson
                            key={lesson.id}
                            lesson={lesson}
                            isActive={lesson.id === selectedId}
                            thumbnailUrl={course.thumbnail_url}
                            onSelect={goToLesson}
                          />
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>

          <FileList title="Quiz files" empty="No quiz files for this course." files={quizFiles} />
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
