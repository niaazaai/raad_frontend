import { Eye, Check, Globe, ShieldCheck, BadgeCheck } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";

// iconoir-react v7 does not export "Target" or "Crosshair".
// Using Globe as a purposeful icon for Mission, Eye for Vision (as specified).

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
    <section
      id="mission-vision"
      className="border-y border-white/[0.08] bg-[#030710] py-20"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">

        {/* Section header — each direct child of ScrollReveal staggered individually */}
        <ScrollReveal className="mb-14 flex flex-col items-center text-center">
          <div>
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Purpose
            </span>
          </div>
          <div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Guided by a Clear Mission &amp; Vision
            </h2>
          </div>
        </ScrollReveal>

        {/* Cards grid — each card is a direct child so both stagger in */}
        <ScrollReveal className="grid gap-8 md:grid-cols-2">

          {/* Mission Card */}
          <div className="flex h-full flex-col rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white">Our Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              To provide world-class professional education that empowers
              individuals, strengthens organizations, and contributes to
              Afghanistan's economic development — making internationally
              recognized qualifications accessible to all.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {missionPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-white/70">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vision Card */}
          <div className="flex h-full flex-col rounded-2xl border border-auxiliary/25 bg-gradient-to-br from-auxiliary/10 to-transparent p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-auxiliary/15">
              <Eye className="h-6 w-6 text-auxiliary" />
            </div>
            <h3 className="text-xl font-bold text-white">Our Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              To become the leading professional development institution in
              Central Asia — a hub where talent meets opportunity, where
              Afghan professionals compete at the highest global levels.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {visionPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-auxiliary/20">
                    <Check className="h-3 w-3 text-auxiliary" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-white/70">{point}</span>
                </li>
              ))}
            </ul>
          </div>

        </ScrollReveal>

        {/* Bottom stats row */}
        <ScrollReveal className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {certBadges.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};

export default MissionVisionSection;
