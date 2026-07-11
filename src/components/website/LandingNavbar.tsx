import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Menu, Xmark, NavArrowDown } from "iconoir-react";
import LanguageSwitcher from "@/components/website/LanguageSwitcher";
import ThemeToggle from "@/components/website/ThemeToggle";
import { useTranslation } from "@/i18n/useTranslation";

interface LandingNavbarProps {
  loginHref: string;
  className?: string;
}

const LandingNavbar = ({ loginHref, className }: LandingNavbarProps) => {
  const { t } = useTranslation();
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

  const desktopLinkClass =
    "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground";
  const mobileLinkClass =
    "block rounded-xl px-5 py-3.5 text-base font-semibold text-foreground/85 transition-colors hover:bg-muted/60";

  return (
    <>
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 md:px-8 md:pt-4",
          className,
        )}
      >
        <nav
          className={cn(
            "pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border border-border/60 px-3 py-2.5 shadow-sm backdrop-blur-xl transition-all duration-300 md:px-5 md:py-3",
            scrolled ? "bg-card/90" : "bg-card/70",
          )}
          aria-label="Main"
        >
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
            <Button asChild size="sm" className="rounded-full px-4 font-semibold">
              <a href={loginHref}>{t("nav.signIn")}</a>
            </Button>
            <button
              type="button"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/70 lg:hidden"
            >
              {menuOpen ? <Xmark width={20} height={20} /> : <Menu width={20} height={20} />}
            </button>
          </div>
        </nav>
      </header>

      <div
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-background/95 backdrop-blur-xl transition-all duration-300 lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
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
          <div className="mt-8 border-t border-border pt-6">
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
