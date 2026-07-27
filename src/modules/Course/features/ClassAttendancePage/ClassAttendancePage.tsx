import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "iconoir-react";
import { Button, Checkbox, PageBreadcrumb, Spinner } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  extractAttendanceGrid,
  useClassAttendance,
  useMarkClassAttendance,
  type AttendanceDateCol,
  type AttendanceStudentRow,
} from "../../hooks/useClassAttendance";

/** Default checkbox is size-3.5 (14px); +20% ≈ 16.8px */
const ATTENDANCE_CHECKBOX_CLASS = "size-[1.05rem] [&_svg]:size-3";

const ClassAttendancePage = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading, error } = useClassAttendance(classId);
  const grid = extractAttendanceGrid(data);
  const markAttendance = useMarkClassAttendance(classId);

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

  if (!hasPermission("course.class_students.read") && !hasPermission("course.lms_classes.read")) {
    return <PermissionDeniedCard />;
  }

  if (!classId || Number.isNaN(classId)) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("course.classStudents.invalidClass")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const classMeta = grid?.class;
  const canEdit = hasPermission("course.lms_classes.update") || hasPermission("course.class_students.update");
  const dateRange =
    classMeta?.start_date && classMeta?.end_date
      ? `${classMeta.start_date} → ${classMeta.end_date}`
      : null;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-2 gap-2"
          onClick={() => navigate("/classes")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("course.classStudents.backToClasses")}
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t("course.attendance.title")}</h1>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: t("course.entities.lmsClasses.title"), to: "/classes" },
              { label: t("course.attendance.title") },
            ]}
          />
        </div>
        {!dateRange && !isLoading ? (
          <p className="mt-2 text-sm text-warning">{t("course.attendance.missingDates")}</p>
        ) : null}
      </div>

      {isLoading || !grid ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[0.6rem] border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {classMeta?.name ? (
                <span className="truncate text-sm font-semibold text-foreground">{classMeta.name}</span>
              ) : null}
              {classMeta?.class_code ? (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {classMeta.class_code}
                </span>
              ) : null}
            </div>
            {dateRange ? (
              <span className="shrink-0 rounded-[0.5rem] border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {dateRange}
              </span>
            ) : null}
          </div>

          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-max min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th
                    rowSpan={2}
                    className="sticky start-0 z-20 border-e border-border bg-muted/80 px-2 py-2 text-start font-medium"
                  >
                    {t("course.columns.student_code")}
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky start-[5.5rem] z-20 border-e border-border bg-muted/80 px-2 py-2 text-start font-medium"
                  >
                    {t("course.columns.full_name")}
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky start-[14rem] z-20 border-e border-border bg-muted/80 px-2 py-2 text-start font-medium"
                  >
                    {t("course.columns.father_name")}
                  </th>
                  {monthGroups.map((g) => (
                    <th
                      key={g.key}
                      colSpan={g.dates.length}
                      className="border-e border-border px-1 py-1 text-center font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {g.label}
                    </th>
                  ))}
                  <th rowSpan={2} className="border-e border-border px-2 py-2 text-center font-medium">
                    {t("course.attendance.totalPresent")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center font-medium">
                    {t("course.attendance.totalAbsent")}
                  </th>
                </tr>
                <tr className="border-b border-border bg-muted/30">
                  {grid.dates.map((d) => (
                    <th
                      key={d.date}
                      title={d.date}
                      className={cn(
                        "w-8 min-w-8 max-w-8 border-e border-border px-0 py-1 text-center font-mono font-medium",
                        d.is_friday && "bg-muted/60 text-muted-foreground",
                        d.is_today && "bg-primary/10 text-primary"
                      )}
                    >
                      {d.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grid.students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={grid.dates.length + 5}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      {t("course.classStudents.empty")}
                    </td>
                  </tr>
                ) : (
                  grid.students.map((student) => (
                    <AttendanceRow
                      key={student.student_id}
                      student={student}
                      dates={grid.dates}
                      canEdit={canEdit}
                      onToggle={(date, next) => {
                        markAttendance.mutate({
                          student_id: student.student_id,
                          date,
                          status: next,
                        });
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface AttendanceRowProps {
  student: AttendanceStudentRow;
  dates: AttendanceDateCol[];
  canEdit: boolean;
  onToggle: (date: string, status: "present" | "absent") => void;
}

function AttendanceRow({ student, dates, canEdit, onToggle }: AttendanceRowProps) {
  return (
    <tr className="hover:bg-muted/20">
      <td className="sticky start-0 z-10 border-e border-border bg-card px-2 py-1.5 font-mono">
        {student.student_code ?? student.student_id}
      </td>
      <td className="sticky start-[5.5rem] z-10 border-e border-border bg-card px-2 py-1.5 font-medium">
        {student.full_name || "—"}
      </td>
      <td className="sticky start-[14rem] z-10 border-e border-border bg-card px-2 py-1.5 text-muted-foreground">
        {student.father_name || "—"}
      </td>
      {dates.map((d) => {
        const cell = student.attendance[d.date];
        if (d.is_friday || cell?.status === "holiday") {
          return (
            <td
              key={d.date}
              className="w-8 min-w-8 max-w-8 border-e border-border bg-muted/30 px-0 py-1 text-center text-muted-foreground"
            >
              /
            </td>
          );
        }

        const isPresent = cell?.status === "present";
        const editable = Boolean(canEdit && cell?.editable !== false && d.editable);

        return (
          <td key={d.date} className="w-8 min-w-8 max-w-8 border-e border-border px-0 py-1 text-center">
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isPresent}
                disabled={!editable}
                title={d.date}
                aria-label={`${student.full_name ?? student.student_code} ${d.date}`}
                className={cn(
                  ATTENDANCE_CHECKBOX_CLASS,
                  !editable && isPresent && "opacity-90",
                  !editable && !isPresent && "opacity-55"
                )}
                onCheckedChange={(checked) => {
                  if (!editable) return;
                  onToggle(d.date, checked === true ? "present" : "absent");
                }}
              />
            </div>
          </td>
        );
      })}
      <td className="border-e border-border px-2 py-1.5 text-center">
        <span className="inline-block min-w-[1.75rem] font-mono text-xs font-semibold tabular-nums text-success">
          {student.total_present}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center">
        <span className="inline-block min-w-[1.75rem] font-mono text-xs font-semibold tabular-nums text-danger">
          {student.total_absent}
        </span>
      </td>
    </tr>
  );
}

export default ClassAttendancePage;
