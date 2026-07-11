import { useSyncExternalStore } from "react";
import { ThemeMode } from "@/data/enums";
import { useLayoutStore } from "@/store";

function subscribeSystemTheme(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useResolvedTheme(): ThemeMode.LIGHT | ThemeMode.DARK {
  const theme = useLayoutStore((s) => s.theme);

  const isDark = useSyncExternalStore(
    subscribeSystemTheme,
    () => {
      if (theme === ThemeMode.DARK) return true;
      if (theme === ThemeMode.LIGHT) return false;
      return getSystemDark();
    },
    () => theme === ThemeMode.DARK,
  );

  return isDark ? ThemeMode.DARK : ThemeMode.LIGHT;
}

export function useIsDarkMode(): boolean {
  return useResolvedTheme() === ThemeMode.DARK;
}
