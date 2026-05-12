import { Building, Laptop, BookStack, Group } from "iconoir-react";
import type { ComponentType, SVGProps } from "react";
import ScrollReveal from "@/components/website/ScrollReveal";

// Icon map: Building, Laptop (Digital Labs), BookStack, Group

interface CampusFeature {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  stat: string;
}

const features: CampusFeature[] = [
  {
    icon: Building,
    title: "Modern Classrooms",
    desc: "Spacious, tech-equipped classrooms designed for interactive learning and collaboration.",
    stat: "20+ rooms",
  },
  {
    icon: Laptop,
    title: "Digital Labs",
    desc: "Fully equipped computer labs with professional software suites for accounting and finance.",
    stat: "150+ workstations",
  },
  {
    icon: BookStack,
    title: "Resource Library",
    desc: "Extensive physical and digital library with ACCA, CIMA materials and reference books.",
    stat: "10,000+ resources",
  },
  {
    icon: Group,
    title: "Study Lounges",
    desc: "Comfortable spaces for group study, peer mentoring, and project collaboration.",
    stat: "Open 7 days",
  },
];

const CampusSection = () => {
  return (
    <section id="campus" className="bg-[#030710] py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">

        {/* Section header */}
        <ScrollReveal className="mb-14 flex flex-col items-center text-center">
          <div>
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Campus
            </span>
          </div>
          <div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              A Space Designed for Learning
            </h2>
          </div>
          <div>
            <p className="mt-4 max-w-xl text-base text-white/55">
              Modern facilities equipped for the demands of professional education.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature grid — each card staggered via ScrollReveal */}
        <ScrollReveal className="grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, desc, stat }) => (
            <div
              key={title}
              className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>

              {/* Description */}
              <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>

              {/* Stat badge */}
              <span className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {stat}
              </span>
            </div>
          ))}
        </ScrollReveal>

        {/* Bottom CTA */}
        <ScrollReveal className="mt-12 flex justify-center">
          <div>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full border-2 border-primary/60 px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-primary hover:bg-primary/10"
            >
              Schedule a Campus Tour
            </a>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};

export default CampusSection;
