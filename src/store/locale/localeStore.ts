import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppLocale, isRtlLocale } from "@/data/enums/locale";

export interface LocaleState {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

/** Admin/dashboard shell — always LTR + Inter */
export function applyAdminDocumentDefaults(): void {
  const root = document.documentElement;
  root.lang = "en";
  root.dir = "ltr";
  root.dataset.locale = "en";
  root.classList.remove("website-locale-active");
}

export function getWebsiteLocaleAttributes(locale: AppLocale): {
  lang: string;
  dir: "rtl" | "ltr";
} {
  return {
    lang: locale,
    dir: isRtlLocale(locale) ? "rtl" : "ltr",
  };
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: AppLocale.PASHTO,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "raad-lms-locale",
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);
