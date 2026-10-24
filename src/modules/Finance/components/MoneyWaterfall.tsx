import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { formatMoney, toNumber } from "./financeFormat";

export interface WaterfallValues {
  gross: unknown;
  discount: unknown;
  net: unknown;
  paid: unknown;
  refunds?: unknown;
  cancelled?: unknown;
  writtenOff: unknown;
  receivable: unknown;
  mof?: unknown;
  other?: unknown;
  credit?: unknown;
}

interface MoneyWaterfallProps {
  values: WaterfallValues;
  currency?: string | null;
  className?: string;
  compact?: boolean;
}

/**
 * Gross → −discount → net → paid / refunds / written off / cancelled → receivable.
 * Mirrors the accounting identity used by the backend so every screen reads the same way.
 */
const MoneyWaterfall = ({ values, currency, className, compact = false }: MoneyWaterfallProps) => {
  const { t } = useTranslation();
  const refunds = toNumber(values.refunds);
  const cancelled = toNumber(values.cancelled);
  const mof = toNumber(values.mof);
  const other = toNumber(values.other);
  const credit = toNumber(values.credit);

  const rows: {
    label: string;
    value: number;
    sign?: "-" | "=";
    tone?: string;
    strong?: boolean;
    hidden?: boolean;
  }[] = [
    { label: t("fin.cards.gross"), value: toNumber(values.gross) },
    {
      label: t("fin.cards.discount"),
      value: toNumber(values.discount),
      sign: "-",
      tone: "text-info",
    },
    { label: t("fin.cards.net"), value: toNumber(values.net), sign: "=", strong: true },
    {
      label: t("fin.cards.paidToDate"),
      value: toNumber(values.paid),
      sign: "-",
      tone: "text-success",
    },
    {
      label: t("fin.cards.refunds"),
      value: refunds,
      tone: "text-muted-foreground",
      hidden: refunds <= 0,
    },
    {
      label: t("fin.cards.writtenOff"),
      value: toNumber(values.writtenOff),
      sign: "-",
      tone: "text-danger",
    },
    {
      label: t("fin.cards.cancelled"),
      value: cancelled,
      sign: "-",
      tone: "text-muted-foreground",
      hidden: cancelled <= 0,
    },
    {
      label: t("fin.cards.receivable"),
      value: toNumber(values.receivable),
      sign: "=",
      tone: "text-warning",
      strong: true,
    },
    { label: `↳ ${t("fin.cards.mof")}`, value: mof, tone: "text-auxiliary", hidden: mof <= 0 },
    { label: `↳ ${t("fin.cards.other")}`, value: other, tone: "text-info", hidden: other <= 0 },
    { label: t("fin.details.credit"), value: credit, tone: "text-info", hidden: credit <= 0 },
  ];

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {rows
        .filter((row) => !row.hidden)
        .map((row) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-3 border-b border-border px-4 last:border-b-0",
              compact ? "py-2 text-sm" : "py-2.5 text-sm",
              row.strong && "bg-muted/30"
            )}
          >
            <span
              className={cn("text-muted-foreground", row.strong && "font-medium text-foreground")}
            >
              {row.sign ? (
                <span className="me-1.5 inline-block w-3 text-center font-mono">
                  {row.sign === "-" ? "−" : "="}
                </span>
              ) : (
                <span className="me-1.5 inline-block w-3" />
              )}
              {row.label}
            </span>
            <span
              className={cn("tabular-nums", row.strong ? "font-semibold" : "font-medium", row.tone)}
            >
              {formatMoney(row.value, currency)}
            </span>
          </div>
        ))}
    </div>
  );
};

export default MoneyWaterfall;
