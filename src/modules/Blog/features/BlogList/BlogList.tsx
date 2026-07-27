import { useCallback, useState } from "react";
import { Plus, EditPencil, Trash, Upload, Undo } from "iconoir-react";
import { Button, DataTable, Drawer, DrawerOverlay, DrawerContent, useConfirmDialog } from "@/components/ui";
import { Can } from "@/features/auth";
import { useConfirmPresets } from "@/i18n/useConfirmPresets";
import { useDataTableParams } from "@/hooks";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import { useBlogs, useDeleteBlogMutation, useToggleBlogPublishedMutation } from "../../hooks";
import {
  BlogCategoryLabels,
  BlogLanguageLabels,
  BlogStatusDisplayLabels,
  type Blog,
  BlogCategory,
  BlogLanguage,
  BlogStatus,
} from "../../data/models";
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

const BlogList = () => {
  const confirmPresets = useConfirmPresets();
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
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
  };

  const { data, isLoading } = useBlogs(apiParams);
  const blogs = getListFromResponse(data);
  const pagination = getPaginationFromResponse(data);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const { confirm } = useConfirmDialog();
  const { mutate: deleteBlog } = useDeleteBlogMutation();
  const { mutate: togglePublished } = useToggleBlogPublishedMutation();

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

  const config: DataTableConfig<Blog> = {
    columns: [
      {
        key: "title",
        header: "Title",
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
            <span className="font-medium">{row.title}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "author",
        header: "Author",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.author_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">ID {row.author_id ?? row.author}</p>
          </div>
        ),
        sortable: true,
      },
      {
        key: "category",
        header: "Category",
        render: (row) => BlogCategoryLabels[row.category],
        sortable: true,
        filterable: true,
        filterOptions: Object.values(BlogCategory).map((v) => ({ value: v, label: BlogCategoryLabels[v] })),
      },
      {
        key: "language",
        header: "Language",
        render: (row) => BlogLanguageLabels[row.language],
        filterable: true,
        filterOptions: Object.values(BlogLanguage).map((v) => ({ value: v, label: BlogLanguageLabels[v] })),
      },
      {
        key: "status",
        header: "Status",
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
            {BlogStatusDisplayLabels[row.status]}
          </span>
        ),
        filterable: true,
        filterOptions: Object.values(BlogStatus).map((v) => ({ value: v, label: BlogStatusDisplayLabels[v] })),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: "Search blogs...",
    filtersEnabled: true,
    paginationEnabled: true,
    emptyMessage: "No blogs found.",
    actions: [
      {
        key: "toggle",
        label: (row) => (row.status === BlogStatus.PUBLISHED ? "Unpublish" : "Publish"),
        icon: (row) => (row.status === BlogStatus.PUBLISHED ? <Undo /> : <Upload />),
        variant: (row) => (row.status === BlogStatus.PUBLISHED ? "danger" : "success"),
        onClick: (row) => togglePublished(row.id),
        permission: "blogs.update",
        // Allow publish from active; unpublish from published. Hide for inactive.
        hidden: (row) => row.status === BlogStatus.INACTIVE,
      },
      {
        key: "edit",
        label: "Edit",
        icon: <EditPencil />,
        onClick: openEdit,
        permission: "blogs.update",
      },
      {
        key: "delete",
        label: "Delete",
        icon: <Trash />,
        variant: "danger",
        onClick: async (row) => {
          if (await confirm(confirmPresets.delete("blog"))) deleteBlog(row.id);
        },
        permission: "blogs.delete",
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blogs</h1>
          <p className="text-sm text-muted-foreground">Manage website blog posts</p>
        </div>
        <Can permission="blogs.create">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add blog
          </Button>
        </Can>
      </div>

      <DataTable
        data={blogs}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />

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
