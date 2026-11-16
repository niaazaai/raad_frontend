import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  Calendar,
  CircleCheck,
  RotateCcw,
  Users,
} from "lucide-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  Input,
  Label,
  PageBreadcrumb,
  useConfirmDialog,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ColumnFunnel,
  NewButton,
  ServerDataTable,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  statusColumn,
  useConfirmDelete,
  useDataTable,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { coursePermission } from "../../data/courseEntityFormRegistry";
import { courseQueryKeys } from "../../data/constants/queryKeys";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import {
  useDeleteCourseEntity,
} from "../../hooks/useCourseEntity";
import {
  useArchiveLmsClassMutation,
  useCompleteLmsClassMutation,
  useRestoreLmsClassMutation,
} from "../../hooks/useLmsClassActions";
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";

const FILTER_KEYS = ["status"] as const;
const READ = "course.lms_classes.read";

interface ClassRow {
  id: number;
  class_code: string | null;
  name: string;
  course_name: string | null;
  main_category_name: string | null;
  sub_category_name: string | null;
  instructor_name: string | null;
  class_type: string | null;
  schedule_days: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  class_fee: number | string | null;
  students_count?: number;
  status: string;
}

interface EditorState {
  mode: CourseEntityDrawerMode;
  id: number | null;
}

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function day(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

function time(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

function scheduleDaysLabel(value: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "—";
  if (raw === "odd") return "Odd days";
  if (raw === "even") return "Even days";
  if (raw === "both") return "Both odd & even";
  return raw;
}

function StatusFunnel({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useGridTranslation();
  const value = filters.values.status || "active";

  return (
    <ColumnFunnel
      label={t("common:status.active")}
      value={value}
      onChange={(next) => filters.set("status", next || "active")}
      options={[
        { value: "active", label: t("common:status.active") },
        { value: "archived", label: t("common:status.archived") },
        { value: "completed", label: t("common:status.completed") },
      ]}
    />
  );
}

function ClassesList({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { columnHeader, entityTitle } = useCourseI18n();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [completeRow, setCompleteRow] = useState<ClassRow | null>(null);
  const [completeEndDate, setCompleteEndDate] = useState("");
  const title = entityTitle("lms-classes");

  const openNew = useCallback(() => setEditor({ mode: "create", id: null }), []);
  const openEdit = useCallback((row: ClassRow) => setEditor({ mode: "edit", id: row.id }), []);
  const openView = useCallback((row: ClassRow) => setEditor({ mode: "view", id: row.id }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity("lms-classes");
  const archiveClass = useArchiveLmsClassMutation();
  const restoreClass = useRestoreLmsClassMutation();
  const completeClass = useCompleteLmsClassMutation();
  const confirmDelete = useConfirmDelete();

  const canCreate = hasPermission(coursePermission(READ, "create"));
  const canUpdate = hasPermission(coursePermission(READ, "update"));
  const canDelete = hasPermission(coursePermission(READ, "delete"));
  const updatePermission = coursePermission(READ, "update");
  const deletePermission = coursePermission(READ, "delete");
  const canReadStudents = hasPermission("course.class_students.read");
  const canReadAttendance =
    hasPermission("attendance.read") || hasPermission("attendance.classes.read") || hasPermission(READ);

  const removeRow = useCallback<UseMutateFunction<unknown, Error, string>>((id, options) => {
    removeMutate(Number(id), {
      onSuccess: () => options?.onSuccess?.(undefined, id, undefined, undefined as never),
      onError: (error) =>
        options?.onError?.(
          error instanceof Error ? error : new Error("Delete failed"),
          id,
          undefined,
          undefined as never,
        ),
    });
    return Promise.resolve(undefined);
  }, [removeMutate]);

  const removeRowAsync = useCallback((id: string) => removeAsync(Number(id)), [removeAsync]);

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: deletePermission, remove: removeRowAsync })],
    [gridT, deletePermission, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<ClassRow, unknown>[]>(() => {
    const status = statusColumn<ClassRow>(gridT);
    const nameLabel = columnHeader("name", "lms-classes");
    const codeLabel = columnHeader("class_code", "lms-classes");
    const instructorLabel = columnHeader("instructor_name", "lms-classes");
    const studentsLabel = columnHeader("students_count", "lms-classes");
    const typeLabel = columnHeader("class_type", "lms-classes");
    const daysLabel = columnHeader("schedule_days", "lms-classes");
    const dateLabel = columnHeader("schedule_date", "lms-classes");
    const timeLabel = columnHeader("schedule_time", "lms-classes");
    const feeLabel = columnHeader("class_fee", "lms-classes");
    const statusLabel = columnHeader("status", "lms-classes");
    const studentsAction = t("course.students");
    const attendanceAction = t("course.attendance.title");
    const archiveAction = t("course.archive");
    const restoreAction = t("course.restore");
    const completeAction = t("course.complete");

    const leading = (row: ClassRow) => {
      const actions: {
        id: string;
        label: string;
        icon: ReactNode;
        permission: string;
        onSelect: () => void;
      }[] = [];
      if (canReadStudents) {
        actions.push({
          id: "students",
          label: studentsAction,
          icon: <Users className="size-4" aria-hidden="true" />,
          permission: "course.class_students.read",
          onSelect: () => navigate(`/classes/${row.id}/students`),
        });
      }
      if (canReadAttendance) {
        actions.push({
          id: "attendance",
          label: attendanceAction,
          icon: <Calendar className="size-4" aria-hidden="true" />,
          permission: READ,
          onSelect: () => navigate(`/classes/${row.id}/attendance`),
        });
      }
      if (canUpdate && row.status === "active") {
        actions.push({
          id: "archive",
          label: archiveAction,
          icon: <Archive className="size-4" aria-hidden="true" />,
          permission: updatePermission,
          onSelect: () => {
            void confirm({
              title: t("course.archiveClassTitle"),
              message: t("course.archiveClassMessage"),
              confirmText: t("course.archive"),
              variant: "warning",
            }).then((ok) => {
              if (ok) archiveClass.mutate({ id: row.id });
            });
          },
        });
        actions.push({
          id: "complete",
          label: completeAction,
          icon: <CircleCheck className="size-4" aria-hidden="true" />,
          permission: updatePermission,
          onSelect: () => {
            setCompleteRow(row);
            setCompleteEndDate(day(row.end_date) !== "—" ? day(row.end_date) : "");
          },
        });
      }
      if (canUpdate && row.status === "archived") {
        actions.push({
          id: "restore",
          label: restoreAction,
          icon: <RotateCcw className="size-4" aria-hidden="true" />,
          permission: updatePermission,
          onSelect: () => restoreClass.mutate({ id: row.id }),
        });
      }
      return actions;
    };

    return [
      {
        id: "name",
        header: nameLabel,
        meta: {
          priority: 1,
          sortKey: "name",
          shortLabel: nameLabel,
          plainText: (row) => (row as ClassRow).name,
        },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "class_code",
        header: codeLabel,
        meta: {
          priority: 1,
          sortKey: "class_code",
          shortLabel: codeLabel,
          plainText: (row) => shown((row as ClassRow).class_code),
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-sm font-medium text-primary">
            {shown(row.original.class_code)}
          </bdi>
        ),
      },
      {
        id: "instructor_name",
        header: instructorLabel,
        meta: {
          priority: 2,
          shortLabel: instructorLabel,
          plainText: (row) => shown((row as ClassRow).instructor_name),
        },
        cell: ({ row }) => shown(row.original.instructor_name),
      },
      {
        id: "students_count",
        header: studentsLabel,
        meta: {
          priority: 2,
          sortKey: "students_count",
          shortLabel: studentsLabel,
          plainText: (row) => String((row as ClassRow).students_count ?? 0),
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-medium tabular-nums">
            {Number(row.original.students_count ?? 0)}
          </bdi>
        ),
      },
      {
        id: "class_type",
        header: typeLabel,
        meta: {
          priority: 3,
          shortLabel: typeLabel,
          plainText: (row) => shown((row as ClassRow).class_type),
        },
        cell: ({ row }) => shown(row.original.class_type),
      },
      {
        id: "schedule_days",
        header: daysLabel,
        meta: {
          priority: 3,
          shortLabel: daysLabel,
          plainText: (row) => scheduleDaysLabel((row as ClassRow).schedule_days),
        },
        cell: ({ row }) => scheduleDaysLabel(row.original.schedule_days),
      },
      {
        id: "schedule_date",
        header: dateLabel,
        meta: {
          priority: 2,
          sortKey: "start_date",
          shortLabel: dateLabel,
          plainText: (row) => {
            const item = row as ClassRow;
            return `${day(item.start_date)} → ${day(item.end_date)}`;
          },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="text-sm tabular-nums">
            {day(row.original.start_date)} → {day(row.original.end_date)}
          </bdi>
        ),
      },
      {
        id: "schedule_time",
        header: timeLabel,
        meta: {
          priority: 3,
          shortLabel: timeLabel,
          plainText: (row) => {
            const item = row as ClassRow;
            return `${time(item.start_time)} – ${time(item.end_time)}`;
          },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="text-sm tabular-nums">
            {time(row.original.start_time)} – {time(row.original.end_time)}
          </bdi>
        ),
      },
      {
        id: "class_fee",
        header: feeLabel,
        meta: {
          priority: 3,
          shortLabel: feeLabel,
          plainText: (row) => {
            const fee = (row as ClassRow).class_fee;
            if (fee == null || fee === "") return "—";
            const num = Number(fee);
            return Number.isNaN(num) ? String(fee) : String(num);
          },
        },
        cell: ({ row }) => {
          const fee = row.original.class_fee;
          if (fee == null || fee === "") return "—";
          const num = Number(fee);
          if (Number.isNaN(num)) return String(fee);
          return (
            <bdi dir="ltr" className="font-medium tabular-nums">
              {num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </bdi>
          );
        },
      },
      withHeaderAddon(
        {
          ...status,
          meta: {
            priority: 2,
            sortKey: "status",
            shortLabel: statusLabel,
            plainText: (row) => {
              const value = (row as ClassRow).status;
              return gridT(`common:status.${value}`, { defaultValue: value });
            },
          },
        },
        <StatusFunnel filters={filters} />,
      ),
      actionsColumn<ClassRow>(
        gridT,
        (row) =>
          editDeleteActions({
            t: gridT,
            canUpdate,
            canDelete,
            updatePermission,
            deletePermission,
            onEdit: () => openEdit(row),
            onDelete: () => confirmDelete(row.name, String(row.id), removeRow),
          }),
        true,
        undefined,
        leading,
      ),
    ];
  }, [
    gridT,
    columnHeader,
    t,
    filters,
    canReadStudents,
    canReadAttendance,
    canUpdate,
    canDelete,
    updatePermission,
    deletePermission,
    navigate,
    confirm,
    archiveClass,
    restoreClass,
    openEdit,
    confirmDelete,
    removeRow,
  ]);

  const table = useDataTable<ClassRow>({
    key: "course.lms-classes",
    queryKey: (query) => courseQueryKeys.entity("lms-classes", query),
    endpoint: "/lms-classes",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: title,
    params: {
      ...filters.params,
      status: filters.values.status || "active",
    },
    syncUrl: true,
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const newLabel = t("dt.classes.new");

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.classes.search")}
        emptyTitle={t("dt.classes.emptyTitle")}
        emptyBody={t("dt.classes.emptyBody")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={filters.narrowed}
        onRowDoubleClick={canUpdate ? openEdit : openView}
        stickyHeader
        toolsInHeader
        searchClassName="sm:w-[23rem] sm:max-w-[23rem] sm:flex-none sm:basis-[23rem]"
        extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      />
      <Drawer open={editor !== null} onClose={closeEditor}>
        <DrawerOverlay />
        <DrawerContent className="w-[min(720px,96vw)] min-w-[320px]">
          {editor ? (
            <CourseEntityFormDrawer
              slug="lms-classes"
              entityTitle={title}
              mode={editor.mode}
              entityId={editor.id}
              onSuccess={closeEditor}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
      <Drawer open={completeRow !== null} onClose={() => setCompleteRow(null)}>
        <DrawerOverlay />
        <DrawerContent className="max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("course.markClassFinished")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="complete-end-date">{t("course.endDate")}</Label>
              <Input
                id="complete-end-date"
                type="date"
                value={completeEndDate}
                onChange={(event) => setCompleteEndDate(event.target.value)}
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setCompleteRow(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              loading={completeClass.isPending}
              onClick={() => {
                if (!completeRow) return;
                completeClass.mutate(
                  { id: completeRow.id, end_date: completeEndDate || undefined },
                  { onSuccess: () => setCompleteRow(null) },
                );
              }}
            >
              {t("course.classFinished")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

const ClassesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription } = useCourseI18n();
  const filters = useUrlFilters(FILTER_KEYS);
  const title = entityTitle("lms-classes");

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{entityDescription("lms-classes")}</p>
        <div className="mt-2">
          <PageBreadcrumb items={[{ label: t("breadcrumb.course"), to: "/course" }, { label: title }]} />
        </div>
      </div>
      <ClassesList filters={filters} />
    </div>
  );
};

export default ClassesPage;
