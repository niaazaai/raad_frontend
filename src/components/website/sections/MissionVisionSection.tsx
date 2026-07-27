import { Check, Globe, Eye } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionTitleClass,
} from "@/components/website/websiteData";

const MissionVisionSection = () => {
  const { t } = useTranslation();

  const missionPoints = [
    t("missionVision.missionPoint1"),
    t("missionVision.missionPoint2"),
    t("missionVision.missionPoint3"),
  ];

  const visionPoints = [
    t("missionVision.visionPoint1"),
    t("missionVision.visionPoint2"),
    t("missionVision.visionPoint3"),
  ];

  return (
    <section id="mission-vision" className={`${sectionShellClass} ${sectionSurface.card}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
          <span className={sectionBadgeClass}>{t("missionVision.badge")}</span>
          <h2 className={`${sectionTitleClass} mt-4 max-w-2xl`}>{t("missionVision.title")}</h2>
        </ScrollReveal>

        <ScrollReveal className="grid gap-6 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-7 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t("missionVision.missionTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("missionVision.missionBody")}</p>
            <ul className="mt-6 space-y-3">
              {missionPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-foreground/80">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-auxiliary/20 bg-gradient-to-br from-auxiliary/10 to-card p-7 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-auxiliary/15">
              <Eye className="h-6 w-6 text-auxiliary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t("missionVision.visionTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("missionVision.visionBody")}</p>
            <ul className="mt-6 space-y-3">
              {visionPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-auxiliary/15">
                    <Check className="h-3 w-3 text-auxiliary" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-foreground/80">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default MissionVisionSection;
