import { useEffect, useRef, useState } from "react";
import { ThinkingOrb, type OrbSize, type OrbTheme } from "thinking-orbs";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

interface OrbMetrics {
  size: OrbSize;
  color?: string;
  theme: OrbTheme;
}

type Rgb = [number, number, number];

let colorProbe: CanvasRenderingContext2D | null = null;

/** Resolves any computed CSS color (rgb, hex, color-mix, …) to RGB channels via the canvas parser. */
const toRgb = (cssColor: string): Rgb | null => {
  colorProbe ??= document.createElement("canvas").getContext("2d");
  if (!colorProbe) return null;
  colorProbe.fillStyle = "#000000";
  colorProbe.fillStyle = cssColor;
  const normalized = String(colorProbe.fillStyle);
  const hex = normalized.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as Rgb;
  const channels = normalized.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  return channels ? [Number(channels[1]), Number(channels[2]), Number(channels[3])] : null;
};

const luminance = ([r, g, b]: Rgb): number => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const mix = (rgb: Rgb, target: number, amount: number): string => {
  const [r, g, b] = rgb.map((c) => Math.round(c + (target - c) * amount));
  return `rgb(${r}, ${g}, ${b})`;
};

const presetFor = (px: number): OrbSize => (px <= 24 ? 20 : px <= 44 ? 32 : 64);

const isDarkContext = (el: Element): boolean => el.closest(".dark, [data-theme='dark']") !== null;

const resolveMetrics = (el: HTMLElement): OrbMetrics => {
  const { width, height } = el.getBoundingClientRect();
  const size = presetFor(Math.min(width, height) || 16);
  const rgb = toRgb(getComputedStyle(el).color);
  if (!rgb) return { size, theme: "auto" };

  // Light ink (white on primary buttons / video) needs the dark substrate ramp to stay visible.
  if (luminance(rgb) > 0.7) return { size, color: `rgb(${rgb.join(", ")})`, theme: "dark" };

  // Brand tint: lift it on dark surfaces, deepen it slightly on light ones so the far side of the sash keeps contrast.
  return isDarkContext(el)
    ? { size, color: mix(rgb, 255, 0.28), theme: "dark" }
    : { size, color: mix(rgb, 0, 0.12), theme: "light" };
};

/**
 * Loading indicator: the "composing" thinking orb, tinted with the inherited text color
 * (`text-primary`, `text-white`, button foreground, …) and sized by the wrapper's
 * `h-*` / `w-*` classes.
 */
export function Spinner({ className }: SpinnerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [metrics, setMetrics] = useState<OrbMetrics>({ size: 20, theme: "auto" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const next = resolveMetrics(el);
      setMetrics((prev) =>
        prev.size === next.size && prev.color === next.color && prev.theme === next.theme
          ? prev
          : next
      );
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    const themeObserver = new MutationObserver(measure);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  const isPageScale = metrics.size === 64;

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center", className)}
    >
      <ThinkingOrb
        state="composing"
        size={metrics.size}
        color={metrics.color}
        theme={metrics.theme}
        dots={isPageScale ? 1.2 : 1}
        dotSize={metrics.size === 20 ? 1.25 : isPageScale ? 1.2 : 1.1}
        aria-hidden
        className="h-full! w-full!"
      />
    </span>
  );
}
