import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocaleStore } from "@/store/locale/localeStore";
import { ServerDataTable, useDataTable } from "@/components/data-table";
import { USER_MANAGEMENT_QUERY_KEYS } from "../../data/constants/endpoints";
import { describePermission, permissionGroupKey, permissionGroupLabel } from "../../data/permissionCopy";

const READ = "permissions.read";

interface PermissionRow {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string | null;
}

const PermissionList = () => {
  const { t } = useTranslation();
  const locale = useLocaleStore((state) => state.locale);
  const { hasPermission } = useAuth();

  const columns = useMemo<ColumnDef<PermissionRow, unknown>[]>(() => {
    const nameLabel = t("userManagement.permission");
    const moduleLabel = t("userManagement.module");
    const descriptionLabel = t("userManagement.description");
    const guardLabel = t("userManagement.guard");
    const createdLabel = t("userManagement.created");
    return [
      {
        id: "name",
        header: nameLabel,
        meta: {
          priority: 1,
          sortKey: "name",
          shortLabel: nameLabel,
          plainText: (row) => {
            const item = row as PermissionRow;
            const copy = describePermission(item.name, locale);
            return `${copy.label} (${item.name})`;
          },
        },
        cell: ({ row }) => {
          const copy = describePermission(row.original.name, locale);
          return (
            <span className="block min-w-0">
              <span className="block font-medium text-foreground">{copy.label}</span>
              <bdi dir="ltr" className="font-mono text-xs text-muted-foreground">{row.original.name}</bdi>
            </span>
          );
        },
      },
      {
        id: "module",
        header: moduleLabel,
        meta: {
          priority: 1,
          shortLabel: moduleLabel,
          plainText: (row) => permissionGroupLabel(permissionGroupKey((row as PermissionRow).name), locale),
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {permissionGroupLabel(permissionGroupKey(row.original.name), locale)}
          </span>
        ),
      },
      {
        id: "description",
        header: descriptionLabel,
        meta: {
          priority: 1,
          shortLabel: descriptionLabel,
          plainText: (row) => describePermission((row as PermissionRow).name, locale).description,
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {describePermission(row.original.name, locale).description}
          </span>
        ),
      },
      {
        id: "guard_name",
        header: guardLabel,
        meta: {
          priority: 2,
          shortLabel: guardLabel,
          plainText: (row) => (row as PermissionRow).guard_name,
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {row.original.guard_name}
          </bdi>
        ),
      },
      {
        id: "created_at",
        header: createdLabel,
        meta: {
          priority: 2,
          sortKey: "created_at",
          shortLabel: createdLabel,
          plainText: (row) => (row as PermissionRow).created_at ?? "",
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="text-sm text-muted-foreground">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : "—"}
          </bdi>
        ),
      },
    ];
  }, [locale, t]);

  const table = useDataTable<PermissionRow>({
    key: "user-management.permissions",
    queryKey: (query) => [...USER_MANAGEMENT_QUERY_KEYS.permissions, "table", query],
    endpoint: "/permissions",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    exportTitle: t("userManagement.permissionsTitle"),
    syncUrl: true,
    defaultSort: "name",
    defaultPerPage: 50,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("userManagement.permissionsTitle")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("userManagement.permissionsSubtitle")}</p>
        <div className="mt-2">
          <PageBreadcrumb items={[{ label: t("userManagement.permissionsTitle") }]} />
        </div>
      </div>
      <ServerDataTable
        api={table}
        entityLabel={t("userManagement.permission")}
        searchPlaceholder={t("userManagement.searchPermissions")}
        emptyTitle={t("userManagement.noPermissions")}
        emptyBody={t("userManagement.permissionsSubtitle")}
        stickyHeader
        toolsInHeader
        searchClassName="sm:w-[23rem] sm:max-w-[23rem] sm:flex-none sm:basis-[23rem]"
      />
    </div>
  );
};

export default PermissionList;
