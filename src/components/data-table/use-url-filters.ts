import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * A screen's own header filters — `?status=active,inactive&site_id=01J…` — living in the URL.
 *
 * These are the FLAT parameters the list endpoints read today (`InventoryMasterController::
 * whereAnyOf`), not the `filter[…]` grammar, which no endpoint parses yet (`capabilities.ts`).
 * Each value is ONE comma-joined string, exactly what `ColumnFunnel` produces and what
 * `anyOf()` splits — so the funnel, the URL and the request share one shape.
 *
 * Every screen with a funnel used to write this by hand: read the URL once, keep a state per
 * filter, rebuild the query string on every change without dropping `sort` / `q` / `cursor`,
 * and keep `history.state` so TanStack Router does not lose its place. Done once here.
 *
 * Hand `params` to `useDataTable({ params })`. A change there resets the cursor and the
 * selection inside the table — a cursor is only valid for the query that minted it, and a
 * selection that survives a filter change is how somebody deletes the wrong rows.
 */
export interface UrlFilters<K extends string> {
  /** Each filter's current value, `''` when it is not filtering. */
  values: Record<K, string>;
  set: (key: K, value: string) => void;
  /** Every filter back to "any", in one URL write. */
  clear: () => void;
  /** For `useDataTable({ params })`. An empty value is `undefined`, so it is not sent. */
  params: Record<K, string | undefined>;
  /** True when any of these filters is narrowing — `ServerDataTable`'s `narrowed`. */
  narrowed: boolean;
}

function readValues<K extends string>(keys: readonly K[]): Record<K, string> {
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);

  return Object.fromEntries(keys.map((key) => [key, params.get(key) ?? ''])) as Record<K, string>;
}

/**
 * Write these keys and leave every other parameter where it was.
 *
 * `replaceState`, not `pushState`: a filter tick is not a page the Back button should step
 * through. The router keeps its location on `history.state`, so that is passed through
 * untouched — a replace with `''` drops it.
 */
function writeValues(values: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);

  for (const [key, value] of Object.entries(values)) {
    if (value === '') params.delete(key);
    else params.set(key, value);
  }

  const search = params.toString();
  const next = `${window.location.pathname}${search === '' ? '' : `?${search}`}${window.location.hash}`;

  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, '', next);
  }
}

const keysOf = <K extends string>(signature: string): K[] =>
  (signature === '' ? [] : signature.split(',')) as K[];

export function useUrlFilters<K extends string>(keys: readonly K[]): UrlFilters<K> {
  // The key list is usually an inline array literal; a joined string keeps the callbacks
  // stable across renders without asking every caller to memoise it.
  const signature = keys.join(',');
  const [values, setValues] = useState<Record<K, string>>(() => readValues(keys));

  // Back and Forward restore whatever the URL then says.
  useEffect(() => {
    const onPop = (): void => setValues(readValues(keysOf<K>(signature)));

    window.addEventListener('popstate', onPop);

    return () => window.removeEventListener('popstate', onPop);
  }, [signature]);

  const set = useCallback((key: K, value: string): void => {
    writeValues({ [key]: value });
    setValues((current) => (current[key] === value ? current : { ...current, [key]: value }));
  }, []);

  const clear = useCallback((): void => {
    const empty = Object.fromEntries(keysOf<K>(signature).map((key) => [key, ''])) as Record<K, string>;

    writeValues(empty);
    setValues(empty);
  }, [signature]);

  return useMemo(() => {
    const entries = Object.entries(values) as Array<[K, string]>;

    return {
      values,
      set,
      clear,
      params: Object.fromEntries(entries.map(([key, value]) => [key, value === '' ? undefined : value])) as Record<K, string | undefined>,
      narrowed: entries.some(([, value]) => value !== ''),
    };
  }, [values, set, clear]);
}
