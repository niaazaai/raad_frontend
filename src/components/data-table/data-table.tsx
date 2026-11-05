import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type ReactNode, type SyntheticEvent,
} from 'react';
import { useTranslation } from './i18n';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from './virtualizer';
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, tableCheckboxClassName } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState } from '@/components/feedback';
import { ApiError } from '@/api/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTier } from '@/components/layout/tier';
import { useAnnounce } from '@/components/layout/announcer-context';
import { DataTableCards } from './data-table-cards';
import { ClientGridTools } from './data-table-toolbar';
import { DataTableColumnResizer } from './data-table-column-resizer';
import { nextSort, sortDirectionFor } from './query';
import { leafColumnIds, resolveColumnOrder, useTablePreferences, type TablePreferenceControls } from './use-table-preferences';
import type { SelectionApi } from './use-data-table';
import {
  DENSITY_CELL, DENSITY_HEADER, DENSITY_ROW_HEIGHT, DENSITY_ROW_PX, VIRTUALISE_ABOVE, type Density,
} from './types';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];

  /** First load. Shows a skeleton shaped like the eventual table. */
  isLoading?: boolean;
  /** Background refetch — keep showing stale rows, just indicate movement. */
  isFetching?: boolean;

  /** The error state, inline where the rows would have been. Shows `request_id`. */
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;

  /** Server-side sorting. `-created_at` means descending (05-conventions §4). */
  sort?: string;
  onSortChange?: (sort: string) => void;

  /** Cursor pagination — there is no page count by design (AD-023). */
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;

  onRowClick?: (row: TData) => void;
  /**
   * Open the row — its view if the screen has one, otherwise its edit sheet.
   *
   * A double-click rather than a click, so a stray click while reading or selecting text does
   * not throw a sheet over the list. Enter on a focused row does the same from the keyboard,
   * and a tap does it on a phone, which has no double-click (the cards use it as their tap).
   */
  onRowDoubleClick?: (row: TData) => void;

  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;

  /**
   * True when a search or a filter is narrowing the list.
   *
   * Decides WHICH empty state shows, and the two are not interchangeable: "no items yet"
   * teaches, and replaces the grid. "Nothing matches" does NOT replace it — the header, with
   * the very filters that emptied it, stays where it was and the body says so in one line.
   * The way out is to untick what was ticked, and that needs the header on screen.
   */
  narrowed?: boolean;

  /** Persisted per user per screen when a key is given. */
  storageKey?: string;
  /** Supplied by `useDataTable`; falls back to `storageKey` when absent. */
  preferences?: TablePreferenceControls;
  className?: string;

  /**
   * Pin the header while the body scrolls.
   *
   * On by default: a stock grid is routinely 200 rows, and a column header that has scrolled
   * away turns every cell into a guess.
   */
  stickyHeader?: boolean;
  /** How tall the scroll container may grow before the body scrolls inside it. */
  maxBodyHeight?: string;

  /** Shown beside the refetch indicator — "12 of 40 loaded". */
  totalHint?: string;

  /**
   * The screen's own actions — "New type", a filter chip row — rendered on the SAME line as
   * the View menu.
   */
  toolbar?: ReactNode;
  /** Pagination controls, drawn as the grid's own footer — inside the frame, not under it. */
  footer?: ReactNode;
  /** A strip inside the frame, above the footer. The bulk bar lives here. */
  banner?: ReactNode;
  /** Icon tools drawn in the actions column header, in place of the word "Actions". */
  actionsHeader?: ReactNode;
  /**
   * Print, Excel and the view menu for rows this grid already holds.
   *
   * Server lists leave this off: they already draw those icons from `useDataTable`.
   */
  clientTools?: boolean;
  /** Title of the plain printout and the spreadsheet. */
  exportTitle?: string;

  /** Row selection, when the screen offers it. */
  selection?: SelectionApi;
  getRowId?: (row: TData) => string;

  /** Column resize. Off unless the columns declare widths. */
  enableResize?: boolean;
}

/**
 * The one data grid.
 *
 * Every list screen in the system uses this — dozens of them — so everything that is hard
 * about a grid is solved once, here:
 *
 *   - server-side sort, filter and pagination (client-side sorting is a lie above a few
 *     hundred rows, and every one of these lists will exceed that)
 *   - column priority driving what survives on a narrow screen
 *   - three density modes, persisted: a clerk entering data all day picks compact, a
 *     manager reviewing does not. Do not choose for them
 *   - a column chooser, column resize, and widths that persist
 *   - horizontal scroll inside the frame when the columns outgrow it, with the selection and
 *     actions columns pinned, so a row can still be ticked and acted on mid-scroll
 *   - RTL: alignment, column order and resize direction all mirror
 *   - virtualised rows above ~100, so a 200-row stock grid stays at 60fps
 *   - all five states: skeleton, empty-no-data, empty-no-results, error, success
 *
 * Deliberately NOT here: client-side sorting or filtering. Both would work on the seeded
 * data and fail in production, which is the worst possible time to find out (06-ui-ux §11).
 */
export function DataTable<TData>({
  columns, data, isLoading, isFetching,
  isError, error, onRetry,
  sort = '', onSortChange,
  hasNextPage, isFetchingNextPage, onLoadMore,
  onRowClick,
  onRowDoubleClick,
  emptyTitle,
  emptyBody,
  emptyAction,
  narrowed = false,
  storageKey,
  preferences,
  className,
  stickyHeader = true,
  maxBodyHeight = 'calc(100vh - 20rem)',
  totalHint,
  toolbar,
  footer,
  banner,
  actionsHeader,
  clientTools = false,
  exportTitle,
  selection,
  getRowId,
  enableResize = true,
}: DataTableProps<TData>) {
  const { t } = useTranslation();

  // `useDataTable` owns preferences when it is driving; a bare `DataTable` owns its own.
  // The hook is called unconditionally either way — a conditional hook is a crash waiting
  // for the first screen that toggles between the two modes.
  const ownPreferences = useTablePreferences(storageKey);
  const prefs = preferences ?? ownPreferences;
  const density = prefs.density;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  /*
   | The header's height, for `.scrollbar-below-header` (index.css): the vertical scrollbar's
   | track starts under it. Measured rather than assumed — density, browser zoom and a font
   | still loading all change it — and re-measured whenever it resizes.
  */
  const [headHeight, setHeadHeight] = useState(0);
  const measureHead = useCallback((head: HTMLTableSectionElement | null) => {
    if (head === null) return undefined;

    const update = (): void => setHeadHeight(head.getBoundingClientRect().height);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(head);

    return () => observer.disconnect();
  }, []);

  /*
   | A search or filter that settles is announced (06-ui-ux §6): a sighted user sees the rows
   | change, a screen-reader user would otherwise hear nothing at all. Only after a refetch —
   | the first load is the page itself, and the route announcement covers it.
  */
  const announce = useAnnounce();
  const wasFetching = useRef(isFetching === true);
  const settledOnce = useRef(false);
  useEffect(() => {
    if (wasFetching.current && isFetching !== true && isError !== true && settledOnce.current) {
      announce(data.length === 0 ? t('table.noRows') : t('table.showing', { count: data.length }));
    }
    if (isFetching !== true) settledOnce.current = true;
    wasFetching.current = isFetching === true;
  }, [isFetching, isError, data.length, announce, t]);

  // Below `md` a Tier A/B screen's rows become cards (06-ui-ux §3.3). A Tier C screen never
  // reaches here on a phone — its TierGate shows the "larger screen" panel instead.
  const mobile = useIsMobile();
  const tier = useTier();
  const cards = mobile && tier !== 'C';

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Sorting, filtering and pagination are the SERVER's job; the header only reports intent.
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    state: {
      columnVisibility: prefs.columns,
      columnOrder: resolveColumnOrder(leafColumnIds(columns), prefs.order),
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(prefs.columns) : updater;
      prefs.setColumns(next);
    },
    onColumnOrderChange: (updater) => {
      const current = resolveColumnOrder(leafColumnIds(columns), prefs.order);
      prefs.setOrder(typeof updater === 'function' ? updater(current) : updater);
    },
  });

  const rows = table.getRowModel().rows;
  const hasActions = columns.some((column) => (column.id ?? '') === 'actions');
  const gridTools = clientTools ? (
    <ClientGridTools
      table={table}
      rows={data}
      title={exportTitle ?? emptyTitle ?? 'export'}
      density={density}
      onDensity={prefs.setDensity}
      onReset={prefs.reset}
    />
  ) : null;
  const headerTools = actionsHeader ?? (hasActions ? gridTools ?? undefined : undefined);
  const hasHeaderTools = headerTools !== undefined && headerTools !== null;
  const toolbarRow = toolbar || (gridTools && !hasActions) ? (
    <div className="flex w-full flex-wrap items-center gap-2">
      {toolbar ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div> : <span className="flex-1" />}
      {gridTools && !hasActions ? gridTools : null}
    </div>
  ) : null;

  /*
   | Virtualise above ~100 rows (06-ui-ux §8).
   |
   | Below that the DOM cost is irrelevant and a virtualiser only adds a scroll container
   | that behaves subtly differently from the page's. Above it, a 40,000-row export preview
   | or a 200-row stock grid drops frames on every scroll without one.
  */
  const virtualise = !cards && rows.length > VIRTUALISE_ABOVE;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DENSITY_ROW_PX[density],
    overscan: 12,
    enabled: virtualise,
  });

  const virtualRows = virtualise ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualise ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom = virtualise
    ? virtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
    : 0;

  const pageIds = useMemo(
    () => (getRowId ? data.map(getRowId) : []),
    [data, getRowId],
  );

  const allOnPageSelected = pageIds.length > 0
    && selection !== undefined
    && pageIds.every((id) => selection.isSelected(id));

  const toggleSort = (sortKey: string): void => {
    if (!onSortChange) return;

    // Tri-state: none → asc → desc → none. "None" is the endpoint's own default order,
    // which `CursorPaginator` makes total by appending the primary key — so returning to it
    // is a real, indexed order rather than an absence of one.
    onSortChange(nextSort(sort, sortKey));
  };

  // The grid's footer: the screen's pagination, or a row count and "load more".
  const footerBar = footer ?? (
    <div className={cn('flex h-full w-full items-center gap-3 px-3 text-xs text-muted-foreground', DENSITY_HEADER[density])}>
      <span>{totalHint ?? t('table.showing', { count: data.length })}</span>

      {hasNextPage === true ? (
        <Button variant="ghost" size="sm" className="ms-auto" onClick={onLoadMore} loading={isFetchingNextPage}>
          {t('table.loadMore')}
        </Button>
      ) : null}
    </div>
  );

  const shell = (children: ReactNode): ReactNode => (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Still rendered on every state: the "New" button vanishing exactly when somebody
          needs to create the first row is the worst possible moment to hide it. */}
      {toolbarRow}
      {children}
    </div>
  );

  if (isError === true) {
    return shell(
      <ErrorState
        error={error}
        requestId={error instanceof ApiError ? error.requestId : undefined}
        onRetry={onRetry}
      />,
    );
  }

  if (isLoading === true) {
    return shell(<TableSkeleton columns={columns.length} density={density} />);
  }

  // Nothing set up yet: the teaching panel replaces the grid. Filtered to nothing: the grid
  // stays, and its body says so (below).
  if (data.length === 0 && !narrowed) {
    return shell(
      <EmptyState
        title={emptyTitle ?? t('table.emptyTitle')}
        body={emptyBody ?? t('table.emptyBody')}
        action={emptyAction}
      />,
    );
  }

  const noMatches = (
    <p role="status" className="py-6 text-center text-sm text-muted-foreground">{t('table.noMatches')}</p>
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {toolbarRow}

      {isFetching === true && isFetchingNextPage !== true ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
          {/* Stale-while-refetching: the rows below are still readable, so this is a quiet
              signal rather than a blocking spinner (06-ui-ux §5). */}
          <Loader2 className="size-3 animate-spin" />
          <span>{t('states.refreshing')}</span>
        </div>
      ) : null}

      {cards ? (
        /*
          | A phone has no header row, so what the table keeps there — select-page and the
          | export and layout tools — moves to a strip above the cards, and the bulk bar and
          | the pagination footer frame them. Without this, a phone could neither page past
          | the first fifty rows nor act on a selection.
          */
        <>
          {banner ? <div className="overflow-hidden rounded-xl border print:hidden">{banner}</div> : null}

          {(selection?.mode === 'multi' && getRowId !== undefined) || hasHeaderTools ? (
            <div className="flex items-center gap-2 print:hidden">
              {selection?.mode === 'multi' && getRowId !== undefined ? (
                <label className="flex min-h-11 cursor-pointer items-center gap-2 ps-3 text-sm text-muted-foreground">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={() => selection.togglePage(pageIds)}
                    aria-label={t('table.selectPage')}
                    className={tableCheckboxClassName}
                  />
                  <span>{t('table.selectAllShort')}</span>
                </label>
              ) : null}
              {hasHeaderTools ? <div className="ms-auto">{headerTools}</div> : null}
            </div>
          ) : null}

          {rows.length === 0
            ? <div className="rounded-xl border bg-card">{noMatches}</div>
            // A phone has no double-click: the card's tap is the row's open.
            : <DataTableCards rows={rows} onRowClick={onRowClick ?? onRowDoubleClick} selection={selection} getRowId={getRowId} />}

          <div className={cn('elevated overflow-hidden rounded-xl border bg-card print:hidden', DENSITY_HEADER[density])}>
            {footerBar}
          </div>
        </>
      ) : (
      <>
      {/*
        | Wide content scrolls INSIDE its container; the page never scrolls sideways.
        |
        | `maxHeight` plus `overflow-auto` is what makes the header sticky actually work —
        | `position: sticky` needs a scroll container with a bounded height, and without one
        | the header simply scrolls away with the page.
        */}
      <div className="elevated overflow-hidden rounded-xl border bg-card print:border-0 print:shadow-none">
        {banner ? <div className="print:hidden">{banner}</div> : null}
        {/*
          | ONE scroll container for both axes. `Table` wraps itself in an `overflow-x-auto`
          | div, and any overflow other than visible makes an element a scroll container in
          | BOTH directions — the sticky header and the pinned columns would then stick to that
          | inner div, which never scrolls vertically, and scroll away with this one. So the
          | inner wrapper is made visible here and this div does all the scrolling.
          */}
        {/* With a sticky header the body scrolls under it, and its vertical scrollbar starts
            below the header rather than beside it (`.scrollbar-below-header`, index.css). */}
        <div
          ref={scrollRef}
          className={cn(
            'scrollbar-themed overflow-auto print:overflow-visible [&>[data-slot=table-container]]:overflow-visible',
            stickyHeader && 'scrollbar-below-header',
          )}
          style={stickyHeader
            ? { maxHeight: maxBodyHeight, '--table-head': `${headHeight}px` } as CSSProperties
            : undefined}
        >
          <Table>
            <TableHeader ref={measureHead} className={stickyHeader ? '[&_tr]:border-b-0!' : undefined}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {selection !== undefined && getRowId !== undefined ? (
                    <TableHead
                      className={cn(
                        'w-10 py-0',
                        DENSITY_HEADER[density],
                        PINNED_START,
                        pinnedHeader(stickyHeader),
                      )}
                    >
                      {selection.mode === 'multi' ? (
                        <Checkbox
                          className={tableCheckboxClassName}
                          checked={allOnPageSelected}
                          onCheckedChange={() => selection.togglePage(pageIds)}
                          // With cursor pagination the header checkbox can only honestly
                          // mean "this page" — "all matching" is a second, deliberate click
                          // in the bulk bar (§3.5).
                          aria-label={t('table.selectPage')}
                        />
                      ) : null}
                    </TableHead>
                  ) : null}

                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta;
                    const sortKey = meta?.sortKey;
                    const direction = sortDirectionFor(sort, sortKey);
                    const label = String(meta?.shortLabel ?? header.column.id);
                    const width = prefs.widths[header.column.id] ?? meta?.width?.default;
                    const canResize = enableResize
                      && (meta?.resizable ?? meta?.width !== undefined)
                      && meta?.width !== undefined;
                    const pinned = header.column.id === 'actions';

                    return (
                      <TableHead
                        key={header.id}
                        style={width === undefined ? undefined : { width, minWidth: width }}
                        className={cn(
                          'whitespace-nowrap py-0 font-semibold',
                          DENSITY_HEADER[density],
                          pinned
                            ? [PINNED_END, pinnedHeader(stickyHeader)]
                            : [
                                'relative bg-muted/40',
                                // Opaque, or the rows show through as they scroll underneath.
                                stickyHeader && 'sticky top-0 z-10 border-b border-border bg-muted',
                              ],
                          meta?.numeric === true && 'text-end',
                          priorityClass(meta?.priority),
                        )}
                        // Announce the sort state, not just paint it.
                        aria-sort={direction === undefined
                          ? undefined
                          : direction === 'desc' ? 'descending' : 'ascending'}
                      >
                        {header.isPlaceholder ? null : header.column.id === 'actions' && hasHeaderTools ? (
                          <div className="flex w-full items-center justify-end">{headerTools}</div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            {sortKey !== undefined ? (
                              <button
                                type="button"
                                onClick={() => toggleSort(sortKey)}
                                className="inline-flex items-center gap-1 hover:text-primary"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {direction === 'desc' ? <ArrowDown className="size-3" />
                                  : direction === 'asc' ? <ArrowUp className="size-3" />
                                    : <ChevronsUpDown className="size-3 opacity-40" />}
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                            {meta?.headerAddon}
                          </div>
                        )}

                        {canResize && meta?.width !== undefined ? (
                          <DataTableColumnResizer
                            columnLabel={label}
                            width={width ?? meta.width.default}
                            min={meta.width.min}
                            max={meta.width.max}
                            onResize={(next) => prefs.setWidth(header.column.id, next)}
                            onCommit={(next) => prefs.setWidth(header.column.id, next)}
                          />
                        ) : null}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={table.getVisibleLeafColumns().length + (selection !== undefined && getRowId !== undefined ? 1 : 0)}>
                    {noMatches}
                  </TableCell>
                </TableRow>
              ) : null}

              {paddingTop > 0 ? <tr style={{ height: paddingTop }} aria-hidden /> : null}

              {(virtualise ? virtualRows.map((item) => rows[item.index]) : rows).map((row) => {
                if (row === undefined) return null;

                const id = getRowId?.(row.original);
                const selected = id !== undefined && selection?.isSelected(id) === true;
                const open = onRowDoubleClick ?? onRowClick;

                return (
                  <TableRow
                    key={row.id}
                    data-state={selected ? 'selected' : undefined}
                    // Focusable only when there is something to open; Enter then opens it.
                    tabIndex={open ? 0 : undefined}
                    onClick={onRowClick
                      ? (event) => { if (isRowGesture(event)) onRowClick(row.original); }
                      : undefined}
                    onDoubleClick={onRowDoubleClick
                      ? (event) => { if (isRowGesture(event)) onRowDoubleClick(row.original); }
                      : undefined}
                    // The second press of a double-click would otherwise select a word of
                    // the cell under the pointer, leaving a highlight behind the sheet.
                    onMouseDown={onRowDoubleClick
                      ? (event) => { if (event.detail > 1 && isRowGesture(event)) event.preventDefault(); }
                      : undefined}
                    onKeyDown={open
                      ? (event) => {
                          if (event.key === 'Enter' && event.target === event.currentTarget) {
                            event.preventDefault();
                            open(row.original);
                          }
                        }
                      : undefined}
                    className={cn(
                      'group/row',
                      DENSITY_ROW_HEIGHT[density],
                      open && 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                    )}
                  >
                    {selection !== undefined && id !== undefined ? (
                      <TableCell className={cn('w-10', DENSITY_CELL[density], ROW_CELL, PINNED_START, PINNED_BODY)}>
                        <Checkbox
                          className={tableCheckboxClassName}
                          checked={selected}
                          onCheckedChange={() => selection.toggle(id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={t('table.selectRow')}
                        />
                      </TableCell>
                    ) : null}

                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      const width = prefs.widths[cell.column.id] ?? meta?.width?.default;

                      return (
                        <TableCell
                          key={cell.id}
                          style={width === undefined ? undefined : { width, minWidth: width }}
                          className={cn(
                            'truncate',
                            DENSITY_CELL[density],
                            ROW_CELL,
                            cell.column.id === 'actions' && [PINNED_END, PINNED_BODY],
                            meta?.numeric === true && 'text-end tabular',
                            priorityClass(meta?.priority),
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

              {paddingBottom > 0 ? <tr style={{ height: paddingBottom }} aria-hidden /> : null}
            </TableBody>
          </Table>
        </div>

        <div className={cn('border-t print:hidden', DENSITY_HEADER[density])}>
          {footerBar}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

/*
 | Pinned columns: the selection checkbox at the inline start, the actions at the inline end.
 |
 | A wide grid scrolls sideways inside its frame; without pinning, ticking a row or reaching its
 | edit button means scrolling back first. `start-0` / `end-0` are logical, so the pins swap
 | sides in Dari and Pashto with no RTL branch.
 |
 | A pinned cell must be OPAQUE or the cells sliding under it show through — which is why every
 | body cell, pinned or not, paints the row's colour itself (`ROW_CELL`).
*/
const PINNED_START = 'sticky start-0';
const PINNED_END = 'sticky end-0';
/** Above the cells that slide under it sideways. */
const PINNED_BODY = 'z-[1]';

/*
 | The row's colours — card at rest, muted at 50% on hover and while its menu is open, muted
 | when selected — painted on every CELL, with one fade.
 |
 | The row used to paint itself (shadcn's translucent `hover:bg-muted/50`, fading over 150ms)
 | while the pinned cells, which must be opaque, painted their own copy with no fade: the
 | checkbox and actions columns lit up at once and the rest of the row caught up after. One
 | class on every cell is one colour on one curve, and the row's own background stays hidden
 | behind them. The translucent colours are mixed against the card rather than approximated.
 |
 | 100ms: quick enough to read as immediate, soft enough not to flicker as the pointer crosses
 | rows. Reduced motion is honoured globally (`index.css`).
*/
const ROW_CELL = 'bg-card transition-colors duration-100 ease-out group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] group-has-aria-expanded/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] group-data-[state=selected]/row:bg-muted';

/** Above the scrolling header cells (z-10), which pass under a pinned one sideways. */
function pinnedHeader(sticky: boolean): string {
  return sticky
    ? 'top-0 z-20 border-b border-border bg-muted'
    : 'z-20 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))]';
}

/**
 * Whether a click on a row is the ROW's — not a control's inside it.
 *
 * A tick, a switch, an edit icon or a funnel is its own action, and must not also open the
 * row. Checked here once rather than by `stopPropagation` in every cell a screen writes.
 * Events from a portal (a row's menu, a confirm dialog) arrive through the React tree but sit
 * outside the row in the DOM, and are never the row's either.
 */
const CONTROL = 'button, a, input, select, textarea, label, [role="checkbox"], [role="switch"], [role="menuitem"], [data-row-control]';

function isRowGesture(event: SyntheticEvent<HTMLElement>): boolean {
  const row = event.currentTarget;
  const target = event.target;

  if (!(target instanceof Element) || !row.contains(target)) return false;

  const control = target.closest(CONTROL);

  return control === null || control === row || !row.contains(control);
}

/** Priority drives which columns survive a narrow screen — data, not per-screen CSS. */
function priorityClass(priority: 1 | 2 | 3 | undefined): string | undefined {
  if (priority === 2) return 'hidden lg:table-cell';
  if (priority === 3) return 'hidden xl:table-cell';

  return undefined;
}

function TableSkeleton({ columns, density }: { columns: number; density: Density }) {
  const { t } = useTranslation();

  return (
    <div className="elevated overflow-hidden rounded-xl border bg-card" aria-busy="true">
      <span className="sr-only">{t('states.loading')}</span>
      <div className="flex h-10 items-center gap-4 border-b bg-muted/40 px-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className={cn('flex items-center gap-4 border-b px-4', DENSITY_ROW_HEIGHT[density])}>
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
