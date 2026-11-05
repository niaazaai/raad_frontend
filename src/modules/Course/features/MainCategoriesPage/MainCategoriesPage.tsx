import { useCallback, useMemo, useState } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Layers } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  PageBreadcrumb,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { API_V1_BASE } from "@/services";
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
import MainCategorySubCategoriesDrawer from "../MainCategorySubCategoriesDrawer/MainCategorySubCategoriesDrawer";

const FILTER_KEYS = ["status"] as const;
const READ = "course.main_categories.read";

interface MainCategoryRow {
  id: number;
  title: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  thumbnail_url: string | null;
}

interface EditorState {
  mode: CourseEntityDrawerMode;
  id: number | null;
}

function thumbSrc(row: MainCategoryRow): string | null {
  if (typeof row.thumbnail_url === "string" && row.thumbnail_url.trim() !== "") {
    return row.thumbnail_url;
  }
  return `${API_V1_BASE}/main-categories/${row.id}/thumbnail`;
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "--";
  const first = words[0] ?? "";
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

function CategoryThumb({ row }: { row: MainCategoryRow }) {
  const [failed, setFailed] = useState(false);
  const src = thumbSrc(row);
  if (!src || failed) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        {initials(row.title)}
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

function MainCategoriesList({ filters }: { filters: UrlFilters<"status"> }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { columnHeader, entityTitle } = useCourseI18n();
  const { hasPermission } = useAuth();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [subs, setSubs] = useState<{ id: number; title: string } | null>(null);
  const title = entityTitle("main-categories");

  const openNew = useCallback(() => setEditor({ mode: "create", id: null }), []);
  const openEdit = useCallback((row: MainCategoryRow) => setEditor({ mode: "edit", id: row.id }), []);
  const openView = useCallback((row: MainCategoryRow) => setEditor({ mode: "view", id: row.id }), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const openSubs = useCallback((row: MainCategoryRow) => setSubs({ id: row.id, title: row.title }), []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity("main-categories");
  const { mutateAsync: saveRow } = useUpdateCourseEntity("main-categories");
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

  const statusToggle = useStatusToggle<MainCategoryRow>({
    can: canUpdate,
    nameOf: (row) => row.title,
    save: (row, next) => saveRow({ id: row.id, body: { status: next } }),
  });

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: coursePermission(READ, "delete"), remove: removeRowAsync })],
    [gridT, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<MainCategoryRow, unknown>[]>(() => {
    const status = statusColumn<MainCategoryRow>(gridT);
    const titleLabel = columnHeader("title", "main-categories");
    const idLabel = columnHeader("id", "main-categories");
    const imageLabel = columnHeader("image", "main-categories");
    const statusLabel = columnHeader("status", "main-categories");
    const subsLabel = t("course.subCategories");
    const leading = (row: MainCategoryRow) => [
      {
        id: "subcategories",
        label: subsLabel,
        icon: <Layers className="size-4" aria-hidden="true" />,
        permission: "course.sub_categories.read",
        onSelect: () => openSubs(row),
      },
    ];

    return [
      {
        id: "name",
        header: titleLabel,
        meta: {
          priority: 1,
          sortKey: "title",
          shortLabel: titleLabel,
          plainText: (row) => (row as MainCategoryRow).title,
        },
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        id: "code",
        header: idLabel,
        meta: {
          priority: 2,
          sortKey: "id",
          shortLabel: idLabel,
          plainText: (row) => String((row as MainCategoryRow).id),
        },
        cell: ({ row }) => <bdi dir="ltr" className="font-mono text-xs">{row.original.id}</bdi>,
      },
      {
        id: "image",
        header: imageLabel,
        meta: { priority: 2, shortLabel: imageLabel, exportable: false },
        cell: ({ row }) => <CategoryThumb row={row.original} />,
      },
      withHeaderAddon(
        {
          ...status,
          meta: {
            priority: 2,
            shortLabel: statusLabel,
            plainText: (row) => {
              const value = (row as MainCategoryRow).status;
              return gridT(`common:status.${value}`, { defaultValue: value });
            },
          },
        },
        <StatusFunnel filters={filters} />,
      ),
      actionsColumn<MainCategoryRow>(
        gridT,
        (row) =>
          editDeleteActions({
            t: gridT,
            canUpdate,
            canDelete,
            updatePermission,
            deletePermission,
            onEdit: () => openEdit(row),
            onDelete: () => confirmDelete(row.title, String(row.id), removeRow),
          }),
        true,
        statusToggle,
        leading,
      ),
    ];
  }, [
    gridT,
    columnHeader,
    filters,
    t,
    openSubs,
    canUpdate,
    canDelete,
    updatePermission,
    deletePermission,
    openEdit,
    confirmDelete,
    removeRow,
    statusToggle,
  ]);

  const table = useDataTable<MainCategoryRow>({
    key: "course.main-categories",
    queryKey: (query) => courseQueryKeys.entity("main-categories", query),
    endpoint: "/main-categories",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: title,
    params: filters.params,
    syncUrl: true,
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const newLabel = t("dt.mainCategories.new");

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.mainCategories.search")}
        emptyTitle={t("dt.mainCategories.emptyTitle")}
        emptyBody={t("dt.mainCategories.emptyBody")}
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
        <DrawerContent>
          {editor ? (
            <CourseEntityFormDrawer
              slug="main-categories"
              entityTitle={title}
              mode={editor.mode}
              entityId={editor.id}
              onSuccess={closeEditor}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
      <MainCategorySubCategoriesDrawer
        open={subs !== null}
        onClose={() => setSubs(null)}
        mainCategoryId={subs?.id ?? null}
        mainCategoryTitle={subs?.title ?? ""}
      />
    </>
  );
}

const MainCategoriesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription } = useCourseI18n();
  const filters = useUrlFilters(FILTER_KEYS);
  const title = entityTitle("main-categories");

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{entityDescription("main-categories")}</p>
        <div className="mt-2">
          <PageBreadcrumb items={[{ label: t("breadcrumb.course"), to: "/course" }, { label: title }]} />
        </div>
      </div>
      <MainCategoriesList filters={filters} />
    </div>
  );
};

export default MainCategoriesPage;
