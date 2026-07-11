import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { usePublicStats } from "@/hooks";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Spinner } from "@/components/ui/spinner";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionTitleClass,
} from "@/components/website/websiteData";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface StatConfig {
  key: "students_enrolled" | "programs_count" | "courses_conducted" | "years_of_excellence" | "graduate_employment_percent";
  labelKey: "stats.studentsEnrolled" | "stats.programs" | "stats.coursesConducted" | "stats.yearsOfExcellence" | "stats.graduateEmployment";
  icon: LucideIcon;
  suffix?: string;
  fallback: number;
}

const STAT_CONFIG: StatConfig[] = [
  { key: "students_enrolled", labelKey: "stats.studentsEnrolled", icon: Users, suffix: "+", fallback: 5000 },
  { key: "programs_count", labelKey: "stats.programs", icon: BookOpen, suffix: "+", fallback: 80 },
  { key: "courses_conducted", labelKey: "stats.coursesConducted", icon: GraduationCap, suffix: "+", fallback: 120 },
  { key: "years_of_excellence", labelKey: "stats.yearsOfExcellence", icon: Calendar, suffix: "+", fallback: 12 },
  { key: "graduate_employment_percent", labelKey: "stats.graduateEmployment", icon: TrendingUp, suffix: "%", fallback: 95 },
];

const StatsSection = () => {
  const { t } = useTranslation();
  const { data: statsResponse, isLoading } = usePublicStats();
  const stats = statsResponse?.data;
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const counterEls = el.querySelectorAll<HTMLSpanElement>("[data-counter-value]");
      const tweens: gsap.core.Tween[] = [];

      counterEls.forEach((span) => {
        const target = Number(span.dataset.counterValue ?? 0);
        const obj = { val: 0 };

        tweens.push(
          gsap.to(obj, {
            val: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
            onUpdate() {
              span.textContent = Math.round(obj.val).toLocaleString();
            },
            onComplete() {
              span.textContent = target.toLocaleString();
            },
          }),
        );
      });

      return () => {
        tweens.forEach((tw) => {
          tw.scrollTrigger?.kill();
          tw.kill();
        });
      };
    },
    { scope: containerRef, dependencies: [stats] },
  );

  return (
    <section className={`${sectionShellClass} ${sectionSurface.primary}`}>
      <div className={`${sectionInnerClass} relative`}>
        <ScrollReveal className="mb-10 flex flex-col items-center text-center md:mb-12">
          <span className={sectionBadgeClass}>Raad</span>
          <h2 className={`${sectionTitleClass} mt-3`}>{t("stats.title")}</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : (
          <div
            ref={containerRef}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5"
          >
            {STAT_CONFIG.map(({ key, labelKey, icon: Icon, suffix, fallback }) => {
              const value = stats?.[key] ?? fallback;
              return (
                <article
                  key={key}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm transition hover:border-primary/30 hover:bg-card md:p-6"
                >
                  <div
                    className="pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition group-hover:bg-primary/10"
                    aria-hidden
                  />
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="flex items-end leading-none">
                    <span className="text-3xl font-bold tabular-nums text-foreground md:text-4xl" data-counter-value={value}>
                      0
                    </span>
                    {suffix ? (
                      <span className="mb-1 ms-0.5 text-xl font-bold text-primary md:text-2xl">{suffix}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-medium text-muted-foreground md:text-sm">{t(labelKey)}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsSection;
