import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import MissionVisionSection from "@/components/website/sections/MissionVisionSection";
import TeamSection from "@/components/website/sections/TeamSection";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Globe, ShieldCheck, HeartSolid } from "iconoir-react";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const timelineEvents = [
  { year: "2012", label: "Founded", description: "Raad Professional Development Institute opens its doors in Kabul." },
  { year: "2015", label: "ACCA Partnership", description: "Officially recognized as an ACCA Gold Approved Learning Partner." },
  { year: "2018", label: "New Campus", description: "Modern campus facilities opened to serve a growing student body." },
  { year: "2020", label: "Online Programs", description: "Launched online learning platform, expanding access across Afghanistan." },
  { year: "2024", label: "5,000+ Alumni", description: "Over five thousand graduates working in top firms and organizations." },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Excellence",
    description:
      "We hold ourselves to the highest academic standards, ensuring every program delivers measurable, real-world impact for our students.",
    color: "primary" as const,
  },
  {
    icon: HeartSolid,
    title: "Integrity",
    description:
      "Honesty and transparency are at the core of everything we do — from our teaching methods to our relationships with students and partners.",
    color: "auxiliary" as const,
  },
  {
    icon: Globe,
    title: "Accessibility",
    description:
      "We believe world-class professional education should be within reach for every Afghan learner, regardless of background or circumstance.",
    color: "primary" as const,
  },
];

const valueStyles = {
  primary: {
    icon: "bg-primary/15 text-primary",
    border: "border-primary/20 hover:border-primary/40",
  },
  auxiliary: {
    icon: "bg-auxiliary/15 text-auxiliary",
    border: "border-auxiliary/20 hover:border-auxiliary/40",
  },
};

const AboutPage = () => {
  const loginHref = resolveLoginHref();

  return (
    <div className="min-h-screen bg-[#050a18] text-white">
      <LandingNavbar loginHref={loginHref} />

      {/* ── 1. Hero ── */}
      <section className="bg-[#050a18] pb-20 pt-32">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <ScrollReveal>
            <span className="mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              About Raad
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Transforming Professional Education in Afghanistan
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
              For over a decade, Raad Professional Development Institute has been
              Afghanistan's trusted gateway to internationally recognized financial
              and accounting qualifications — equipping professionals with the skills
              to compete and lead on the world stage.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 2. Story + Timeline ── */}
      <section className="border-y border-white/[0.06] bg-[#030710] py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Story text */}
            <ScrollReveal delay={0}>
              <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                Our Story
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Built on a Vision, Driven by Purpose
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/60">
                Raad was founded in 2012 by a group of Afghan finance professionals
                who recognized a critical gap: while local talent was abundant,
                access to globally recognized qualifications was virtually nonexistent
                in the country.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Starting with a small cohort of ACCA students in a single classroom,
                Raad quickly earned a reputation for exceptional teaching and
                unmatched student support. Word spread, enrollment grew, and
                partnerships with global accounting bodies followed.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Today, Raad operates a modern campus in Kabul, a comprehensive
                online learning platform, and serves thousands of students across
                Afghanistan — all united by one goal: professional excellence.
              </p>
            </ScrollReveal>

            {/* Timeline */}
            <ScrollReveal delay={0.1}>
              <h3 className="mb-8 text-lg font-semibold text-white/80">
                Key Milestones
              </h3>
              <ol className="relative flex flex-col gap-0 border-l border-white/[0.1]">
                {timelineEvents.map((event) => (
                  <li key={event.year} className="relative pb-8 pl-8 last:pb-0">
                    {/* Dot */}
                    <span
                      className="absolute -left-[9px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#030710] bg-primary/80"
                      aria-hidden
                    />
                    {/* Year badge */}
                    <span className="mb-1 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {event.year}
                    </span>
                    <p className="text-sm font-semibold text-white">{event.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">
                      {event.description}
                    </p>
                  </li>
                ))}
              </ol>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 3. Values ── */}
      <section className="bg-[#050a18] py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <ScrollReveal className="mb-14 flex flex-col items-center text-center">
            <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              What We Stand For
            </span>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Our Core Values
            </h2>
          </ScrollReveal>

          <ScrollReveal staggerChildren stagger={0.1} className="grid gap-6 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className={`flex flex-col rounded-2xl border bg-white/[0.04] p-7 transition-all duration-300 hover:bg-white/[0.07] ${valueStyles[color].border}`}
              >
                <span
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${valueStyles[color].icon}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  {description}
                </p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. Mission & Vision ── */}
      <MissionVisionSection />

      {/* ── 5. Team ── */}
      <TeamSection />

      <WebsiteFooter />
    </div>
  );
};

export default AboutPage;
