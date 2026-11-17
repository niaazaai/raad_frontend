import { downloadXlsx } from "@/lib/xlsxWorkbook";

export interface DataTableExportQuery {
  allTime: boolean;
  from?: string;
  to?: string;
}

export function downloadSpreadsheet(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  downloadXlsx(filename, headers, rows);
}

export function rowValueAt(row: unknown, key: string): string | number {
  if (!row || typeof row !== "object") return "";
  const value = (row as Record<string, unknown>)[key];
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return "";
  return String(value);
}

const DATE_KEY_HINTS = [
  "transaction_date",
  "issued_at",
  "created_at",
  "payment_date",
  "purchase_date",
  "enrollment_date",
  "next_due_date",
  "date",
];

export function detectDateKey(columns: Array<{ key: string }>, explicit?: string): string | null {
  if (explicit) return explicit;
  const keys = columns.map((column) => column.key);
  return DATE_KEY_HINTS.find((key) => keys.includes(key)) ?? null;
}

export function rowMatchesDateRange<T>(
  row: T,
  dateKey: string | null,
  query: DataTableExportQuery
): boolean {
  if (query.allTime || !dateKey || (!query.from && !query.to)) return true;
  const raw = rowValueAt(row, dateKey);
  if (raw === "") return false;
  const date = String(raw).slice(0, 10);
  if (query.from && date < query.from) return false;
  if (query.to && date > query.to) return false;
  return true;
}
