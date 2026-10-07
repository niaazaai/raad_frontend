import type { ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarSearch,
  Infinity as InfinityIcon,
} from "lucide-react";
import {
  DatePicker,
  DateRangePicker,
  MonthPicker,
  Tabs,
  TabsList,
  TabsTrigger,
  YearPicker,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { PeriodTab, PeriodState } from "./financeFormat";

interface FinancePeriodFilterProps {
  value: PeriodState;
  onChange: (next: PeriodState) => void;
  /** Hide the "All" tab on pages where an unbounded range makes no sense. */
  allowAll?: boolean;
  className?: string;
  idPrefix?: string;
  /** Kept for call-site compatibility; the control is always compact. */
  size?: "sm" | "default";
}

const TAB_ICONS: Record<PeriodTab, ComponentType<{ className?: string }>> = {
  today: CalendarCheck,
  daily: CalendarDays,
  monthly: CalendarRange,
  yearly: CalendarClock,
  range: CalendarSearch,
  all: InfinityIcon,
};

/**
 * Compact shadcn tab strip (default pill style, not `line`).
 * Daily / Monthly / Yearly / Date range reveal a matching date picker beside the tabs.
 */
const FinancePeriodFilter = ({
  value,
  onChange,
  allowAll = true,
  className,
  idPrefix = "finance-period",
}: FinancePeriodFilterProps) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const tabs: { value: PeriodTab; label: string }[] = [
    { value: "today", label: t("fin.period.today") },
    { value: "daily", label: t("fin.period.daily") },
    { value: "monthly", label: t("fin.period.monthly") },
    { value: "yearly", label: t("fin.period.yearly") },
    { value: "range", label: t("fin.period.range") },
    ...(allowAll ? [{ value: "all" as PeriodTab, label: t("fin.period.all") }] : []),
  ];

  const set = (patch: Partial<PeriodState>) => onChange({ ...value, ...patch });

  const reveal = {
    initial: { opacity: 0, width: 0 },
    animate: { opacity: 1, width: "auto" },
    exit: { opacity: 0, width: 0 },
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

  const pickerClassName = "h-8 gap-1.5 px-2.5 text-xs has-[>svg]:px-2";

  return (
    <Tabs
      value={value.period}
      onValueChange={(next) => set({ period: next as PeriodTab })}
      className={cn(
        "flex max-w-full min-w-0 flex-row flex-wrap items-center gap-2 data-horizontal:flex-row",
        className
      )}
    >
      <TabsList
        aria-label={t("fin.period.label")}
        className="max-w-full min-w-0 flex-wrap justify-start group-data-horizontal/tabs:h-auto sm:flex-nowrap sm:overflow-x-auto sm:group-data-horizontal/tabs:h-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.value];
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="shrink-0 flex-none">
              <Icon />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <AnimatePresence initial={false} mode="wait">
        {value.period === "daily" ? (
          <motion.div key="daily" className="overflow-hidden" transition={transition} {...reveal}>
            <DatePicker
              id={`${idPrefix}-date`}
              size="sm"
              className={pickerClassName}
              value={value.date}
              placeholder={t("fin.period.pickDate")}
              onChange={(date) => set({ date })}
            />
          </motion.div>
        ) : null}

        {value.period === "monthly" ? (
          <motion.div key="monthly" className="overflow-hidden" transition={transition} {...reveal}>
            <MonthPicker
              id={`${idPrefix}-month`}
              size="sm"
              className={pickerClassName}
              value={value.month}
              placeholder={t("fin.period.pickMonth")}
              onChange={(month) => set({ month })}
            />
          </motion.div>
        ) : null}

        {value.period === "yearly" ? (
          <motion.div key="yearly" className="overflow-hidden" transition={transition} {...reveal}>
            <YearPicker
              id={`${idPrefix}-year`}
              size="sm"
              className={pickerClassName}
              value={value.year}
              placeholder={t("fin.period.pickYear")}
              onChange={(year) => set({ year })}
            />
          </motion.div>
        ) : null}

        {value.period === "range" ? (
          <motion.div key="range" className="overflow-hidden" transition={transition} {...reveal}>
            <DateRangePicker
              id={`${idPrefix}-range`}
              size="sm"
              className={pickerClassName}
              value={{ from: value.from, to: value.to }}
              placeholder={t("fin.period.pickRange")}
              onChange={({ from, to }) => set({ from, to })}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Tabs>
  );
};

export default FinancePeriodFilter;
