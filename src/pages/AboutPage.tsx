import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import MissionVisionSection from "@/components/website/sections/MissionVisionSection";
import TeamSection from "@/components/website/sections/TeamSection";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Globe, ShieldCheck, HeartSolid } from "iconoir-react";
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

const valueStyles = {
  primary: { icon: "bg-primary/10 text-primary", border: "border-primary/20 hover:border-primary/35" },
  auxiliary: { icon: "bg-auxiliary/10 text-auxiliary", border: "border-auxiliary/20 hover:border-auxiliary/35" },
};

const AboutPage = () => {
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();

  const timelineEvents = [
    { year: "2012", label: t("aboutPage.timeline2012Label"), description: t("aboutPage.timeline2012Desc") },
    { year: "2015", label: t("aboutPage.timeline2015Label"), description: t("aboutPage.timeline2015Desc") },
    { year: "2020", label: t("aboutPage.timeline2020Label"), description: t("aboutPage.timeline2020Desc") },
    { year: "2024", label: t("aboutPage.timeline2024Label"), description: t("aboutPage.timeline2024Desc") },
    { year: "2026", label: t("aboutPage.timeline2026Label"), description: t("aboutPage.timeline2026Desc") },
  ];

  const values = [
    {
      icon: ShieldCheck,
      titleKey: "about.excellence" as const,
      descriptionKey: "aboutPage.excellenceDesc" as const,
      color: "primary" as const,
    },
    {
      icon: HeartSolid,
      titleKey: "about.integrity" as const,
      descriptionKey: "aboutPage.integrityDesc" as const,
      color: "auxiliary" as const,
    },
    {
      icon: Globe,
      titleKey: "about.accessibility" as const,
      descriptionKey: "aboutPage.accessibilityDesc" as const,
      color: "primary" as const,
    },
  ];

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <section className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} max-w-4xl text-center`}>
          <ScrollReveal>
            <span className={sectionBadgeClass}>{t("about.badge")}</span>
            <h1 className={`${sectionTitleClass} mt-4 text-4xl md:text-5xl lg:text-6xl`}>{t("about.title")}</h1>
            <p className={`${sectionSubtitleClass} mx-auto md:text-lg`}>{t("about.subtitle")}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={`${sectionShellClass} border-y border-border/60 bg-muted/15`}>
        <div className={sectionInnerClass}>
          <ScrollReveal className="mb-12 max-w-2xl">
            <span className={sectionBadgeClass}>{t("about.storyBadge")}</span>
            <h2 className={`${sectionTitleClass} mt-4`}>{t("about.storyTitle")}</h2>
            <p className={`${sectionSubtitleClass} mt-5`}>{t("aboutPage.storyBody")}</p>
          </ScrollReveal>

          <ScrollReveal>
            <ol className="relative mx-auto max-w-2xl border-s-2 border-primary/25 ps-8 ms-3 md:ms-4">
              {timelineEvents.map((event) => (
                <li key={event.year} className="relative pb-10 last:pb-0">
                  <span
                    className="absolute -start-[calc(0.5rem+5px)] top-1.5 h-4 w-4 rounded-full border-[3px] border-primary bg-background shadow-sm"
                    aria-hidden
                  />
                  <p className="text-xs font-bold tracking-wide text-primary">{event.year}</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{event.label}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      <section className={sectionShellClass}>
        <div className={sectionInnerClass}>
          <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
            <span className={sectionBadgeClass}>{t("about.valuesBadge")}</span>
            <h2 className={`${sectionTitleClass} mt-4`}>{t("about.valuesTitle")}</h2>
          </ScrollReveal>
          <ScrollReveal className="grid gap-5 sm:grid-cols-3">
            {values.map(({ icon: Icon, titleKey, descriptionKey, color }) => (
              <div
                key={titleKey}
                className={`rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md ${valueStyles[color].border}`}
              >
                <span
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${valueStyles[color].icon}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{t(titleKey)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(descriptionKey)}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      <MissionVisionSection />
      <TeamSection />
      <WebsiteFooter />
    </>
  );
};

export default AboutPage;
