import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Pie,
  PieChart,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { DashboardChartPoint } from "@/hooks/useDashboardStats";

export function Sparkline({
  data,
  className,
  width = 120,
  height = 40,
}: {
  data: { value: number }[];
  className?: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;
  const values = data.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const path = data
    .map((p, i) => {
      const x = padding + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = padding + innerH - ((p.value - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPath = `${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("text-primary", className)} aria-hidden>
      <path d={areaPath} fill="currentColor" fillOpacity={0.12} stroke="none" />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const inkBarConfig = {
  value: {
    label: "Amount",
    theme: { light: "#0a0a0a", dark: "#f4f4f5" },
  },
} satisfies ChartConfig;

const serviceIncomeCostConfig = {
  income: {
    label: "Income",
    theme: { light: "#0a0a0a", dark: "#f4f4f5" },
  },
  cost: {
    label: "Service cost",
    theme: { light: "#71717a", dark: "#a1a1aa" },
  },
} satisfies ChartConfig;

export function EarningsBarChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: DashboardChartPoint[];
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {data.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-muted-foreground">
          No data yet
        </p>
      ) : (
        <ChartContainer config={inkBarConfig} className="aspect-[4/3] w-full flex-1">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              fontSize={11}
              className="fill-muted-foreground"
              tickFormatter={(v) =>
                typeof v === "number" && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

export function ServiceIncomeCostBarChart({
  title,
  subtitle,
  income,
  cost,
}: {
  title: string;
  subtitle?: string;
  income: DashboardChartPoint[];
  cost: DashboardChartPoint[];
}) {
  const costByMonth = new Map(cost.map((p) => [p.month, p.value]));
  const chartData = income.map((p) => ({
    month: p.month,
    label: p.label,
    income: p.value,
    cost: costByMonth.get(p.month) ?? 0,
  }));

  const data =
    chartData.length > 0
      ? chartData
      : cost.map((p) => ({
          month: p.month,
          label: p.label,
          income: 0,
          cost: p.value,
        }));

  const hasData = data.some((d) => d.income > 0 || d.cost > 0);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {!hasData ? (
        <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-muted-foreground">
          No data yet
        </p>
      ) : (
        <ChartContainer config={serviceIncomeCostConfig} className="aspect-[4/3] w-full flex-1">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              fontSize={11}
              className="fill-muted-foreground"
              tickFormatter={(v) =>
                typeof v === "number" && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

export function EnrolmentsPieChart({
  title,
  subtitle,
  enrollments,
  registrations,
}: {
  title: string;
  subtitle?: string;
  enrollments: DashboardChartPoint[];
  registrations: DashboardChartPoint[];
}) {
  const enrollmentTotal = enrollments.reduce((sum, p) => sum + p.value, 0);
  const registrationTotal = registrations.reduce((sum, p) => sum + p.value, 0);
  const chartData = [
    {
      key: "enrollments",
      name: "Enrolments",
      value: enrollmentTotal,
      fill: "var(--color-enrollments)",
    },
    {
      key: "registrations",
      name: "Registrations",
      value: registrationTotal,
      fill: "var(--color-registrations)",
    },
  ].filter((d) => d.value > 0);

  const chartConfig = {
    enrollments: {
      label: "Enrolments",
      theme: { light: "#0069B4", dark: "#5eb0e8" },
    },
    registrations: {
      label: "Registrations",
      theme: { light: "#9B3D9A", dark: "#d084cf" },
    },
  } satisfies ChartConfig;

  const total = enrollmentTotal + registrationTotal;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-muted-foreground">
          No data yet
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-square w-full flex-1">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="key"
              innerRadius="48%"
              outerRadius="82%"
              stroke="var(--card)"
              strokeWidth={2}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                className="fill-card text-xs font-medium"
                stroke="none"
                formatter={(value: number) => value.toLocaleString()}
              />
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-muted-foreground text-xs"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="key" />} />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  );
}

export function ClassesStatusRadial({
  title,
  subtitle,
  active,
  completed,
}: {
  title: string;
  subtitle?: string;
  active: number;
  completed: number;
}) {
  const chartData = [{ name: "classes", active, completed }];
  const total = active + completed;

  const safeConfig = {
    active: {
      label: "Active",
      theme: { light: "#16a34a", dark: "#4ade80" },
    },
    completed: {
      label: "Completed",
      theme: { light: "#0a0a0a", dark: "#f4f4f5" },
    },
  } satisfies ChartConfig;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-muted-foreground">
          No data yet
        </p>
      ) : (
        <ChartContainer config={safeConfig} className="aspect-square w-full flex-1">
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius="42%"
            outerRadius="88%"
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 6}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 14}
                          className="fill-muted-foreground text-xs"
                        >
                          Classes
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="active"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-active)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="completed"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-completed)"
              className="stroke-transparent stroke-2"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadialBarChart>
        </ChartContainer>
      )}
    </div>
  );
}
