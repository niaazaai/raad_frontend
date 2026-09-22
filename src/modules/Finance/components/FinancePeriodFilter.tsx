import { Button, Input, Label } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { FinancePeriod } from "../data/models/FinanceReport";
import type { PeriodState } from "./financeFormat";

interface FinancePeriodFilterProps {
  value: PeriodState;
  onChange: (next: PeriodState) => void;
  /** Hide the "All" tab on pages where an unbounded range makes no sense. */
  allowAll?: boolean;
  className?: string;
  idPrefix?: string;
}

const FinancePeriodFilter = ({
  value,
  onChange,
  allowAll = true,
  className,
  idPrefix = "finance-period",
}: FinancePeriodFilterProps) => {
  const { t } = useTranslation();

  const tabs: { value: FinancePeriod; label: string }[] = [
    { value: "daily", label: t("finance.periodDaily") },
    { value: "monthly", label: t("finance.periodMonthly") },
    { value: "yearly", label: t("finance.periodYearly") },
    { value: "range", label: t("finance.periodRange") },
    ...(allowAll ? [{ value: "all" as FinancePeriod, label: t("finance.periodAll") }] : []),
  ];

  const set = (patch: Partial<PeriodState>) => onChange({ ...value, ...patch });

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div
        className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1"
        role="tablist"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            role="tab"
            aria-selected={value.period === tab.value}
            variant={value.period === tab.value ? "default" : "ghost"}
            onClick={() => set({ period: tab.value })}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {value.period === "daily" ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-date`} className="text-xs text-muted-foreground">
            {t("finance.date")}
          </Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            className="h-9 w-auto"
            value={value.date}
            onChange={(e) => e.target.value && set({ date: e.target.value })}
          />
        </div>
      ) : null}

      {value.period === "monthly" ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-month`} className="text-xs text-muted-foreground">
            {t("finance.month")}
          </Label>
          <Input
            id={`${idPrefix}-month`}
            type="month"
            className="h-9 w-auto"
            value={value.month}
            onChange={(e) => e.target.value && set({ month: e.target.value })}
          />
        </div>
      ) : null}

      {value.period === "yearly" ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-year`} className="text-xs text-muted-foreground">
            {t("finance.year")}
          </Label>
          <Input
            id={`${idPrefix}-year`}
            type="number"
            min={2000}
            max={2100}
            className="h-9 w-28"
            value={value.year}
            onChange={(e) => set({ year: e.target.value })}
          />
        </div>
      ) : null}

      {value.period === "range" ? (
        <>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-from`} className="text-xs text-muted-foreground">
              {t("finance.from")}
            </Label>
            <Input
              id={`${idPrefix}-from`}
              type="date"
              className="h-9 w-auto"
              value={value.from}
              onChange={(e) => e.target.value && set({ from: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-to`} className="text-xs text-muted-foreground">
              {t("finance.to")}
            </Label>
            <Input
              id={`${idPrefix}-to`}
              type="date"
              className="h-9 w-auto"
              value={value.to}
              onChange={(e) => e.target.value && set({ to: e.target.value })}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default FinancePeriodFilter;
