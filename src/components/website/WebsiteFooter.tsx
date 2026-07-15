import { useTranslation } from "@/i18n/useTranslation";
import { SOCIAL_ICON_LINKS } from "@/components/website/SocialIcons";
import { CONTACT_INFO } from "@/components/website/websiteData";
import { useLocaleStore } from "@/store";
import { AppLocale } from "@/data/enums/locale";
import { MapPin, Mail, Phone } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

const WebsiteFooter = () => {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const haltoonLabel = locale === AppLocale.ENGLISH ? "haltoon" : "حلتون";

  const quickLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.programs"), href: "/explore-courses" },
    { label: t("nav.qualifications"), href: "/#qualifications" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const resourceLinks = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ];

  const colTitleClass = "mb-4 text-sm font-semibold uppercase tracking-widest text-primary";

  return (
    <footer className="border-t border-primary/10 bg-gradient-to-b from-primary/[0.05] to-background">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <a href="/" aria-label="Raad LMS – Home">
              <img src="/logo.png" alt="Raad Professional Development Institute" className="h-10 w-auto object-contain" />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t("footer.tagline")}</p>
            <div className="flex flex-wrap gap-2.5">
              {SOCIAL_ICON_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-card text-muted-foreground transition hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className={colTitleClass}>{t("footer.quickLinks")}</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={colTitleClass}>{t("footer.resources")}</h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={colTitleClass}>{t("footer.contact")}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href={CONTACT_INFO.mapsHref}
                  className="flex items-start gap-2 hover:text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" strokeWidth={2} />
                  {CONTACT_INFO.location}
                </a>
              </li>
              <li>
                <a href={CONTACT_INFO.emailHref} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="h-4 w-4 shrink-0 text-primary/70" strokeWidth={2} />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li>
                <a href={CONTACT_INFO.phoneHref} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4 shrink-0 text-primary/70" strokeWidth={2} />
                  {CONTACT_INFO.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/10 px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-start">
          <span>
            © {CURRENT_YEAR} {t("footer.rights")}
          </span>
          <a
            href="https://haltoon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-muted-foreground transition hover:text-primary"
          >
            {t("footer.poweredBy")}
            <img src="/haltoon.svg" alt="" className="h-5 w-auto" aria-hidden />
            <span className="text-foreground/90">{haltoonLabel}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
