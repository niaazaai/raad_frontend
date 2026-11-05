import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from './i18n';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';

/** The lifecycle every master shares (`MasterStatus` on the server). */
export type MasterStatus = 'active' | 'inactive';

export const isMasterStatus = (status: string): status is MasterStatus =>
  status === 'active' || status === 'inactive';

/**
 * What `actionsColumn(t, build, inline, toggle)` needs to draw the switch before edit.
 *
 * Built by {@link useStatusToggle}; a screen never assembles one by hand.
 *
 * **Stable while a save is in flight.** TanStack's `flexRender` renders a column's `cell` as a
 * component, so a rebuilt column array remounts every cell — and the switch the person just
 * pressed with the keyboard would take their focus with it. So the object never changes for a
 * pending save; the switch subscribes to which row is saving and re-renders on its own.
 */
export interface StatusToggle<TRow> {
  /** False draws no switch: the user may read the status but not change it. */
  can: boolean;
  /** Whether this row's change is saving now. Read through `subscribe` to re-render on it. */
  isPending: (row: TRow) => boolean;
  subscribe: (listener: () => void) => () => void;
  toggle: (row: TRow) => void;
  /** Names the row for a screen reader — "Toggle status of Raw materials". */
  nameOf: (row: TRow) => string;
  /** Where the row's switch stands, or `null` for a row that gets no switch at all. */
  statusOf: (row: TRow) => MasterStatus | null;
}

const masterStatusOf = (row: { status: string }): MasterStatus | null =>
  (isMasterStatus(row.status) ? row.status : null);

/** Which row is saving, outside React state, so reading it never rebuilds the columns. */
function pendingStore() {
  let pending: string | undefined;
  const listeners = new Set<() => void>();

  return {
    get: (): string | undefined => pending,
    set: (id: string | undefined): void => {
      pending = id;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);

      return () => { listeners.delete(listener); };
    },
  };
}

/**
 * Active ⇄ inactive from the row's switch, with one implementation of the parts every
 * screen would otherwise get slightly different: one change in flight at a time, the row's
 * own switch busy while it saves, a toast naming the row and its new status, and a 409 read
 * as "someone else changed this" rather than as a generic failure (AD-026).
 *
 * `save` is the screen's knowledge of its endpoint — usually the resource's own save
 * mutation sent the row's current values with only `status` changed, because the master
 * requests mark `code` and `name` as required even on PATCH. Where a resource has a named
 * transition (`POST …/{id}/deactivate`, as the chart of accounts does) `save` calls that.
 * The list refreshes through the mutation's own invalidation; nothing is patched here.
 */
export function useStatusToggle<TRow extends { id: string | number; status: string }>({
  can, save, nameOf, statusOf,
}: {
  can: boolean;
  save: (row: TRow, next: MasterStatus) => Promise<unknown>;
  /** Defaults to `row.name`, then the id. */
  nameOf?: (row: TRow) => string;
  /**
   * For a row whose own status is a longer lifecycle than active/inactive — an item's
   * `draft → active → inactive → discontinued`. Map it onto the switch, and return `null`
   * for a state the switch must not touch. Defaults to the master status, as is.
   */
  statusOf?: (row: TRow) => MasterStatus | null;
}): StatusToggle<TRow> {
  const { t } = useTranslation();
  const [store] = useState(pendingStore);

  // `save` is usually an inline closure. Reading the latest one through a ref keeps `toggle`
  // stable, so the column array memoised on it is not rebuilt on every render.
  const saveRef = useRef(save);
  const nameRef = useRef(nameOf);
  const statusRef = useRef(statusOf);
  useEffect(() => {
    saveRef.current = save;
    nameRef.current = nameOf;
    statusRef.current = statusOf;
  });

  const describe = useCallback((row: TRow): string => {
    const named = nameRef.current?.(row) ?? (row as { name?: string }).name;
    return named && named !== '' ? named : String(row.id);
  }, []);

  const position = useCallback(
    (row: TRow): MasterStatus | null => (statusRef.current ?? masterStatusOf)(row),
    [],
  );

  const toggle = useCallback((row: TRow): void => {
    const current = position(row);

    if (!can || store.get() !== undefined || current === null) return;

    const next: MasterStatus = current === 'active' ? 'inactive' : 'active';

    store.set(String(row.id));

    saveRef.current(row, next)
      .then(() => {
        toast.success(t('table.statusChanged', { name: describe(row), status: t(`status.${next}`) }));
      })
      .catch((error: unknown) => {
        const conflict = error instanceof ApiError && error.status === 409;

        toast.error(conflict ? t('table.conflict') : t('table.statusFailed'), {
          description: !conflict && error instanceof Error ? error.message : undefined,
        });
      })
      .finally(() => store.set(undefined));
  }, [can, t, describe, position, store]);

  return useMemo(() => ({
    can,
    isPending: (row: TRow) => store.get() === String(row.id),
    subscribe: store.subscribe,
    toggle,
    nameOf: describe,
    statusOf: position,
  }), [can, toggle, describe, position, store]);
}
