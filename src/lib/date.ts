/**
 * Local-time ISO date helpers. `Date.toISOString()` is UTC and is a day behind in Kabul
 * after midnight, so every date that the user picks or sends to the API goes through here.
 */

/** `YYYY-MM-DD` in the browser's local time zone. */
export function localIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM` in the browser's local time zone. */
export function localIsoMonth(date: Date = new Date()): string {
  return localIsoDate(date).slice(0, 7);
}

/** Parses `YYYY-MM-DD` (or `YYYY-MM`) into a local-midnight Date. Returns undefined when unparseable. */
export function parseIsoDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m) return undefined;
  const date = new Date(y, m - 1, d || 1);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Last day of the month that `YYYY-MM` points at, as `YYYY-MM-DD`. */
export function endOfIsoMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${month}-${String(last).padStart(2, "0")}`;
}

/** e.g. "22 Sep 2026". Falls back to the raw value when unparseable. */
export function formatIsoDateLabel(value: string | null | undefined, locale?: string): string {
  const date = parseIsoDate(value);
  if (!date) return value ?? "";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

/** e.g. "Sep 2026". Falls back to the raw value when unparseable. */
export function formatIsoMonthLabel(value: string | null | undefined, locale?: string): string {
  const date = parseIsoDate(value);
  if (!date) return value ?? "";
  return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
}
