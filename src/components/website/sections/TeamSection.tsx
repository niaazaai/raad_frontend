import ScrollReveal from "@/components/website/ScrollReveal";
import { TEAM_MEMBERS, memberColorStyles, sectionBadgeClass, sectionInnerClass, sectionShellClass, sectionTitleClass } from "@/components/website/websiteData";
import { useTranslation } from "@/i18n/useTranslation";

const TeamSection = () => {
  const { t } = useTranslation();

  return (
    <section id="team" className={sectionShellClass}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
          <span className={sectionBadgeClass}>{t("qualifications.teamBadge")}</span>
          <h2 className={`${sectionTitleClass} mt-4`}>{t("qualifications.teamTitle")}</h2>
        </ScrollReveal>

        <ScrollReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_MEMBERS.map(({ name, role, bio, initials, color }) => (
            <article
              key={name}
              className="flex flex-col items-center rounded-2xl border border-border/70 bg-card p-6 text-center transition hover:border-primary/30 hover:shadow-md"
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold ${memberColorStyles[color].avatar}`}>
                {initials}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{name}</h3>
              <p className={`mt-1 text-sm font-medium ${memberColorStyles[color].role}`}>{role}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio}</p>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TeamSection;
