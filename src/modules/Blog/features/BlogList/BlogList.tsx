import { useCallback, useMemo, useState } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Undo2, Upload } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useConfirmDialog,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useConfirmPresets } from "@/i18n/useConfirmPresets";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ColumnFunnel,
  NewButton,
  ServerDataTable,
  StatusBadge,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  useConfirmDelete,
  useDataTable,
  useStatusToggle,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { BLOG_QUERY_KEYS } from "../../data/constants/endpoints";
import { BlogCategory, BlogLanguage, BlogStatus, type Blog } from "../../data/models";
import {
  useBlogs,
  useDeleteBlogMutation,
  useSetBlogStatusMutation,
  useToggleBlogPublishedMutation,
} from "../../hooks";
import BlogFormDrawer from "../BlogForm/BlogFormDrawer";

const FILTER_KEYS = ["language", "category", "author", "status"] as const;
const READ = "blogs.read";

type BlogFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

function namedOptions(
  response: unknown,
  key: "authors" | "categories",
): { value: string; label: string }[] {
  if (!response || typeof response !== "object") return [];
  const rows = (response as { meta?: Record<string, { value?: string; label?: string }[] | undefined> })
    .meta?.[key];
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => typeof row?.value === "string" && row.value !== "")
    .map((row) => ({ value: row.value as string, label: row.label || (row.value as string) }));
}

function BlogThumb({ blog }: { blog: Blog }) {
  const src = blog.image_signed_url || blog.image_url;
  if (!src) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        B
      </div>
    );
  }
  return <img src={src} alt="" className="h-9 w-9 rounded-md border border-border object-cover" />;
}

function BlogsList({ filters }: { filters: BlogFilters }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { hasPermission } = useAuth();
  const { confirm } = useConfirmDialog();
  const confirmPresets = useConfirmPresets();
  const [editing, setEditing] = useState<Blog | null>(null);
  const [creating, setCreating] = useState(false);

  const optionsQuery = useBlogs({ per_page: 1 });
  const authors = namedOptions(optionsQuery.data, "authors");
  const savedCategories = namedOptions(optionsQuery.data, "categories");

  const openNew = useCallback(() => {
    setEditing(null);
    setCreating(true);
  }, []);
  const openEdit = useCallback((row: Blog) => {
    setCreating(false);
    setEditing(row);
  }, []);
  const closeDrawer = useCallback(() => {
    setCreating(false);
    setEditing(null);
  }, []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteBlogMutation();
  const { mutateAsync: setStatusAsync } = useSetBlogStatusMutation();
  const { mutate: togglePublished } = useToggleBlogPublishedMutation();
  const confirmDelete = useConfirmDelete();

  const canCreate = hasPermission("blogs.create");
  const canUpdate = hasPermission("blogs.update");
  const canDelete = hasPermission("blogs.delete");

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

  const statusToggle = useStatusToggle<Blog>({
    can: canUpdate,
    nameOf: (row) => row.title,
    statusOf: (row) => (row.status === BlogStatus.INACTIVE ? "inactive" : row.status === BlogStatus.ACTIVE ? "active" : null),
    save: (row, next) => setStatusAsync({
      id: row.id,
      status: next === "active" ? BlogStatus.ACTIVE : BlogStatus.INACTIVE,
    }),
  });

  const publish = useCallback((row: Blog) => {
    void (async () => {
      const publishing = row.status !== BlogStatus.PUBLISHED;
      const preset = publishing
        ? confirmPresets.activate(row.title)
        : confirmPresets.suspend(row.title);
      if (await confirm(preset)) togglePublished(row.id);
    })();
  }, [confirm, confirmPresets, togglePublished]);

  const categoryLabel = useCallback((category: string) => {
    if (category === BlogCategory.FINANCE) return t("blogs.categories.finance");
    if (category === BlogCategory.ACCOUNTING) return t("blogs.categories.accounting");
    if (category === BlogCategory.EDUCATION) return t("blogs.categories.education");
    if (category === BlogCategory.CAREER) return t("blogs.categories.career");
    if (category === BlogCategory.NEWS) return t("blogs.categories.news");
    if (category === BlogCategory.OTHER) return t("blogs.categories.other");
    return category;
  }, [t]);

  const languageLabel = useCallback((language: string) => {
    if (language === BlogLanguage.EN) return t("blogs.languages.en");
    if (language === BlogLanguage.PS) return t("blogs.languages.ps");
    if (language === BlogLanguage.DR) return t("blogs.languages.dr");
    return language;
  }, [t]);

  const statusLabel = useCallback((status: string) => {
    if (status === BlogStatus.ACTIVE) return t("blogs.statuses.active");
    if (status === BlogStatus.INACTIVE) return t("blogs.statuses.inactive");
    if (status === BlogStatus.PUBLISHED) return t("blogs.statuses.published");
    return status;
  }, [t]);

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: "blogs.delete", remove: removeRowAsync })],
    [gridT, removeRowAsync],
  );

  const languageOptions = useMemo(() => [
    { value: "", label: t("blogs.allLanguages") },
    { value: BlogLanguage.EN, label: t("blogs.languages.en") },
    { value: BlogLanguage.PS, label: t("blogs.languages.ps") },
    { value: BlogLanguage.DR, label: t("blogs.languages.dr") },
  ], [t]);

  const categoryOptions = useMemo(() => {
    const fromApi = savedCategories.filter(
      (category) => category.value !== "" && category.value.toLowerCase() !== "other",
    );
    const rows = fromApi.length > 0
      ? fromApi.map((category) => ({ value: category.value, label: categoryLabel(category.value) }))
      : [
          { value: BlogCategory.FINANCE, label: t("blogs.categories.finance") },
          { value: BlogCategory.ACCOUNTING, label: t("blogs.categories.accounting") },
          { value: BlogCategory.EDUCATION, label: t("blogs.categories.education") },
          { value: BlogCategory.CAREER, label: t("blogs.categories.career") },
          { value: BlogCategory.NEWS, label: t("blogs.categories.news") },
        ];
    return [{ value: "", label: t("blogs.allCategories") }, ...rows];
  }, [categoryLabel, savedCategories, t]);

  const authorOptions = useMemo(
    () => [{ value: "", label: t("blogs.allAuthors") }, ...authors],
    [authors, t],
  );

  const statusOptions = useMemo(() => [
    { value: "", label: t("blogs.allStatuses") },
    { value: BlogStatus.ACTIVE, label: t("blogs.statuses.active") },
    { value: BlogStatus.INACTIVE, label: t("blogs.statuses.inactive") },
    { value: BlogStatus.PUBLISHED, label: t("blogs.statuses.published") },
  ], [t]);

  const columns = useMemo<ColumnDef<Blog, unknown>[]>(() => [
    {
      id: "title",
      header: t("common.title"),
      meta: {
        priority: 1,
        sortKey: "title",
        shortLabel: t("common.title"),
        plainText: (row) => (row as Blog).title,
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <BlogThumb blog={row.original} />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    withHeaderAddon(
      {
        id: "author",
        header: t("blogs.author"),
        meta: {
          priority: 1,
          sortKey: "author",
          shortLabel: t("blogs.author"),
          plainText: (row) => (row as Blog).author_name ?? (row as Blog).author,
        },
        cell: ({ row }) => (
          <span className="truncate font-medium">
            {row.original.author_name ?? row.original.author ?? "—"}
          </span>
        ),
      },
      <ColumnFunnel
        label={t("blogs.allAuthors")}
        value={filters.values.author}
        onChange={(next) => filters.set("author", next)}
        options={authorOptions}
      />,
    ),
    withHeaderAddon(
      {
        id: "category",
        header: t("blogs.category"),
        meta: {
          priority: 1,
          sortKey: "category",
          shortLabel: t("blogs.category"),
          plainText: (row) => categoryLabel((row as Blog).category),
        },
        cell: ({ row }) => categoryLabel(row.original.category),
      },
      <ColumnFunnel
        label={t("blogs.allCategories")}
        value={filters.values.category}
        onChange={(next) => filters.set("category", next)}
        options={categoryOptions}
      />,
    ),
    withHeaderAddon(
      {
        id: "language",
        header: t("blogs.language"),
        meta: {
          priority: 2,
          sortKey: "language",
          shortLabel: t("blogs.language"),
          plainText: (row) => languageLabel((row as Blog).language),
        },
        cell: ({ row }) => languageLabel(row.original.language),
      },
      <ColumnFunnel
        label={t("blogs.allLanguages")}
        value={filters.values.language}
        onChange={(next) => filters.set("language", next)}
        options={languageOptions}
      />,
    ),
    withHeaderAddon(
      {
        id: "status",
        header: t("common.status"),
        meta: {
          priority: 2,
          sortKey: "status",
          shortLabel: t("common.status"),
          plainText: (row) => statusLabel((row as Blog).status),
        },
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} label={statusLabel(row.original.status)} />
        ),
      },
      <ColumnFunnel
        label={t("blogs.allStatuses")}
        value={filters.values.status}
        onChange={(next) => filters.set("status", next)}
        options={statusOptions}
      />,
    ),
    actionsColumn<Blog>(
      gridT,
      (row) => editDeleteActions({
        t: gridT,
        canUpdate,
        canDelete,
        updatePermission: "blogs.update",
        deletePermission: "blogs.delete",
        onEdit: () => openEdit(row),
        onDelete: () => confirmDelete(row.title, String(row.id), removeRow),
      }),
      true,
      statusToggle,
      (row) => row.status === BlogStatus.INACTIVE
        ? []
        : [{
            id: row.status === BlogStatus.PUBLISHED ? "unpublish" : "publish",
            label: row.status === BlogStatus.PUBLISHED ? t("blogs.unpublish") : t("blogs.publish"),
            icon: row.status === BlogStatus.PUBLISHED
              ? <Undo2 className="size-4" aria-hidden="true" />
              : <Upload className="size-4" aria-hidden="true" />,
            permission: "blogs.update",
            onSelect: () => publish(row),
          }],
    ),
  ], [
    authorOptions,
    canDelete,
    canUpdate,
    categoryLabel,
    categoryOptions,
    confirmDelete,
    filters,
    gridT,
    languageLabel,
    languageOptions,
    openEdit,
    publish,
    removeRow,
    statusLabel,
    statusOptions,
    statusToggle,
    t,
  ]);

  const table = useDataTable<Blog>({
    key: "blogs",
    queryKey: (query) => [...BLOG_QUERY_KEYS.blogs, query],
    endpoint: "/blogs",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: t("blogs.title"),
    params: filters.params,
    syncUrl: true,
    defaultSort: "-created_at",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const newLabel = t("blogs.add");
  const drawerOpen = creating || editing !== null;

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={t("blogs.entity")}
        searchPlaceholder={t("blogs.search")}
        emptyTitle={t("blogs.empty")}
        emptyBody={t("blogs.subtitle")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={filters.narrowed}
        onRowDoubleClick={canUpdate ? openEdit : undefined}
        stickyHeader
        toolsInHeader
        searchClassName="sm:w-[23rem] sm:max-w-[23rem] sm:flex-none sm:basis-[23rem]"
        extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      />
      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <DrawerOverlay />
        <DrawerContent className="w-full max-w-lg">
          {drawerOpen ? (
            <BlogFormDrawer
              blog={editing}
              savedCategories={savedCategories.map((category) => category.value)}
              onSuccess={closeDrawer}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}

const BlogList = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const filters = useUrlFilters(FILTER_KEYS);

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("blogs.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("blogs.subtitle")}</p>
      </div>
      <BlogsList filters={filters} />
    </div>
  );
};

export default BlogList;
