import { AppLocale } from "@/data/enums/locale";
import { ThemeMode } from "@/data/enums";
import type { User } from "@/data/models/User";
import { useLocaleStore, applyAdminLocale } from "@/store/locale/localeStore";
import { useLayoutStore } from "@/store/layout/layoutStore";

const LOCALES = new Set<string>(Object.values(AppLocale));

/**
 * Apply server-stored UI preferences after login / /auth/me.
 * No-ops when the user has never saved preferences.
 */
export function applyUserUiPreferences(user: User | null | undefined): void {
  if (!user) return;

  if (user.preferred_locale && LOCALES.has(user.preferred_locale)) {
    const locale = user.preferred_locale as AppLocale;
    useLocaleStore.getState().setLocale(locale);
    applyAdminLocale(locale);
  }

  if (user.preferred_theme === ThemeMode.LIGHT || user.preferred_theme === ThemeMode.DARK) {
    useLayoutStore.getState().setTheme(user.preferred_theme as ThemeMode);
  }
}
