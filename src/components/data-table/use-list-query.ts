import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  emptyListQuery, mergeListQueryIntoSearch, parseListQuery,
  type FilterValue, type ListQuery,
} from './query';

/**
 * List state — sort, search, filters, page size and the cursor stack — living in the URL.
 *
 * 05-conventions §5 requires list filters in the URL so a filtered list is shareable and
 * survives a refresh. A user who narrows 40,000 rows to the 12 they care about and then
 * cannot send that view to a colleague will paste a screenshot instead.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────
 * ADAPTER NOTE — read before changing this file.
 *
 * The router is live (`web/src/router`). List search is still written here, and only here,
 * because the screen routes do not declare a search schema — `navigate({ search })` on a
 * route with no `validateSearch` is not where `sort` and `q` have a typed home yet.
 *
 * The writer preserves every query key it does not own. The item list's `status`,
 * `inventory_type_id` and `inventory_category_id` are flat parameters the endpoint reads;
 * folding them into `filter[…]` would be a filter the server silently drops. Do not spread
 * `window.history` calls into a screen.
 * ────────────────────────────────────────────────────────────────────────────────────────
 */

export interface UseListQueryOptions {
  /** The endpoint's own default order, e.g. `-created_at`. */
  defaultSort?: string;
  defaultPerPage?: number;
  /**
   * Off for a table that is not the screen's subject — a panel inside a detail page, a
   * picker in a dialog. Two tables writing to one URL would overwrite each other.
   */
  syncUrl?: boolean;
  /**
   * Anything outside this hook that changes which rows match — a screen's own parameters.
   * When it changes, the cursor, the stack and the selection reset, exactly as they do for a
   * filter change here.
   */
  resetKey?: string;
}

export interface ListQueryControls {
  query: ListQuery;
  /** What the search box shows: the un-debounced value, so typing feels immediate. */
  searchDraft: string;

  setSort: (sortKey: string) => void;
  setSearch: (value: string) => void;
  setFilter: (column: string, value: FilterValue | undefined) => void;
  clearFilters: () => void;
  setPerPage: (perPage: number) => void;

  /** Cursor pagination: forward by token, back by popping the stack of visited cursors. */
  goNext: (nextCursor: string | null) => void;
  goPrevious: () => void;
  canGoPrevious: boolean;
  /** How many pages deep we are, 0-based — the only honest position indicator we have. */
  pageIndex: number;

  /** Bumped whenever a change invalidates a selection, so the table can clear it. */
  resetToken: number;

  /**
   * Back to the first page, and the selection cleared, without touching search or filters.
   *
   * For inputs the table does not own — a screen's own parameters — that still change which
   * rows match. A cursor is only valid for the query that minted it.
   */
  resetPosition: () => void;
}

const DEBOUNCE_MS = 300;

function readUrl(defaultSort: string, defaultPerPage: number, syncUrl: boolean): ListQuery {
  if (!syncUrl || typeof window === 'undefined') {
    return emptyListQuery(defaultPerPage, defaultSort);
  }

  const parsed = parseListQuery(window.location.search, defaultPerPage);

  // An absent `sort` in the URL means "the endpoint's default", not "no order at all".
  return parsed.sort === '' ? { ...parsed, sort: defaultSort } : parsed;
}

export function useListQuery({
  defaultSort = '',
  defaultPerPage = 50,
  syncUrl = true,
  resetKey = '',
}: UseListQueryOptions = {}): ListQueryControls {
  const [query, setQuery] = useState<ListQuery>(() => readUrl(defaultSort, defaultPerPage, syncUrl));
  const [searchDraft, setSearchDraft] = useState(query.q);
  const [stack, setStack] = useState<string[]>([]);
  const [resetToken, setResetToken] = useState(0);

  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /*
   | Adjusted during render rather than in an effect. An effect would let one request go out
   | with the new parameters and the OLD cursor first — a position in a result set that cursor
   | was never minted for.
  */
  const [seenResetKey, setSeenResetKey] = useState(resetKey);

  if (seenResetKey !== resetKey) {
    setSeenResetKey(resetKey);
    setQuery((current) => ({ ...current, cursor: '' }));
    setStack([]);
    setResetToken((token) => token + 1);
  }

  // Write the URL whenever the query changes, and read it back when the user presses Back.
  useEffect(() => {
    if (!syncUrl || typeof window === 'undefined') return;

    const next = `${window.location.pathname}${mergeListQueryIntoSearch(window.location.search, query)}`;

    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [query, syncUrl]);

  useEffect(() => {
    if (!syncUrl || typeof window === 'undefined') return undefined;

    const onPop = (): void => {
      setQuery(readUrl(defaultSort, defaultPerPage, syncUrl));
      setStack([]);
    };

    window.addEventListener('popstate', onPop);

    return () => window.removeEventListener('popstate', onPop);
  }, [defaultSort, defaultPerPage, syncUrl]);

  useEffect(() => () => clearTimeout(debounce.current), []);

  /**
   * Every change that alters WHICH rows match invalidates the cursor and the selection.
   *
   * A cursor is only valid for the query and the page size that minted it, and a selection
   * that silently survives a filter change is how a user deletes the wrong rows (§3.5).
   */
  const applyNarrowing = useCallback((patch: Partial<ListQuery>): void => {
    setQuery((current) => ({ ...current, ...patch, cursor: '' }));
    setStack([]);
    setResetToken((token) => token + 1);
  }, []);

  const setSort = useCallback((sort: string): void => {
    // Sorting reorders the same matching set, so the selection survives — but the cursor
    // cannot, because it encodes a position in the OLD order.
    setQuery((current) => ({ ...current, sort, cursor: '' }));
    setStack([]);
  }, []);

  const setSearch = useCallback((value: string): void => {
    setSearchDraft(value);
    clearTimeout(debounce.current);

    // 300ms (06-ui-ux §8). Debouncing the request, not the input: the box updates on every
    // keystroke, so typing never feels laggy.
    debounce.current = setTimeout(() => applyNarrowing({ q: value }), DEBOUNCE_MS);
  }, [applyNarrowing]);

  const setFilter = useCallback((column: string, value: FilterValue | undefined): void => {
    setQuery((current) => {
      const filter = { ...current.filter };

      if (value === undefined) delete filter[column];
      else filter[column] = value;

      return { ...current, filter, cursor: '' };
    });
    setStack([]);
    setResetToken((token) => token + 1);
  }, []);

  const clearFilters = useCallback((): void => {
    clearTimeout(debounce.current);
    setSearchDraft('');
    applyNarrowing({ filter: {}, q: '' });
  }, [applyNarrowing]);

  const setPerPage = useCallback((perPage: number): void => {
    applyNarrowing({ perPage });
  }, [applyNarrowing]);

  const resetPosition = useCallback((): void => applyNarrowing({}), [applyNarrowing]);

  const goNext = useCallback((nextCursor: string | null): void => {
    if (nextCursor === null || nextCursor === '') return;

    setQuery((current) => {
      // Remember where we were so Previous has somewhere to return to. There is no way to
      // synthesise a backwards cursor — the token encodes one direction of travel.
      setStack((visited) => [...visited, current.cursor]);

      return { ...current, cursor: nextCursor };
    });
  }, []);

  const goPrevious = useCallback((): void => {
    setStack((visited) => {
      if (visited.length === 0) return visited;

      const previous = visited[visited.length - 1] ?? '';

      setQuery((current) => ({ ...current, cursor: previous }));

      return visited.slice(0, -1);
    });
  }, []);

  return useMemo(() => ({
    query,
    searchDraft,
    setSort,
    setSearch,
    setFilter,
    clearFilters,
    setPerPage,
    goNext,
    goPrevious,
    canGoPrevious: stack.length > 0,
    pageIndex: stack.length,
    resetToken,
    resetPosition,
  }), [
    query, searchDraft, setSort, setSearch, setFilter, clearFilters,
    setPerPage, goNext, goPrevious, stack.length, resetToken, resetPosition,
  ]);
}
