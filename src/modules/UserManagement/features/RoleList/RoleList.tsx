import { useCallback, useMemo } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  NewButton,
  ServerDataTable,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  useConfirmDelete,
  useDataTable,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { USER_MANAGEMENT_ENDPOINTS, USER_MANAGEMENT_QUERY_KEYS } from "../../data/constants/endpoints";
import type { Role } from "../../data/models";
import { isSystemRole } from "../../data/systemRoles";
import { useDeleteRoleMutation } from "../../hooks";

const READ = "roles.read";

function RolesList() {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteRoleMutation();

  const canCreate = hasPermission("roles.create");
  const canUpdate = hasPermission("roles.update");
  const canDelete = hasPermission("roles.delete");

  const openNew = useCallback(() => navigate("/roles/create"), [navigate]);
  const openView = useCallback((row: Role) => navigate(`/roles/${row.id}`), [navigate]);
  const openEdit = useCallback((row: Role) => navigate(`/roles/${row.id}/edit`), [navigate]);

  const removeRow = useCallback<UseMutateFunction<unknown, Error, string>>((id, options) => {
    removeMutate(
      { id: Number(id) },
      {
        onSuccess: () => options?.onSuccess?.(undefined, id, undefined, undefined as never),
        onError: (error) =>
          options?.onError?.(
            error instanceof Error ? error : new Error("Delete failed"),
            id,
            undefined,
            undefined as never,
          ),
      },
    );
    return Promise.resolve(undefined);
  }, [removeMutate]);

  const removeRowAsync = useCallback(
    (id: string) => removeAsync({ id: Number(id) }),
    [removeAsync],
  );

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: "roles.delete", remove: removeRowAsync })],
    [gridT, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<Role, unknown>[]>(() => [
    {
      id: "name",
      header: t("userManagement.role"),
      meta: {
        priority: 1,
        sortKey: "name",
        shortLabel: t("userManagement.role"),
        plainText: (row) => (row as Role).name,
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium capitalize text-foreground">{row.original.name}</span>
            {isSystemRole(row.original.name) ? (
              <span className="text-xs text-muted-foreground">{t("userManagement.systemRole")}</span>
            ) : null}
          </span>
        </div>
      ),
    },
    {
      id: "users_count",
      header: t("userManagement.usersCount"),
      meta: {
        priority: 2,
        shortLabel: t("userManagement.usersCount"),
        numeric: true,
        plainText: (row) => String((row as Role).users_count ?? 0),
        width: { default: 110, min: 88 },
      },
      cell: ({ row }) => <bdi dir="ltr">{row.original.users_count ?? 0}</bdi>,
    },
    {
      id: "permissions_count",
      header: t("userManagement.permissionsCount"),
      meta: {
        priority: 2,
        shortLabel: t("userManagement.permissionsCount"),
        numeric: true,
        plainText: (row) =>
          String((row as Role).permissions_count ?? (row as Role).permissions?.length ?? 0),
        width: { default: 130, min: 100 },
      },
      cell: ({ row }) => (
        <bdi dir="ltr">{row.original.permissions_count ?? row.original.permissions?.length ?? 0}</bdi>
      ),
    },
    {
      id: "created_at",
      header: t("userManagement.created"),
      meta: {
        priority: 3,
        sortKey: "created_at",
        shortLabel: t("userManagement.created"),
        plainText: (row) => {
          const value = (row as Role).created_at;
          return value ? value.slice(0, 10) : "—";
        },
        width: { default: 128, min: 110 },
      },
      cell: ({ row }) => {
        const value = row.original.created_at;
        return value ? <bdi dir="ltr">{value.slice(0, 10)}</bdi> : "—";
      },
    },
    actionsColumn<Role>(
      gridT,
      (row) =>
        editDeleteActions({
          t: gridT,
          canUpdate,
          canDelete,
          updatePermission: "roles.update",
          deletePermission: "roles.delete",
          onEdit: () => openEdit(row),
          onDelete: () => confirmDelete(row.name, String(row.id), removeRow),
          deleteBlockedReason: isSystemRole(row.name)
            ? t("userManagement.cannotDeleteSystem")
            : undefined,
        }),
      true,
      undefined,
      (row) => [
        {
          id: "view",
          label: t("common.view"),
          icon: <Eye className="size-4" aria-hidden="true" />,
          permission: READ,
          onSelect: () => openView(row),
        },
      ],
    ),
  ], [
    canDelete,
    canUpdate,
    confirmDelete,
    gridT,
    openEdit,
    openView,
    removeRow,
    t,
  ]);

  const table = useDataTable<Role>({
    key: "roles",
    queryKey: (query) => [...USER_MANAGEMENT_QUERY_KEYS.roles, query],
    endpoint: USER_MANAGEMENT_ENDPOINTS.ROLES.BASE,
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: t("userManagement.rolesTitle"),
    syncUrl: true,
    defaultSort: "name",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const newLabel = t("userManagement.addRole");

  return (
    <ServerDataTable
      api={table}
      entityLabel={t("userManagement.role")}
      searchPlaceholder={t("userManagement.searchRoles")}
      emptyTitle={t("userManagement.noRolesYet")}
      emptyBody={t("userManagement.rolesSubtitle")}
      emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      onRowDoubleClick={openView}
      stickyHeader
      toolsInHeader
      searchClassName="sm:w-[23rem] sm:max-w-[23rem] sm:flex-none sm:basis-[23rem]"
      extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
    />
  );
}

const RoleList = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("userManagement.rolesTitle")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {t("userManagement.rolesSubtitle")}
        </p>
        <div className="mt-2">
          <PageBreadcrumb items={[{ label: t("userManagement.rolesTitle") }]} />
        </div>
      </div>
      <RolesList />
    </div>
  );
};

export default RoleList;
