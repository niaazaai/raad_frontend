import type { FinancePeriod } from "../data/models/FinanceReport";

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

/** YYYY-MM-DD in the browser's local time zone (toISOString() is UTC and is a day behind in Kabul after midnight). */
export function localIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function openPdf(url?: string | null): void {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export interface PeriodState {
  period: FinancePeriod;
  date: string;
  month: string;
  year: string;
  from: string;
  to: string;
}

export function defaultPeriodState(period: FinancePeriod = "daily"): PeriodState {
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

/** from/to (inclusive) for endpoints that take a plain date range; null means all time. */
export function periodRange(state: PeriodState): { from: string; to: string } | null {
  switch (state.period) {
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
    default: {
      const [y, m] = state.month.split("-").map(Number);
      const last = new Date(y, m, 0).getDate();
      return { from: `${state.month}-01`, to: `${state.month}-${String(last).padStart(2, "0")}` };
    }
  }
}
