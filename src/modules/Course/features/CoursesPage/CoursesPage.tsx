import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Plus, LayoutGrid as ViewGrid, List, Eye, Pencil as EditPencil, Ban, CircleCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useConfirmDialog,
} from "@/components/ui";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { Can, useAuth } from "@/features/auth";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import { courseLevelLabel } from "@/data/enums/courseWizard";
import { cn } from "@/lib/utils";
import { COURSE_ENTITY_REGISTRY } from "../../data/courseRegistry";
import {
  getCourseListFromResponse,
  type CourseRow,
  useCourseEntityList,
  useDeleteCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";

function CourseStatusBadge({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const status = String(value ?? "").toLowerCase();
  const active = status === "active";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        active ? "bg-success/15 text-success" : "bg-danger/10 text-danger",
      )}
    >
      {active ? t("common.active") : status === "inactive" ? t("common.inactive") : status || "—"}
    </span>
  );
}

const CoursesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { confirm } = useConfirmDialog();
  const { mutate: patchCourse, isPending: patching } = useUpdateCourseEntity("courses");
  const { mutate: deleteCourse, isPending: deleting } = useDeleteCourseEntity("courses");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
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
  };

  const { data, isFetching } = useCourseEntityList("courses", apiParams);
  const rows = getCourseListFromResponse(data);
  const pagination = (data as { meta?: { pagination?: DataTablePaginationMeta } } | undefined)?.meta
    ?.pagination;

  const tableConfig: DataTableConfig<CourseRow> = useMemo(
    () => ({
      columns: [
        {
          key: "title",
          header: "Title",
          sortable: true,
          render: (row) => String(row.title ?? "—"),
        },
        {
          key: "language",
          header: "Language",
          sortable: true,
          render: (row) => String(row.language ?? "—"),
        },
        {
          key: "level",
          header: "Level",
          sortable: true,
          render: (row) => courseLevelLabel(row.level),
        },
        {
          key: "status",
          header: "Status",
          sortable: true,
          render: (row) => <CourseStatusBadge value={row.status} />,
        },
      ],
      rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
      searchable: true,
      searchPlaceholder: "Search courses...",
      emptyMessage: "No courses found.",
      actions: [
        {
          key: "view",
          label: "View",
          icon: <Eye className="h-4 w-4" />,
          permission: "course.courses.read",
          onClick: (row) => {
            const id = Number(row.id);
            if (!Number.isNaN(id)) navigate(`/course/courses/${id}/view`);
          },
        },
        {
          key: "edit",
          label: "Edit",
          icon: <EditPencil className="h-4 w-4" />,
          permission: "course.courses.update",
          onClick: (row) => {
            const id = Number(row.id);
            if (!Number.isNaN(id)) navigate(`/course/courses/${id}/edit`);
          },
        },
        {
          key: "toggle",
          label: (row) =>
            String(row.status ?? "") === "active" ? t("common.deactivate") : t("common.activate"),
          icon: (row) =>
            String(row.status ?? "") === "active" ? (
              <Ban className="h-4 w-4" />
            ) : (
              <CircleCheck className="h-4 w-4" />
            ),
          variant: (row) => (String(row.status ?? "") === "active" ? "danger" : "default"),
          permission: "course.courses.update",
          onClick: (row) => {
            const id = Number(row.id);
            if (Number.isNaN(id) || patching) return;
            const next = String(row.status ?? "") === "active" ? "inactive" : "active";
            patchCourse(
              { id, body: { status: next } },
              {
                onSuccess: () =>
                  toast.success(next === "active" ? t("common.activate") : t("common.deactivate")),
                onError: (error: unknown) =>
                  toast.error(error instanceof Error ? error.message : "Could not update the course"),
              },
            );
          },
        },
        {
          key: "delete",
          label: t("common.delete"),
          icon: <Trash2 className="h-4 w-4" />,
          variant: "danger",
          permission: "course.courses.delete",
          onClick: (row) => {
            const id = Number(row.id);
            if (Number.isNaN(id) || deleting) return;
            void confirm({
              title: "Delete this course?",
              message:
                "The course is removed from this list and from the public website. Classes and finance records are kept.",
              variant: "danger",
              confirmText: t("common.delete"),
              cancelText: t("common.cancel"),
            }).then((ok) => {
              if (!ok) return;
              deleteCourse(id, {
                onSuccess: () => toast.success("Course deleted"),
                onError: (error: unknown) =>
                  toast.error(error instanceof Error ? error.message : "Could not delete the course"),
              });
            });
          },
        },
      ],
    }),
    [navigate, t, confirm, patchCourse, patching, deleteCourse, deleting]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {COURSE_ENTITY_REGISTRY.courses.pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-1">
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs ${viewMode === "card" ? "bg-primary text-white" : "text-muted-foreground"}`}
              onClick={() => setViewMode("card")}
            >
              <ViewGrid className="h-4 w-4" />
            </button>
          </div>
          <Can permission="course.courses.create">
            <Button onClick={() => navigate("/course/courses/create")} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Can>
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable<CourseRow>
          data={rows}
          config={tableConfig}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isFetching}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const id = Number(row.id);
            return (
              <div
                key={String(row.id)}
                className="rounded-lg border border-border bg-card p-4 space-y-2"
              >
                <h3 className="font-semibold">{String(row.title ?? "Untitled Course")}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {String(row.short_description ?? row.long_description ?? "No description")}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{courseLevelLabel(row.level)}</span>
                  <span>{String(row.language ?? "—")}</span>
                </div>
                <div className="flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasPermission("course.courses.read") && (
                        <DropdownMenuItem
                          onClick={() =>
                            !Number.isNaN(id) && navigate(`/course/courses/${id}/view`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                      )}
                      {hasPermission("course.courses.update") && (
                        <DropdownMenuItem
                          onClick={() =>
                            !Number.isNaN(id) && navigate(`/course/courses/${id}/edit`)
                          }
                        >
                          <EditPencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      )}
                      {hasPermission("course.courses.update") && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (Number.isNaN(id) || patching) return;
                            const next = String(row.status ?? "") === "active" ? "inactive" : "active";
                            patchCourse(
                              { id, body: { status: next } },
                              {
                                onError: (error: unknown) =>
                                  toast.error(error instanceof Error ? error.message : "Could not update the course"),
                              },
                            );
                          }}
                        >
                          {String(row.status ?? "") === "active" ? (
                            <Ban className="mr-2 h-4 w-4" />
                          ) : (
                            <CircleCheck className="mr-2 h-4 w-4" />
                          )}
                          {String(row.status ?? "") === "active" ? t("common.deactivate") : t("common.activate")}
                        </DropdownMenuItem>
                      )}
                      {hasPermission("course.courses.delete") && (
                        <DropdownMenuItem
                          variant="danger"
                          onClick={() => {
                            if (Number.isNaN(id) || deleting) return;
                            void confirm({
                              title: "Delete this course?",
                              message:
                                "The course is removed from this list and from the public website. Classes and finance records are kept.",
                              variant: "danger",
                              confirmText: t("common.delete"),
                              cancelText: t("common.cancel"),
                            }).then((ok) => {
                              if (!ok) return;
                              deleteCourse(id, {
                                onSuccess: () => toast.success("Course deleted"),
                                onError: (error: unknown) =>
                                  toast.error(error instanceof Error ? error.message : "Could not delete the course"),
                              });
                            });
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NavLink to="/course" className="text-xs text-muted-foreground hover:text-foreground">
        Back to course hub
      </NavLink>
    </div>
  );
};

export default CoursesPage;
