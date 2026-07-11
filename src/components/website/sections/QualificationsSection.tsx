import ScrollReveal from "@/components/website/ScrollReveal";
import {
  QUALIFICATIONS,
  TEAM_MEMBERS,
  badgeColorStyles,
  memberColorStyles,
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";
import { useTranslation } from "@/i18n/useTranslation";

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

        <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUALIFICATIONS.map((q) => (
            <article
              key={q.name}
              className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md md:p-6"
            >
              <span className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{q.name}</span>
              <span className="mt-1 text-sm text-muted-foreground">{q.full}</span>
              <div className="mt-auto pt-5">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeColorStyles[q.color]}`}>
                  {q.badge}
                </span>
              </div>
            </article>
          ))}
        </ScrollReveal>

        <ScrollReveal className="mt-16 flex flex-col items-center text-center md:mt-20">
          <span className={sectionBadgeClass}>{t("qualifications.teamBadge")}</span>
          <h3 className={`${sectionTitleClass} mt-4 text-2xl md:text-3xl`}>{t("qualifications.teamTitle")}</h3>
        </ScrollReveal>

        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_MEMBERS.map(({ name, role, bio, initials, color }) => (
            <article
              key={name}
              className="flex flex-col items-center rounded-2xl border border-border/70 bg-card p-6 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-primary/30 dark:hover:bg-white/[0.07]"
            >
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold ${memberColorStyles[color].avatar}`}
              >
                {initials}
              </div>
              <h4 className="mt-4 text-lg font-semibold text-foreground">{name}</h4>
              <p className={`mt-1 text-sm font-medium ${memberColorStyles[color].role}`}>{role}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio}</p>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
};

export default QualificationsSection;
