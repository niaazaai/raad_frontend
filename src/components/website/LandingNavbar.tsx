import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Menu, Xmark, NavArrowDown } from "iconoir-react";
import LanguageSwitcher from "@/components/website/LanguageSwitcher";
import ThemeToggle from "@/components/website/ThemeToggle";
import { useTranslation } from "@/i18n/useTranslation";
import { useIsDarkMode } from "@/hooks";

interface LandingNavbarProps {
  loginHref: string;
  className?: string;
}

const LandingNavbar = ({ loginHref, className }: LandingNavbarProps) => {
  const { t } = useTranslation();
  const isDark = useIsDarkMode();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.programs"), href: "/explore-courses" },
    { label: t("nav.qualifications"), href: "/#qualifications" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const glassNavClass = cn(
    "pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 md:px-5 md:py-3",
    isDark
      ? cn(
          "border-white/15 bg-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.28)]",
          scrolled && "border-white/20 bg-white/[0.11] shadow-[0_12px_40px_rgba(0,0,0,0.38)]",
        )
      : cn(
          "border-white/50 bg-white/45 shadow-[0_8px_32px_rgba(0,105,180,0.10)]",
          scrolled && "border-primary/20 bg-white/65 shadow-[0_12px_40px_rgba(0,105,180,0.14)]",
        ),
  );

  const desktopLinkClass = cn(
    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
    isDark
      ? "text-white/70 hover:bg-white/10 hover:text-white"
      : "text-foreground/70 hover:bg-primary/10 hover:text-primary",
  );

  const mobileLinkClass = cn(
    "block rounded-xl px-5 py-3.5 text-base font-semibold transition-colors",
    isDark ? "text-white/85 hover:bg-white/10" : "text-foreground hover:bg-primary/10",
  );

  const mobileOverlayClass = cn(
    "fixed inset-0 z-40 flex flex-col backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 lg:hidden",
    isDark ? "bg-[#050a18]/80" : "bg-background/75",
    menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
  );

  return (
    <>
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 md:px-8 md:pt-4",
          className,
        )}
      >
        <nav className={glassNavClass} aria-label="Main">
          <a href="/" className="flex shrink-0 items-center gap-2 pe-2">
            <img src="/logo.png" alt="Raad LMS" className="h-9 w-auto object-contain md:h-10" />
          </a>

          <div className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={desktopLinkClass}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle className="hidden sm:flex" />
            <Button asChild size="sm" className="rounded-full px-4 font-semibold shadow-sm">
              <a href={loginHref}>{t("nav.signIn")}</a>
            </Button>
            <button
              type="button"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors lg:hidden",
                isDark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-primary/10",
              )}
            >
              {menuOpen ? <Xmark width={20} height={20} /> : <Menu width={20} height={20} />}
            </button>
          </div>
        </nav>
      </header>

      <div aria-hidden={!menuOpen} className={mobileOverlayClass}>
        <div className="h-20 shrink-0" />
        <nav className="flex flex-1 flex-col px-6 pb-10">
          <div className="mb-6 flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
                  <span className="flex items-center justify-between">
                    {link.label}
                    <NavArrowDown width={16} height={16} className="-rotate-90 opacity-40" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div
            className={cn(
              "mt-8 border-t pt-6",
              isDark ? "border-white/10" : "border-primary/15",
            )}
          >
            <Button asChild className="w-full rounded-full py-3 font-semibold">
              <a href={loginHref} onClick={() => setMenuOpen(false)}>
                {t("nav.signIn")}
              </a>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default LandingNavbar;
