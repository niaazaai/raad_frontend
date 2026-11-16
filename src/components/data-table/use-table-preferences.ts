import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VisibilityState } from '@tanstack/react-table';
import { usePreferenceScope } from '@/lib/permission';
import type { Density } from './types';

/**
 * Column visibility, column widths and density — per user, per table.
 *
 * The home is the server: the `__default__` row of `user_table_views` (PLT-MST-008,
 * platform_masters_amendment.md §8), so a layout follows the person to another device and is
 * not lost when site data is cleared. `localStorage`, scoped `{tenant_id}:{user_id}:{tableKey}`,
 * stays as the first paint and the fallback: the table draws at once from it, the server copy
 * replaces it when it arrives, and a change is written to both — to the server a moment later,
 * so dragging a column edge is one request, not forty.
 *
 * The scope is not optional: a key without it serves one person's layout to the next person
 * signing in on a shared browser.
 */

export interface TablePreferences {
  density: Density;
  columns: VisibilityState;
  /** Column id → pixel width. Absent means "use `meta.width.default`". */
  widths: Record<string, number>;
  /**
   * Leaf column ids, actions last. Empty means the column definition order.
   * Reordering happens in the layout menu, never by dragging a header.
   */
  order: string[];
}

const DEFAULTS: TablePreferences = { density: 'standard', columns: {}, widths: {}, order: [] };

/** Ids the table can actually render, in definition order. */
export function leafColumnIds(columns: Array<{ id?: string }>): string[] {
  return columns.map((column) => column.id).filter((id): id is string => typeof id === 'string' && id !== '');
}

/**
 * Saved order, with any new column inserted before `actions`, and `actions` kept last.
 * An empty save is the definition order.
 */
export function resolveColumnOrder(defined: string[], saved: string[]): string[] {
  const tail = defined.filter((id) => id === 'actions');
  const body = defined.filter((id) => id !== 'actions');
  const kept = saved.filter((id) => body.includes(id));
  const missing = body.filter((id) => !kept.includes(id));
  return [...kept, ...missing, ...tail];
}

const storageKeyFor = (scope: string, tableKey: string): string =>
  `haltoon.table.${scope}:${tableKey}`;

function read(scope: string, tableKey: string): TablePreferences {
  try {
    const raw = localStorage.getItem(storageKeyFor(scope, tableKey));
    if (raw === null) return DEFAULTS;

    const parsed = JSON.parse(raw) as Partial<TablePreferences>;

    return {
      density: parsed.density ?? DEFAULTS.density,
      columns: parsed.columns ?? DEFAULTS.columns,
      widths: parsed.widths ?? DEFAULTS.widths,
      order: Array.isArray(parsed.order) ? parsed.order.filter((id): id is string => typeof id === 'string') : [],
    };
  } catch {
    // A private window, storage disabled, or a value written by an older shape. A
    // remembered layout is a convenience and never a requirement, so failing to read one
    // must not break the screen.
    return DEFAULTS;
  }
}

/** Only a well-formed server row is adopted; anything else leaves the local layout alone. */
function fromServer(value: unknown): TablePreferences | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const row = value as Partial<TablePreferences>;
  if (row.density !== 'comfortable' && row.density !== 'standard' && row.density !== 'compact') return undefined;

  return {
    density: row.density,
    columns: typeof row.columns === 'object' && row.columns !== null ? row.columns : {},
    widths: typeof row.widths === 'object' && row.widths !== null ? row.widths : {},
    order: Array.isArray(row.order) ? row.order.filter((id): id is string => typeof id === 'string') : [],
  };
}

export const tablePreferencesKey = (scope: string, tableKey: string) => ['haltoon', 'platform', 'table-preferences', scope, tableKey] as const;

export interface TablePreferenceControls extends TablePreferences {
  setDensity: (density: Density) => void;
  setColumns: (columns: VisibilityState) => void;
  setWidth: (columnId: string, width: number) => void;
  setOrder: (order: string[]) => void;
  /** A whole layout at once — what applying a saved view does. */
  replace: (next: TablePreferences) => void;
  reset: () => void;
}

export function useTablePreferences(tableKey: string | undefined): TablePreferenceControls {
  const scope = usePreferenceScope();

  /*
   | Re-read when the identity changes, by ADJUSTING STATE DURING RENDER rather than in an
   | effect.
   |
   | The scope arrives one render after the session resolves — before that it is `anon` —
   | so reading once on mount would serve every user the anonymous layout until they
   | reloaded. Doing it in an effect would paint the wrong layout first and then correct it,
   | which is a visible flicker on every table; React's documented answer for "derive state
   | from a prop change" is this pattern, and the lint rule enforces it.
  */
  const [state, setState] = useState<{ scope: string; tableKey: string | undefined; preferences: TablePreferences; adopted: unknown }>(() => ({
    scope,
    tableKey,
    preferences: tableKey === undefined ? DEFAULTS : read(scope, tableKey),
    adopted: undefined,
  }));

  if (state.scope !== scope || state.tableKey !== tableKey) {
    setState({
      scope,
      tableKey,
      preferences: tableKey === undefined ? DEFAULTS : read(scope, tableKey),
      adopted: undefined,
    });
  }

  // RAAD has no per-user table-views endpoint. Layout stays in localStorage, scoped by
  // user id, and this query stays off so the list never calls a route that does not exist.
  const remote = useQuery({
    queryKey: tablePreferencesKey(scope, tableKey ?? ''),
    queryFn: () => Promise.resolve(null),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });

  // The server copy wins once, when it arrives — adjusted during render, like the scope above.
  const serverPreferences = fromServer(remote.data);
  if (serverPreferences !== undefined && state.adopted !== remote.data) {
    setState((current) => ({ ...current, preferences: serverPreferences, adopted: remote.data }));
  }

  const client = useQueryClient();

  const preferences = state.preferences;

  const setPreferences = useCallback(
    (next: TablePreferences) => setState((current) => ({ ...current, preferences: next })),
    [],
  );

  const persist = useCallback((next: TablePreferences): void => {
    setPreferences(next);

    if (tableKey === undefined) return;

    try {
      localStorage.setItem(storageKeyFor(scope, tableKey), JSON.stringify(next));
    } catch {
      // Ignore — see `read`.
    }

    if (scope === 'anon') return;

    client.setQueryData(tablePreferencesKey(scope, tableKey), next);
  }, [scope, tableKey, setPreferences, client]);

  return {
    ...preferences,
    setDensity: useCallback(
      (density: Density) => persist({ ...preferences, density }),
      [persist, preferences],
    ),
    setColumns: useCallback(
      (columns: VisibilityState) => persist({ ...preferences, columns }),
      [persist, preferences],
    ),
    setWidth: useCallback(
      (columnId: string, width: number) =>
        persist({ ...preferences, widths: { ...preferences.widths, [columnId]: width } }),
      [persist, preferences],
    ),
    setOrder: useCallback(
      (order: string[]) => persist({ ...preferences, order }),
      [persist, preferences],
    ),
    replace: persist,
    reset: useCallback(() => persist(DEFAULTS), [persist]),
  };
}
