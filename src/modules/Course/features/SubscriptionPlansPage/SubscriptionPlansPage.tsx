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
import { COURSE_ENTITY_REGISTRY } from "../../data/courseRegistry";
import { courseQueryKeys } from "../../data/constants/queryKeys";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import {
  useDeleteCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";

const SLUG = "subscription-plans" as const;
const FILTER_KEYS = ["status"] as const;
const READ = COURSE_ENTITY_REGISTRY[SLUG].permission;

interface PlanRow {
  id: number;
  plan_name: string | null;
  plan_description: string | null;
  price: number | string | null;
  price_label: string | null;
  duration_in_days: number | null;
  subscription_type: string | null;
  status: string;
  created_at: string | null;
}

interface EditorState {
  mode: CourseEntityDrawerMode;
  id: number | null;
}

type PlanFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function StatusFunnel({ filters }: { filters: PlanFilters }) {
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

function SubscriptionPlansList({ filters }: { filters: PlanFilters }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { columnHeader, entityTitle } = useCourseI18n();
  const { hasPermission } = useAuth();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const title = entityTitle(SLUG);

  const openNew = useCallback(() => setEditor({ mode: "create", id: null }), []);
  const openEdit = useCallback((row: PlanRow) => setEditor({ mode: "edit", id: row.id }), []);
  const openView = useCallback((row: PlanRow) => setEditor({ mode: "view", id: row.id }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity(SLUG);
  const { mutateAsync: saveRow } = useUpdateCourseEntity(SLUG);
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

  const nameOf = useCallback((row: PlanRow) => {
    const name = shown(row.plan_name);
    return name === "—" ? String(row.id) : name;
  }, []);

  const statusToggle = useStatusToggle<PlanRow>({
    can: canUpdate,
    nameOf,
    save: (row, next) => saveRow({ id: row.id, body: { status: next } }),
  });

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: deletePermission, remove: removeRowAsync })],
    [deletePermission, gridT, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<PlanRow, unknown>[]>(() => {
    const status = statusColumn<PlanRow>(gridT);
    const nameLabel = columnHeader("plan_name", SLUG);
    const idLabel = columnHeader("id", SLUG);
    const priceLabel = columnHeader("price", SLUG);
    const durationLabel = columnHeader("duration_in_days", SLUG);
    const typeLabel = columnHeader("subscription_type", SLUG);
    const statusLabel = columnHeader("status", SLUG);

    return [
      {
        id: "plan_name",
        header: nameLabel,
        meta: {
          priority: 1,
          sortKey: "plan_name",
          shortLabel: nameLabel,
          plainText: (row) => shown((row as PlanRow).plan_name),
          width: { default: 200, min: 140 },
        },
        cell: ({ row }) => <span className="font-medium">{shown(row.original.plan_name)}</span>,
      },
      {
        id: "id",
        header: idLabel,
        meta: {
          priority: 2,
          sortKey: "id",
          shortLabel: idLabel,
          plainText: (row) => String((row as PlanRow).id),
          width: { default: 88, min: 72 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-xs">
            {row.original.id}
          </bdi>
        ),
      },
      {
        id: "price",
        header: priceLabel,
        meta: {
          priority: 1,
          shortLabel: priceLabel,
          plainText: (row) => {
            const item = row as PlanRow;
            return shown(item.price_label ?? item.price);
          },
          width: { default: 120, min: 96 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="tabular-nums">
            {shown(row.original.price_label ?? row.original.price)}
          </bdi>
        ),
      },
      {
        id: "duration_in_days",
        header: durationLabel,
        meta: {
          priority: 2,
          shortLabel: durationLabel,
          plainText: (row) => shown((row as PlanRow).duration_in_days),
          width: { default: 120, min: 96 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="tabular-nums">
            {shown(row.original.duration_in_days)}
          </bdi>
        ),
      },
      {
        id: "subscription_type",
        header: typeLabel,
        meta: {
          priority: 2,
          shortLabel: typeLabel,
          plainText: (row) => shown((row as PlanRow).subscription_type),
          width: { default: 110, min: 90 },
        },
        cell: ({ row }) => shown(row.original.subscription_type),
      },
      withHeaderAddon(
        {
          ...status,
          meta: {
            priority: 1,
            shortLabel: statusLabel,
            plainText: (row) => {
              const value = (row as PlanRow).status;
              return gridT(`common:status.${value}`, { defaultValue: value });
            },
          },
        },
        <StatusFunnel filters={filters} />,
      ),
      actionsColumn<PlanRow>(
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

  const table = useDataTable<PlanRow>({
    key: "course.subscription-plans",
    queryKey: (query) => courseQueryKeys.entity(SLUG, query),
    endpoint: COURSE_ENTITY_REGISTRY[SLUG].apiPath,
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

  const newLabel = t("dt.subscriptionPlans.new");

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.subscriptionPlans.search")}
        emptyTitle={t("dt.subscriptionPlans.emptyTitle")}
        emptyBody={t("dt.subscriptionPlans.emptyBody")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={filters.narrowed}
        onRowDoubleClick={canUpdate ? openEdit : openView}
        stickyHeader
        toolsInHeader
        extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      />

      <Drawer open={editor != null} onClose={closeEditor}>
        <DrawerOverlay />
        <DrawerContent className="w-[42%] min-w-[480px]">
          {editor ? (
            <CourseEntityFormDrawer
              slug={SLUG}
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

const SubscriptionPlansPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription } = useCourseI18n();
  const filters = useUrlFilters(FILTER_KEYS);
  const title = entityTitle(SLUG);

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{entityDescription(SLUG)}</p>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.course"), to: "/course" },
              { label: title },
            ]}
          />
        </div>
      </div>
      <SubscriptionPlansList filters={filters} />
    </div>
  );
};

export default SubscriptionPlansPage;
