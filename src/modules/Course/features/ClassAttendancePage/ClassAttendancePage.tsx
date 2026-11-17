import { useCallback, useLayoutEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useParams } from "react-router-dom";
import { PageBreadcrumb, Skeleton } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  extractAttendanceGrid,
  nextAttendanceStatus,
  useClassAttendance,
  useMarkClassAttendance,
  type AttendanceDateCol,
  type AttendanceMarkStatus,
  type AttendanceStudentRow,
} from "../../hooks/useClassAttendance";

const WEEKDAY_KEYS: Record<string, TranslationKey> = {
  sat: "course.attendance.weekdays.sat",
  sun: "course.attendance.weekdays.sun",
  mon: "course.attendance.weekdays.mon",
  tue: "course.attendance.weekdays.tue",
  wed: "course.attendance.weekdays.wed",
  thu: "course.attendance.weekdays.thu",
  fri: "course.attendance.weekdays.fri",
};

const DATE_COL_PX = 40;
const ROW_PX = 44;
const HEADER_H = "h-[4.25rem]";
const ROW_H = "h-11";

const ClassAttendancePage = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading, error } = useClassAttendance(classId);
  const grid = extractAttendanceGrid(data);
  const { markCell, isCellPending } = useMarkClassAttendance(classId);

  const monthGroups = useMemo(() => {
    if (!grid?.dates?.length) return [];
    const groups: { key: string; label: string; dates: AttendanceDateCol[] }[] = [];
    for (const d of grid.dates) {
      const last = groups[groups.length - 1];
      if (!last || last.key !== d.month_key) {
        groups.push({ key: d.month_key, label: d.month, dates: [d] });
      } else {
        last.dates.push(d);
      }
    }
    return groups;
  }, [grid?.dates]);

  const datesWidth = (grid?.dates.length ?? 0) * DATE_COL_PX;
  const studentCountRef = useRef(0);
  const dateCountRef = useRef(0);
  studentCountRef.current = grid?.students.length ?? 0;
  dateCountRef.current = grid?.dates.length ?? 0;
  const [rowWindow, setRowWindow] = useState({ start: 0, end: 24 });
  const [colWindow, setColWindow] = useState({ start: 0, end: 48 });
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const dateCount = dateCountRef.current;
    const colEnd = Math.min(dateCount, Math.ceil(el.clientWidth / DATE_COL_PX) + 16);
    setColWindow((prev) => (prev.start === 0 && prev.end === colEnd ? prev : { start: 0, end: colEnd }));
  }, [grid?.dates.length]);

  const onGridScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const count = studentCountRef.current;
    const start = Math.max(0, Math.floor(el.scrollTop / ROW_PX) - 6);
    const end = Math.min(count, start + Math.ceil(el.clientHeight / ROW_PX) + 14);
    setRowWindow((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));

    const dateCount = dateCountRef.current;
    const scrolled = Math.abs(el.scrollLeft);
    const colStart = Math.max(0, Math.floor(scrolled / DATE_COL_PX) - 6);
    const colEnd = Math.min(dateCount, colStart + Math.ceil(el.clientWidth / DATE_COL_PX) + 16);
    setColWindow((prev) => (prev.start === colStart && prev.end === colEnd ? prev : { start: colStart, end: colEnd }));
  }, []);

  if (!hasPermission("attendance.read") && !hasPermission("attendance.classes.read")) {
    return <PermissionDeniedCard />;
  }

  if (!classId || Number.isNaN(classId)) {
    return (
      <div className="p-2 sm:p-4">
        <p className="text-muted-foreground">{t("course.classStudents.invalidClass")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const classMeta = grid?.class;
  const classCompleted = classMeta?.status === "completed" || classMeta?.can_edit === false;
  const canEdit = !classCompleted && hasPermission("attendance.record");
  const canEditPast = canEdit && hasPermission("attendance.record.past");
  const dateRange =
    classMeta?.start_date && classMeta?.end_date
      ? `${classMeta.start_date} → ${classMeta.end_date}`
      : null;

  return (
    <div className="flex h-[calc(100dvh-13.5rem)] min-h-[22rem] w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden pb-4 sm:h-[calc(100dvh-12.75rem)] sm:gap-4">
      <div className="shrink-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("course.attendance.title")}</h1>
        <div className="mt-1 sm:mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: t("course.attendance.hubTitle"), to: "/attendance" },
              { label: t("course.attendance.title") },
            ]}
          />
        </div>
        {!dateRange && !isLoading ? (
          <p className="mt-2 text-sm text-warning">{t("course.attendance.missingDates")}</p>
        ) : null}
        {classCompleted && !isLoading ? (
          <p className="mt-2 text-sm text-warning">{t("course.attendance.completedLocked")}</p>
        ) : null}
      </div>

      {isLoading || !grid ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-[0.6rem] border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[0.6rem] border border-border bg-card">
          <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-muted/30 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {classMeta?.name ? (
                <span className="truncate text-sm font-semibold text-foreground">{classMeta.name}</span>
              ) : null}
              {classMeta?.class_code ? (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {classMeta.class_code}
                </span>
              ) : null}
              {classMeta?.schedule_days_label ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {classMeta.schedule_days_label}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <AttendanceLegend
                completed={classCompleted}
                pastLocked={grid.dates.some((date) => date.is_past) && !canEditPast}
              />
              {dateRange ? (
                <span className="shrink-0 rounded-[0.5rem] border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground sm:text-xs">
                  {dateRange}
                </span>
              ) : null}
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain"
            onScroll={onGridScroll}
          >
              <AttendanceGridBody
                students={grid.students}
                dates={grid.dates}
                monthGroups={monthGroups}
                datesWidth={datesWidth}
                rowWindow={rowWindow}
                colWindow={colWindow}
                canEdit={canEdit}
                canEditPast={canEditPast}
                isCellPending={isCellPending}
                onToggle={(studentId, date, status) => {
                  markCell({ student_id: studentId, date, status });
                }}
              />
          </div>
          <div className="flex shrink-0 items-center border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{grid.students.length}</span>
            <span className="ms-1.5">{t("course.attendance.students")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

function AttendanceGridBody({
  students,
  dates,
  monthGroups,
  datesWidth,
  rowWindow,
  colWindow,
  canEdit,
  canEditPast,
  isCellPending,
  onToggle,
}: {
  students: AttendanceStudentRow[];
  dates: AttendanceDateCol[];
  monthGroups: { key: string; label: string; dates: AttendanceDateCol[] }[];
  datesWidth: number;
  rowWindow: { start: number; end: number };
  colWindow: { start: number; end: number };
  canEdit: boolean;
  canEditPast: boolean;
  isCellPending: (studentId: number, date: string) => boolean;
  onToggle: (studentId: number, date: string, status: AttendanceMarkStatus) => void;
}) {
  const { t } = useTranslation();
  const count = students.length;
  const start = Math.min(rowWindow.start, count);
  const end = Math.min(Math.max(rowWindow.end, start), count);
  const visible = students.slice(start, end);
  const colStart = Math.min(colWindow.start, dates.length);
  const colEnd = Math.min(Math.max(colWindow.end, colStart), dates.length);
  const visibleDates = dates.slice(colStart, colEnd);
  const colPad = colStart * DATE_COL_PX;

  return (
    <div className="min-w-full">
      <div className="sticky top-0 z-20 flex bg-muted">
        <div className={cn(HEADER_H, "sticky start-0 z-30 flex w-52 shrink-0 items-end border-e border-b border-border bg-muted px-3 pb-2 text-[11px] font-medium sm:w-60 sm:text-xs")}>
          <span className="truncate">{t("course.columns.full_name")}</span>
        </div>
        <div style={{ width: datesWidth }} className="shrink-0">
          {dates.length === 0 ? (
            <div className={cn(HEADER_H, "border-b border-border")} />
          ) : (
            <>
              <div className="flex h-7 border-b border-border">
                {monthGroups.map((group) => (
                  <div
                    key={group.key}
                    style={{ width: group.dates.length * DATE_COL_PX }}
                    className="flex items-center justify-center border-e border-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]"
                  >
                    {group.label}
                  </div>
                ))}
              </div>
              <div className="flex h-10 border-b border-border">
                <div className="shrink-0" style={{ width: colPad }} />
                {visibleDates.map((date) => (
                  <div
                    key={date.date}
                    title={date.date}
                    style={{ width: DATE_COL_PX }}
                    className={cn(
                      "flex flex-col items-center justify-center text-center",
                      date.week_separator ? "border-e-[3px] border-e-foreground/45" : "border-e border-border",
                      date.is_today && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="block text-[9px] font-semibold lowercase leading-none text-muted-foreground sm:text-[10px]">
                      {WEEKDAY_KEYS[date.weekday ?? ""] ? t(WEEKDAY_KEYS[date.weekday ?? ""]) : (date.weekday ?? "")}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] leading-none sm:text-xs">{date.day}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className={cn(HEADER_H, "sticky end-0 z-30 grid w-[6.75rem] shrink-0 grid-cols-3 items-end border-s border-b border-border bg-muted px-1 py-2 text-center text-[10px] font-medium sm:w-[8.25rem] sm:text-[11px]")}>
          <span className="text-success">{t("course.attendance.totalPresent")}</span>
          <span className="text-danger">{t("course.attendance.totalAbsent")}</span>
          <span className="text-info">{t("course.attendance.totalLeave")}</span>
        </div>
      </div>
      {count === 0 ? (
        <div className="px-3 py-10 text-center text-xs text-muted-foreground">
          {dates.length === 0 ? t("course.attendance.notStarted") : t("course.classStudents.empty")}
        </div>
      ) : (
        <>
          <div style={{ height: start * ROW_PX }} />
          {visible.map((student) => (
            <div key={student.student_id} className="flex border-b border-border">
              <div className="sticky start-0 z-10 flex w-52 shrink-0 items-center border-e border-border bg-card px-3 sm:w-60" style={{ height: ROW_PX }}>
                <div className="min-w-0">
                  <div className="truncate text-[0.825rem] font-semibold leading-tight text-foreground">{student.full_name || "—"}</div>
                  <div className="truncate font-mono text-[0.65rem] leading-none text-muted-foreground">{student.student_code ?? student.student_id}</div>
                </div>
              </div>
              {dates.length === 0 ? (
                <div className="min-w-0 flex-1" style={{ height: ROW_PX }} />
              ) : (
                <AttendanceDateRow
                  student={student}
                  dates={visibleDates}
                  pad={colPad}
                  width={datesWidth}
                  canEdit={canEdit}
                  canEditPast={canEditPast}
                  isCellPending={isCellPending}
                  onToggle={(date, status) => onToggle(student.student_id, date, status)}
                />
              )}
              <div className="sticky end-0 z-10 grid w-[6.75rem] shrink-0 grid-cols-3 items-center border-s border-border bg-card text-center sm:w-[8.25rem]" style={{ height: ROW_PX }}>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-success sm:text-xs">{student.total_present}</span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-danger sm:text-xs">{student.total_absent}</span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-info sm:text-xs">{student.total_leave ?? 0}</span>
              </div>
            </div>
          ))}
          <div style={{ height: (count - end) * ROW_PX }} />
        </>
      )}
    </div>
  );
}

const AttendanceLegend = ({ completed, pastLocked }: { completed: boolean; pastLocked: boolean }) => {
  const { t } = useTranslation();
  const hint = completed
    ? t("course.attendance.completedLocked")
    : pastLocked
      ? t("course.attendance.todayOnly")
      : t("course.attendance.pastAndToday");

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="rounded-md bg-success/15 px-1.5 py-0.5 font-semibold text-success">
        {t("course.attendance.legendPresent")}
      </span>
      <span className="rounded-md bg-danger/15 px-1.5 py-0.5 font-semibold text-danger">
        {t("course.attendance.legendAbsent")}
      </span>
      <span className="rounded-md bg-info/15 px-1.5 py-0.5 font-semibold text-info">
        {t("course.attendance.legendLeave")}
      </span>
      <span className="hidden text-muted-foreground sm:inline">{hint}</span>
    </div>
  );
};

interface AttendanceDateRowProps {
  student: AttendanceStudentRow;
  dates: AttendanceDateCol[];
  pad: number;
  width: number;
  canEdit: boolean;
  canEditPast: boolean;
  isCellPending: (studentId: number, date: string) => boolean;
  onToggle: (date: string, status: AttendanceMarkStatus) => void;
}

function AttendanceDateRow({
  student,
  dates,
  pad,
  width,
  canEdit,
  canEditPast,
  isCellPending,
  onToggle,
}: AttendanceDateRowProps) {
  return (
    <div className={cn(ROW_H, "flex")} style={{ width }}>
      <div className="shrink-0" style={{ width: pad }} />
      {dates.map((d) => {
        const cell = student.attendance[d.date];
        const status = (cell?.status ?? null) as AttendanceMarkStatus | null;
        const pending = isCellPending(student.student_id, d.date);
        const editable = Boolean(
          canEdit &&
          (!d.is_past || canEditPast) &&
          cell?.editable !== false &&
          d.editable &&
          !pending
        );

        return (
          <div
            key={d.date}
            style={{ width: DATE_COL_PX }}
            className={cn(
              "flex items-center justify-center",
              d.week_separator ? "border-e-[3px] border-e-foreground/45" : "border-e border-border",
              d.is_today && "bg-primary/5"
            )}
          >
            <AttendanceMarkButton
              status={status}
              date={d.date}
              studentLabel={student.full_name ?? student.student_code ?? String(student.student_id)}
              editable={editable}
              pending={pending}
              onToggle={() => onToggle(d.date, nextAttendanceStatus(status))}
            />
          </div>
        );
      })}
    </div>
  );
}

interface AttendanceMarkButtonProps {
  status: AttendanceMarkStatus | null;
  date: string;
  studentLabel: string;
  editable: boolean;
  pending: boolean;
  onToggle: () => void;
}

function AttendanceMarkButton({
  status,
  date,
  studentLabel,
  editable,
  pending,
  onToggle,
}: AttendanceMarkButtonProps) {
  const letter = status === "present" ? "P" : status === "absent" ? "A" : status === "leave" ? "L" : "";

  return (
    <button
      type="button"
      title={date}
      aria-label={`${studentLabel} ${date}`}
      disabled={!editable}
      aria-busy={pending || undefined}
      onClick={() => {
        if (!editable) return;
        onToggle();
      }}
      className={cn(
        "flex size-6 items-center justify-center rounded-md border text-[10px] font-bold leading-none sm:size-7 sm:text-[11px]",
        status === "present" && "border-success/40 bg-success/15 text-success",
        status === "absent" && "border-danger/40 bg-danger/15 text-danger",
        status === "leave" && "border-info/40 bg-info/15 text-info",
        !status && "border-border bg-background text-muted-foreground",
        editable && "cursor-pointer hover:ring-2 hover:ring-primary/30",
        (!editable || pending) && "cursor-default",
        pending && "opacity-50",
        !editable && !pending && "opacity-80"
      )}
    >
      {letter}
    </button>
  );
}

export default ClassAttendancePage;
