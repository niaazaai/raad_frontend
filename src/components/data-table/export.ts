import type { Column, ColumnDef } from '@tanstack/react-table';
import { apiFetch, ApiError, newId, type ListEnvelope } from '@/api/client';
import type { FilterExpression } from './query';
import type { DataTableApi, Selection } from './use-data-table';

/**
 * Export — three different mechanisms, and the difference is not an implementation detail.
 *
 *   CSV / Excel  backend, on the `reports` queue, whatever the size (05-conventions §4): the
 *                list is re-run in the job as the person who asked, so it reflects the
 *                FILTER and the reader's data scope, not the page in the browser.
 *   PDF          backend, the same document service that prints every other document
 *                (PLT-DOC-001, AD-035). Arabic script needs contextual shaping and bidi
 *                reordering, and a document must render identically no matter whose browser
 *                produced it — a client-side renderer would make it depend on installed fonts.
 *   Print        client, a plain HTML document of the current filter (or the ticked rows),
 *                printed from a hidden frame. Not a print of the app chrome.
 *
 * There is no jsPDF here and there must never be one (06-ui-ux §12).
 */

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportRequest {
  format: ExportFormat;
  /**
   * The ACTIVE FILTER, not the loaded row ids.
   *
   * A user who filters to 4,213 rows and exports must receive 4,213 rows, not the 50 on
   * screen. This is the single most important line in this file.
   */
  expression: FilterExpression;
  /** Paths into each row, in order — only the columns currently visible and exportable. */
  columns: string[];
  /** The header each path had on screen, so the file is in the reader's language. */
  labels: Record<string, string>;
  /** The document's title (PDF). */
  title?: string;
  /** Flat parameters the screen owns (`?status=active`), exactly as the list was sent them. */
  params?: Record<string, string>;
  /** When a selection is active the user chooses: just those rows, or everything matching. */
  selection?: Selection;
}

export interface ExportAccepted {
  export_id: string;
  /** Always `queued`: one path for every size (05-conventions §4). */
  status: 'queued';
}

/**
 * `POST {endpoint}/exports` → `202 {export_id}`.
 *
 * The audit event for exporting customer or supplier data (AD-054, 07 §8) is recorded
 * server-side **in the job**, not here. A client-side audit call would not fire for a queued
 * export, would not fire if the tab closed, and could be skipped by anyone calling the API
 * directly — which is three ways of saying it is not an audit trail.
 */
export async function requestExport(
  endpoint: string,
  request: ExportRequest,
): Promise<ExportAccepted> {
  const body = {
    format: request.format,
    columns: request.columns,
    labels: request.labels,
    ...(request.title ? { title: request.title } : {}),
    ...(request.params && Object.keys(request.params).length > 0 ? { params: request.params } : {}),
    ...(request.selection?.mode === 'ids' && request.selection.ids.length > 0
      ? { scope: 'selected' as const, ids: request.selection.ids }
      : { scope: 'all' as const }),
    filter: request.expression.filter,
    q: request.expression.q,
    sort: request.expression.sort,
  };

  const response = await apiFetch<{ data: ExportAccepted }>(`${endpoint}/exports`, {
    method: 'POST',
    body,
    // Exports are rate limited to 10/hour (07 §5); a double-click must not spend two.
    idempotencyKey: newId(),
  });

  return response.data;
}

/**
 * The paths and headers an export writes, from the columns on screen: visible, not opted out,
 * each through its `meta.exportAs` or else its own id. A path named twice is written once.
 */
export function exportColumnsOf<TRow>(
  columns: Array<Column<TRow, unknown>>,
): { columns: string[]; labels: Record<string, string> } {
  const keys: string[] = [];
  const labels: Record<string, string> = {};

  for (const column of columns) {
    const meta = column.columnDef.meta;
    if (meta?.exportable === false) continue;

    const header = column.columnDef.header;
    const ownLabel = meta?.shortLabel ?? (typeof header === 'string' ? header : column.id);

    for (const part of meta?.exportAs ?? [{ key: column.id }]) {
      if (keys.includes(part.key)) continue;
      keys.push(part.key);
      labels[part.key] = part.label ?? ownLabel;
    }
  }

  return { columns: keys, labels };
}

/** `429` is a normal outcome at 10/hour, so it gets a sentence rather than a stack trace. */
export const isRateLimited = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 429;

/**
 * Print, the one legitimately client-side format.
 *
 * `window.print()` over a print stylesheet, rather than opening a rendered document: the
 * user's own browser is already showing exactly the rows they filtered to, and the
 * stylesheet's job is only to drop the chrome around them.
 */
export function printTable(): void {
  if (typeof window === 'undefined') return;

  window.print();
}

const SHEET_PAGE = 200;
const SHEET_CAP = 2000;

/**
 * Rows for a printout or a spreadsheet.
 *
 * A selection wins: those rows, and only those. With nothing ticked, every row of the
 * current filter is collected, not just the page on screen.
 */
async function rowsForOutput<TRow>(
  api: DataTableApi<TRow>,
  onlySelected: boolean,
): Promise<TRow[]> {
  const idOf = api.options.getRowId ?? ((row: TRow) => (row as { id: string }).id);
  const selected = new Set(api.selection.selectedIds);
  const narrowed = (onlySelected || selected.size > 0) && !api.selection.allMatching;

  if (narrowed) {
    const onPage = api.rows.filter((row) => selected.has(idOf(row)));
    if (onPage.length === selected.size) return onPage;

    const all = await fetchFiltered<TRow>(api.options.endpoint, api.queryString);
    return all.filter((row) => selected.has(idOf(row)));
  }

  return fetchFiltered<TRow>(api.options.endpoint, api.queryString);
}

async function fetchFiltered<TRow>(endpoint: string, queryString: string): Promise<TRow[]> {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  params.delete('cursor');
  params.delete('page');
  params.set('per_page', String(SHEET_PAGE));

  const all: TRow[] = [];
  let cursor = '';

  for (let page = 0; page < 20 && all.length < SHEET_CAP; page += 1) {
    if (cursor) params.set('page', cursor);
    else params.delete('page');

    const envelope = await apiFetch<ListEnvelope<TRow>>(`${endpoint}?${params.toString()}`);
    all.push(...envelope.data);

    const next = envelope.meta.next_cursor;
    if (!envelope.meta.has_more || next === null || next === '') break;
    cursor = next;
  }

  return all.slice(0, SHEET_CAP);
}

function outputColumns<TRow>(api: DataTableApi<TRow>): Array<ColumnDef<TRow, unknown>> {
  const hidden = api.preferences.columns;

  return api.columns.filter((column) => {
    const id = column.id ?? '';
    if (column.meta?.exportable === false) return false;
    if (id !== '' && hidden[id] === false) return false;
    return true;
  });
}

function headerOf<TRow>(column: ColumnDef<TRow, unknown>): string {
  const header = column.header;
  return String(column.meta?.shortLabel ?? (typeof header === 'string' ? header : column.id ?? ''));
}

function textOf<TRow>(column: ColumnDef<TRow, unknown>, row: TRow): string {
  const plain = column.meta?.plainText;
  if (plain) return plain(row);

  const key = column.meta?.exportAs?.[0]?.key ?? column.id ?? '';
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current === null || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, row);

  // Money and quantities arrive as strings (AD-024) and pass through untouched. Anything
  // that is not a scalar has no honest single-cell form, so it is written as blank.
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

function gridOf<TRow>(
  columns: Array<ColumnDef<TRow, unknown>>,
  rows: TRow[],
): { headers: string[]; body: string[][] } {
  return {
    headers: columns.map(headerOf),
    body: rows.map((row) => columns.map((column) => textOf(column, row))),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char
  ));
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char
  ));
}

/**
 * A plain document: a title and a table, in the page's direction, with none of the app chrome.
 *
 * Shared by the server list (`printGrid`) and a grid that already holds its rows.
 */
export function printDocument(title: string, grid: { headers: string[]; body: string[][] }): void {
  const dir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
  const lang = document.documentElement.lang || 'en';

  const head = grid.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = grid.body.map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" dir="${dir}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 24px; color: #111; background: #fff; font-family: Vazirmatn, sans-serif; font-size: 12px; }
  h1 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #222; padding: 6px 8px; text-align: start; vertical-align: top; }
  th { font-weight: 600; }
  @page { margin: 16mm; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<table>
<thead><tr>${head}</tr></thead>
<tbody>${body}</tbody>
</table>
</body>
</html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.append(frame);
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  };
}

/** The rows already on screen, as the same plain document. */
export function printRows<TRow>(
  title: string,
  columns: Array<ColumnDef<TRow, unknown>>,
  rows: TRow[],
): void {
  printDocument(title, gridOf(columns.filter((column) => column.meta?.exportable !== false), rows));
}

export async function printGrid<TRow>(
  api: DataTableApi<TRow>,
  onlySelected = false,
): Promise<void> {
  const rows = await rowsForOutput(api, onlySelected);
  printRows(api.options.exportTitle ?? document.title, outputColumns(api), rows);
}

/**
 * The same rows as {@link printGrid}, as a spreadsheet Excel opens.
 *
 * SpreadsheetML rather than a queued `POST …/exports`: inventory lists are not in the
 * platform export registry, and a download of the filter (or the ticked rows) is what the
 * person asked for.
 */
export function downloadRows<TRow>(
  title: string,
  columns: Array<ColumnDef<TRow, unknown>>,
  rows: TRow[],
): void {
  const grid = gridOf(columns.filter((column) => column.meta?.exportable !== false), rows);
  const sheetName = title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';

  const headerRow = `<Row>${grid.headers.map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join('')}</Row>`;
  const dataRows = grid.body.map((cells) => `<Row>${cells.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${escapeXml(sheetName)}">
<Table>
${headerRow}
${dataRows}
</Table>
</Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-|-$/g, '') || 'export'}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadGrid<TRow>(
  api: DataTableApi<TRow>,
  onlySelected = false,
): Promise<void> {
  const rows = await rowsForOutput(api, onlySelected);
  downloadRows(api.options.exportTitle ?? 'export', outputColumns(api), rows);
}
