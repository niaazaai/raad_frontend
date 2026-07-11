import { Button } from "@/components/ui";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Calendar, Shield, Users, Globe } from "lucide-react";
import { AnimatedArrowRight } from "@/components/icons/animated";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionTitleClass,
} from "@/components/website/websiteData";

const AboutSection = () => {
  const { t } = useTranslation();

  const glassCards = [
    { icon: Calendar, title: "Est. 2012", subtitle: "Over a decade of excellence" },
    { icon: Shield, title: "ACCA Partner", subtitle: "Authorized & accredited" },
    { icon: Users, title: "5000+ Alumni", subtitle: "Professionals in industry" },
    { icon: Globe, title: "Global Reach", subtitle: "International standards" },
  ];

  return (
    <section id="about" className={`${sectionShellClass} ${sectionSurface.default}`}>
      <div className={sectionInnerClass}>
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-16">
          <div>
            <ScrollReveal>
              <span className={sectionBadgeClass}>{t("about.badge")}</span>
              <h2 className={`${sectionTitleClass} mt-4`}>{t("about.title")}</h2>
            </ScrollReveal>
            <ScrollReveal delay={80} className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>{t("about.subtitle")}</p>
            </ScrollReveal>
            <ScrollReveal delay={120} className="mt-8">
              <Button asChild className="h-auto gap-2 rounded-full px-7 py-3">
                <a href="/about" className="inline-flex items-center gap-2">
                  {t("nav.about")}
                  <AnimatedArrowRight size={16} />
                </a>
              </Button>
            </ScrollReveal>
          </div>

          <ScrollReveal className="grid grid-cols-2 gap-4" distance={20}>
            {glassCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:border-primary/25 md:p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <p className="text-base font-bold text-foreground">{card.title}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{card.subtitle}</p>
                </div>
              );
            })}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
