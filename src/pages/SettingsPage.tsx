import { useEffect, useState } from "react";
import { Globe, HalfMoon, SunLight } from "iconoir-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { applyUserUiPreferences } from "@/features/auth/applyUserUiPreferences";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { ThemeMode } from "@/data/enums";
import { AppLocale, AppLocaleLabels } from "@/data/enums/locale";
import type { User } from "@/data/models/User";
import { useTranslation } from "@/i18n/useTranslation";
import { useLayoutStore } from "@/store";
import { useLocaleStore, applyAdminLocale } from "@/store/locale/localeStore";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/authStore";

type ThemeChoice = ThemeMode.LIGHT | ThemeMode.DARK;

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const theme = useLayoutStore((s) => s.theme);
  const setTheme = useLayoutStore((s) => s.setTheme);

  const initialTheme: ThemeChoice =
    (user?.preferred_theme === ThemeMode.DARK ? ThemeMode.DARK : null) ??
    (theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT);

  const [draftLocale, setDraftLocale] = useState<AppLocale>(
    (user?.preferred_locale as AppLocale | null | undefined) ?? locale
  );
  const [draftTheme, setDraftTheme] = useState<ThemeChoice>(initialTheme);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.preferred_locale) {
      setDraftLocale(user.preferred_locale as AppLocale);
    } else {
      setDraftLocale(locale);
    }
  }, [user?.preferred_locale, locale]);

  useEffect(() => {
    if (user?.preferred_theme === ThemeMode.LIGHT || user?.preferred_theme === ThemeMode.DARK) {
      setDraftTheme(user.preferred_theme as ThemeChoice);
    } else {
      setDraftTheme(theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT);
    }
  }, [user?.preferred_theme, theme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetchCsrfCookie();
      const response = await callApi<User>({
        url: API_ENDPOINTS.AUTH.PREFERENCES,
        method: RequestMethod.PUT,
        data: {
          preferred_locale: draftLocale,
          preferred_theme: draftTheme,
        },
      });

      if (!response.ok) {
        const body = response.data as { message?: string };
        toast.error(body?.message ?? t("settings.saveFailed"));
        return;
      }

      const updated = (response.data as { data?: User })?.data;
      if (updated) {
        useAuthStore.getState().setUser(updated);
        applyUserUiPreferences(updated);
      } else {
        setLocale(draftLocale);
        applyAdminLocale(draftLocale);
        setTheme(draftTheme);
      }

      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const dirty = draftLocale !== locale || draftTheme !== (theme === ThemeMode.DARK ? ThemeMode.DARK : ThemeMode.LIGHT);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.appearanceTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.appearanceHint")}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t("settings.language")}</p>
            <div className="flex flex-col gap-2">
              {Object.values(AppLocale).map((code) => {
                const active = draftLocale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setDraftLocale(code)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-start text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <span>{AppLocaleLabels[code]}</span>
                    {active ? (
                      <span className="text-xs font-medium">{t("settings.selected")}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t("settings.theme")}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setDraftTheme(ThemeMode.LIGHT)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-start text-sm transition-colors",
                  draftTheme === ThemeMode.LIGHT
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                <SunLight className="h-5 w-5 shrink-0" />
                <span className="flex-1">{t("settings.themeLight")}</span>
                {draftTheme === ThemeMode.LIGHT ? (
                  <span className="text-xs font-medium">{t("settings.selected")}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setDraftTheme(ThemeMode.DARK)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-start text-sm transition-colors",
                  draftTheme === ThemeMode.DARK
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                <HalfMoon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{t("settings.themeDark")}</span>
                {draftTheme === ThemeMode.DARK ? (
                  <span className="text-xs font-medium">{t("settings.selected")}</span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving || !dirty} loading={isSaving}>
            {t("settings.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
