import { Sun as SunLight, Moon as MoonSat, Globe, Check, ChevronDown as NavArrowDown } from "lucide-react";
import { useAuth } from "@/features/auth";
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
import { LogOutIcon } from "@/components/icons/sidebar-icons";
import { cn } from "@/lib/utils";

/** Banner art is 154px (+15%), then trimmed 10% for a tighter bar. */
const HEADER_HEIGHT = "calc(154px * 1.15 * 0.9)";

const headerActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white bg-white/10 px-2.5 text-sm font-medium text-white outline-none backdrop-blur-[2px] transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/80";

const LanguageSwitcher = () => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(headerActionClass, "text-white")}
        aria-label={t("language.select")}
      >
        <Globe className="h-5 w-5 shrink-0 text-white" />
        <span className="hidden text-white sm:block">{AppLocaleLabels[locale]}</span>
        <NavArrowDown className="h-3.5 w-3.5 shrink-0 text-white/80" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9.5rem] bg-white text-black">
        {Object.values(AppLocale).map((code) => {
          const active = locale === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className={cn(
                "cursor-pointer text-black focus:bg-black/5 focus:text-black",
                active && "bg-black/5 font-semibold text-black",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3 text-black">
                {AppLocaleLabels[code]}
                {active ? <Check className="h-4 w-4 shrink-0 text-black" /> : null}
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
  const { user, logout } = useAuth();
  const fullName = user?.name?.trim() || t("header.user");

  const toggleTheme = () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    setTheme(newTheme);
  };

  return (
    <header
      className="relative sticky top-0 z-40 flex shrink-0 items-center border-b border-border/40 px-4 sm:px-5"
      style={{
        height: HEADER_HEIGHT,
        backgroundImage: "url(/welcome-banner.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex min-w-0 items-center gap-2 pr-36 sm:gap-3 sm:pr-48">
        <SidebarTrigger
          className="size-9 shrink-0 text-[#000000] hover:bg-black/5"
          aria-label={t("header.toggleSidebar")}
        />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55 sm:text-[11px]">
            {t("dashboard.goodToSeeYouAgain")}
          </p>
          <p className="truncate text-lg font-bold leading-tight sm:text-xl md:text-2xl">
            <span className="text-black">{t("dashboard.welcomeBack")},</span>{" "}
            <span className="font-extrabold text-[#2373F4]">{fullName}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-black/65 sm:text-sm">
            {t("dashboard.homeSubtitle")}
          </p>
        </div>
      </div>

      <div className="absolute top-2 right-3 flex shrink-0 items-center gap-1.5 sm:top-2.5 sm:right-4 sm:gap-2">
        <LanguageSwitcher />

        <button
          type="button"
          onClick={toggleTheme}
          className={cn(headerActionClass, "size-9 px-0 text-white")}
          aria-label={t("header.toggleTheme")}
        >
          {theme === ThemeMode.DARK ? (
            <SunLight className="h-5 w-5 text-white" />
          ) : (
            <MoonSat className="h-5 w-5 text-white" />
          )}
        </button>

        <button
          type="button"
          onClick={logout}
          className={cn(headerActionClass, "size-9 px-0 text-white")}
          aria-label={t("header.signOut")}
        >
          <LogOutIcon className="h-5 w-5 text-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;
