import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ApiError, apiFetch, newId, type ListEnvelope } from '@/api/client';
import { usePermissionCheck } from '@/lib/permission';
import {
  filterExpressionOf, isNarrowed, serialiseListQuery, type FilterExpression,
} from './query';
import { useListQuery, type ListQueryControls } from './use-list-query';
import { useTablePreferences, type TablePreferenceControls } from './use-table-preferences';
import { resolveCapabilities, type DataTableCapabilities } from './capabilities';
import type { FilterOption, PerPage } from './types';

/** What a bulk action receives. Either explicit ids, or "everything matching this filter". */
export type Selection =
  | { mode: 'ids'; ids: string[] }
  | { mode: 'matching'; expression: FilterExpression };

export interface BulkAction {
  id: string;
  label: string;
  /** Drawn before the label — the bar is read at a glance, and an icon is faster than a word. */
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  /** Hidden when the user lacks it. The endpoint enforces it regardless (07 §4). */
  permission?: string;
  /** `named` confirms and names the object, per 06-ui-ux §10. */
  confirm?: 'named' | 'simple';
  /**
   * Receives an `Idempotency-Key` to put on the request (AD-027). A retried bulk delete
   * must not delete twice, and a bulk endpoint has no natural key to collide on.
   */
  /** `null` means the person backed out (a reason they were asked for and did not give): nothing happened. */
  run: (selection: Selection, idempotencyKey: string) => Promise<BulkResult | void | null>;
}

/**
 * Partial failure is reported per row, never as one "something went wrong" — a 409 on one
 * row of 413 is a conflict on THAT row and the user needs to know which (§3.6).
 */
export interface BulkResult {
  succeeded: number;
  failed: Array<{ id: string; error_code: string; message: string }>;
}

export interface UseDataTableOptions<TRow> {
  /** Preference and (later) saved-view scope, e.g. `inventory.items`. */
  key: string;
  /** The factory, never an inline array (05 §5). */
  queryKey: (filters: Record<string, unknown>) => QueryKey;
  /** Path below the API root, e.g. `/inventory/items`. */
  endpoint: string;
  columns: ColumnDef<TRow, unknown>[];

  search?: boolean;
  select?: 'multi' | 'single' | false;
  bulkActions?: BulkAction[];
  exports?: Array<'csv' | 'xlsx' | 'pdf' | 'print'>;
  /**
   * The model's read permission. Excel and print hide without it.
   * Create, update, and delete stay on the buttons that perform them.
   */
  readPermission?: string;
  /** The title a PDF export prints above the table — usually the page's own title. */
  exportTitle?: string;

  defaultSort?: string;
  perPageOptions?: readonly number[];
  defaultPerPage?: PerPage;

  /** Defaults to `row.id`. */
  getRowId?: (row: TRow) => string;
  /**
   * Optional. Supplies the honest count behind "Select all 4,213 matching".
   *
   * Cursor endpoints return no `total` by design (AD-023), so without this the offer is
   * made without a number rather than with a guessed one.
   */
  countEndpoint?: string;
  /**
   * Query parameters the screen owns itself, sent verbatim alongside the table's own.
   *
   * For endpoints that read flat parameters (`?status=active&inventory_type_id=…`) rather than
   * the §4 `filter[…]` grammar, which no endpoint parses yet (`capabilities.ts`). Empty values
   * are omitted. Changing any value resets the cursor and the selection, because both
   * describe a position in, and a subset of, the OLD result set.
   */
  params?: Record<string, string | undefined>;
  syncUrl?: boolean;
  enabled?: boolean;
  /**
   * Per-table opt-in for the capabilities whose server half does not exist yet.
   *
   * Off by default — see `capabilities.ts`. Passing `{ columnFilters: true }` for an
   * endpoint that does not parse the §4 grammar produces a screen that claims to be
   * filtered and is not.
   */
  capabilities?: Partial<DataTableCapabilities>;
}

export interface FacetMap {
  [column: string]: FilterOption[];
}

export interface DataTableApi<TRow> {
  rows: TRow[];
  columns: ColumnDef<TRow, unknown>[];
  controls: ListQueryControls;
  preferences: TablePreferenceControls;

  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;

  hasMore: boolean;
  nextCursor: string | null;
  perPageOptions: readonly number[];
  narrowed: boolean;

  facets: FacetMap;
  requestFacets: () => void;
  capabilities: DataTableCapabilities;

  selection: SelectionApi;
  can: (permission: string | undefined) => boolean;

  options: UseDataTableOptions<TRow>;
  /** The active query string, shared by the export request so it exports what is on screen. */
  queryString: string;
}

export interface SelectionApi {
  mode: 'multi' | 'single' | false;
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  togglePage: (ids: string[]) => void;
  allMatching: boolean;
  selectAllMatching: () => void;
  clear: () => void;
  count: number;
  matchingCount: string | undefined;
  /** What a bulk action is given — ids, or the filter expression for "all matching". */
  asSelection: () => Selection;
}

export function useDataTable<TRow>(options: UseDataTableOptions<TRow>): DataTableApi<TRow> {
  const {
    key, queryKey, endpoint, columns,
    select = false, defaultSort = '', defaultPerPage = 50,
    perPageOptions = [25, 50, 100, 200],
    getRowId = (row: TRow) => (row as { id: string }).id,
    countEndpoint, syncUrl = true, enabled = true,
  } = options;

  // Off unless this table has explicitly earned them, endpoint by endpoint.
  const capabilities = resolveCapabilities(options.capabilities);

  // Sorted and emptied of blanks, so one set of parameters is one cache key and one request.
  const params = normaliseParams(options.params);
  const paramsKey = new URLSearchParams(params).toString();

  // A parameter change resets the cursor and the selection inside the list-state hook itself.
  const controls = useListQuery({ defaultSort, defaultPerPage, syncUrl, resetKey: paramsKey });
  const preferences = useTablePreferences(key);
  const can = usePermissionCheck();

  const tableQuery = serialiseListQuery(controls.query);
  const queryString = paramsKey === ''
    ? tableQuery
    : `${tableQuery}${tableQuery === '' ? '?' : '&'}${paramsKey}`;

  const list = useQuery({
    // The params join the key as their sorted string, appended rather than folded into the
    // factory's argument: one parameter set is one cache entry, and the factory is still
    // called exactly as it always was.
    queryKey: [...queryKey(controls.query as unknown as Record<string, unknown>), paramsKey],
    queryFn: () => apiFetch<ListEnvelope<TRow>>(`${endpoint}${queryString}`),
    enabled,
    /*
     | Keep the previous page on screen while the next one loads.
     |
     | Without this every sort, filter and page step blanks the grid to a skeleton, which
     | reads as "it broke" rather than "it is working" — and on a fast connection it is a
     | flash of nothing at all, which is worse (06-ui-ux §5, §8).
    */
    placeholderData: keepPreviousData,
  });

  // ---- Facets -----------------------------------------------------------------------------
  // A separate key with a longer staleTime than the rows: the options behind a filter menu
  // change far more slowly than the rows they filter, and re-counting 40,000 rows every time
  // a menu opens is exactly the expensive-query denial 07 §1 threat #8 describes.
  const [facetsWanted, setFacetsWanted] = useState(false);

  const facetFields = useMemo(
    () => columns
      .map((column) => (column.meta?.filter?.type === 'faceted' && column.meta.filter.source === 'facets'
        ? columnIdOf(column)
        : undefined))
      .filter((id): id is string => id !== undefined),
    [columns],
  );

  const facetQueryString = useMemo(() => {
    if (facetFields.length === 0) return '';

    // Counts must respect the OTHER active filters, so the facet request carries the same
    // filter state as the list — minus the cursor and the page size, which mean nothing here.
    const params = serialiseListQuery({ ...controls.query, cursor: '', perPage: 0 })
      .replace(/[?&]per_page=0/, '');

    return `?fields=${facetFields.join(',')}${params.replace('?', '&')}`;
  }, [facetFields, controls.query]);

  const facetsQuery = useQuery({
    queryKey: [...queryKey({ facets: facetQueryString }), 'facets'],
    queryFn: () => apiFetch<{ data: FacetMap }>(`${endpoint}/facets${facetQueryString}`),
    enabled: enabled && capabilities.facets && facetsWanted && facetFields.length > 0,
    staleTime: 5 * 60_000,
    // The facets endpoint may not exist yet on a given resource. A filter menu that cannot
    // show counts is a degraded menu, not a broken screen, so this never surfaces an error.
    retry: false,
  });

  /*
   | The server sends `label: null` for enum values (the client translates them) and a `null`
   | VALUE for rows where the column is empty. An option needs a string value to be filtered
   | on, so the empty bucket is dropped rather than offered as a choice that cannot work.
  */
  const normalisedFacets = useMemo<FacetMap>(() => {
    const raw = facetsQuery.data?.data ?? {};
    const out: FacetMap = {};

    for (const column of columns) {
      const id = columnIdOf(column);
      const spec = column.meta?.filter;
      const entries = id === undefined ? undefined : (raw[id] as Array<Partial<FilterOption> & { value: string | null; label?: string | null }> | undefined);

      if (id === undefined || entries === undefined || spec?.type !== 'faceted') continue;

      out[id] = entries
        .filter((entry): entry is typeof entry & { value: string } => typeof entry.value === 'string')
        .map((entry) => ({
          value: entry.value,
          label: entry.label ?? spec.labelFor?.(entry.value) ?? entry.value,
          count: entry.count,
        }));
    }

    return out;
  }, [facetsQuery.data, columns]);

  // ---- Selection --------------------------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allMatching, setAllMatching] = useState(false);

  // Any change to WHICH rows match clears the selection. A selection that silently survives
  // a filter change is how a user deletes the wrong rows (§3.5).
  const [seenReset, setSeenReset] = useState(controls.resetToken);

  if (seenReset !== controls.resetToken) {
    setSeenReset(controls.resetToken);
    setSelectedIds([]);
    setAllMatching(false);
  }

  const countQuery = useQuery({
    queryKey: [...queryKey(controls.query as unknown as Record<string, unknown>), paramsKey, 'count'],
    queryFn: () => apiFetch<{ data: { count: string } }>(`${countEndpoint ?? ''}${queryString}`),
    enabled: enabled && countEndpoint !== undefined && select === 'multi',
    staleTime: 60_000,
    retry: false,
  });

  const pageRows = list.data?.data;
  // A rejected sort must not blank the grid (PLT-UI-010). The last successful page stays
  // readable; the inline error names the column. Any other error still replaces the grid.
  const [retainedRows, setRetainedRows] = useState<TRow[]>([]);

  if (pageRows !== undefined && pageRows !== retainedRows) {
    setRetainedRows(pageRows);
  }

  const fieldError = list.isError && isFieldQueryError(list.error);
  const rows = pageRows ?? (fieldError ? retainedRows : []);

  const selection = useMemo<SelectionApi>(() => ({
    mode: select,
    selectedIds,
    isSelected: (id) => allMatching || selectedIds.includes(id),
    toggle: (id) => {
      setAllMatching(false);
      setSelectedIds((current) => (select === 'single'
        ? (current[0] === id ? [] : [id])
        : current.includes(id) ? current.filter((each) => each !== id) : [...current, id]));
    },
    togglePage: (ids) => {
      setAllMatching(false);
      setSelectedIds((current) => (ids.every((id) => current.includes(id))
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])]));
    },
    allMatching,
    selectAllMatching: () => {
      /*
        A guard, not just a hidden button.
        
        The bar already hides the affordance when the flag is off, but hiding a control is
        not the same as disabling the behaviour — any caller holding the SelectionApi could
        still invoke this. With the flag off, "all matching" would post a filter expression
        to an endpoint that ignores `filter`, and a bulk delete would then act on every row
        rather than the 4,213 the user narrowed to.
      */
      if (!capabilities.selectAllMatching) return;

      setAllMatching(true);
      setSelectedIds(rows.map(getRowId));
    },
    clear: () => {
      setAllMatching(false);
      setSelectedIds([]);
    },
    count: allMatching ? Number.NaN : selectedIds.length,
    matchingCount: countQuery.data?.data.count,
    asSelection: () => (allMatching
      ? { mode: 'matching', expression: filterExpressionOf(controls.query) }
      : { mode: 'ids', ids: selectedIds }),
  }), [select, selectedIds, allMatching, rows, getRowId, countQuery.data, controls.query, capabilities]);

  return {
    rows,
    columns,
    controls,
    preferences,
    isLoading: list.isPending,
    isFetching: list.isFetching,
    isError: list.isError,
    error: list.error,
    refetch: () => void list.refetch(),
    hasMore: list.data?.meta.has_more ?? false,
    nextCursor: list.data?.meta.next_cursor ?? null,
    perPageOptions,
    narrowed: isNarrowed(controls.query),
    facets: normalisedFacets,
    requestFacets: useCallback(() => setFacetsWanted(true), []),
    capabilities,
    selection,
    can,
    options,
    queryString,
  };
}

/** A 422 on a sort or filter the endpoint does not allow. The rows already loaded stay. */
export function isFieldQueryError(error: unknown): boolean {
  const code = error instanceof ApiError
    ? error.code
    : (error as { body?: { error_code?: string } } | null)?.body?.error_code;

  return code === 'UNSORTABLE_FIELD' || code === 'UNFILTERABLE_FIELD';
}

/** A `ColumnDef` may identify itself by `id` or by `accessorKey`; the filter needs one name. */
export function columnIdOf<TRow>(column: ColumnDef<TRow, unknown>): string | undefined {
  if (column.id !== undefined) return column.id;

  const accessor = (column as { accessorKey?: string }).accessorKey;

  return accessor;
}

/** A fresh idempotency key per bulk attempt (AD-027). */
export const bulkIdempotencyKey = (): string => newId();

/** Drop empty values and sort the keys: one parameter set, one request, one cache entry. */
function normaliseParams(params: Record<string, string | undefined> | undefined): Record<string, string> {
  if (params === undefined) return {};

  return Object.fromEntries(
    Object.entries(params)
      .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}
