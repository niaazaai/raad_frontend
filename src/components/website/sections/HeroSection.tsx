import PixelBlast from "@/components/ui/pixel-blast";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { useIsDarkMode } from "@/hooks";
import ScrollReveal from "@/components/website/ScrollReveal";
import { AnimatedArrowRight, AnimatedChevronDown } from "@/components/icons/animated";
import { cn } from "@/lib/utils";
import { sectionInnerClass } from "@/components/website/websiteData";

const HeroSection = () => {
  const { t } = useTranslation();
  const isDark = useIsDarkMode();

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Base layer — theme-aware */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-500",
          isDark ? "bg-[#050a18]" : "bg-gradient-to-br from-primary/[0.12] via-background to-auxiliary/[0.08]",
        )}
        aria-hidden
      />

      {/* Animated pixels */}
      <div
        className={cn("absolute inset-0 transition-opacity duration-500", isDark ? "opacity-90" : "opacity-45")}
        aria-hidden
      >
        <PixelBlast
          variant="diamond"
          pixelSize={3}
          color={isDark ? "#0960f0" : "#0069B4"}
          patternScale={3}
          patternDensity={isDark ? 2 : 1.6}
          enableRipples
          rippleSpeed={0.25}
          rippleThickness={0.21}
          rippleIntensityScale={1}
          speed={0.5}
          transparent
          edgeFade={0.12}
        />
      </div>

      {/* Overlay gradient */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          isDark
            ? "bg-gradient-to-b from-[#050a18]/30 via-transparent to-[#050a18]/80"
            : "bg-gradient-to-b from-background/20 via-transparent to-background/70",
        )}
        aria-hidden
      />

      <div
        className={`${sectionInnerClass} relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-28 text-center md:px-8 md:pb-24 md:pt-32`}
      >
        <ScrollReveal className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center" distance={20}>
          <span
            className={cn(
              "mb-4 inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-md transition-colors duration-500",
              isDark
                ? "border-white/20 bg-white/10 text-white"
                : "border-primary/25 bg-white/60 text-primary shadow-sm",
            )}
          >
            {t("hero.badge")}
          </span>

          <h1
            className={cn(
              "text-4xl font-bold leading-[1.08] tracking-tight transition-colors duration-500 sm:text-5xl md:text-6xl lg:text-7xl",
              isDark ? "text-white" : "text-foreground",
            )}
          >
            {t("hero.title")}
          </h1>

          <p
            className={cn(
              "mx-auto mt-6 max-w-2xl text-base leading-relaxed transition-colors duration-500 md:text-lg",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className={cn(
                "h-12 rounded-full px-8 text-base font-semibold shadow-lg transition-all duration-500",
                isDark
                  ? "border-0 bg-white text-primary hover:bg-white/95"
                  : "bg-primary text-primary-foreground hover:bg-primary-active",
              )}
            >
              <a href="/explore-courses" className="inline-flex items-center gap-2">
                {t("hero.explorePrograms")}
                <AnimatedArrowRight size={18} className={isDark ? "text-primary" : "text-primary-foreground"} />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                "h-12 rounded-full px-8 text-base font-semibold backdrop-blur-md transition-all duration-500",
                isDark
                  ? "border-2 border-white/50 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white"
                  : "border-primary/30 bg-white/50 text-primary hover:border-primary/50 hover:bg-white/70",
              )}
            >
              <a href="#contact">{t("hero.getInTouch")}</a>
            </Button>
          </div>
        </ScrollReveal>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block" aria-hidden>
        <div
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors duration-500",
            isDark ? "text-white/45" : "text-primary/50",
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">{t("hero.scroll")}</span>
          <AnimatedChevronDown size={18} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
