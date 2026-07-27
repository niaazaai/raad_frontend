import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  duration?: number;
  distance?: number;
  once?: boolean;
  threshold?: string;
  from?: gsap.TweenVars;
  staggerChildren?: boolean;
  stagger?: number;
  start?: string;
  ease?: string;
  to?: gsap.TweenVars;
}

const ScrollReveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.55,
  distance = 28,
  once = true,
  threshold,
  from,
  stagger = 0.08,
  start,
}: ScrollRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerStart = threshold ?? start ?? "top 88%";
  const delaySeconds = delay < 1 ? delay : delay / 1000;

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = Array.from(container.children) as HTMLElement[];
      if (!targets.length) return;

      const fromVars: gsap.TweenVars = from ?? {
        opacity: 0,
        ...(direction === "up" && { y: distance }),
        ...(direction === "down" && { y: -distance }),
        ...(direction === "left" && { x: distance }),
        ...(direction === "right" && { x: -distance }),
        ...(direction === "scale" && { scale: 0.96, y: distance * 0.4 }),
      };

      const toVars: gsap.TweenVars = {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration,
        delay: delaySeconds,
        stagger,
        ease: "power2.out",
        overwrite: "auto",
      };

      gsap.set(targets, fromVars);

      const tween = gsap.to(targets, {
        ...toVars,
        scrollTrigger: {
          trigger: container,
          start: triggerStart,
          once,
          toggleActions: once ? "play none none none" : "play none none reverse",
          invalidateOnRefresh: true,
        },
      });

      // Ensure above-the-fold content reveals after Lenis/layout settles
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const st = tween.scrollTrigger;
        if (st && st.progress > 0 && tween.progress() === 0) {
          tween.progress(1);
        }
      });

      // Safety: never leave content invisible if ScrollTrigger missed
      const safety = window.setTimeout(() => {
        const stillHidden = targets.some((el) => Number(gsap.getProperty(el, "opacity")) < 0.05);
        if (stillHidden) {
          gsap.set(targets, { opacity: 1, x: 0, y: 0, scale: 1 });
        }
      }, 900);

      return () => {
        window.clearTimeout(safety);
        tween.scrollTrigger?.kill();
        tween.kill();
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
