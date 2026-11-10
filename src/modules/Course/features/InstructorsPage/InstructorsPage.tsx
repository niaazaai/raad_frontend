import { useCallback, useMemo, useState } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  PageBreadcrumb,
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
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";

const FILTER_KEYS = ["status"] as const;
const READ = "course.instructors.read";

interface InstructorRow {
  id: number;
  user_id: number | null;
  user_name: string | null;
  bio: string | null;
  specialization: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  status: string;
  created_at: string | null;
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

function InstructorsList({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { columnHeader, entityTitle } = useCourseI18n();
  const { hasPermission } = useAuth();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const title = entityTitle("instructors");

  const openNew = useCallback(() => setEditor({ mode: "create", id: null }), []);
  const openEdit = useCallback((row: InstructorRow) => setEditor({ mode: "edit", id: row.id }), []);
  const openView = useCallback((row: InstructorRow) => setEditor({ mode: "view", id: row.id }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity("instructors");
  const { mutateAsync: saveRow } = useUpdateCourseEntity("instructors");
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

  const nameOf = useCallback((row: InstructorRow) => {
    const name = shown(row.user_name);
    return name === "—" ? String(row.id) : name;
  }, []);

  const statusToggle = useStatusToggle<InstructorRow>({
    can: canUpdate,
    nameOf,
    save: (row, next) => saveRow({ id: row.id, body: { status: next } }),
  });

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: deletePermission, remove: removeRowAsync })],
    [deletePermission, gridT, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<InstructorRow, unknown>[]>(() => {
    const status = statusColumn<InstructorRow>(gridT);
    const nameLabel = columnHeader("user_name", "instructors");
    const idLabel = columnHeader("id", "instructors");
    const specializationLabel = columnHeader("specialization", "instructors");
    const phoneLabel = columnHeader("phone_number", "instructors");
    const whatsappLabel = columnHeader("whatsapp_number", "instructors");
    const emailLabel = columnHeader("email", "instructors");
    const statusLabel = columnHeader("status", "instructors");
    const createdLabel = columnHeader("created_at", "instructors");

    return [
      {
        id: "user_name",
        header: nameLabel,
        meta: {
          priority: 1,
          shortLabel: nameLabel,
          plainText: (row) => shown((row as InstructorRow).user_name),
          width: { default: 180, min: 140 },
        },
        cell: ({ row }) => <span className="font-medium">{shown(row.original.user_name)}</span>,
      },
      {
        id: "id",
        header: idLabel,
        meta: {
          priority: 2,
          sortKey: "id",
          shortLabel: idLabel,
          plainText: (row) => String((row as InstructorRow).id),
          width: { default: 88, min: 72 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-xs">
            {row.original.id}
          </bdi>
        ),
      },
      {
        id: "specialization",
        header: specializationLabel,
        meta: {
          priority: 1,
          shortLabel: specializationLabel,
          plainText: (row) => shown((row as InstructorRow).specialization),
          width: { default: 160, min: 120 },
        },
        cell: ({ row }) => shown(row.original.specialization),
      },
      {
        id: "phone_number",
        header: phoneLabel,
        meta: {
          priority: 2,
          shortLabel: phoneLabel,
          plainText: (row) => shown((row as InstructorRow).phone_number),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => {
          const value = shown(row.original.phone_number);
          return value === "—" ? value : <bdi dir="ltr">{value}</bdi>;
        },
      },
      {
        id: "whatsapp_number",
        header: whatsappLabel,
        meta: {
          priority: 3,
          shortLabel: whatsappLabel,
          plainText: (row) => shown((row as InstructorRow).whatsapp_number),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => {
          const value = shown(row.original.whatsapp_number);
          return value === "—" ? value : <bdi dir="ltr">{value}</bdi>;
        },
      },
      {
        id: "email",
        header: emailLabel,
        meta: {
          priority: 2,
          shortLabel: emailLabel,
          plainText: (row) => shown((row as InstructorRow).email),
          width: { default: 200, min: 140 },
        },
        cell: ({ row }) => {
          const value = shown(row.original.email);
          return value === "—" ? value : <bdi dir="ltr">{value}</bdi>;
        },
      },
      withHeaderAddon(
        {
          ...status,
          meta: {
            priority: 1,
            shortLabel: statusLabel,
            plainText: (row) => {
              const value = (row as InstructorRow).status;
              return gridT(`common:status.${value}`, { defaultValue: value });
            },
          },
        },
        <StatusFunnel filters={filters} />,
      ),
      {
        id: "created_at",
        header: createdLabel,
        meta: {
          priority: 3,
          sortKey: "created_at",
          shortLabel: createdLabel,
          plainText: (row) => day((row as InstructorRow).created_at),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => {
          const value = day(row.original.created_at);
          return value === "—" ? value : <bdi dir="ltr">{value}</bdi>;
        },
      },
      actionsColumn<InstructorRow>(
        gridT,
        (row) =>
          editDeleteActions({
            t: gridT,
            canUpdate,
            canDelete,
            updatePermission,
            deletePermission,
            onEdit: () => openEdit(row),
            onDelete: () => confirmDelete(nameOf(row), String(row.id), removeRow),
          }),
        true,
        statusToggle,
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
    nameOf,
    openEdit,
    removeRow,
    statusToggle,
    updatePermission,
  ]);

  const table = useDataTable<InstructorRow>({
    key: "course.instructors",
    queryKey: (query) => courseQueryKeys.entity("instructors", query),
    endpoint: "/instructors",
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

  const newLabel = t("dt.instructors.new");

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.instructors.search")}
        emptyTitle={t("dt.instructors.emptyTitle")}
        emptyBody={t("dt.instructors.emptyBody")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={filters.narrowed}
        onRowDoubleClick={canUpdate ? openEdit : openView}
        stickyHeader
        toolsInHeader
        extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      />
      <Drawer open={editor !== null} onClose={closeEditor}>
        <DrawerOverlay />
        <DrawerContent className="w-[42%] min-w-[480px]">
          {editor ? (
            <CourseEntityFormDrawer
              slug="instructors"
              entityTitle={title}
              mode={editor.mode}
              entityId={editor.id}
              onSuccess={closeEditor}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}

const InstructorsPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription } = useCourseI18n();
  const filters = useUrlFilters(FILTER_KEYS);
  const title = entityTitle("instructors");

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{entityDescription("instructors")}</p>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.course"), to: "/course" },
              { label: title },
            ]}
          />
        </div>
      </div>
      <InstructorsList filters={filters} />
    </div>
  );
};

export default InstructorsPage;
