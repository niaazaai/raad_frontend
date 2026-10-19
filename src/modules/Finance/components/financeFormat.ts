import { endOfIsoMonth, localIsoDate } from "@/lib/date";
import type { DataTableExportQuery } from "@/lib/exportSpreadsheet";
import type {
  FinancePeriod,
  FinancialTransactionFilter,
  TransactionPayer,
} from "../data/models/FinanceReport";

export { localIsoDate };

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: unknown, currency?: string | null): string {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function openPdf(url?: string | null): void {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * UI-only tab set. `today` is not a backend period: it is sent as `daily` with the current
 * local date, so the API contract (`daily|monthly|yearly|range|all`) stays unchanged.
 */
export type PeriodTab = FinancePeriod | "today";

export interface PeriodState {
  period: PeriodTab;
  date: string;
  month: string;
  year: string;
  from: string;
  to: string;
}

export function defaultPeriodState(period: PeriodTab = "today"): PeriodState {
  const today = localIsoDate();
  return {
    period,
    date: today,
    month: today.slice(0, 7),
    year: today.slice(0, 4),
    from: `${today.slice(0, 7)}-01`,
    to: today,
  };
}

/** Every filter on the transactions page, applied together. */
export interface TransactionFilterState {
  period: PeriodState;
  filter: FinancialTransactionFilter | "";
  payer: TransactionPayer | "";
}

export function defaultTransactionFilters(): TransactionFilterState {
  return { period: defaultPeriodState("all"), filter: "", payer: "" };
}

/** How many filters the user moved away from the default (all time / all types / all payers). */
export function countActiveTransactionFilters(value: TransactionFilterState): number {
  return (value.period.period === "all" ? 0 : 1) + (value.filter ? 1 : 0) + (value.payer ? 1 : 0);
}

export interface PeriodQuery {
  period: FinancePeriod;
  date?: string;
  month?: string;
  year?: number;
  from?: string;
  to?: string;
}

/** Params understood by /finance/report and /finance/report/breakdown. */
export function periodParams(state: PeriodState): PeriodQuery {
  switch (state.period) {
    case "today":
      return { period: "daily", date: localIsoDate() };
    case "daily":
      return { period: "daily", date: state.date };
    case "yearly":
      return { period: "yearly", year: Number(state.year) || new Date().getFullYear() };
    case "range":
      return { period: "range", from: state.from, to: state.to };
    case "all":
      return { period: "all" };
    default:
      return { period: "monthly", month: state.month };
  }
}

/** Report/breakdown period params for the date range chosen in the Excel export drawer. */
export function exportPeriodParams(query: DataTableExportQuery): PeriodQuery {
  return query.allTime || !query.from || !query.to
    ? { period: "all" }
    : { period: "range", from: query.from, to: query.to };
}

/** from/to (inclusive) for endpoints that take a plain date range; null means all time. */
export function periodRange(state: PeriodState): { from: string; to: string } | null {
  switch (state.period) {
    case "today": {
      const today = localIsoDate();
      return { from: today, to: today };
    }
    case "daily":
      return { from: state.date, to: state.date };
    case "yearly": {
      const year = Number(state.year) || new Date().getFullYear();
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
    case "range":
      return state.from <= state.to
        ? { from: state.from, to: state.to }
        : { from: state.to, to: state.from };
    case "all":
      return null;
    default:
      return { from: `${state.month}-01`, to: endOfIsoMonth(state.month) };
  }
}
