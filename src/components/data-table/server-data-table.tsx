import { useMemo, type ReactNode } from 'react';
import { useTranslation } from './i18n';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { DataTable } from './data-table';
import { DataTableToolbar, TableHeaderTools } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';
import { DataTableBulkBar } from './data-table-bulk-bar';
import { filterableColumns } from './data-table-filters';
import { downloadGrid, printGrid } from './export';
import { leafColumnIds, resolveColumnOrder } from './use-table-preferences';
import { isFieldQueryError, type BulkAction, type DataTableApi } from './use-data-table';

/**
 * The whole list screen, from one `useDataTable(…)` object.
 *
 * A screen author supplies a column array, a query key and an endpoint — and gets search,
 * URL-synced filters, tri-state sorting, cursor pagination, rows-per-page, a column chooser,
 * density, column resize, selection, bulk actions and export, all behaving identically to
 * every other list in the system (06-ui-ux §9).
 *
 * `DataTable` underneath stays usable on its own for the panels and pickers that are not a
 * screen's subject — a table inside a dialog has no business writing to the page URL.
 */
export function ServerDataTable<TRow>({
  api, extra, entityLabel, searchPlaceholder,
  emptyTitle, emptyBody, emptyAction, searchClassName, onRowClick, onRowDoubleClick, className, stickyHeader,
  maxBodyHeight,
  narrowed: screenNarrowed = false,
  toolsInHeader = false,
}: {
  api: DataTableApi<TRow>;
  /** The screen's own actions — a "New …" button — on the toolbar line. */
  extra?: ReactNode;
  /** What the rows are, for selection and confirmation sentences. */
  entityLabel: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  /** Extra classes on the search field. The main-category list uses a longer field. */
  searchClassName?: string;
  onRowClick?: (row: TRow) => void;
  /** Open the row — its view, or its edit sheet when there is no view. See `DataTable`. */
  onRowDoubleClick?: (row: TRow) => void;
  className?: string;
  stickyHeader?: boolean;
  /** Caps the frame so header and footer stay put while the body scrolls. */
  maxBodyHeight?: string;
  /**
   * True when a filter the SCREEN owns (see `params`) is narrowing the list.
   *
   * The table only knows about its own search and filters. Without this, a screen filtered to
   * nothing by its own controls would show "nothing here yet" — which reads as "the system
   * lost my data" to someone who has simply filtered everything away.
   */
  narrowed?: boolean;
  /**
   * Draw export and the layout menu as icons in the actions column header, and drop the
   * saved-views bookmark. Classification lists are already full of tabs and a New button.
   */
  toolsInHeader?: boolean;
}) {
  const { t } = useTranslation();
  const { controls, preferences, options, selection, rows } = api;
  const fieldError = isFieldQueryError(api.error);
  const sortField = controls.query.sort.replace(/^-/, '').split(',')[0] ?? '';
  const sortLabel = String(
    api.columns.find((column) => column.meta?.sortKey === sortField)?.meta?.shortLabel ?? sortField,
  );

  /*
   | A second, headless table instance purely so the toolbar can list columns for the
   | chooser and the export.
   |
   | It shares the same `columns` and the same visibility state as the grid's, so the two
   | cannot disagree. Building the chooser from the raw `columns` array instead would miss
   | exactly what TanStack normalises — ids derived from `accessorKey`, grouped headers.
  */
  const shadow = useReactTable({
    data: rows,
    columns: api.columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: preferences.columns,
      columnOrder: resolveColumnOrder(leafColumnIds(api.columns), preferences.order),
    },
    onColumnVisibilityChange: (updater) => {
      preferences.setColumns(
        typeof updater === 'function' ? updater(preferences.columns) : updater,
      );
    },
    onColumnOrderChange: (updater) => {
      const current = resolveColumnOrder(leafColumnIds(api.columns), preferences.order);
      preferences.setOrder(typeof updater === 'function' ? updater(current) : updater);
    },
  });

  const filterColumns = useMemo(
    () => filterableColumns(api.columns, (column) => String(column.meta?.shortLabel ?? '')),
    [api.columns],
  );

  /*
   | Print and Excel of the ticked rows, on every multi-select list, ahead of the screen's own.
   |
   | Built here because this is where the grid exists. A screen that built them had to reach
   | its own `useDataTable` result from inside the options it was passing to it — a ref written
   | during render, which is exactly what the React rules forbid.
  */
  const bulkActions = useMemo<BulkAction[]>(() => [
    {
      id: 'print',
      label: t('table.print'),
      icon: <Printer aria-hidden="true" />,
      permission: options.readPermission,
      run: () => printGrid(api, true),
    },
    {
      id: 'sheet',
      label: t('table.excel'),
      permission: options.readPermission,
      icon: <FileSpreadsheet aria-hidden="true" />,
      run: () => downloadGrid(api, true),
    },
    ...(options.bulkActions ?? []),
  ], [t, api, options.bulkActions]);

  const showBulk = options.select === 'multi'
    && (selection.selectedIds.length > 0 || selection.allMatching);

  return (
    <div className={className}>
      <DataTable
        columns={api.columns}
        data={rows}
        isLoading={api.isLoading}
        isFetching={api.isFetching}
        // A rejected sort keeps the rows. A real failure still replaces the grid.
        isError={api.isError && !(fieldError && rows.length > 0)}
        error={api.error}
        onRetry={api.refetch}
        sort={controls.query.sort}
        onSortChange={controls.setSort}
        onRowClick={onRowClick}
        onRowDoubleClick={onRowDoubleClick}
        emptyTitle={emptyTitle}
        emptyBody={emptyBody}
        emptyAction={emptyAction}
        narrowed={api.narrowed || screenNarrowed}
        preferences={preferences}
        stickyHeader={stickyHeader}
        maxBodyHeight={maxBodyHeight}
        selection={options.select === false ? undefined : selection}
        getRowId={options.getRowId ?? ((row: TRow) => (row as { id: string }).id)}
        toolbar={(
          <DataTableToolbar
            api={api}
            table={shadow}
            filterColumns={filterColumns}
            extra={extra}
            searchPlaceholder={searchPlaceholder}
            searchClassName={searchClassName}
            hideTools={toolsInHeader}
          />
        )}
        actionsHeader={toolsInHeader ? <TableHeaderTools api={api} table={shadow} /> : undefined}
        banner={showBulk ? (
          <DataTableBulkBar
            selection={selection}
            actions={bulkActions}
            can={api.can}
            entityLabel={entityLabel}
            allowSelectAllMatching={api.capabilities.selectAllMatching}
            className="rounded-none border-x-0 border-t-0 shadow-none"
          />
        ) : undefined}
        footer={(
          <DataTablePagination
            loaded={rows.length}
            hasMore={api.hasMore}
            canGoPrevious={controls.canGoPrevious}
            pageIndex={controls.pageIndex}
            perPage={controls.query.perPage}
            perPageOptions={api.perPageOptions}
            onPrevious={controls.goPrevious}
            onNext={() => controls.goNext(api.nextCursor)}
            onPerPageChange={controls.setPerPage}
            isFetching={api.isFetching}
            density={preferences.density}
          />
        )}
      />

      {/* A sort on a column the endpoint does not allow is a 422, not a crash (AD-023).
          It is shown where the sort was made, not as a toast that vanishes. */}
      {fieldError ? (
        <p role="alert" className="text-xs text-destructive">
          {t('table.unsortableColumn', { column: sortLabel })}
        </p>
      ) : null}
    </div>
  );
}
