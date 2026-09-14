import { SunLight, MoonSat, Globe, Check, NavArrowDown } from "iconoir-react";
import { useLayoutStore } from "@/store";
import { ThemeMode } from "@/data/enums";
import { AppLocale, AppLocaleLabels } from "@/data/enums/locale";
import { useLocaleStore } from "@/store/locale/localeStore";
import { useTranslation } from "@/i18n/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const LanguageSwitcher = () => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/25"
        aria-label={t("language.select")}
      >
        <Globe className="h-5 w-5 shrink-0" />
        <span className="hidden sm:block">{AppLocaleLabels[locale]}</span>
        <NavArrowDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9.5rem]">
        {Object.values(AppLocale).map((code) => {
          const active = locale === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className={cn("cursor-pointer", active && "bg-primary/10 text-primary")}
            >
              <span className="flex w-full items-center justify-between gap-3">
                {AppLocaleLabels[code]}
                {active ? <Check className="h-4 w-4 shrink-0" /> : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Header = () => {
  const { theme, setTheme } = useLayoutStore();
  const { t } = useTranslation();

  const toggleTheme = () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    setTheme(newTheme);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="size-9" aria-label={t("header.toggleSidebar")} />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 hover:bg-muted"
          aria-label={t("header.toggleTheme")}
        >
          {theme === ThemeMode.DARK ? (
            <SunLight className="h-5 w-5" />
          ) : (
            <MoonSat className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
