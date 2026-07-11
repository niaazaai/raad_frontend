import { Eye, Check, Globe, ShieldCheck, BadgeCheck } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionTitleClass,
} from "@/components/website/websiteData";

const missionPoints = [
  "Internationally recognized qualifications for every learner",
  "Accessible, affordable professional education",
  "Strengthening Afghan organizations from within",
];

const visionPoints = [
  "Central Asia's leading professional development hub",
  "Afghan professionals competing at the highest global levels",
  "A bridge between local talent and world-class opportunity",
];

const certBadges = [
  { label: "ISO Certified", icon: ShieldCheck },
  { label: "Govt. Recognized", icon: BadgeCheck },
  { label: "ACCA Authorized", icon: Globe },
];

const MissionVisionSection = () => {
  return (
    <section id="mission-vision" className={`${sectionShellClass} ${sectionSurface.card}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
          <span className={sectionBadgeClass}>Our Purpose</span>
          <h2 className={`${sectionTitleClass} mt-4 max-w-2xl`}>Guided by a Clear Mission &amp; Vision</h2>
        </ScrollReveal>

        <ScrollReveal className="grid gap-6 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-7 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Our Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To provide world-class professional education that empowers individuals, strengthens organizations,
              and contributes to Afghanistan&apos;s economic development.
            </p>
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
            <h3 className="text-xl font-bold text-foreground">Our Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To become the leading professional development institution in Central Asia — where Afghan
              professionals compete at the highest global levels.
            </p>
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

        <ScrollReveal className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {certBadges.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground/85">{label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default MissionVisionSection;
