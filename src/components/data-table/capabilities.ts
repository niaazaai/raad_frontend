/**
 * Capabilities that are BUILT on the client and NOT YET SAFE to switch on, because the
 * server half does not exist.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────
 * Why this file exists, stated plainly so nobody flips a flag without reading it.
 *
 * `05-conventions.md` §4 defines the list query grammar — `?filter[status]=approved`,
 * `?filter[created_at][gte]=…`. **No endpoint in `api/` implements it.** Every list
 * controller reads flat parameters (`$request->filled('status')`), so a request carrying
 * `filter[status]=approved` parses into `$request->input('filter.status')`, `filled('status')`
 * is false, and the filter is **silently dropped**. The response is `200`, the rows come
 * back unfiltered, and the screen shows a filter chip reading "status is approved" above a
 * list that was never filtered.
 *
 * That is worse than a broken feature. A user who exports, prints or acts on that list
 * believes it is narrowed when it is not.
 *
 * Building the grammar server-side is **`PLT-API-003`**, which is `BACKLOG`.
 * ────────────────────────────────────────────────────────────────────────────────────────
 *
 * Everything not listed here is on, because the backend already supports it: sort (the
 * `sortable` allowlist and `UnsortableFieldException` are live in `CursorPaginator`), `q`
 * (every list controller reads it), cursor pagination and `per_page`, plus the purely
 * client-side column resize, density and row actions.
 */

export interface DataTableCapabilities {
  /**
   * The column filter menu and its chips (`meta.filter`).
   *
   * Turn on per endpoint only once that endpoint parses the §4 grammar and a feature test
   * proves a filtered request returns fewer rows than an unfiltered one.
   */
  columnFilters: boolean;

  /**
   * Faceted option lists and their counts.
   *
   * Needs the facets endpoint (escalation B-1) **and** `columnFilters`, since a facet is
   * only useful as the source of a filter.
   */
  facets: boolean;

  /**
   * "Select all 4,213 matching", which posts a FILTER EXPRESSION instead of row ids.
   *
   * ⚠️ **The most dangerous flag in this file.** A bulk delete that posts
   * `{ scope: 'all', filter: {...} }` to an endpoint that ignores `filter` does not delete
   * the 4,213 matching rows — it deletes **everything the user can see**. Page selection is
   * unaffected and stays on, because it posts explicit ids that an endpoint cannot
   * misinterpret.
   *
   * Two conditions, both required, per endpoint: `PLT-API-003` has landed, **and** that
   * specific bulk endpoint has a test proving it honours the filter and refuses a request
   * whose filter it does not understand.
   */
  selectAllMatching: boolean;
}

/**
 * The defaults. **All three are off, and a test asserts it.**
 *
 * Changing a default here switches the behaviour on for every list screen in the system at
 * once, which is exactly the blast radius that needs a deliberate, reviewed decision rather
 * than a convenient edit during an unrelated feature.
 */
export const DEFAULT_CAPABILITIES: Readonly<DataTableCapabilities> = Object.freeze({
  columnFilters: false,
  facets: false,
  selectAllMatching: false,
});

/**
 * Per-table opt-in, once a specific endpoint has earned it.
 *
 * Deliberately per table rather than global: `PLT-API-003` will land endpoint by endpoint,
 * and "the grammar works on inventory items" is not evidence that it works on suppliers.
 */
export function resolveCapabilities(
  overrides?: Partial<DataTableCapabilities>,
): DataTableCapabilities {
  return { ...DEFAULT_CAPABILITIES, ...overrides };
}
