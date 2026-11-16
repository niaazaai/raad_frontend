import { useCallback, useEffect, useState } from 'react';

/**
 * Which tab of a tabbed list page is showing, kept in `?tab=` so a refresh or a shared link
 * opens the same list.
 *
 * Every tab's table shares the page URL's `sort`, `cursor` and `per_page`, and each table
 * reads them while it mounts. A cursor is only valid for the query that minted it, and each
 * list has its own sort allowlist — so a switch drops both before the next table mounts, and
 * that list starts on its first page in its own default order. A sites cursor handed to the
 * locations list would land mid-page, and a category sort of `path` is a 422 on types.
 *
 * Search and the header filters (`useUrlFilters`) are left alone. A filter the next tab does
 * not read is the caller's to clear, on the same select.
 */
function readTab<T extends string>(tabs: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  const value = new URLSearchParams(window.location.search).get('tab') ?? '';

  return (tabs as readonly string[]).includes(value) ? value as T : fallback;
}

export function useUrlTab<T extends string>(tabs: readonly T[], fallback: T): readonly [T, (next: T) => void] {
  // Usually an inline array; the joined string keeps the callbacks stable without a memo.
  const signature = tabs.join(',');
  const [tab, setTab] = useState<T>(() => readTab(tabs, fallback));

  useEffect(() => {
    const onPop = (): void => setTab(readTab(signature.split(',') as T[], fallback));

    window.addEventListener('popstate', onPop);

    return () => window.removeEventListener('popstate', onPop);
  }, [signature, fallback]);

  const select = useCallback((next: T): void => {
    const params = new URLSearchParams(window.location.search);

    params.set('tab', next);
    params.delete('sort');
    params.delete('cursor');

    const search = params.toString();
    // `history.state` passed through: TanStack Router keeps its place there.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${search}${window.location.hash}`);
    setTab(next);
  }, []);

  return [tab, select] as const;
}
