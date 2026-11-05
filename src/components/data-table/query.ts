/**
 * The list query grammar, and the only place it is written (05-conventions §4).
 *
 *   ?filter[status]=approved
 *   &filter[created_at][gte]=2026-08-01
 *   &sort=-created_at
 *   &q=free+text
 *   &cursor=…&per_page=50
 *
 * Pure functions with no React and no fetch, because this is the part that is worth testing
 * exhaustively: a filter that serialises to a shape the server does not read fails SILENTLY —
 * the request succeeds, the rows come back unfiltered, and the screen looks like it works.
 */

export type FilterOp = 'eq' | 'like' | 'in' | 'gte' | 'lte';

export interface FilterValue {
  op: FilterOp;
  /** `in` carries a list; every other operator carries one value. Always strings (AD-024). */
  value: string | string[];
}

/** Column id → the one active filter on it. */
export type FilterState = Record<string, FilterValue>;

export interface ListQuery {
  /** `-created_at` is descending. Empty means "the endpoint's own default order". */
  sort: string;
  q: string;
  filter: FilterState;
  /** Opaque base64url token encoding `(sort_value, id)`. Never parsed, never constructed. */
  cursor: string;
  perPage: number;
}

export const emptyListQuery = (perPage = 50, sort = ''): ListQuery => ({
  sort,
  q: '',
  filter: {},
  cursor: '',
  perPage,
});

/**
 * `eq` uses the bare form, every other operator is bracketed.
 *
 * This asymmetry is in the spec, not an accident: `filter[status]=approved` reads naturally
 * and is what a human types into a URL bar, while `filter[created_at][gte]=…` has nowhere
 * else to put the operator.
 */
function appendFilter(params: URLSearchParams, column: string, { op, value }: FilterValue): void {
  const key = op === 'eq' ? `filter[${column}]` : `filter[${column}][${op}]`;

  if (Array.isArray(value)) {
    // An empty `in` is not a filter matching nothing — it is no filter at all. Emitting
    // `filter[x][in]=` would ask the server to match the empty string.
    if (value.length === 0) return;

    params.set(key, value.join(','));

    return;
  }

  if (value === '') return;

  params.set(key, value);
}

// RAAD lists read `search`, `sort_by`, `sort_dir`, `page` and `per_page`. The old Haltoon
// names stay in this set so a rewritten URL does not keep both grammars at once.
const LIST_QUERY_KEYS: ReadonlySet<string> = new Set([
  'sort', 'q', 'cursor', 'per_page', 'search', 'sort_by', 'sort_dir', 'page',
]);

/**
 * Write list state into an existing query string without dropping keys this hook does not own.
 *
 * The item list's type, category and status travel as flat parameters — the grammar that
 * endpoint reads. They are not `filter[…]`. A sort change that rebuilt the query from the
 * list state alone would wipe them, and the filter would look applied while the URL (and
 * the next refresh) had forgotten it.
 */
export function mergeListQueryIntoSearch(current: string, query: ListQuery): string {
  const params = new URLSearchParams(current.startsWith('?') ? current.slice(1) : current);

  for (const key of [...params.keys()]) {
    if (LIST_QUERY_KEYS.has(key) || key.startsWith('filter[')) {
      params.delete(key);
    }
  }

  const serialised = new URLSearchParams(serialiseListQuery(query).replace(/^\?/, ''));

  for (const [key, value] of serialised) {
    params.set(key, value);
  }

  const search = params.toString();

  return search === '' ? '' : `?${search}`;
}

/**
 * Serialise to the query string the API expects.
 *
 * Key order is deterministic — filters by sorted column name, then sort, q, cursor, per_page
 * — because this string is also part of the TanStack Query cache key, and two orderings of
 * the same filter would be two cache entries for one result set.
 */
export function serialiseListQuery(query: ListQuery): string {
  const params = new URLSearchParams();

  for (const column of Object.keys(query.filter).sort()) {
    const value = query.filter[column];
    if (value) appendFilter(params, column, value);
  }

  if (query.sort !== '') {
    const descending = query.sort.startsWith('-');
    const field = (descending ? query.sort.slice(1) : query.sort).split(',')[0] ?? '';
    if (field !== '') {
      params.set('sort_by', field);
      params.set('sort_dir', descending ? 'desc' : 'asc');
    }
  }
  if (query.q !== '') params.set('search', query.q);
  // The cursor slot holds the page number. Page 1 is the absent key, matching the API default.
  if (query.cursor !== '' && query.cursor !== '1') params.set('page', query.cursor);
  params.set('per_page', String(query.perPage));

  const serialised = params.toString();

  return serialised === '' ? '' : `?${serialised}`;
}

const FILTER_PATTERN = /^filter\[([^\]]+)\](?:\[([^\]]+)\])?$/;

const OPS: ReadonlySet<string> = new Set<FilterOp>(['eq', 'like', 'in', 'gte', 'lte']);

/** The inverse of `serialiseListQuery`, for reading state back out of the browser URL. */
export function parseListQuery(search: string, fallbackPerPage = 50): ListQuery {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const filter: FilterState = {};

  for (const [key, raw] of params.entries()) {
    const match = FILTER_PATTERN.exec(key);
    if (!match) continue;

    const column = match[1];
    if (column === undefined) continue;

    const op = match[2] ?? 'eq';
    if (!OPS.has(op)) continue;

    filter[column] = {
      op: op as FilterOp,
      value: op === 'in' ? raw.split(',').filter((part) => part !== '') : raw,
    };
  }

  const perPage = Number.parseInt(params.get('per_page') ?? '', 10);
  const sortBy = params.get('sort_by') ?? '';
  const sortDir = params.get('sort_dir') === 'asc' ? '' : '-';
  const page = params.get('page') ?? '';

  return {
    sort: sortBy !== '' ? `${sortDir}${sortBy}` : (params.get('sort') ?? ''),
    q: params.get('search') ?? params.get('q') ?? '',
    filter,
    cursor: page !== '' && page !== '1' ? page : (params.get('cursor') ?? ''),
    // `Number.parseInt` on the string form of a whole count is not money arithmetic — it is
    // a page size, which is a UI control with four allowed values (AD-044 is about values
    // that must stay exact, and a page size is not one of them).
    perPage: Number.isFinite(perPage) && perPage > 0 ? perPage : fallbackPerPage,
  };
}

/**
 * The tri-state sort cycle: none → asc → desc → none.
 *
 * "None" is a real, total, indexed order — `CursorPaginator` falls back to `(primary key,
 * desc)` when `sort` is absent — so returning to it is safe under cursor pagination rather
 * than being an absence of order.
 */
export function nextSort(current: string, sortKey: string): string {
  if (current === sortKey) return `-${sortKey}`;
  if (current === `-${sortKey}`) return '';

  return sortKey;
}

export type SortDirection = 'asc' | 'desc' | undefined;

/**
 * Which way this column is currently sorted, if at all.
 *
 * `sort` may carry several keys (`-created_at,name`, 05 §4). The chevron belongs on the
 * LEADING key — it is the one that actually determines the order a reader sees.
 */
export function sortDirectionFor(sort: string, sortKey: string | undefined): SortDirection {
  if (sortKey === undefined || sort === '') return undefined;

  const leading = sort.split(',')[0] ?? '';

  if (leading === sortKey) return 'asc';
  if (leading === `-${sortKey}`) return 'desc';

  return undefined;
}

/**
 * The filter expression sent to an export or a bulk action when "all matching" is selected.
 *
 * Deliberately NOT the loaded row ids: a user who filters to 4,213 rows and acts on the 50
 * on screen has silently done the wrong thing, and sending 4,213 ULIDs in a request body is
 * a different bug at every page size (§3.5).
 */
export interface FilterExpression {
  filter: FilterState;
  q: string;
  sort: string;
}

export const filterExpressionOf = ({ filter, q, sort }: ListQuery): FilterExpression => ({
  filter,
  q,
  sort,
});

/** True when anything is narrowing the list — decides empty-no-data vs empty-no-results. */
export const isNarrowed = (query: ListQuery): boolean =>
  query.q !== '' || Object.keys(query.filter).length > 0;
