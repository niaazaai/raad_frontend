import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from './i18n';
import { toast } from 'sonner';
import { useNavigate } from './navigate';
import type { Table } from '@tanstack/react-table';
import {
  Download, FileSpreadsheet, GripVertical, Loader2, Printer, RotateCcw, Rows2, Rows3, Rows4, Search, Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, tableCheckboxClassName } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  downloadGrid, downloadRows, exportColumnsOf, isRateLimited, printGrid, printRows, requestExport, type ExportFormat,
} from './export';
import { DataTableFilters, DataTableFilterChips, type FilterableColumn } from './data-table-filters';
import { DataTableViews } from './data-table-views';
import type { Density } from './types';
import type { DataTableApi } from './use-data-table';

/**
 * One toolbar for every list screen: search, filters, the view menu and export.
 *
 * 06-ui-ux §9: *"Every list screen has: search, filters that live in the URL, column chooser,
 * density toggle, export, saved views. Built once in `DataTable`, not per screen."* The
 * `extra` slot is where a screen puts its own "New …" button, on the same line — two
 * toolbars stacked on each other waste exactly the vertical space a grid needs.
 */
export function DataTableToolbar<TRow>({
  api, table, filterColumns, extra, searchPlaceholder, searchClassName, hideTools = false,
}: {
  api: DataTableApi<TRow>;
  table: Table<TRow>;
  filterColumns: FilterableColumn[];
  extra?: ReactNode;
  searchPlaceholder?: string;
  searchClassName?: string;
  /** Classification puts export and the layout menu in the actions header instead. */
  hideTools?: boolean;
}) {
  const { t } = useTranslation();
  const { controls, preferences, options, selection } = api;
  const [exporting, setExporting] = useState<ExportFormat | undefined>(undefined);
  const navigate = useNavigate();

  const formats = options.exports ?? [];

  // A faceted filter arriving from the URL shows its chip before any menu has been opened;
  // fetching the facets then is what turns "01J8Z…" into the company's name.
  const hasFacetChip = filterColumns.some((column) => column.spec.type === 'faceted'
    && column.spec.source === 'facets' && controls.query.filter[column.id] !== undefined);
  const { requestFacets } = api;

  useEffect(() => {
    if (hasFacetChip) requestFacets();
  }, [hasFacetChip, requestFacets]);

  const runExport = async (format: ExportFormat): Promise<void> => {
    setExporting(format);

    try {
      const { columns, labels } = exportColumnsOf(table.getVisibleLeafColumns());
      const params = Object.fromEntries(
        Object.entries(options.params ?? {}).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''),
      );

      await requestExport(options.endpoint, {
        format,
        // The ACTIVE FILTER, never the loaded row ids — a user who filtered to 4,213 rows
        // must receive 4,213 rows, not the 50 on screen (§3.4).
        expression: { filter: controls.query.filter, q: controls.query.q, sort: controls.query.sort },
        columns,
        labels,
        title: options.exportTitle,
        params,
        selection: selection.selectedIds.length > 0 || selection.allMatching
          ? selection.asSelection()
          : undefined,
      });

      toast.success(t('table.exportQueued'), {
        description: t('table.exportQueuedBody'),
        action: { label: t('table.openDownloads'), onClick: () => void navigate({ to: '/downloads' }) },
      });
    } catch (error) {
      // 10/hour (07 §5). A rate limit is a normal outcome with a clear cause, so it gets a
      // sentence that says what happened — not a silent failure and not a generic error.
      toast.error(isRateLimited(error) ? t('table.exportRateLimited') : t('table.exportFailed'), {
        description: error instanceof Error && !isRateLimited(error) ? error.message : undefined,
      });
    } finally {
      setExporting(undefined);
    }
  };

  const runPrint = async (): Promise<void> => {
    try {
      await printGrid(api);
    } catch {
      toast.error(t('table.printFailed'));
    }
  };

  const runSheet = async (): Promise<void> => {
    setExporting('xlsx');

    try {
      await downloadGrid(api);
      toast.success(t('table.sheetReady'));
    } catch {
      toast.error(t('table.sheetFailed'));
    } finally {
      setExporting(undefined);
    }
  };

  return (
    <div className={cn('flex w-full flex-col print:hidden', hideTools ? 'gap-0' : 'gap-2')} data-tour="table-toolbar">
      <div className="flex w-full flex-wrap items-center gap-2">
        {options.search === true ? (
          // A row of its own on a phone: sharing one with tabs and a button squeezed all three.
          <div className={cn('relative min-w-40 flex-1 basis-full sm:basis-auto', searchClassName ?? 'sm:max-w-xs')} data-tour="table-search">
            {/* `start-2`, not `left-2` — the icon has to move to the other edge in RTL
                (AD-043), and a magnifier sitting on top of Dari text is the visible bug. */}
            <Search className="pointer-events-none absolute inset-y-0 start-2 my-auto size-4 text-muted-foreground" />
            <Input
              type="search"
              value={controls.searchDraft}
              onChange={(event) => controls.setSearch(event.target.value)}
              placeholder={searchPlaceholder ?? t('table.searchPlaceholder')}
              aria-label={searchPlaceholder ?? t('table.searchPlaceholder')}
              className="h-8 rounded-md ps-8"
            />
          </div>
        ) : null}

        {/* Not rendered at all while `columnFilters` is off: a filter control that posts a
            grammar the server drops would show a chip reading "status is approved" above a
            list that was never filtered. See capabilities.ts. */}
        {api.capabilities.columnFilters ? (
        <DataTableFilters
          columns={filterColumns}
          active={controls.query.filter}
          facets={api.facets}
          onChange={controls.setFilter}
          onRequestFacets={api.requestFacets}
        />
        ) : null}

        {/* Shrinkable only on a phone, where the tabs inside scroll. From `sm` it keeps its full
            width, so a narrow toolbar wraps it to its own line instead of pressing it into the
            search box. */}
        <div className="ms-auto flex shrink-0 items-center justify-end gap-2">
          {extra}

          {hideTools ? null : (
            <>
          <DataTableViews api={api} />

          {formats.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting !== undefined} data-tour="table-export">
                  {exporting === undefined
                    ? <Download className="size-4" />
                    : <Loader2 className="size-4 animate-spin" />}
                  <span className="hidden sm:inline">{t('table.export')}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('table.export')}</DropdownMenuLabel>
                {formats.filter((format): format is ExportFormat => format !== 'print').map((format) => (
                  <DropdownMenuItem key={format} onSelect={() => void runExport(format)}>
                    {format === 'xlsx' ? t('table.excel') : t(`table.exportAs.${format}`)}
                  </DropdownMenuItem>
                ))}

                {formats.includes('print') || !options.endpoint.startsWith('/platform/') ? (
                  <>
                    <DropdownMenuSeparator />
                    {!options.endpoint.startsWith('/platform/') ? (
                      <DropdownMenuItem onSelect={() => void runSheet()}>
                        <FileSpreadsheet className="size-4" />
                        {t('table.excel')}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onSelect={() => void runPrint()}>
                      <Printer className="size-4" />
                      {t('table.printOrPdf')}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <LayoutMenu table={table} density={preferences.density} onDensity={preferences.setDensity} onReset={preferences.reset} />
            </>
          )}
        </div>
      </div>

      {api.capabilities.columnFilters ? (
        <DataTableFilterChips
          columns={filterColumns}
          active={controls.query.filter}
          facets={api.facets}
          onRemove={(columnId) => controls.setFilter(columnId, undefined)}
          onClear={controls.clearFilters}
        />
      ) : null}

      <span className="sr-only" aria-live="polite">
        {t('table.showing', { count: api.rows.length })}
      </span>
    </div>
  );
}

/**
 * Export and layout, as icon buttons in the actions column header.
 *
 * The toolbar versions are outline buttons with labels. On a classification list those
 * sit on a second wrapped row; here they are two ghost icons at the inline end of the
 * actions header, and the saved-views bookmark is not shown.
 */
export function TableHeaderTools<TRow>({
  api, table,
}: {
  api: DataTableApi<TRow>;
  table: Table<TRow>;
}) {
  const { t } = useTranslation();
  const { preferences, options, selection, controls, can } = api;
  const mayExport = can(options.readPermission);
  const formats = options.exports ?? [];
  const [exporting, setExporting] = useState<ExportFormat | undefined>(undefined);
  const navigate = useNavigate();
  const queued = options.endpoint.startsWith('/platform/');
  const onlyPrint = queued && formats.length > 0 && formats.every((format) => format === 'print');

  const runExport = async (format: ExportFormat): Promise<void> => {
    setExporting(format);

    try {
      const { columns, labels } = exportColumnsOf(table.getVisibleLeafColumns());
      const params = Object.fromEntries(
        Object.entries(options.params ?? {}).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''),
      );

      await requestExport(options.endpoint, {
        format,
        expression: { filter: controls.query.filter, q: controls.query.q, sort: controls.query.sort },
        columns,
        labels,
        title: options.exportTitle,
        params,
        selection: selection.selectedIds.length > 0 || selection.allMatching
          ? selection.asSelection()
          : undefined,
      });

      toast.success(t('table.exportQueued'), {
        description: t('table.exportQueuedBody'),
        action: { label: t('table.openDownloads'), onClick: () => void navigate({ to: '/downloads' }) },
      });
    } catch (error) {
      toast.error(isRateLimited(error) ? t('table.exportRateLimited') : t('table.exportFailed'), {
        description: error instanceof Error && !isRateLimited(error) ? error.message : undefined,
      });
    } finally {
      setExporting(undefined);
    }
  };

  const runPrint = async (): Promise<void> => {
    try {
      await printGrid(api);
    } catch {
      toast.error(t('table.printFailed'));
    }
  };

  const runSheet = async (): Promise<void> => {
    setExporting('xlsx');

    try {
      await downloadGrid(api);
      toast.success(t('table.sheetReady'));
    } catch {
      toast.error(t('table.sheetFailed'));
    } finally {
      setExporting(undefined);
    }
  };

  return (
    <div className="flex items-center justify-end">
      {queued && !onlyPrint && formats.some((format) => format !== 'print') ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="size-7" aria-label={t('table.export')} disabled={exporting !== undefined}>
              {exporting === undefined ? <Download className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('table.export')}</DropdownMenuLabel>
            {formats.filter((format): format is ExportFormat => format !== 'print').map((format) => (
              <DropdownMenuItem key={format} onSelect={() => void runExport(format)}>
                {format === 'xlsx' ? t('table.excel') : t(`table.exportAs.${format}`)}
              </DropdownMenuItem>
            ))}
            {formats.includes('print') ? (
              <DropdownMenuItem onSelect={() => void runPrint()}>
                <Printer className="size-4" />
                {t('table.printOrPdf')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {queued && onlyPrint ? (
        <Button type="button" variant="ghost" size="icon-sm" className="size-7" aria-label={t('table.printOrPdf')} title={t('table.printOrPdf')} onClick={() => void runPrint()}>
          <Printer className="size-4" />
        </Button>
      ) : null}

      {queued || !mayExport ? null : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label={t('table.excel')}
            title={t('table.excel')}
            disabled={exporting !== undefined}
            onClick={() => void runSheet()}
          >
            {exporting === 'xlsx' ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="size-7" aria-label={t('table.printOrPdf')} title={t('table.printOrPdf')} onClick={() => void runPrint()}>
            <Printer className="size-4" />
          </Button>
        </>
      )}

      <LayoutMenu
        table={table}
        density={preferences.density}
        onDensity={preferences.setDensity}
        onReset={preferences.reset}
        icon
      />
    </div>
  );
}

/**
 * Print, Excel and the view menu for a grid that already holds its rows.
 *
 * Server lists use {@link TableHeaderTools}. This is the same icons for a list the screen
 * loaded itself, so those screens do not grow a second export implementation.
 */
export function ClientGridTools<TRow>({
  table, rows, title, density, onDensity, onReset,
}: {
  table: Table<TRow>;
  rows: TRow[];
  title: string;
  density: Density;
  onDensity: (density: Density) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const columns = table.getVisibleLeafColumns().map((column) => column.columnDef);

  const runPrint = (): void => {
    try {
      printRows(title, columns, rows);
    } catch {
      toast.error(t('table.printFailed'));
    }
  };

  const runSheet = (): void => {
    try {
      downloadRows(title, columns, rows);
      toast.success(t('table.sheetReady'));
    } catch {
      toast.error(t('table.sheetFailed'));
    }
  };

  return (
    <div className="flex items-center justify-end">
      <Button type="button" variant="ghost" size="icon-sm" className="size-7" aria-label={t('table.excel')} title={t('table.excel')} onClick={runSheet}>
        <FileSpreadsheet className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" className="size-7" aria-label={t('table.printOrPdf')} title={t('table.printOrPdf')} onClick={runPrint}>
        <Printer className="size-4" />
      </Button>
      <LayoutMenu table={table} density={density} onDensity={onDensity} onReset={onReset} icon />
    </div>
  );
}

/** Density choices, their icon and the key that picks one while the menu is open. */
const DENSITIES: Array<{ value: Density; label: string; icon: typeof Rows2; code: string; key: string }> = [
  { value: 'comfortable', label: 'table.densityComfortable', icon: Rows2, code: 'Digit1', key: '1' },
  { value: 'standard', label: 'table.densityStandard', icon: Rows3, code: 'Digit2', key: '2' },
  { value: 'compact', label: 'table.densityCompact', icon: Rows4, code: 'Digit3', key: '3' },
];

const RESET_CODE = 'Digit0';

/** Column toggles take the letters in order: A for the first hideable column, B for the next. */
const columnKey = (index: number): string | undefined =>
  index < 26 ? String.fromCharCode(65 + index) : undefined;

/** Tight rows: the checkbox sits in the flow, with no reserved tick gutter. */
const ITEM = 'gap-2 px-1.5 py-1';

function reorderIds(ids: string[], from: string, to: string): string[] {
  if (from === to) return ids;
  const next = ids.filter((id) => id !== from);
  const index = next.indexOf(to);
  if (index < 0) return ids;
  next.splice(index, 0, from);
  return next;
}

/**
 * Density, columns and reset — one menu, every option with a key. Densities and reset carry
 * an icon; a column is just its checkbox and label.
 *
 * The keys work while the menu is open: 1–3 pick a density, A–Z toggle columns in the order
 * they are listed, 0 resets. They are read from `event.code`, the physical key, so they work
 * the same on a Dari or Pashto keyboard layout — `event.key` there would be a Persian letter.
 * A handled key is `preventDefault`ed, which also stops Radix's type-ahead from jumping.
 */
function LayoutMenu<TRow>({
  table, density, onDensity, onReset, icon = false,
}: {
  table: Table<TRow>;
  density: Density;
  onDensity: (density: Density) => void;
  onReset: () => void;
  icon?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragged = useRef(false);
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.columnDef.meta?.alwaysVisible !== true);

  const moveColumn = (from: string, to: string): void => {
    const current = table.getAllLeafColumns().map((column) => column.id);
    const movable = current.filter((id) => id !== 'actions');
    const nextMovable = reorderIds(movable, from, to);
    const fixed = current.filter((id) => !movable.includes(id));
    table.setColumnOrder([...nextMovable, ...fixed]);
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const choice = DENSITIES.find((option) => option.code === event.code);

    if (choice) {
      event.preventDefault();
      onDensity(choice.value);

      return;
    }

    if (event.code === RESET_CODE) {
      event.preventDefault();
      onReset();
      setOpen(false);

      return;
    }

    const letter = /^Key([A-Z])$/.exec(event.code)?.[1];
    const column = letter === undefined ? undefined : columns[letter.charCodeAt(0) - 65];

    if (column) {
      event.preventDefault();
      column.toggleVisibility(!column.getIsVisible());
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={icon ? 'ghost' : 'outline'}
          size={icon ? 'icon-sm' : 'sm'}
          className={icon ? 'size-7' : undefined}
          aria-label={t('table.view')}
          title={icon ? t('table.view') : undefined}
          data-tour="table-layout"
        >
          <Settings2 className="size-4" />
          {icon ? null : <span className="hidden sm:inline">{t('table.view')}</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-1" onKeyDown={onKeyDown}>
        <DropdownMenuGroup aria-label={t('table.density')}>
          {DENSITIES.map((option) => {
            const selected = density === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                data-state={selected ? 'checked' : 'unchecked'}
                className={cn(ITEM, 'data-[state=checked]:font-medium')}
                onSelect={(event) => {
                  event.preventDefault();
                  onDensity(option.value);
                }}
              >
                <option.icon
                  className={cn('size-4', selected ? 'text-primary' : 'text-muted-foreground')}
                  aria-hidden="true"
                />
                <span className="flex-1">{t(option.label)}</span>
                <Shortcut keys={option.key} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-0.5" />

        <DropdownMenuGroup aria-label={t('table.columns')}>
          {columns.map((column, index) => {
            const key = columnKey(index);
            const visible = column.getIsVisible();

            return (
              <DropdownMenuItem
                key={column.id}
                data-state={visible ? 'checked' : 'unchecked'}
                className={cn(ITEM, dragId === column.id && 'opacity-50')}
                onSelect={(event) => {
                  event.preventDefault();
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  column.toggleVisibility(!visible);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = event.dataTransfer.getData('text/plain');
                  if (from !== '') moveColumn(from, column.id);
                  setDragId(null);
                }}
              >
                <span
                  draggable
                  title={t('table.reorderColumn')}
                  aria-label={t('table.reorderColumn')}
                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                  onDragStart={(event) => {
                    dragged.current = true;
                    setDragId(column.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', column.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                >
                  <GripVertical className="size-3.5" aria-hidden="true" />
                </span>
                <Checkbox
                  checked={visible}
                  tabIndex={-1}
                  aria-hidden="true"
                  className={cn(tableCheckboxClassName, 'pointer-events-none')}
                />
                <span className="flex-1 truncate">{String(column.columnDef.meta?.shortLabel ?? column.id)}</span>
                {key ? <Shortcut keys={key} /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-0.5" />

        <DropdownMenuItem onSelect={onReset} className={ITEM}>
          <RotateCcw aria-hidden="true" />
          <span className="flex-1">{t('table.resetLayout')}</span>
          <Shortcut keys="0" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A key cap. Always LTR: "A" and "1" are physical keys, not words to mirror. */
function Shortcut({ keys }: { keys: string }) {
  return (
    <DropdownMenuShortcut className="tracking-normal">
      <kbd
        dir="ltr"
        className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground group-data-[highlighted]:border-primary group-data-[highlighted]:bg-primary group-data-[highlighted]:text-primary-foreground group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary/15 group-data-[state=checked]:text-primary group-data-[highlighted]:group-data-[state=checked]:bg-primary group-data-[highlighted]:group-data-[state=checked]:text-primary-foreground"
      >
        {keys}
      </kbd>
    </DropdownMenuShortcut>
  );
}
