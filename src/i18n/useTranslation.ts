import { useCallback, useMemo } from "react";
import { translations, type Messages } from "@/i18n/translations";
import { useLocaleStore } from "@/store/locale/localeStore";

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<Messages>;

function resolvePath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const dictionary = translations[locale];

  const t = useCallback(
    (key: TranslationKey) => resolvePath(dictionary as Record<string, unknown>, key),
    [dictionary],
  );

  return useMemo(() => ({ t, locale }), [t, locale]);
}
