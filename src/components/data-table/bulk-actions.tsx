import type { ReactNode } from 'react';
import type { TFunction } from './i18n';
import { Trash2 } from 'lucide-react';
import { ApiError } from '@/api/client';
import type { BulkAction, BulkResult } from './use-data-table';

/**
 * Run one request per ticked row, reporting each failure by row.
 *
 * One request per row because the endpoints behind these have no bulk form, and a row the
 * server refuses answers on its own — "412 retired, 3 refused" is what the bar then says,
 * rather than one failure for the lot (§3.6).
 *
 * Only explicit ids are ever acted on. "All matching" posts a filter expression, and an
 * endpoint that ignores it would act on every row the user can see (`capabilities.ts`), so
 * that mode is refused here even if a screen turns it on.
 */
export function bulkRowAction({
  id, label, icon, permission, run, variant, confirm = 'simple',
}: {
  id: string;
  label: string;
  icon: ReactNode;
  /** The bar hides the button without it; the endpoint enforces it. */
  permission: string;
  /** Acts on one row by id — the resource's mutation, `mutateAsync`. */
  run: (id: string) => Promise<unknown>;
  variant?: BulkAction['variant'];
  confirm?: BulkAction['confirm'];
}): BulkAction {
  return {
    id,
    label,
    icon,
    variant,
    permission,
    confirm,
    run: async (selection) => {
      if (selection.mode !== 'ids') return { succeeded: 0, failed: [] };

      const failed: BulkResult['failed'] = [];
      let succeeded = 0;

      // In sequence, not in parallel: forty concurrent writes trip the write rate limit and
      // turn into forty 429s that read as forty failures.
      for (const rowId of selection.ids) {
        try {
          await run(rowId);
          succeeded += 1;
        } catch (error) {
          failed.push({
            id: rowId,
            error_code: error instanceof ApiError ? error.code : 'ERROR',
            message: error instanceof Error ? error.message : '',
          });
        }
      }

      return { succeeded, failed };
    },
  };
}

/**
 * Delete the ticked rows — `bulkRowAction` with the bin, the destructive tone and a confirm.
 *
 * Print and Excel of the ticked rows are not here: `ServerDataTable` puts them on every bulk
 * bar itself, so no screen builds them again.
 */
export function bulkDeleteAction({
  t, permission, remove, label, icon,
}: {
  t: TFunction;
  /** The delete permission. The bar hides the button without it; the endpoint enforces it. */
  permission: string;
  /** Deletes one row by id — the resource's delete mutation, `mutateAsync`. */
  remove: (id: string) => Promise<unknown>;
  label?: string;
  /** For a delete that removes nothing (an item's discontinue). Keep the bin otherwise. */
  icon?: ReactNode;
}): BulkAction {
  return bulkRowAction({
    id: 'delete',
    label: label ?? t('actions.delete'),
    icon: icon ?? <Trash2 aria-hidden="true" />,
    variant: 'destructive',
    permission,
    run: remove,
  });
}
