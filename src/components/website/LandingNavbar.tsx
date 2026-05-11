import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Menu, Xmark, NavArrowDown } from "iconoir-react";

interface LandingNavbarProps {
  loginHref: string;
  className?: string;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Programs", href: "/explore-courses" },
  { label: "Campus", href: "/#campus" },
  { label: "Team", href: "/#team" },
  { label: "Contact", href: "/contact" },
];

const desktopLinkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white";

const mobileLinkClass =
  "block rounded-xl px-5 py-3.5 text-base font-semibold text-white/75 transition-colors hover:bg-white/8 hover:text-white";

const LandingNavbar = ({ loginHref, className }: LandingNavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:px-8 md:pt-6",
          className,
        )}
      >
        <nav
          className={cn(
            "pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border-[0.5px] border-solid border-neutral-500/45 px-4 py-2.5 shadow-sm transition-all duration-300 md:px-6 md:py-3",
            "backdrop-blur-xl backdrop-saturate-150",
            scrolled ? "bg-white/8" : "bg-transparent",
          )}
          aria-label="Main"
        >
          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center gap-3 pr-2">
            <img
              src="/logo.png"
              alt="Raad LMS"
              className="h-9 max-h-11 w-auto object-contain md:h-11"
            />
          </a>

          {/* Desktop center links */}
          <div className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={desktopLinkClass}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: Sign In + hamburger */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <Button
              asChild
              className="shrink-0 rounded-full border-0 bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-md hover:bg-white/95"
            >
              <a href={loginHref}>Sign In</a>
            </Button>

            {/* Hamburger – mobile only */}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            >
              {menuOpen ? (
                <Xmark width={20} height={20} />
              ) : (
                <Menu width={20} height={20} />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen mobile overlay */}
      <div
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-[#050a18]/95 backdrop-blur-2xl transition-all duration-300 lg:hidden",
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        {/* Top spacing to clear the navbar */}
        <div className="h-24 shrink-0" />

        <nav className="flex flex-1 flex-col justify-center px-6 pb-12">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={mobileLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center justify-between">
                    {link.label}
                    <NavArrowDown
                      width={16}
                      height={16}
                      className="-rotate-90 opacity-40"
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-white/8 pt-8">
            <Button
              asChild
              className="w-full rounded-full border-0 bg-white py-3 text-base font-semibold text-primary shadow-md hover:bg-white/95"
            >
              <a href={loginHref} onClick={() => setMenuOpen(false)}>
                Sign In
              </a>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default LandingNavbar;
