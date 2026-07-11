import { AppLocale, AppLocaleLabels } from "@/data/enums/locale";
import { useLocaleStore } from "@/store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Check, Globe, NavArrowDown } from "iconoir-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 text-xs font-semibold text-primary shadow-sm outline-none transition hover:border-primary/35 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/25 data-[state=open]:border-primary/40 data-[state=open]:bg-primary/10",
          className,
        )}
        aria-label={t("language.select")}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span>{AppLocaleLabels[locale]}</span>
        <NavArrowDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[9.5rem] overflow-hidden rounded-2xl border border-primary/15 bg-card p-1.5 shadow-lg"
      >
        {Object.values(AppLocale).map((code) => {
          const active = locale === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition",
                active
                  ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
                  : "text-foreground focus:bg-muted/70 focus:text-foreground",
              )}
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

export default LanguageSwitcher;
