import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Check,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Mail,
  Moon,
  Pencil,
  Shield,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge, Button, ImageDropzone, Input, Label } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth";
import { applyUserUiPreferences } from "@/features/auth/applyUserUiPreferences";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { ThemeMode } from "@/data/enums";
import { AppLocale, AppLocaleLabels } from "@/data/enums/locale";
import type { User } from "@/data/models/User";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/authStore";

type ThemeChoice = ThemeMode.LIGHT | ThemeMode.DARK;

interface ProfileFormValues {
  name: string;
  email: string;
  preferred_locale: AppLocale;
  preferred_theme: ThemeChoice;
  current_password: string;
  password: string;
  password_confirmation: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part.charAt(0).toUpperCase()).join("");
  return letters || "?";
}

function formatJoined(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, t("settings.nameTooShort")).max(255),
          email: z.string().trim().email(t("settings.emailInvalid")).max(255),
          preferred_locale: z.enum([AppLocale.ENGLISH, AppLocale.DARI, AppLocale.PASHTO]),
          preferred_theme: z.enum([ThemeMode.LIGHT, ThemeMode.DARK]),
          current_password: z.string(),
          password: z.string(),
          password_confirmation: z.string(),
        })
        .superRefine((data, ctx) => {
          const next = data.password.trim();
          if (!next) return;
          if (next.length < 8) {
            ctx.addIssue({
              code: "custom",
              path: ["password"],
              message: t("settings.passwordTooShort"),
            });
          }
          if (!data.current_password.trim()) {
            ctx.addIssue({
              code: "custom",
              path: ["current_password"],
              message: t("settings.currentPasswordRequired"),
            });
          }
          if (next !== data.password_confirmation) {
            ctx.addIssue({
              code: "custom",
              path: ["password_confirmation"],
              message: t("settings.passwordMismatch"),
            });
          }
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      preferred_locale:
        (user?.preferred_locale as AppLocale | null | undefined) ?? AppLocale.ENGLISH,
      preferred_theme: user?.preferred_theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT,
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const preferenceRequest = useRef(0);

  useEffect(() => {
    if (!user || editing) return;
    reset({
      name: user.name,
      email: user.email,
      preferred_locale:
        (user.preferred_locale as AppLocale | null | undefined) ?? AppLocale.ENGLISH,
      preferred_theme: user.preferred_theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT,
      current_password: "",
      password: "",
      password_confirmation: "",
    });
  }, [user, editing, reset]);

  const startEdit = () => {
    if (!user) return;
    reset({
      name: user.name,
      email: user.email,
      preferred_locale:
        (user.preferred_locale as AppLocale | null | undefined) ?? AppLocale.ENGLISH,
      preferred_theme: user.preferred_theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT,
      current_password: "",
      password: "",
      password_confirmation: "",
    });
    setAvatarFile(null);
    setShowPassword(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setAvatarFile(null);
    setShowPassword(false);
    setEditing(false);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await fetchCsrfCookie();
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email.trim(),
        preferred_locale: values.preferred_locale,
        preferred_theme: values.preferred_theme,
      };
      if (values.password.trim()) {
        payload.current_password = values.current_password;
        payload.password = values.password;
        payload.password_confirmation = values.password_confirmation;
      }
      if (avatarFile) payload.avatar = avatarFile;

      const response = await callApi<User>({
        url: API_ENDPOINTS.AUTH.PROFILE,
        method: RequestMethod.PUT,
        data: payload,
        hasFiles: Boolean(avatarFile),
      });

      if (!response.ok) {
        const body = response.data as { message?: string; errors?: Record<string, string[]> };
        const first = body?.errors ? Object.values(body.errors).flat()[0] : undefined;
        toast.error(first ?? body?.message ?? t("settings.profileSaveFailed"));
        return;
      }

      const updated = (response.data as { data?: User })?.data;
      if (updated) {
        useAuthStore.getState().setUser(updated);
        applyUserUiPreferences(updated);
      }
      setAvatarFile(null);
      setEditing(false);
      toast.success(t("settings.profileSaved"));
    } catch {
      toast.error(t("settings.profileSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-danger/20 bg-light-danger px-4 py-6 text-center text-sm text-danger">
        {t("settings.loadError")}
      </div>
    );
  }

  const typeLabel =
    user.type === "admin"
      ? t("settings.typeAdmin")
      : user.type === "instructor"
        ? t("settings.typeInstructor")
        : t("settings.typeStudent");
  const roles = user.roles ?? [];
  const localeValue =
    (user.preferred_locale as AppLocale | null | undefined) ?? AppLocale.ENGLISH;
  const themeValue =
    user.preferred_theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT;

  const savePreferences = async (locale: AppLocale, theme: ThemeChoice) => {
    if (locale === localeValue && theme === themeValue) return;

    const previous = user;
    const requestId = ++preferenceRequest.current;
    const optimistic = { ...user, preferred_locale: locale, preferred_theme: theme };
    setValue("preferred_locale", locale, { shouldDirty: true });
    setValue("preferred_theme", theme, { shouldDirty: true });
    useAuthStore.getState().setUser(optimistic);
    applyUserUiPreferences(optimistic);

    try {
      await fetchCsrfCookie();
      const response = await callApi<User>({
        url: API_ENDPOINTS.AUTH.PREFERENCES,
        method: RequestMethod.PUT,
        data: { preferred_locale: locale, preferred_theme: theme },
      });

      if (requestId !== preferenceRequest.current) return;

      if (!response.ok) {
        useAuthStore.getState().setUser(previous);
        applyUserUiPreferences(previous);
        setValue("preferred_locale", localeValue, { shouldDirty: true });
        setValue("preferred_theme", themeValue, { shouldDirty: true });
        const body = response.data as { message?: string; errors?: Record<string, string[]> };
        const first = body?.errors ? Object.values(body.errors).flat()[0] : undefined;
        toast.error(first ?? body?.message ?? t("settings.saveFailed"));
        return;
      }

      const updated = (response.data as { data?: User })?.data;
      if (updated) {
        useAuthStore.getState().setUser(updated);
        applyUserUiPreferences(updated);
      }
      toast.success(t("settings.saved"));
    } catch {
      if (requestId !== preferenceRequest.current) return;
      useAuthStore.getState().setUser(previous);
      applyUserUiPreferences(previous);
      setValue("preferred_locale", localeValue, { shouldDirty: true });
      setValue("preferred_theme", themeValue, { shouldDirty: true });
      toast.error(t("settings.saveFailed"));
    }
  };

  const preferences = (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("settings.appearanceHint")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <LanguagePreference
          value={localeValue}
          onChange={(code) => void savePreferences(code, themeValue)}
        />
        <ThemePreference
          value={themeValue}
          onChange={(mode) => void savePreferences(localeValue, mode)}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
        {editing ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={cancelEdit}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={startEdit}>
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Button>
        )}
      </div>

      {editing ? (
        <form className="space-y-3" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="settings-name">{t("settings.name")}</Label>
                <Input id="settings-name" autoComplete="name" {...register("name")} />
                {errors.name ? <p className="text-xs text-danger">{errors.name.message}</p> : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="settings-email">{t("settings.email")}</Label>
                <Input
                  id="settings-email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-danger">{errors.email.message}</p>
                ) : null}
              </div>
            </div>

            <ImageDropzone
              accept="image/jpeg,image/png,image/webp"
              label={t("settings.avatar")}
              hint={t("settings.avatarHint")}
              value={avatarFile}
              onSelect={setAvatarFile}
              previewMode="square"
              initialPreviewUrl={avatarFile ? null : user.avatar}
              dense
            />

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("settings.passwordTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("settings.passwordHint")}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="settings-current-password">{t("settings.currentPassword")}</Label>
                  <Input
                    id="settings-current-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    dir="ltr"
                    {...register("current_password")}
                  />
                  {errors.current_password ? (
                    <p className="text-xs text-danger">{errors.current_password.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="settings-password">{t("settings.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="settings-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      dir="ltr"
                      className="pe-9"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((open) => !open)}
                      aria-label={
                        showPassword ? t("settings.hidePassword") : t("settings.showPassword")
                      }
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-danger">{errors.password.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="settings-password-confirmation">
                    {t("settings.confirmPassword")}
                  </Label>
                  <Input
                    id="settings-password-confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    dir="ltr"
                    {...register("password_confirmation")}
                  />
                  {errors.password_confirmation ? (
                    <p className="text-xs text-danger">{errors.password_confirmation.message}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {preferences}

          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={isSaving} disabled={isSaving}>
              {t("settings.saveProfile")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-4 px-4 py-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary/15"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
                  {initials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold leading-tight text-foreground">
                  {user.name}
                </p>
                <p className="mt-0.5 break-all text-sm text-muted-foreground" dir="ltr">
                  {user.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge>{typeLabel}</Badge>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{t("settings.noRoles")}</Badge>
                  )}
                </div>
              </div>
            </div>

            <dl className="grid border-t border-border sm:grid-cols-2">
              <Fact icon={UserRound} label={t("settings.name")} value={user.name} />
              <Fact icon={Mail} label={t("settings.email")} value={user.email} ltr />
              <Fact icon={Shield} label={t("settings.accountType")} value={typeLabel} />
              <Fact
                icon={Shield}
                label={t("settings.roles")}
                value={roles.length > 0 ? roles.join(", ") : t("settings.noRoles")}
              />
              <Fact
                icon={Calendar}
                label={t("settings.memberSince")}
                value={formatJoined(user.created_at)}
                ltr
              />
              <Fact
                icon={Mail}
                label={t("settings.emailStatus")}
                value={
                  user.email_verified_at
                    ? t("settings.emailVerified")
                    : t("settings.emailUnverified")
                }
                tone={user.email_verified_at ? "success" : "warning"}
              />
            </dl>
          </section>
          {preferences}
        </div>
      )}
    </div>
  );
};

function Fact({
  icon: Icon,
  label,
  value,
  ltr = false,
  tone,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  ltr?: boolean;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:border-e-0 sm:odd:border-e sm:[&:nth-last-child(-n+2)]:border-b-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd
          className={cn(
            "mt-0.5 break-words text-sm font-medium text-foreground",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning"
          )}
          dir={ltr ? "ltr" : undefined}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}

function LanguagePreference({
  value,
  onChange,
}: {
  value: AppLocale;
  onChange: (code: AppLocale) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">{t("settings.language")}</h2>
      </div>
      <div className="space-y-1.5">
        {Object.values(AppLocale).map((code) => {
          const active = value === code;
          return (
            <button
              key={code}
              type="button"
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-start text-sm",
                active
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-foreground hover:bg-muted/60"
              )}
              onClick={() => onChange(code)}
            >
              <span>{AppLocaleLabels[code]}</span>
              {active ? <Check className="h-4 w-4 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ThemePreference({
  value,
  onChange,
}: {
  value: ThemeChoice;
  onChange: (mode: ThemeChoice) => void;
}) {
  const { t } = useTranslation();
  const options = [
    { mode: ThemeMode.LIGHT, label: t("settings.themeLight"), icon: Sun },
    { mode: ThemeMode.DARK, label: t("settings.themeDark"), icon: Moon },
  ] as const;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {value === ThemeMode.DARK ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{t("settings.theme")}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = value === option.mode;
          const Icon = option.icon;
          return (
            <button
              key={option.mode}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm",
                active
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-foreground hover:bg-muted/60"
              )}
              onClick={() => onChange(option.mode)}
            >
              <Icon className="h-5 w-5" />
              <span>{option.label}</span>
              <span className={cn("text-[11px]", active ? "text-primary" : "text-transparent")}>
                {t("settings.selected")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default SettingsPage;
