import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  partial: "bg-info/10 text-info",
  mof_pending: "bg-auxiliary/10 text-auxiliary",
  other_party: "bg-info/10 text-info",
  free: "bg-success/10 text-success",
  written_off: "bg-danger/10 text-danger",
  withdrawn: "bg-muted text-muted-foreground",
  moved: "bg-muted text-muted-foreground",
  // transaction types
  payment: "bg-success/10 text-success",
  refund: "bg-danger/10 text-danger",
  receivable: "bg-warning/10 text-warning",
  mof_receivable: "bg-auxiliary/10 text-auxiliary",
  other_receivable: "bg-info/10 text-info",
  irrecoverable: "bg-danger/10 text-danger",
  irrecoverable_reversal: "bg-success/10 text-success",
  fee_cancellation: "bg-muted text-muted-foreground",
  recovery: "bg-success/10 text-success",
};

const KNOWN_STATUSES = [
  "pending",
  "paid",
  "partial",
  "mof_pending",
  "other_party",
  "free",
  "written_off",
  "withdrawn",
  "moved",
];
const KNOWN_TYPES = [
  "payment",
  "refund",
  "receivable",
  "mof_receivable",
  "other_receivable",
  "irrecoverable",
  "irrecoverable_reversal",
  "fee_cancellation",
  "recovery",
];

interface FinanceStatusBadgeProps {
  value?: string | null;
  /** "status" = enrollment payment status, "type" = ledger transaction type */
  kind?: "status" | "type";
  fallbackLabel?: string | null;
  className?: string;
}

const FinanceStatusBadge = ({
  value,
  kind = "status",
  fallbackLabel,
  className,
}: FinanceStatusBadgeProps) => {
  const { t } = useTranslation();
  const raw = String(value ?? "");
  const known = kind === "status" ? KNOWN_STATUSES : KNOWN_TYPES;
  const label = known.includes(raw)
    ? t(`fin.${kind === "status" ? "status" : "txType"}.${raw}` as TranslationKey)
    : fallbackLabel || raw || "—";

  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_COLORS[raw] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
};

export default FinanceStatusBadge;
