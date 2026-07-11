import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import WebsiteShell from "@/components/website/WebsiteShell";
import MissionVisionSection from "@/components/website/sections/MissionVisionSection";
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

const timelineEvents = [
  { year: "2012", label: "Founded", description: "Raad Professional Development Institute opens its doors in Kabul." },
  { year: "2015", label: "ACCA Partnership", description: "Officially recognized as an ACCA Gold Approved Learning Partner." },
  { year: "2020", label: "Online Programs", description: "Launched online learning platform, expanding access across Afghanistan." },
  { year: "2024", label: "5,000+ Alumni", description: "Over five thousand graduates working in top firms and organizations." },
];

const values = [
  {
    icon: ShieldCheck,
    titleKey: "about.excellence" as const,
    description:
      "We hold ourselves to the highest academic standards, ensuring every program delivers measurable, real-world impact for our students.",
    color: "primary" as const,
  },
  {
    icon: HeartSolid,
    titleKey: "about.integrity" as const,
    description:
      "Honesty and transparency are at the core of everything we do — from our teaching methods to our relationships with students and partners.",
    color: "auxiliary" as const,
  },
  {
    icon: Globe,
    titleKey: "about.accessibility" as const,
    description:
      "We believe world-class professional education should be within reach for every Afghan learner, regardless of background or circumstance.",
    color: "primary" as const,
  },
];

const valueStyles = {
  primary: { icon: "bg-primary/10 text-primary", border: "border-primary/20 hover:border-primary/35" },
  auxiliary: { icon: "bg-auxiliary/10 text-auxiliary", border: "border-auxiliary/20 hover:border-auxiliary/35" },
};

const AboutPage = () => {
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();

  return (
    <WebsiteShell>
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
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>
              <span className={sectionBadgeClass}>{t("about.storyBadge")}</span>
              <h2 className={`${sectionTitleClass} mt-4`}>{t("about.storyTitle")}</h2>
              <p className={`${sectionSubtitleClass} mt-5`}>
                Raad was founded in 2012 by Afghan finance professionals who recognized a critical gap in access to
                globally recognized qualifications.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <ol className="relative border-s border-border ps-8">
                {timelineEvents.map((event) => (
                  <li key={event.year} className="relative pb-8 last:pb-0">
                    <span className="absolute -start-[9px] top-0 h-[18px] w-[18px] rounded-full border-2 border-background bg-primary" aria-hidden />
                    <span className="mb-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {event.year}
                    </span>
                    <p className="text-sm font-semibold text-foreground">{event.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  </li>
                ))}
              </ol>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className={sectionShellClass}>
        <div className={sectionInnerClass}>
          <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
            <span className={sectionBadgeClass}>{t("about.valuesBadge")}</span>
            <h2 className={`${sectionTitleClass} mt-4`}>{t("about.valuesTitle")}</h2>
          </ScrollReveal>
          <ScrollReveal className="grid gap-5 sm:grid-cols-3">
            {values.map(({ icon: Icon, titleKey, description, color }) => (
              <div
                key={titleKey}
                className={`rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md ${valueStyles[color].border}`}
              >
                <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${valueStyles[color].icon}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{t(titleKey)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      <MissionVisionSection />
      <WebsiteFooter />
    </WebsiteShell>
  );
};

export default AboutPage;
