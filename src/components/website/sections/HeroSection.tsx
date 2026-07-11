import PixelBlast from "@/components/ui/pixel-blast";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import ScrollReveal from "@/components/website/ScrollReveal";
import { AnimatedArrowRight, AnimatedChevronDown } from "@/components/icons/animated";
import { sectionBadgeClass, sectionInnerClass } from "@/components/website/websiteData";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[#050a18]" aria-hidden />
      <div className="absolute inset-0 opacity-90" aria-hidden>
        <PixelBlast
          variant="diamond"
          pixelSize={3}
          color="#0960f0"
          patternScale={3}
          patternDensity={2}
          enableRipples
          rippleSpeed={0.25}
          rippleThickness={0.21}
          rippleIntensityScale={1}
          speed={0.5}
          transparent
          edgeFade={0.12}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050a18]/30 via-transparent to-[#050a18]/80"
        aria-hidden
      />

      <div className={`${sectionInnerClass} relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-28 text-center md:px-8 md:pb-24 md:pt-32`}>
        <ScrollReveal className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center" distance={20}>
          <span className={`${sectionBadgeClass} border-white/20 bg-white/10 text-white backdrop-blur-sm`}>
            {t("hero.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full border-0 bg-white px-8 text-base font-semibold text-primary shadow-lg hover:bg-white/95"
            >
              <a href="/explore-courses" className="inline-flex items-center gap-2">
                {t("hero.explorePrograms")}
                <AnimatedArrowRight size={18} className="text-primary" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-2 border-white/50 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:border-white hover:bg-white/20 hover:text-white"
            >
              <a href="#contact">{t("hero.getInTouch")}</a>
            </Button>
          </div>
        </ScrollReveal>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block" aria-hidden>
        <div className="flex flex-col items-center gap-1.5 text-white/45">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">{t("hero.scroll")}</span>
          <AnimatedChevronDown size={18} className="text-white/45" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
