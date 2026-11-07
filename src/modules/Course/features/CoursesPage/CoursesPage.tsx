import { useCallback, useMemo, useState } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { courseLevelLabel } from "@/data/enums/courseWizard";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ColumnFunnel,
  NewButton,
  ServerDataTable,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  statusColumn,
  statusFilterOptions,
  useConfirmDelete,
  useDataTable,
  useStatusToggle,
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
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";

const FILTER_KEYS = ["status"] as const;
const READ = "course.courses.read";

interface CourseListRow {
  id: number;
  title: string | null;
  language: string | null;
  level: string | null;
  status: string;
  thumbnail_url?: string | null;
  created_at?: string | null;
}

function StatusFunnel({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useGridTranslation();

  return (
    <ColumnFunnel
      label={t("common:table.anyStatus")}
      value={filters.values.status}
      onChange={(next) => filters.set("status", next)}
      options={statusFilterOptions(t)}
    />
  );
}

function CourseThumb({ title, src }: { title: string; src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const words = title.trim().split(/\s+/).filter(Boolean);
    const initials =
      words.length === 0
        ? "C"
        : words.length === 1
          ? words[0]!.slice(0, 2).toUpperCase()
          : `${words[0]![0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-9 w-9 rounded-md border border-border object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function CoursesList({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { columnHeader, entityTitle } = useCourseI18n();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const title = entityTitle("courses");

  const openNew = useCallback(() => navigate("/course/courses/create"), [navigate]);
  const openView = useCallback(
    (row: CourseListRow) => navigate(`/course/courses/${row.id}/view`),
    [navigate],
  );
  const openEdit = useCallback(
    (row: CourseListRow) => navigate(`/course/courses/${row.id}/edit`),
    [navigate],
  );

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity("courses");
  const { mutateAsync: saveRow } = useUpdateCourseEntity("courses");
  const confirmDelete = useConfirmDelete();

  const canCreate = hasPermission(coursePermission(READ, "create"));
  const canUpdate = hasPermission(coursePermission(READ, "update"));
  const canDelete = hasPermission(coursePermission(READ, "delete"));
  const updatePermission = coursePermission(READ, "update");
  const deletePermission = coursePermission(READ, "delete");

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

  const statusToggle = useStatusToggle<CourseListRow>({
    can: canUpdate,
    nameOf: (row) => row.title ?? String(row.id),
    save: (row, next) => saveRow({ id: row.id, body: { status: next } }),
  });

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: deletePermission, remove: removeRowAsync })],
    [deletePermission, gridT, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<CourseListRow, unknown>[]>(() => {
    const status = statusColumn<CourseListRow>(gridT);
    const titleLabel = columnHeader("title", "courses");
    const languageLabel = columnHeader("language", "courses");
    const levelLabel = columnHeader("level", "courses");
    const statusLabel = columnHeader("status", "courses");
    const createdLabel = columnHeader("created_at", "courses");
    const viewLabel = t("common.view");

    return [
      {
        id: "title",
        header: titleLabel,
        meta: {
          priority: 1,
          sortKey: "title",
          shortLabel: titleLabel,
          plainText: (row) => (row as CourseListRow).title ?? "—",
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <CourseThumb title={row.original.title ?? ""} src={row.original.thumbnail_url} />
            <span className="font-medium">{row.original.title ?? "—"}</span>
          </div>
        ),
      },
      {
        id: "language",
        header: languageLabel,
        meta: {
          priority: 2,
          shortLabel: languageLabel,
          plainText: (row) => (row as CourseListRow).language ?? "—",
          width: { default: 110, min: 88 },
        },
        cell: ({ row }) => row.original.language ?? "—",
      },
      {
        id: "level",
        header: levelLabel,
        meta: {
          priority: 2,
          shortLabel: levelLabel,
          plainText: (row) => courseLevelLabel((row as CourseListRow).level),
          width: { default: 120, min: 96 },
        },
        cell: ({ row }) => courseLevelLabel(row.original.level),
      },
      {
        id: "created_at",
        header: createdLabel,
        meta: {
          priority: 3,
          sortKey: "created_at",
          shortLabel: createdLabel,
          plainText: (row) => {
            const value = (row as CourseListRow).created_at;
            return value ? value.slice(0, 10) : "—";
          },
          width: { default: 128, min: 110 },
        },
        cell: ({ row }) => {
          const value = row.original.created_at;
          return value ? <bdi dir="ltr">{value.slice(0, 10)}</bdi> : "—";
        },
      },
      withHeaderAddon(
        {
          ...status,
          meta: {
            priority: 2,
            shortLabel: statusLabel,
            plainText: (row) => {
              const value = (row as CourseListRow).status;
              return gridT(`common:status.${value}`, { defaultValue: value });
            },
          },
        },
        <StatusFunnel filters={filters} />,
      ),
      actionsColumn<CourseListRow>(
        gridT,
        (row) =>
          editDeleteActions({
            t: gridT,
            canUpdate,
            canDelete,
            updatePermission,
            deletePermission,
            onEdit: () => openEdit(row),
            onDelete: () => confirmDelete(row.title ?? String(row.id), String(row.id), removeRow),
          }),
        true,
        statusToggle,
        (row) => [
          {
            id: "view",
            label: viewLabel,
            icon: <Eye className="size-4" aria-hidden="true" />,
            permission: READ,
            onSelect: () => openView(row),
          },
        ],
      ),
    ];
  }, [
    canDelete,
    canUpdate,
    columnHeader,
    confirmDelete,
    deletePermission,
    filters,
    gridT,
    openEdit,
    openView,
    removeRow,
    statusToggle,
    t,
    updatePermission,
  ]);

  const table = useDataTable<CourseListRow>({
    key: "course.courses",
    queryKey: (query) => courseQueryKeys.entity("courses", query),
    endpoint: "/courses",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: title,
    params: filters.params,
    syncUrl: true,
    defaultSort: "-created_at",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const newLabel = t("dt.courses.new");

  return (
    <ServerDataTable
      api={table}
      entityLabel={title}
      searchPlaceholder={t("dt.courses.search")}
      emptyTitle={t("dt.courses.emptyTitle")}
      emptyBody={t("dt.courses.emptyBody")}
      emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      narrowed={filters.narrowed}
      onRowDoubleClick={openView}
      stickyHeader
      toolsInHeader
      searchClassName="sm:w-[23rem] sm:max-w-[23rem] sm:flex-none sm:basis-[23rem]"
      extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
    />
  );
}

const CoursesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription } = useCourseI18n();
  const filters = useUrlFilters(FILTER_KEYS);
  const title = entityTitle("courses");

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{entityDescription("courses")}</p>
        <div className="mt-2">
          <PageBreadcrumb items={[{ label: t("breadcrumb.course"), to: "/course" }, { label: title }]} />
        </div>
      </div>
      <CoursesList filters={filters} />
    </div>
  );
};

export default CoursesPage;
