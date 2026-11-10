import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
  PageBreadcrumb,
  useConfirmDialog,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  ColumnFunnel,
  NewButton,
  ServerDataTable,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  useConfirmDelete,
  useDataTable,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { PendingCountBadge } from "../../components/PendingCountBadge";
import { coursePermission } from "../../data/courseEntityFormRegistry";
import { COURSE_ENTITY_REGISTRY } from "../../data/courseRegistry";
import { courseQueryKeys } from "../../data/constants/queryKeys";
import { parseCourseOverviewStats } from "../../data/models";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import { useCourseOverviewStats } from "../../hooks/useCourseOverviewStats";
import {
  getCourseListFromResponse,
  useCancelStudentSubscription,
  useCourseEntityList,
  useDeactivateStudentSubscription,
  useDeleteCourseEntity,
} from "../../hooks/useCourseEntity";
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";

const SLUG = "student-subscriptions" as const;
const FILTER_KEYS = ["subscription_status", "course_id", "plan_id"] as const;
const READ = COURSE_ENTITY_REGISTRY[SLUG].permission;

const STATUS_VALUES = ["active", "pending", "inactive", "cancelled", "expired"] as const;

interface SubscriptionRow {
  id: number;
  subscription_public_id: string | null;
  course_id: number | null;
  course_title: string | null;
  user_name: string | null;
  plan_id: number | null;
  plan_name: string | null;
  subscription_status: string | null;
  subscription_status_label: string | null;
  purchase_date: string | null;
}

interface EditorState {
  mode: CourseEntityDrawerMode;
  id: number | null;
}

type SubFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function day(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

function statusTone(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "bg-success/10 text-success";
    case "pending":
      return "bg-warning/10 text-warning";
    case "inactive":
      return "bg-muted text-muted-foreground";
    case "expired":
    case "cancelled":
      return "bg-danger/10 text-danger";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function SubscriptionsList({ filters }: { filters: SubFilters }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { columnHeader, entityTitle } = useCourseI18n();
  const { hasPermission } = useAuth();
  const { confirm } = useConfirmDialog();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [cancelRow, setCancelRow] = useState<SubscriptionRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const title = entityTitle(SLUG);

  const openNew = useCallback(() => setEditor({ mode: "create", id: null }), []);
  const openEdit = useCallback((row: SubscriptionRow) => setEditor({ mode: "edit", id: row.id }), []);
  const openView = useCallback((row: SubscriptionRow) => setEditor({ mode: "view", id: row.id }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity(SLUG);
  const { mutateAsync: deactivateSubscription, isPending: deactivating } =
    useDeactivateStudentSubscription();
  const { mutateAsync: cancelSubscription, isPending: cancelling } =
    useCancelStudentSubscription();
  const confirmDelete = useConfirmDelete();

  const canCreate = hasPermission(coursePermission(READ, "create"));
  const canUpdate = hasPermission(coursePermission(READ, "update"));
  const canDelete = hasPermission(coursePermission(READ, "delete"));
  const updatePermission = coursePermission(READ, "update");
  const deletePermission = coursePermission(READ, "delete");

  const { data: overviewStats } = useCourseOverviewStats(true);
  const pendingCount =
    parseCourseOverviewStats(overviewStats?.data).pending_subscriptions_count ?? 0;

  const coursesQuery = useCourseEntityList("courses", {
    has_subscription_plans: 1,
    per_page: 200,
  });
  const courseOptions = useMemo(() => {
    const rows = getCourseListFromResponse(coursesQuery.data);
    return [
      { value: "", label: t("course.allCourses") },
      ...rows.map((row) => ({
        value: String(row.id),
        label: `${String(row.title ?? t("common.course"))} (#${row.id})`,
      })),
    ];
  }, [coursesQuery.data, t]);

  const selectedCourseId = Number(
    filters.values.course_id.split(",").filter(Boolean)[0] ?? 0,
  );
  const plansQuery = useCourseEntityList(
    "subscription-plans",
    selectedCourseId > 0
      ? { attached_to_course: selectedCourseId, per_page: 200 }
      : { per_page: 200 },
  );
  const planOptions = useMemo(() => {
    const rows = getCourseListFromResponse(plansQuery.data);
    return [
      { value: "", label: t("course.allPlans") },
      ...rows.map((row) => ({
        value: String(row.id),
        label: `${String(row.plan_name ?? t("course.plan"))} (#${row.id})`,
      })),
    ];
  }, [plansQuery.data, t]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("course.allStatuses") },
      ...STATUS_VALUES.map((value) => ({
        value,
        label: t(`course.subscriptionStatusValues.${value}`),
      })),
    ],
    [t],
  );

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

  const nameOf = useCallback((row: SubscriptionRow) => {
    const code = shown(row.subscription_public_id);
    const student = shown(row.user_name);
    if (code !== "—" && student !== "—") return `${code} · ${student}`;
    if (code !== "—") return code;
    if (student !== "—") return student;
    return `#${row.id}`;
  }, []);

  const onDeactivate = useCallback(
    async (row: SubscriptionRow) => {
      if (deactivating) return;
      const ok = await confirm({
        title: t("course.deactivateSubscriptionTitle"),
        message: t("course.deactivateSubscriptionMessage"),
        confirmText: t("course.deactivate"),
        cancelText: t("common.cancel"),
        variant: "warning",
      });
      if (!ok) return;
      try {
        await deactivateSubscription(row.id);
        toast.success(t("course.subscriptionDeactivated"));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t("course.updateFailed"));
      }
    },
    [confirm, deactivateSubscription, deactivating, t],
  );

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: deletePermission, remove: removeRowAsync })],
    [deletePermission, gridT, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<SubscriptionRow, unknown>[]>(() => {
    const publicIdLabel = columnHeader("subscription_public_id", SLUG);
    const courseLabel = columnHeader("course_title", SLUG);
    const studentLabel = columnHeader("user_name", SLUG);
    const planLabel = columnHeader("plan_name", SLUG);
    const statusLabel = columnHeader("subscription_status", SLUG);
    const purchaseLabel = columnHeader("purchase_date", SLUG);
    const deactivateLabel = t("course.deactivate");
    const cancelLabel = t("course.cancelSubscription");

    return [
      {
        id: "subscription_public_id",
        header: publicIdLabel,
        meta: {
          priority: 1,
          sortKey: "subscription_public_id",
          shortLabel: publicIdLabel,
          plainText: (row) => shown((row as SubscriptionRow).subscription_public_id),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-sm font-medium text-primary">
            {shown(row.original.subscription_public_id)}
          </bdi>
        ),
      },
      withHeaderAddon(
        {
          id: "course_title",
          header: courseLabel,
          meta: {
            priority: 1,
            shortLabel: courseLabel,
            plainText: (row) => shown((row as SubscriptionRow).course_title),
            width: { default: 180, min: 140 },
          },
          cell: ({ row }) => shown(row.original.course_title),
        },
        <ColumnFunnel
          label={courseLabel}
          value={filters.values.course_id}
          onChange={(next) => filters.set("course_id", next)}
          options={courseOptions}
        />,
      ),
      {
        id: "user_name",
        header: studentLabel,
        meta: {
          priority: 1,
          shortLabel: studentLabel,
          plainText: (row) => shown((row as SubscriptionRow).user_name),
          width: { default: 160, min: 120 },
        },
        cell: ({ row }) => <span className="font-medium">{shown(row.original.user_name)}</span>,
      },
      withHeaderAddon(
        {
          id: "plan_name",
          header: planLabel,
          meta: {
            priority: 2,
            sortKey: "plan_name",
            shortLabel: planLabel,
            plainText: (row) => shown((row as SubscriptionRow).plan_name),
            width: { default: 150, min: 120 },
          },
          cell: ({ row }) => shown(row.original.plan_name),
        },
        <ColumnFunnel
          label={planLabel}
          value={filters.values.plan_id}
          onChange={(next) => filters.set("plan_id", next)}
          options={planOptions}
        />,
      ),
      withHeaderAddon(
        {
          id: "subscription_status",
          header: statusLabel,
          meta: {
            priority: 1,
            shortLabel: statusLabel,
            plainText: (row) => {
              const item = row as SubscriptionRow;
              return shown(item.subscription_status_label ?? item.subscription_status);
            },
            width: { default: 140, min: 110 },
          },
          cell: ({ row }) => {
            const status = row.original.subscription_status;
            const label = shown(
              row.original.subscription_status_label ?? row.original.subscription_status,
            );
            return (
              <span
                className={cn(
                  "inline-flex whitespace-nowrap rounded-full px-2 text-xs font-medium",
                  statusTone(status),
                )}
              >
                {label}
              </span>
            );
          },
        },
        <ColumnFunnel
          label={statusLabel}
          value={filters.values.subscription_status}
          onChange={(next) => filters.set("subscription_status", next)}
          options={statusOptions}
        />,
      ),
      {
        id: "purchase_date",
        header: purchaseLabel,
        meta: {
          priority: 2,
          shortLabel: purchaseLabel,
          plainText: (row) => day((row as SubscriptionRow).purchase_date),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="tabular-nums">
            {day(row.original.purchase_date)}
          </bdi>
        ),
      },
      actionsColumn<SubscriptionRow>(
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
        undefined,
        (row) => {
          const status = String(row.subscription_status ?? "");
          const leading: {
            id: string;
            label: string;
            icon: ReactNode;
            permission: string;
            onSelect: () => void;
          }[] = [];
          if (canUpdate && (status === "active" || status === "pending")) {
            leading.push({
              id: "deactivate",
              label: deactivateLabel,
              icon: <Ban className="size-4" aria-hidden="true" />,
              permission: updatePermission,
              onSelect: () => {
                void onDeactivate(row);
              },
            });
          }
          if (canUpdate && status === "active") {
            leading.push({
              id: "cancel",
              label: cancelLabel,
              icon: <XCircle className="size-4" aria-hidden="true" />,
              permission: updatePermission,
              onSelect: () => {
                setCancelRow(row);
                setCancelReason("");
              },
            });
          }
          return leading;
        },
      ),
    ];
  }, [
    canDelete,
    canUpdate,
    columnHeader,
    confirmDelete,
    courseOptions,
    deletePermission,
    filters,
    gridT,
    nameOf,
    onDeactivate,
    openEdit,
    planOptions,
    removeRow,
    statusOptions,
    t,
    updatePermission,
  ]);

  const table = useDataTable<SubscriptionRow>({
    key: "course.student-subscriptions",
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

  const newLabel = t("dt.studentSubscriptions.new");

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.studentSubscriptions.search")}
        emptyTitle={t("dt.studentSubscriptions.emptyTitle")}
        emptyBody={t("dt.studentSubscriptions.emptyBody")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={filters.narrowed}
        onRowDoubleClick={openView}
        stickyHeader
        toolsInHeader
        extra={
          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                {t("course.subscriptionStatusValues.pending")}
                <PendingCountBadge count={pendingCount} />
              </span>
            ) : null}
            <NewButton show={canCreate} onNew={openNew} label={newLabel} />
          </div>
        }
      />

      <Drawer open={editor != null} onClose={closeEditor}>
        <DrawerOverlay />
        <DrawerContent className="w-[min(920px,96vw)] min-w-[300px]">
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

      <Modal
        open={cancelRow != null}
        onClose={() => {
          if (cancelling) return;
          setCancelRow(null);
          setCancelReason("");
        }}
      >
        <ModalOverlay />
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>{t("course.cancelSubscriptionTitle")}</ModalTitle>
            <ModalDescription>{t("course.cancelSubscriptionMessage")}</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-subscription-reason">{t("course.cancelReason")}</Label>
              <textarea
                id="cancel-subscription-reason"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-[110px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t("course.cancelReasonPlaceholder")}
                disabled={cancelling}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              disabled={cancelling}
              onClick={() => {
                setCancelRow(null);
                setCancelReason("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={cancelling}
              disabled={cancelReason.trim().length < 3}
              onClick={async () => {
                if (!cancelRow) return;
                try {
                  await cancelSubscription({
                    id: cancelRow.id,
                    cancel_reason: cancelReason.trim(),
                  });
                  toast.success(t("course.subscriptionCancelled"));
                  setCancelRow(null);
                  setCancelReason("");
                } catch (error: unknown) {
                  toast.error(error instanceof Error ? error.message : t("course.updateFailed"));
                }
              }}
            >
              {t("course.cancelSubscription")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

const StudentSubscriptionsPage = () => {
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
      <SubscriptionsList filters={filters} />
    </div>
  );
};

export default StudentSubscriptionsPage;
