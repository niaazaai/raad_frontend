export enum AppLocale {
  PASHTO = "ps",
  DARI = "fa",
  ENGLISH = "en",
}

export const AppLocaleLabels: Record<AppLocale, string> = {
  [AppLocale.PASHTO]: "پښتو",
  [AppLocale.DARI]: "دری",
  [AppLocale.ENGLISH]: "English",
};

export const RTL_LOCALES: AppLocale[] = [AppLocale.PASHTO, AppLocale.DARI];

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
}
