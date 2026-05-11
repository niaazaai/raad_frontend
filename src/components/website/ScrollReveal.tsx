import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /**
   * Delay before animation. Treated as **milliseconds** when ≥ 1, and as
   * **seconds** when < 1 (legacy compat — old callers pass e.g. delay={0.1}).
   * Default 0.
   */
  delay?: number;
  /** Direction from which children animate in (default "up") */
  direction?: "up" | "down" | "left" | "right" | "scale";
  /** Animation duration in seconds (default 0.7) */
  duration?: number;
  /** Travel distance in px (default 40) */
  distance?: number;
  /** Animate only once (default true) */
  once?: boolean;
  /** ScrollTrigger start value (default "top 82%") */
  threshold?: string;

  // ── Legacy / compatibility props (kept for existing consumers) ──────────
  /** @deprecated Use `direction` + `distance` instead. Override from-state. */
  from?: gsap.TweenVars;
  /** @deprecated Ignored — to-state is always the element's natural position. */
  to?: gsap.TweenVars;
  /**
   * @deprecated Replaced by per-child stagger that is always active.
   * When true, stagger delay is taken from the `stagger` prop.
   */
  staggerChildren?: boolean;
  /** @deprecated Per-child stagger seconds (default 0.1). */
  stagger?: number;
  /** @deprecated Replaced by `threshold`. ScrollTrigger start string. */
  start?: string;
  /** @deprecated Ignored — use `delay` in milliseconds on the new API. */
  ease?: string;
}

const ScrollReveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.7,
  distance = 40,
  once = true,
  threshold,
  // legacy
  from,
  staggerChildren: _staggerChildren,
  stagger = 0.1,
  start,
}: ScrollRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve ScrollTrigger start — prefer new prop, fall back to legacy, then default.
  const triggerStart = threshold ?? start ?? "top 82%";

  // Normalise delay: values < 1 are treated as seconds (legacy), ≥ 1 as ms (new).
  const delaySeconds = delay < 1 ? delay : delay / 1000;

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = Array.from(container.children) as HTMLElement[];
      if (!targets.length) return;

      // Build fromVars: use explicit `from` override, otherwise derive from direction.
      const fromVars: gsap.TweenVars = from ?? {
        opacity: 0,
        ...(direction === "up" && { y: distance }),
        ...(direction === "down" && { y: -distance }),
        ...(direction === "left" && { x: distance }),
        ...(direction === "right" && { x: -distance }),
        ...(direction === "scale" && { scale: 0.88, y: distance * 0.5 }),
      };

      const tweens = targets.map((target, i) =>
        gsap.fromTo(target, fromVars, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          delay: delaySeconds + i * stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: target,
            start: triggerStart,
            once,
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
            fastScrollEnd: true,
          },
        }),
      );

      return () => {
        tweens.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
      };
    },
    {
      scope: containerRef,
      dependencies: [direction, duration, distance, delaySeconds, once, triggerStart, stagger],
    },
  );

  return (
    <div ref={containerRef} className={cn(className)}>
      {children}
    </div>
  );
};

export default ScrollReveal;
