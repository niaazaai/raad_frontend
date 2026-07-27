import { Link, useParams } from "react-router-dom";
import { Check, NavArrowLeft } from "iconoir-react";
import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import ScrollReveal from "@/components/website/ScrollReveal";
import { QUALIFICATION_DETAILS, type QualificationSlug } from "@/components/website/qualificationData";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const QualificationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();
  const qualification =
    slug && slug in QUALIFICATION_DETAILS ? QUALIFICATION_DETAILS[slug as QualificationSlug] : null;

  if (!qualification) {
    return (
      <>
        <LandingNavbar loginHref={loginHref} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 pt-28">
          <p className="text-muted-foreground">{t("qualifications.notFound")}</p>
          <Link to="/" className="mt-4 text-primary hover:underline">
            {t("common.back")}
          </Link>
        </div>
        <WebsiteFooter />
      </>
    );
  }

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <section className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={sectionInnerClass}>
          <Link
            to="/#qualifications"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <NavArrowLeft className="h-4 w-4" />
            {t("qualifications.backToAll")}
          </Link>
          <ScrollReveal>
            <span className={sectionBadgeClass}>{qualification.badge}</span>
            <h1 className={`${sectionTitleClass} mt-4 text-4xl md:text-5xl`}>{qualification.name}</h1>
            <p className={`${sectionSubtitleClass} md:text-lg`}>{qualification.full}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={`${sectionShellClass} border-y border-border/60 bg-muted/15`}>
        <div className={`${sectionInnerClass} grid gap-10 lg:grid-cols-[1.2fr_0.8fr]`}>
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-foreground">{qualification.aboutTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{qualification.about}</p>

            <h3 className="mt-10 text-xl font-semibold text-foreground">{qualification.whyTitle}</h3>
            <ul className="mt-4 space-y-3">
              {qualification.whyPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-foreground/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 text-xl font-semibold text-foreground">{qualification.careerTitle}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {qualification.careerRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                >
                  {role}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">{t("qualifications.keyDetails")}</h3>
              <dl className="mt-5 space-y-4">
                {qualification.details.map(({ label, value }) => (
                  <div key={label} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                to="/contact"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-active"
              >
                {t("qualifications.enquireNow")}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WebsiteFooter />
    </>
  );
};

export default QualificationPage;
