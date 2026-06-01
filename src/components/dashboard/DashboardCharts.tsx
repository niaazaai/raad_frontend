import { cn } from "@/lib/utils";
import type { DashboardChartPoint, DashboardSparkPoint } from "@/hooks/useDashboardStats";

function buildLinePath(
  points: { value: number }[],
  width: number,
  height: number,
  padding = 4
): string {
  if (points.length === 0) return "";
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return points
    .map((p, i) => {
      const x = padding + (i / Math.max(points.length - 1, 1)) * innerW;
      const y = padding + innerH - ((p.value - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  data,
  className,
  width = 120,
  height = 40,
}: {
  data: DashboardSparkPoint[];
  className?: string;
  width?: number;
  height?: number;
}) {
  const path = buildLinePath(data, width, height);
  const areaPath = path
    ? `${path} L${width - 4},${height - 4} L4,${height - 4} Z`
    : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("text-primary", className)}
      aria-hidden
    >
      {areaPath && (
        <path d={areaPath} fill="currentColor" fillOpacity={0.12} stroke="none" />
      )}
      {path && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function AnalyticsLineChart({
  title,
  subtitle,
  data,
  valuePrefix = "",
  valueSuffix = "",
  colorClass = "text-primary",
}: {
  title: string;
  subtitle?: string;
  data: DashboardChartPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
  colorClass?: string;
}) {
  const width = 560;
  const height = 200;
  const padding = { top: 16, right: 16, bottom: 36, left: 16 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);

  const path = data
    .map((point, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = padding.top + innerH - (point.value / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = path
    ? `${path} L${padding.left + innerW},${padding.top + innerH} L${padding.left},${padding.top + innerH} Z`
    : "";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
          {areaPath && (
            <path d={areaPath} className={colorClass} fill="currentColor" fillOpacity={0.1} />
          )}
          {path && (
            <path
              d={path}
              className={colorClass}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {data.map((point, i) => {
            const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
            const y = padding.top + innerH - (point.value / max) * innerH;
            const showLabel = i === 0 || i === data.length - 1 || i % 2 === 0;
            return (
              <g key={point.month}>
                <circle cx={x} cy={y} r={3.5} className={colorClass} fill="currentColor" />
                {showLabel && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {point.label.split(" ")[0]}
                  </text>
                )}
                <title>
                  {point.label}: {valuePrefix}
                  {point.value.toLocaleString()}
                  {valueSuffix}
                </title>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
