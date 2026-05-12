import { Button } from "@/components/ui";
import ScrollReveal from "@/components/website/ScrollReveal";
import { NavArrowRight, Calendar, Shield, Group, Globe } from "iconoir-react";

interface GlassCard {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

const glassCards: GlassCard[] = [
  {
    icon: Calendar,
    title: "Est. 2012",
    subtitle: "Over a decade of excellence",
  },
  {
    icon: Shield,
    title: "ACCA Partner",
    subtitle: "Authorized & accredited",
  },
  {
    icon: Group,
    title: "5000+ Alumni",
    subtitle: "Professionals in industry",
  },
  {
    icon: Globe,
    title: "Global Reach",
    subtitle: "International standards",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="bg-[#050a18] py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">

          {/* ── Left column: text ── */}
          <div>
            <ScrollReveal>
              {/* Badge */}
              <span className="mb-5 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                About Raad
              </span>

              {/* Heading */}
              <h2 className="mt-4 text-3xl font-bold leading-snug tracking-tight text-white md:text-4xl">
                Shaping the Future of Professional Education in Afghanistan
              </h2>
            </ScrollReveal>

            {/* Body paragraphs */}
            <ScrollReveal delay={100} className="mt-6 flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-white/60 md:text-base">
                Founded in 2012, Raad Professional Development Institute has been at the forefront
                of transforming professional education in Afghanistan. We bridge the gap between
                local talent and international standards.
              </p>
              <p className="text-sm leading-relaxed text-white/60 md:text-base">
                Our comprehensive programs span accounting, finance, business management, and
                technology — all delivered by industry professionals with decades of real-world
                experience.
              </p>
              <p className="text-sm leading-relaxed text-white/60 md:text-base">
                We are the authorized partner for internationally recognized qualifications including
                ACCA, bringing globally competitive credentials to Afghan professionals.
              </p>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal delay={180} className="mt-8">
              <Button
                asChild
                className="h-auto gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,105,180,0.35)] transition hover:bg-primary-active hover:shadow-[0_6px_28px_rgba(0,105,180,0.45)]"
              >
                <a href="/about" className="inline-flex items-center gap-2">
                  Learn More About Us
                  <NavArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </ScrollReveal>
          </div>

          {/* ── Right column: 2×2 glass cards ── */}
          <ScrollReveal className="grid grid-cols-2 gap-4" direction="up" distance={24}>
            {glassCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/[0.14] hover:bg-white/[0.07]"
                >
                  {/* Icon circle */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  {/* Title */}
                  <p className="text-base font-bold text-white">{card.title}</p>

                  {/* Subtitle */}
                  <p className="text-xs leading-snug text-white/50">{card.subtitle}</p>
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
