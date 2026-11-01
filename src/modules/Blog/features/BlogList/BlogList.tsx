import { useCallback, useMemo, useState } from "react";
import { Plus, Pencil as EditPencil, Trash2 as Trash, Upload, Undo2 as Undo } from "lucide-react";
import {
  Button,
  DataTable,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useConfirmDialog,
} from "@/components/ui";
import { Can } from "@/features/auth";
import { useConfirmPresets } from "@/i18n/useConfirmPresets";
import { useTranslation } from "@/i18n/useTranslation";
import { useDataTableParams } from "@/hooks";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import {
  useBlogs,
  useDeleteBlogMutation,
  useSetBlogStatusMutation,
  useToggleBlogPublishedMutation,
} from "../../hooks";
import { type Blog, BlogCategory, BlogLanguage, BlogStatus } from "../../data/models";
import BlogFormDrawer from "../BlogForm/BlogFormDrawer";

function getListFromResponse(response: unknown): Blog[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: Blog[] | { data?: Blog[] } }).data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: Blog[] }).data))
    return (data as { data: Blog[] }).data;
  return [];
}

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
}

function getAuthorsFromResponse(response: unknown): { value: string; label: string }[] {
  if (!response || typeof response !== "object") return [];
  const authors = (response as { meta?: { authors?: { value?: string; label?: string }[] } }).meta
    ?.authors;
  if (!Array.isArray(authors)) return [];
  return authors
    .filter((row) => typeof row?.value === "string" && row.value !== "")
    .map((row) => ({ value: row.value as string, label: row.label || (row.value as string) }));
}

const BlogList = () => {
  const { t } = useTranslation();
  const confirmPresets = useConfirmPresets();
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    status: (params.filters.status as string) || undefined,
    category: (params.filters.category as string) || undefined,
    language: (params.filters.language as string) || undefined,
    author: (params.filters.author as string) || undefined,
  };

  const { data, isLoading, error } = useBlogs(apiParams);
  const blogs = getListFromResponse(data);
  const pagination = getPaginationFromResponse(data);
  const authors = getAuthorsFromResponse(data);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const { confirm } = useConfirmDialog();
  const { mutate: deleteBlog } = useDeleteBlogMutation();
  const { mutate: togglePublished } = useToggleBlogPublishedMutation();
  const { mutate: setStatus } = useSetBlogStatusMutation();

  const openCreate = useCallback(() => {
    setEditingBlog(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((blog: Blog) => {
    setEditingBlog(blog);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingBlog(null);
  }, []);

  const authorFilterOptions = useMemo(
    () => authors.map((author) => ({ value: author.value, label: author.label })),
    [authors]
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: BlogCategory.FINANCE, label: t("blogs.categories.finance") },
      { value: BlogCategory.ACCOUNTING, label: t("blogs.categories.accounting") },
      { value: BlogCategory.EDUCATION, label: t("blogs.categories.education") },
      { value: BlogCategory.CAREER, label: t("blogs.categories.career") },
      { value: BlogCategory.NEWS, label: t("blogs.categories.news") },
      { value: BlogCategory.OTHER, label: t("blogs.categories.other") },
    ],
    [t]
  );

  const languageFilterOptions = useMemo(
    () => [
      { value: BlogLanguage.EN, label: t("blogs.languages.en") },
      { value: BlogLanguage.PS, label: t("blogs.languages.ps") },
      { value: BlogLanguage.DR, label: t("blogs.languages.dr") },
    ],
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: BlogStatus.ACTIVE, label: t("blogs.statuses.active") },
      { value: BlogStatus.INACTIVE, label: t("blogs.statuses.inactive") },
      { value: BlogStatus.PUBLISHED, label: t("blogs.statuses.published") },
    ],
    [t]
  );

  const categoryLabel = useCallback(
    (category: BlogCategory) => {
      const match = categoryFilterOptions.find((option) => option.value === category);
      return match?.label ?? category;
    },
    [categoryFilterOptions]
  );

  const languageLabel = useCallback(
    (language: BlogLanguage) => {
      const match = languageFilterOptions.find((option) => option.value === language);
      return match?.label ?? language;
    },
    [languageFilterOptions]
  );

  const statusLabel = useCallback(
    (status: BlogStatus) => {
      const match = statusFilterOptions.find((option) => option.value === status);
      return match?.label ?? status;
    },
    [statusFilterOptions]
  );

  const config: DataTableConfig<Blog> = {
    columns: [
      {
        key: "title",
        header: t("common.title"),
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.image_signed_url || row.image_url ? (
              <img
                src={row.image_signed_url ?? row.image_url ?? ""}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                B
              </div>
            )}
            <span className="font-medium text-foreground">{row.title}</span>
          </div>
        ),
        sortable: true,
        exportValue: (row) => row.title,
      },
      {
        key: "author",
        header: t("blogs.author"),
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.author_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {row.author_id ?? row.author}
            </p>
          </div>
        ),
        sortable: true,
        filterable: true,
        filterOptions: authorFilterOptions,
        exportValue: (row) => row.author_name ?? row.author,
      },
      {
        key: "category",
        header: t("blogs.category"),
        render: (row) => categoryLabel(row.category),
        sortable: true,
        filterable: true,
        filterOptions: categoryFilterOptions,
        exportValue: (row) => categoryLabel(row.category),
      },
      {
        key: "language",
        header: t("blogs.language"),
        render: (row) => languageLabel(row.language),
        sortable: true,
        filterable: true,
        filterOptions: languageFilterOptions,
        exportValue: (row) => languageLabel(row.language),
      },
      {
        key: "status",
        header: t("common.status"),
        render: (row) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.status === BlogStatus.PUBLISHED
                ? "bg-success/10 text-success"
                : row.status === BlogStatus.INACTIVE
                  ? "bg-danger/10 text-danger"
                  : "bg-info/10 text-info"
            }`}
          >
            {statusLabel(row.status)}
          </span>
        ),
        sortable: true,
        filterable: true,
        filterOptions: statusFilterOptions,
        exportValue: (row) => statusLabel(row.status),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("blogs.search"),
    filtersEnabled: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    paginationEnabled: true,
    emptyMessage: t("blogs.empty"),
    exportFilename: "blogs",
    onRowDoubleClick: (row) => openEdit(row),
    actions: [
      {
        key: "edit",
        label: t("common.edit"),
        icon: <EditPencil className="h-4 w-4" />,
        onClick: (row) => openEdit(row),
        permission: "blogs.update",
      },
      {
        key: "toggle",
        label: (row) =>
          row.status === BlogStatus.PUBLISHED
            ? t("blogs.unpublish")
            : row.status === BlogStatus.INACTIVE
              ? t("common.activate")
              : t("blogs.publish"),
        icon: (row) =>
          row.status === BlogStatus.PUBLISHED ? (
            <Undo className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          ),
        variant: (row) => (row.status === BlogStatus.PUBLISHED ? "danger" : "success"),
        onClick: async (row) => {
          if (row.status === BlogStatus.INACTIVE) {
            if (await confirm(confirmPresets.activate(t("blogs.entity")))) {
              setStatus({ id: row.id, status: BlogStatus.ACTIVE });
            }
            return;
          }
          const publishing = row.status !== BlogStatus.PUBLISHED;
          const preset = publishing
            ? confirmPresets.activate(t("blogs.entity"))
            : confirmPresets.suspend(t("blogs.entity"));
          if (await confirm(preset)) togglePublished(row.id);
        },
        permission: "blogs.update",
      },
      {
        key: "delete",
        label: t("common.delete"),
        icon: <Trash className="h-4 w-4" />,
        variant: "danger",
        onClick: async (row) => {
          if (await confirm(confirmPresets.delete(t("blogs.entity")))) deleteBlog(row.id);
        },
        permission: "blogs.delete",
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("blogs.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("blogs.subtitle")}</p>
        </div>
        <Can permission="blogs.create">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("blogs.add")}
          </Button>
        </Can>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-light-danger p-6 text-center">
          <p className="text-danger">{t("blogs.loadError")}</p>
        </div>
      ) : (
        <DataTable
          data={blogs}
          config={config}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      )}

      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <DrawerOverlay />
        <DrawerContent className="w-full max-w-lg">
          <BlogFormDrawer blog={editingBlog} onSuccess={closeDrawer} />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default BlogList;
