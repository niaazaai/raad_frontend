import { useCallback, useMemo } from 'react';
import { translations } from '@/i18n/translations';
import { useLocaleStore } from '@/store/locale/localeStore';

export type TOptions = {
  defaultValue?: string;
  [key: string]: string | number | undefined;
};

/** The grid's translator. Same shape the copied files call, reading this app's dictionaries. */
export type TFunction = (key: string, options?: TOptions) => string;

function gridKey(key: string): string {
  if (key.startsWith('common:')) return `dt.${key.slice('common:'.length)}`;
  return `dt.${key}`;
}

function read(source: unknown, path: string): string | undefined {
  let current: unknown = source;
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function fill(template: string, options?: TOptions): string {
  if (!options) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}|\{(\w+)\}/g, (full, doubled: string | undefined, single: string | undefined) => {
    const name = doubled ?? single ?? '';
    const value = options[name];
    return value === undefined ? full : String(value);
  });
}

export function translateGrid(locale: keyof typeof translations, key: string, options?: TOptions): string {
  const path = gridKey(key);
  const local = read(translations[locale], path);
  const english = read(translations.en, path);
  const template = local ?? english ?? options?.defaultValue ?? key;
  return fill(template, options);
}

export function useTranslation(): { t: TFunction; locale: string } {
  const locale = useLocaleStore((state) => state.locale);
  const t = useCallback<TFunction>(
    (key, options) => translateGrid(locale, key, options),
    [locale],
  );

  return useMemo(() => ({ t, locale }), [t, locale]);
}
