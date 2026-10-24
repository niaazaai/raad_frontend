import type { TranslationKey } from "@/i18n/useTranslation";
import { translations } from "@/i18n/translations";
import { useLocaleStore } from "@/store/locale/localeStore";

function resolvePath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

/** Locale-aware copy for non-React callers (API client, Zod is not used here). */
export function translate(key: TranslationKey): string {
  const locale = useLocaleStore.getState().locale;
  return resolvePath(translations[locale] as Record<string, unknown>, key);
}
