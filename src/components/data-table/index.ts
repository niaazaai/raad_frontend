/**
 * The one data grid, and everything that configures it.
 *
 * A screen imports from here, never from a file directly — one import path means one place
 * to change when the API evolves, and it is what keeps sixteen master lists from drifting
 * into sixteen slightly different tables.
 */
export { DataTable, type DataTableProps } from './data-table';
export { ServerDataTable } from './server-data-table';
export { DataTableInlineActions, DataTableRowActions, type RowAction } from './data-table-row-actions';
export { DataTableToolbar, ClientGridTools } from './data-table-toolbar';
export { ColumnFunnel } from './column-funnel';
export { funnelValues } from './funnel-values';
export { DataTablePagination } from './data-table-pagination';
export { DataTableBulkBar } from './data-table-bulk-bar';
export {
  DataTableFilters, DataTableFilterChips, filterableColumns, type FilterableColumn,
} from './data-table-filters';
export { DataTableColumnResizer } from './data-table-column-resizer';
export {
  DEFAULT_CAPABILITIES, resolveCapabilities, type DataTableCapabilities,
} from './capabilities';

export {
  useDataTable, columnIdOf, bulkIdempotencyKey,
  type DataTableApi, type UseDataTableOptions, type BulkAction, type BulkResult,
  type Selection, type SelectionApi, type FacetMap,
} from './use-data-table';
export { useListQuery, type ListQueryControls, type UseListQueryOptions } from './use-list-query';
export {
  useTablePreferences, type TablePreferences, type TablePreferenceControls,
} from './use-table-preferences';

export {
  serialiseListQuery, mergeListQueryIntoSearch, parseListQuery, nextSort, sortDirectionFor,
  filterExpressionOf, isNarrowed, emptyListQuery,
  type ListQuery, type FilterOp, type FilterValue, type FilterState,
  type FilterExpression, type SortDirection,
} from './query';
export {
  requestExport, printTable, printGrid, downloadGrid, printRows, downloadRows, isRateLimited,
  type ExportFormat, type ExportRequest, type ExportAccepted,
} from './export';

export {
  DENSITY_ROW_HEIGHT, DENSITY_ROW_PX, PER_PAGE_OPTIONS, VIRTUALISE_ABOVE,
  type Density, type PerPage, type HaltoonColumnDef, type HaltoonColumnMeta,
  type ColumnFilterSpec, type FilterOption,
} from './types';
export {
  codeColumn, nameColumn, actionsColumn, statusColumn, editDeleteActions, buildMasterColumns,
  statusFilterOptions, withHeaderAddon,
  FlagBadges, StatusBadge, type MasterColumnSpec,
} from './master-columns';
export { StatusSwitch } from './status-switch';
export {
  useStatusToggle, isMasterStatus, type MasterStatus, type StatusToggle,
} from './use-status-toggle';
export { useUrlFilters, type UrlFilters } from './use-url-filters';
export { useUrlTab } from './use-url-tab';
export { useConfirmDelete, type ConfirmDeleteCopy } from './use-confirm-delete';
export { bulkDeleteAction, bulkRowAction } from './bulk-actions';
export { NewButton } from './new-button';
