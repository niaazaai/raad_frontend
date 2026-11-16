import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  Save,
  School,
  ScrollText,
  Search,
  Settings,
  Shield,
  Ticket,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreateRole, usePermissions, useRole, useUpdateRole } from "../../hooks";
import { CreateRoleSchema, type Permission } from "../../data/models";
import { isSystemRole } from "../../data/systemRoles";
import {
  comparePermissionNames,
  describePermission,
  permissionFormColumns,
  permissionGroupKey,
  permissionGroupLabel,
  permissionSectionKey,
  PERMISSION_GROUP_ORDER,
} from "../../data/permissionCopy";
import { Button, PageBreadcrumb } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocaleStore } from "@/store/locale/localeStore";
import { cn } from "@/lib/utils";

interface RoleFormProps {
  mode?: "create" | "edit";
}

const EMPTY_PERMISSIONS: Permission[] = [];

const GROUP_ICONS: Record<string, LucideIcon> = {
  finance: Wallet,
  attendance: ClipboardCheck,
  dashboard: LayoutDashboard,
  users: Users,
  roles: Shield,
  students: GraduationCap,
  settings: Settings,
  permissions: KeyRound,
  reports: ClipboardCheck,
  blogs: Newspaper,
  activity_log: ScrollText,
  "course.content": BookOpen,
  "course.instructors": UserRound,
  "course.lms_classes": School,
  "course.class_students": Users,
  "course.subscription_plans": Ticket,
  "course.student_subscriptions": Ticket,
};

function sectionPermissions(items: Permission[]): [string, Permission[]][] {
  const sections = new Map<string, Permission[]>();
  for (const permission of items) {
    const section = permissionSectionKey(permission.name);
    const list = sections.get(section) ?? [];
    list.push(permission);
    sections.set(section, list);
  }
  return [...sections.entries()];
}

function unwrapPermissions(payload: unknown): Permission[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as Permission[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Permission[] }).data;
  }
  return [];
}

const RoleForm = ({ mode = "create" }: RoleFormProps) => {
  const { t } = useTranslation();
  const locale = useLocaleStore((state) => state.locale);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const rolesUrl = "/roles";
  const [filter, setFilter] = useState("");

  const roleId = id ? parseInt(id, 10) : 0;
  const isEdit = mode === "edit";

  const { data: existingData, isLoading: isLoadingRole } = useRole(roleId);
  const role = (existingData as { data?: { name?: string; permissions?: { name: string }[] } })?.data;
  const { data: permissionsData, isLoading: isLoadingPermissions, error: permissionsError } = usePermissions({
    per_page: 250,
    sort_by: "name",
    sort_dir: "asc",
  });
  const permissions = useMemo(() => {
    const unique = new Map<string, Permission>();
    for (const permission of unwrapPermissions(permissionsData)) {
      if (!unique.has(permission.name)) unique.set(permission.name, permission);
    }
    return unique.size > 0 ? [...unique.values()] : EMPTY_PERMISSIONS;
  }, [permissionsData]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const permission of permissions) {
      const key = permissionGroupKey(permission.name);
      groups[key] = groups[key] ?? [];
      groups[key].push(permission);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => comparePermissionNames(a.name, b.name));
    }
    return groups;
  }, [permissions]);

  const groupKeys = useMemo(() => {
    return Object.keys(groupedPermissions).sort((a, b) => {
      const ai = PERMISSION_GROUP_ORDER.indexOf(a);
      const bi = PERMISSION_GROUP_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
    });
  }, [groupedPermissions]);

  const formColumns = useMemo(() => permissionFormColumns(groupKeys), [groupKeys]);

  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole(roleId);
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: {
      name: "",
      permissions: [] as string[],
    },
  });

  const selectedPermissions = watch("permissions") || [];
  const nameLocked = isEdit && isSystemRole(role?.name);

  useEffect(() => {
    if (role && isEdit) {
      const permNames = Array.isArray(role.permissions)
        ? role.permissions.map((permission: { name: string } | string) =>
            typeof permission === "string" ? permission : permission.name
          )
        : [];
      reset({
        name: role.name ?? "",
        permissions: permNames,
      });
    }
  }, [role, isEdit, reset]);

  const togglePermission = (permissionName: string) => {
    const current = selectedPermissions;
    if (current.includes(permissionName)) {
      setValue(
        "permissions",
        current.filter((permission: string) => permission !== permissionName)
      );
    } else {
      setValue("permissions", [...current, permissionName]);
    }
  };

  const toggleAllInModule = (moduleName: string) => {
    const modulePerms = groupedPermissions[moduleName]?.map((permission) => permission.name) || [];
    const allSelected = modulePerms.every((permission) => selectedPermissions.includes(permission));
    if (allSelected) {
      setValue(
        "permissions",
        selectedPermissions.filter((permission: string) => !modulePerms.includes(permission))
      );
    } else {
      setValue("permissions", Array.from(new Set([...selectedPermissions, ...modulePerms])));
    }
  };

  const allPermissionNames = useMemo(() => permissions.map((permission) => permission.name), [permissions]);
  const allSelected =
    allPermissionNames.length > 0 && allPermissionNames.every((permission) => selectedPermissions.includes(permission));
  const someSelected = allPermissionNames.some((permission) => selectedPermissions.includes(permission));

  const toggleSelectAll = () => {
    setValue("permissions", allSelected ? [] : [...allPermissionNames]);
  };

  const onSubmit = (data: Record<string, unknown>) => {
    const payload = nameLocked ? { ...data, name: role?.name ?? data.name } : data;
    if (isEdit) {
      updateRole(payload as Parameters<typeof updateRole>[0], {
        onSuccess: () => navigate(rolesUrl),
      });
    } else {
      createRole(payload as Parameters<typeof createRole>[0], {
        onSuccess: () => navigate(rolesUrl),
      });
    }
  };

  const needle = filter.trim().toLowerCase();

  if (isEdit && isLoadingRole) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate(rolesUrl)}
          className="mt-0.5 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("userManagement.backToRoles")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? t("userManagement.editRoleTitle") : t("userManagement.createRoleTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? t("userManagement.editRoleHint") : t("userManagement.createRoleHint")}
          </p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("userManagement.rolesTitle"), to: rolesUrl },
                { label: isEdit ? t("userManagement.editRoleTitle") : t("userManagement.createRoleTitle") },
              ]}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-8">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("userManagement.permissionsTitle")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.permissionsSelected")
                  .replace("{selected}", String(selectedPermissions.length))
                  .replace("{total}", String(permissions.length))}
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={t("userManagement.filterPermissions")}
                className="h-9 w-full rounded-lg border border-input bg-background ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="border-b border-border px-3 py-2.5">
            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-md border bg-background sm:flex-row sm:items-stretch",
                errors.name ? "border-danger" : "border-primary/50"
              )}
            >
              <input
                id="role-name"
                {...register("name")}
                disabled={nameLocked}
                aria-label={t("userManagement.roleInformation")}
                placeholder={t("userManagement.roleInformation")}
                className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:bg-primary/[0.03] disabled:cursor-not-allowed disabled:bg-muted"
              />
              {permissions.length > 0 ? (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={cn(
                    "flex items-center justify-between gap-2 border-t bg-primary/[0.04] px-3 text-sm font-medium text-foreground hover:bg-primary/10 sm:border-s sm:border-t-0",
                    errors.name ? "border-danger" : "border-primary/50"
                  )}
                >
                  <span>{t("userManagement.selectAllPermissions")}</span>
                  <CheckBoxMark checked={allSelected} partial={someSelected && !allSelected} />
                </button>
              ) : null}
            </div>
            {nameLocked ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{t("userManagement.systemNameLocked")}</p>
            ) : null}
            {errors.name ? (
              <p className="mt-1 text-xs text-danger">{errors.name.message as string}</p>
            ) : null}
          </div>

          {isLoadingPermissions ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : permissionsError ? (
            <p className="px-3 py-6 text-sm text-danger">{t("userManagement.roleNotFound")}</p>
          ) : groupKeys.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">{t("userManagement.permissionsEmpty")}</p>
          ) : (
            <div className="grid grid-cols-1 items-start gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {formColumns.map((columnKeys, columnIndex) => {
                const cards = columnKeys.flatMap((moduleName) => {
                  const perms = groupedPermissions[moduleName] ?? [];
                  const visible = needle
                    ? perms.filter((permission) => {
                        const copy = describePermission(permission.name, locale);
                        return (
                          permission.name.toLowerCase().includes(needle) ||
                          copy.label.toLowerCase().includes(needle) ||
                          copy.description.toLowerCase().includes(needle)
                        );
                      })
                    : perms;
                  if (visible.length === 0) return [];
                  const moduleSelected = perms.every((permission) =>
                    selectedPermissions.includes(permission.name)
                  );
                  const modulePartial = perms.some((permission) =>
                    selectedPermissions.includes(permission.name)
                  );
                  const Icon = GROUP_ICONS[moduleName] ?? Shield;
                  return [
                    <section
                      key={moduleName}
                      className="overflow-hidden rounded-lg border border-border bg-background"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAllInModule(moduleName)}
                        className="flex w-full items-center justify-between gap-2 bg-muted/40 px-2.5 py-1.5 text-start hover:bg-muted"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Icon className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate text-sm font-medium">
                            {permissionGroupLabel(moduleName, locale)}
                          </span>
                          <bdi dir="ltr" className="text-[11px] text-muted-foreground">
                            {perms.filter((permission) => selectedPermissions.includes(permission.name)).length}
                            /{perms.length}
                          </bdi>
                        </span>
                        <CheckBoxMark checked={moduleSelected} partial={modulePartial && !moduleSelected} />
                      </button>
                      <div>
                        {sectionPermissions(visible).map(([section, sectionItems]) => (
                          <div key={section || moduleName}>
                            {section ? (
                              <p className="border-t border-border bg-muted/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {permissionGroupLabel(`course.${section}`, locale)}
                              </p>
                            ) : null}
                            <ul className="divide-y divide-border">
                              {sectionItems.map((permission) => {
                                const selected = selectedPermissions.includes(permission.name);
                                const copy = describePermission(permission.name, locale);
                                return (
                                  <li key={permission.name}>
                                    <button
                                      type="button"
                                      onClick={() => togglePermission(permission.name)}
                                      className="flex w-full items-start justify-between gap-2 px-2.5 py-1.5 text-start hover:bg-muted/30"
                                    >
                                      <span className="min-w-0">
                                        <span className="block text-sm font-medium leading-snug text-foreground">
                                          {copy.label}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                                          {copy.description}
                                        </span>
                                      </span>
                                      <CheckBoxMark checked={selected} />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>,
                  ];
                });
                if (cards.length === 0) return null;
                return (
                  <div key={`permission-column-${columnIndex}`} className="flex flex-col gap-2">
                    {cards}
                  </div>
                );
              })}
            </div>
          )}
          {needle && groupKeys.every((key) => {
            const perms = groupedPermissions[key] ?? [];
            return !perms.some((permission) => {
              const copy = describePermission(permission.name, locale);
              return (
                permission.name.toLowerCase().includes(needle) ||
                copy.label.toLowerCase().includes(needle) ||
                copy.description.toLowerCase().includes(needle)
              );
            });
          }) ? (
            <p className="px-3 pb-3 text-sm text-muted-foreground">{t("userManagement.noPermissionMatch")}</p>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 -mx-3 flex justify-end gap-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(rolesUrl)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-4" /> : <Save className="size-4" />}
            {isEdit ? t("userManagement.updateRole") : t("userManagement.saveRole")}
          </Button>
        </div>
      </form>
    </div>
  );
};

const CheckBoxMark = ({ checked, partial = false }: { checked: boolean; partial?: boolean }) => (
  <span
    className={cn(
      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
      checked ? "border-primary bg-primary text-white" : partial ? "border-primary bg-primary/15" : "border-input"
    )}
  >
    {checked ? <Check className="size-3" /> : partial ? <span className="size-1.5 rounded-sm bg-primary" /> : null}
  </span>
);

export default RoleForm;
