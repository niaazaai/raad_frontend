import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { formatMoney, toNumber } from "./financeFormat";

export interface WaterfallValues {
  gross: unknown;
  discount: unknown;
  net: unknown;
  /** Net cash retained: payments − refunds (EnrollmentBalance.paid). */
  paid: unknown;
  refunds?: unknown;
  cancelled?: unknown;
  writtenOff: unknown;
  /** Total open balance before student/MOF/other split. */
  receivable: unknown;
  mof?: unknown;
  other?: unknown;
  credit?: unknown;
  /** When set, used for the Receivable row instead of receivable − mof − other. */
  studentReceivable?: unknown;
}

interface MoneyWaterfallProps {
  values: WaterfallValues;
  currency?: string | null;
  className?: string;
  compact?: boolean;
  /** Receipt-slip look: dotted row rules, no card chrome. */
  variant?: "card" | "receipt";
}

/**
 * Same identity as EnrollmentBalance / invoice math:
 *   gross − discount = net
 *   net − paid − refunds − writtenOff − cancelled = receivable
 *   paid = payments − refunds
 * Receivable row is student debt only; MOF / other / credit are separate.
 */
const MoneyWaterfall = ({
  values,
  currency,
  className,
  compact = false,
  variant = "card",
}: MoneyWaterfallProps) => {
  const { t } = useTranslation();
  const receipt = variant === "receipt";
  const refunds = toNumber(values.refunds);
  const cancelled = toNumber(values.cancelled);
  const mof = toNumber(values.mof);
  const other = toNumber(values.other);
  const credit = toNumber(values.credit);
  const studentReceivable =
    values.studentReceivable != null
      ? Math.max(0, toNumber(values.studentReceivable))
      : Math.max(0, Math.round((toNumber(values.receivable) - mof - other) * 100) / 100);

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
      sign: "-",
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
      value: studentReceivable,
      sign: mof + other > 0.009 ? undefined : "=",
      tone: "text-warning",
      strong: true,
    },
    { label: t("fin.cards.mof"), value: mof, tone: "text-auxiliary", hidden: mof <= 0 },
    { label: t("fin.cards.other"), value: other, tone: "text-info", hidden: other <= 0 },
    { label: t("fin.details.credit"), value: credit, tone: "text-info", hidden: credit <= 0 },
  ];

  const visible = rows.filter((row) => !row.hidden);

  return (
    <div
      className={cn(
        receipt ? "bg-transparent" : "rounded-lg border border-border bg-card",
        className
      )}
    >
      {visible.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            "flex items-center justify-between gap-3",
            compact ? "py-2 text-sm" : "py-2.5 text-sm",
            receipt
              ? cn(
                  // ~15% bolder than the default 1px dotted rule
                  "border-b-[1.15px] border-dotted border-foreground/45 px-0.5",
                  index === visible.length - 1 && "border-b-0",
                  row.strong && "pt-2"
                )
              : cn("border-b border-border px-4 last:border-b-0", row.strong && "bg-muted/30")
          )}
        >
          <span
            className={cn(
              "text-muted-foreground",
              row.strong && "font-medium text-foreground",
              receipt && row.strong && "tracking-tight"
            )}
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
            className={cn(
              "tabular-nums",
              row.strong ? "font-semibold" : "font-medium",
              row.tone
            )}
          >
            {formatMoney(row.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MoneyWaterfall;
