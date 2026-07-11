import { ThemeMode } from "@/data/enums";
import { useLayoutStore } from "@/store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const theme = useLayoutStore((s) => s.theme);
  const setTheme = useLayoutStore((s) => s.setTheme);
  const { t } = useTranslation();

  const isDark =
    theme === ThemeMode.DARK ||
    (theme === ThemeMode.SYSTEM &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggle = () => {
    setTheme(isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary backdrop-blur-sm transition hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        className,
      )}
      aria-label={t("theme.toggle")}
      title={isDark ? t("theme.light") : t("theme.dark")}
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
    </button>
  );
};

export default ThemeToggle;
