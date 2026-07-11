import { ThemeMode } from "@/data/enums";
import { useLayoutStore } from "@/store";
import { useIsDarkMode } from "@/hooks";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const setTheme = useLayoutStore((s) => s.setTheme);
  const isDark = useIsDarkMode();
  const { t } = useTranslation();

  const toggle = () => {
    setTheme(isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        isDark
          ? "border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15"
          : "border-white/50 bg-white/40 text-primary hover:border-primary/30 hover:bg-white/60",
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
