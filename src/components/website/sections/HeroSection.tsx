import LightPillar from "@/components/website/LightPillar";
import SplitText from "@/components/website/SplitText";
import { Button } from "@/components/ui";
import { NavArrowDown } from "iconoir-react";

const HeroSection = () => {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-[#050a18]" aria-hidden />

      {/* Decorative orbs */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, #0069B4 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, #9B3D9A 0%, transparent 70%)" }}
        aria-hidden
      />

      {/* WebGL light pillar */}
      <div className="absolute inset-0">
        <LightPillar
          topColor="#0069B4"
          bottomColor="#9B3D9A"
          intensity={1.05}
          rotationSpeed={0.28}
          glowAmount={0.006}
          pillarWidth={3.2}
          pillarHeight={0.42}
          noiseIntensity={0.45}
          pillarRotation={0}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-28 md:px-8 md:pb-24 md:pt-32">
        <div className="mx-auto w-full max-w-5xl text-center">

          {/* Badge pill */}
          <div className="mb-8 inline-flex items-center rounded-full border border-white/[0.18] bg-white/[0.07] px-4 py-2 backdrop-blur-sm">
            <span className="text-xs font-semibold tracking-widest text-white/80 uppercase">
              Raad Professional Development
            </span>
          </div>

          {/* Main heading */}
          <SplitText
            tag="h1"
            text="Empowering the Next Generation of Global Professionals"
            className="hyphens-manual break-normal text-pretty text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl lg:text-7xl"
            delay={80}
            duration={0.55}
            ease="power3.out"
            splitType="words"
            from={{ opacity: 0, y: 36 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            triggerOnScroll={false}
          />

          {/* Subheading */}
          <div className="mt-7 md:mt-8">
            <SplitText
              tag="p"
              text="Premier professional education in Afghanistan — globally recognized qualifications, world-class instructors, and a community of driven learners."
              className="mx-auto max-w-2xl text-base leading-relaxed text-white/65 md:text-lg"
              delay={30}
              duration={0.55}
              ease="power2.out"
              splitType="words"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="center"
              triggerOnScroll={false}
            />
          </div>

          {/* CTA buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:mt-14 sm:flex-row sm:gap-5">
            <Button
              asChild
              className="h-auto rounded-full border-0 bg-white px-10 py-4 text-base font-bold tracking-wide text-primary shadow-[0_6px_28px_rgba(0,0,0,0.22)] ring-1 ring-white/30 transition hover:bg-white/90 hover:shadow-[0_10px_36px_rgba(0,0,0,0.3)]"
            >
              <a href="/explore-courses" className="inline-flex items-center justify-center">
                Explore Programs
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto rounded-full border-2 border-white/60 bg-white/10 px-10 py-4 text-base font-bold tracking-wide text-white shadow-[0_6px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:border-white hover:bg-white/20 hover:text-white"
            >
              <a href="#contact" className="inline-flex items-center justify-center">
                Get in Touch
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2" aria-hidden>
        <div className="animate-bounce flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium tracking-widest text-white/40 uppercase">Scroll</span>
          <NavArrowDown className="h-5 w-5 text-white/40" strokeWidth={2} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
