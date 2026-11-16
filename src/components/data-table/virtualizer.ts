import { useMemo } from 'react';

/**
 * Stand-in for `@tanstack/react-virtual`.
 *
 * Lists on this screen stay under the virtualisation threshold, and this returns every row
 * with the same index/start/end shape so a larger page still paints instead of going blank.
 */
export function useVirtualizer(options: {
  count: number;
  getScrollElement: () => Element | null;
  estimateSize: () => number;
  overscan?: number;
  enabled?: boolean;
}) {
  const size = options.estimateSize();
  const count = options.enabled === false ? 0 : options.count;

  return useMemo(() => {
    const items = Array.from({ length: count }, (_, index) => ({
      index,
      start: index * size,
      end: (index + 1) * size,
      size,
      key: index,
    }));

    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * size,
    };
  }, [count, size]);
}
