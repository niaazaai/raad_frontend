export interface DataTableExportQuery {
  allTime: boolean;
  from?: string;
  to?: string;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cellXml(value: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  return `<Cell><Data ss:Type="String">${escapeXml(String(value ?? ""))}</Data></Cell>`;
}

/**
 * Builds an Excel-compatible SpreadsheetML workbook (opens in Excel / LibreOffice).
 */
export function buildSpreadsheetXml(headers: string[], rows: Array<Array<string | number>>): string {
  const headerRow = `<Row>${headers.map((header) => cellXml(header)).join("")}</Row>`;
  const bodyRows = rows.map((row) => `<Row>${row.map((cell) => cellXml(cell)).join("")}</Row>`).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Export">
  <Table>
   ${headerRow}
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadSpreadsheet(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  const xml = buildSpreadsheetXml(headers, rows);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
