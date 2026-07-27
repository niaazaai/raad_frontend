import { Link } from "react-router-dom";
import { NavArrowRight } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";
import {
  LANDING_QUALIFICATIONS,
  QUALIFICATION_DETAILS,
  type QualificationSlug,
} from "@/components/website/qualificationData";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

const colorStyles = {
  primary: "border-primary/20 hover:border-primary/40 bg-primary/5",
  auxiliary: "border-auxiliary/20 hover:border-auxiliary/40 bg-auxiliary/5",
  success: "border-success/20 hover:border-success/40 bg-success/5",
};

const QualificationsSection = () => {
  const { t } = useTranslation();

  return (
    <section id="qualifications" className={`${sectionShellClass} ${sectionSurface.muted}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
          <span className={sectionBadgeClass}>{t("qualifications.badge")}</span>
          <h2 className={`${sectionTitleClass} mt-4`}>{t("qualifications.title")}</h2>
          <p className={`${sectionSubtitleClass} mx-auto`}>{t("qualifications.subtitle")}</p>
        </ScrollReveal>

        <ScrollReveal className="grid gap-5 md:grid-cols-3">
          {LANDING_QUALIFICATIONS.map((slug: QualificationSlug) => {
            const q = QUALIFICATION_DETAILS[slug];
            return (
              <Link
                key={slug}
                to={`/qualifications/${slug}`}
                className={`group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md ${colorStyles[q.color]}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{q.badge}</span>
                <span className="mt-3 text-4xl font-black tracking-tight text-foreground">{q.name}</span>
                <span className="mt-1 text-sm text-muted-foreground">{q.full}</span>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{q.about}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {t("qualifications.learnMore")}
                  <NavArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
};

export default QualificationsSection;
