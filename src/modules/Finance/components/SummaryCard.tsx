import type { ReactNode } from "react";
import { ChevronRight as NavArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { formatMoney } from "./financeFormat";

export type SummaryTone = "default" | "success" | "warning" | "danger" | "info" | "auxiliary";

const THEMES: Record<SummaryTone, { border: string; bg: string; icon: string; value: string }> = {
  default: {
    border: "border-border",
    bg: "from-muted/40 via-card to-card",
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
  success: {
    border: "border-success/20",
    bg: "from-success/8 via-card to-card",
    icon: "bg-success/15 text-success",
    value: "text-success",
  },
  warning: {
    border: "border-warning/20",
    bg: "from-warning/8 via-card to-card",
    icon: "bg-warning/15 text-warning",
    value: "text-warning",
  },
  danger: {
    border: "border-danger/20",
    bg: "from-danger/8 via-card to-card",
    icon: "bg-danger/15 text-danger",
    value: "text-danger",
  },
  info: {
    border: "border-info/20",
    bg: "from-info/8 via-card to-card",
    icon: "bg-info/15 text-info",
    value: "text-info",
  },
  auxiliary: {
    border: "border-auxiliary/20",
    bg: "from-auxiliary/8 via-card to-card",
    icon: "bg-auxiliary/15 text-auxiliary",
    value: "text-auxiliary",
  },
};

export interface SummaryCardPart {
  label: string;
  value: number;
}

interface SummaryCardProps {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  tone?: SummaryTone;
  /** Small sub-values under the main number (e.g. Students / MOF / Other). */
  parts?: SummaryCardPart[];
  footnote?: string;
  onClick?: () => void;
  loading?: boolean;
}

/** Finance KPI tile. Clicking it opens the breakdown of the amount. */
const SummaryCard = ({
  label,
  value,
  hint,
  icon,
  tone = "default",
  parts,
  footnote,
  onClick,
  loading,
}: SummaryCardProps) => {
  const { t } = useTranslation();
  const theme = THEMES[tone];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={cn(
            "group relative w-full rounded-xl border bg-gradient-to-br p-3 text-start outline-none transition sm:p-4",
            "hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:translate-y-0",
            theme.border,
            theme.bg
          )}
        >
          <div className={cn("absolute end-3 top-3 rounded-lg p-2", theme.icon)}>{icon}</div>
          <p className="pe-11 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
              theme.value,
              loading && "opacity-50"
            )}
          >
            {formatMoney(value)}
          </p>
          {parts && parts.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {parts.map((part) => (
                <span key={part.label} className="whitespace-nowrap">
                  {part.label}:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatMoney(part.value)}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
          {footnote ? <p className="mt-1.5 text-xs text-muted-foreground">{footnote}</p> : null}
          {onClick ? (
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-70 transition group-hover:opacity-100">
              {t("fin.clickForBreakdown")}
              <NavArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
};

export default SummaryCard;
