import { Link, useParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Shield, SquarePen, Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRole } from "../../hooks";
import { isSystemRole } from "../../data/systemRoles";
import {
  comparePermissionNames,
  describePermission,
  permissionGroupKey,
  permissionGroupLabel,
  permissionSectionKey,
  PERMISSION_GROUP_ORDER,
} from "../../data/permissionCopy";
import { Avatar, Button, PageBreadcrumb } from "@/components/ui";
import { Can } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocaleStore } from "@/store/locale/localeStore";

function nameParts(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" "),
  };
}

const RoleDetail = () => {
  const { t } = useTranslation();
  const locale = useLocaleStore((state) => state.locale);
  const { id } = useParams<{ id: string }>();
  const backUrl = "/roles";

  const roleId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, error } = useRole(roleId);
  const role = data?.data;

  if (isLoading || !roleId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="rounded-xl border border-danger/20 bg-red-50 px-4 py-8 text-center dark:bg-red-900/10">
        <p className="text-sm text-danger">{t("userManagement.roleNotFound")}</p>
        <Link to={backUrl} className="mt-3 inline-block text-sm text-primary hover:underline">
          {t("userManagement.backToRoles")}
        </Link>
      </div>
    );
  }

  const permissions = (role.permissions ?? [])
    .filter((permission, index, list) => list.findIndex((item) => item.name === permission.name) === index)
    .sort((a, b) => comparePermissionNames(a.name, b.name));
  const groups = new Map<string, typeof permissions>();
  for (const permission of permissions) {
    const key = permissionGroupKey(permission.name);
    const list = groups.get(key) ?? [];
    list.push(permission);
    groups.set(key, list);
  }
  const groupKeys = [...groups.keys()].sort((a, b) => {
    const ai = PERMISSION_GROUP_ORDER.indexOf(a);
    const bi = PERMISSION_GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
  });

  const users = role.users ?? [];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={backUrl}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("userManagement.backToRoles")}
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Shield className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold capitalize tracking-tight text-foreground">{role.name}</h1>
              {isSystemRole(role.name) ? (
                <p className="text-xs text-muted-foreground">{t("userManagement.systemRole")}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("userManagement.rolesTitle"), to: backUrl },
                { label: role.name },
              ]}
            />
          </div>
        </div>
        <Can permission="roles.update">
          <Button asChild size="sm" variant="outline">
            <Link to={`/roles/${role.id}/edit`}>
              <SquarePen className="size-4" />
              {t("common.edit")}
            </Link>
          </Button>
        </Can>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-3">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <KeyRound className="size-4 text-primary" />
              {t("userManagement.permissionsTitle")}
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs">
                <Users className="size-3.5 text-primary" />
                <span className="text-muted-foreground">{t("userManagement.usersCount")}</span>
                <bdi dir="ltr" className="font-semibold text-foreground">{role.users_count ?? users.length}</bdi>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs">
                <KeyRound className="size-3.5 text-primary" />
                <span className="text-muted-foreground">{t("userManagement.permissionsCount")}</span>
                <bdi dir="ltr" className="font-semibold text-foreground">
                  {role.permissions_count ?? permissions.length}
                </bdi>
              </span>
            </div>
          </header>
          {permissions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">{t("userManagement.permissionsEmpty")}</p>
          ) : (
            <div className="columns-1 gap-2 p-2 sm:columns-2 lg:columns-3">
              {groupKeys.map((key) => {
                const items = groups.get(key) ?? [];
                const sections = new Map<string, typeof items>();
                for (const permission of items) {
                  const section = permissionSectionKey(permission.name);
                  const list = sections.get(section) ?? [];
                  list.push(permission);
                  sections.set(section, list);
                }
                return (
                  <div
                    key={key}
                    className="mb-2 break-inside-avoid overflow-hidden rounded-lg border border-border bg-background"
                  >
                    <h3 className="border-b border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {permissionGroupLabel(key, locale)}
                    </h3>
                    <div>
                      {[...sections.entries()].map(([section, sectionItems]) => (
                        <div key={section || key}>
                          {section ? (
                            <p className="border-b border-border bg-muted/20 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                              {permissionGroupLabel(`course.${section}`, locale)}
                            </p>
                          ) : null}
                          <table className="w-full text-start text-sm">
                            <thead>
                              <tr className="border-b border-border text-[11px] text-muted-foreground">
                                <th className="px-2.5 py-1.5 font-medium">{t("userManagement.permission")}</th>
                                <th className="px-2.5 py-1.5 font-medium">{t("userManagement.description")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sectionItems.map((permission) => {
                                const copy = describePermission(permission.name, locale);
                                return (
                                  <tr key={permission.id} className="border-b border-border last:border-b-0">
                                    <td className="px-2.5 py-1.5 align-top font-medium leading-snug text-foreground">
                                      {copy.label}
                                    </td>
                                    <td className="px-2.5 py-1.5 align-top text-[11px] leading-snug text-muted-foreground">
                                      {copy.description}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {t("userManagement.usersOnRole")}
            </h2>
          </header>
          {users.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">{t("userManagement.noUsersOnRole")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((user) => {
                const { first, last } = nameParts(user.name);
                return (
                  <li key={user.id}>
                    <Link
                      to={`/users?edit=${user.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <Avatar
                        src={user.avatar}
                        firstName={first}
                        lastName={last}
                        alt={user.name}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold text-foreground">{user.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          <bdi dir="ltr">{user.email}</bdi>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default RoleDetail;
