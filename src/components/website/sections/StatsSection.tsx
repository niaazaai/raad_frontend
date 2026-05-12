import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 5000, suffix: "+", label: "Students Enrolled" },
  { value: 80, suffix: "+", label: "Professional Programs" },
  { value: 12, suffix: "+", label: "Years of Excellence" },
  { value: 95, suffix: "%", label: "Graduate Employment" },
];

const StatsSection = () => {
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
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: span,
              start: "top 88%",
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
        tweens.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
      };
    },
    { scope: containerRef, dependencies: [] },
  );

  return (
    <section className="bg-[#050a18] py-16">
      {/* Gradient band */}
      <div className="bg-gradient-to-r from-primary/20 via-[#050a18] to-auxiliary/20">
        <div ref={containerRef} className="mx-auto max-w-6xl px-4 py-14 md:px-8">
          <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="relative flex flex-col items-center text-center">
                {/* Vertical divider — shown between items on md+ */}
                {index < stats.length - 1 && (
                  <span
                    className="absolute right-0 top-1/2 hidden h-14 w-px -translate-y-1/2 bg-white/[0.12] md:block"
                    aria-hidden
                  />
                )}

                {/* Number + suffix */}
                <div className="flex items-end leading-none">
                  <span
                    className="text-5xl font-bold text-white tabular-nums"
                    data-counter-value={stat.value}
                  >
                    0
                  </span>
                  <span className="mb-1 ml-0.5 text-3xl font-bold text-primary">
                    {stat.suffix}
                  </span>
                </div>

                {/* Label */}
                <p className="mt-2.5 text-sm font-medium text-white/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
