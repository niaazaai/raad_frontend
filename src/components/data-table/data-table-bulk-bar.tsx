import { useState } from 'react';
import { useTranslation } from './i18n';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ApiError } from '@/api/client';
import { cn } from '@/lib/utils';
import { bulkIdempotencyKey, type BulkAction, type BulkResult, type SelectionApi } from './use-data-table';

/**
 * The action bar that appears when rows are selected.
 *
 * Actions are supplied per screen as data; the bar is built once here. Three rules it
 * enforces that a per-screen implementation would get inconsistently right:
 *
 *   - **Permission-gated**, but only as convenience. The endpoint behind every button has
 *     its own Policy check, permission test and cross-tenant isolation test (07 §4, §11).
 *   - **Every mutation carries an `Idempotency-Key`** (AD-027). A retried bulk delete must
 *     not delete twice, and a bulk endpoint has no natural key to collide on.
 *   - **Partial failure is reported per row.** `{ succeeded: 412, failed: [...] }` — never
 *     one "something went wrong" for an operation that mostly worked.
 */
export function DataTableBulkBar({
  selection, actions, can, entityLabel, allowSelectAllMatching = false, className,
}: {
  selection: SelectionApi;
  actions: BulkAction[];
  can: (permission: string | undefined) => boolean;
  /** What the rows are, for the confirmation sentence — "3 items", "all matching suppliers". */
  entityLabel: string;
  /**
   * Off by default. See `capabilities.ts`: posting a filter expression to an endpoint that
   * ignores `filter` turns a bulk delete of 4,213 rows into a bulk delete of everything.
   */
  allowSelectAllMatching?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState<BulkAction | undefined>(undefined);

  const visible = actions.filter((action) => can(action.permission));
  const selectedCount = selection.allMatching ? undefined : selection.selectedIds.length;

  if (selection.selectedIds.length === 0 && !selection.allMatching) return null;
  if (visible.length === 0) return null;

  const describe = (): string => (selection.allMatching
    ? t('table.bulkAllMatching', {
      count: selection.matchingCount ?? '',
      entity: entityLabel,
    })
    : t('table.bulkSelected', { count: selectedCount ?? 0, entity: entityLabel }));

  const run = async (action: BulkAction): Promise<void> => {
    setPending(action.id);
    setConfirming(undefined);

    try {
      const result = await action.run(selection.asSelection(), bulkIdempotencyKey());

      // Backed out: no toast, and the selection stays so they can try again.
      if (result === null) return;

      report(result ?? undefined);
      selection.clear();
    } catch (error) {
      // A 409 on a bulk mutation is an optimistic-lock conflict (AD-026) and is never
      // swallowed — the user changed something another person had already changed.
      const conflict = error instanceof ApiError && error.status === 409;

      toast.error(conflict ? t('table.conflict') : t('states.errorTitle'), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(undefined);
    }
  };

  const report = (result: BulkResult | undefined): void => {
    if (result === undefined) {
      toast.success(t('table.bulkDone'));

      return;
    }

    if (result.failed.length === 0) {
      toast.success(t('table.bulkSucceeded', { count: result.succeeded }));

      return;
    }

    // Both numbers, and the first few reasons. "412 succeeded, 3 failed" is actionable;
    // "something went wrong" after a 415-row operation is not.
    toast.warning(
      t('table.bulkPartial', { succeeded: result.succeeded, failed: result.failed.length }),
      {
        description: result.failed
          .slice(0, 3)
          .map((failure) => `${failure.id}: ${failure.message}`)
          .join('\n'),
        duration: 10_000,
      },
    );
  };

  return (
    <>
      <div
        role="region"
        aria-label={t('table.bulkActions')}
        className={cn('clay-sm flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2', className)}
      >
        <span className="text-sm font-medium">{describe()}</span>

        {/* Offered as a SECOND, deliberate click — never implied by the header checkbox,
            which with cursor pagination can only honestly mean "this page". */}
        {allowSelectAllMatching && !selection.allMatching && selection.mode === 'multi' ? (
          <Button variant="link" size="sm" onClick={selection.selectAllMatching}>
            {selection.matchingCount === undefined
              ? t('table.selectAllMatchingUnknown')
              : t('table.selectAllMatching', { count: selection.matchingCount })}
          </Button>
        ) : null}

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {visible.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
              loading={pending === action.id}
              onClick={() => (action.confirm ? setConfirming(action) : void run(action))}
            >
              {pending === action.id ? null : action.icon}
              {/*
                | Trimmed to cap height and baseline, in LTR only.
                |
                | Vazirmatn's line box is drawn for Arabic: 1.025em above the baseline, 0.537em
                | below. Centring that box puts its middle 0.244em above the baseline, but
                | "Print", "Excel" and "Retire" have no descenders — their ink runs from the
                | baseline to the cap height (0.80em), so it sat ~2px above the middle of
                | the button. Trimming the box to the ink lets `items-center` centre what is
                | actually drawn; nothing is offset. Dari's letters already sit on the box's
                | middle, so RTL keeps the full line box.
              */}
              <span className="ltr:[text-box:trim-both_cap_alphabetic]">{action.label}</span>
            </Button>
          ))}

          <Button variant="ghost" size="icon-sm" onClick={selection.clear} aria-label={t('table.clearSelection')}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={confirming !== undefined} onOpenChange={(open) => !open && setConfirming(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirming?.label}</DialogTitle>
            {/* A destructive action confirms AND names what it will act on (06-ui-ux §10).
                "Are you sure?" with no object is how people delete the wrong thing. */}
            <DialogDescription>
              {t('table.bulkConfirm', { action: confirming?.label ?? '', target: describe() })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(undefined)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant={confirming?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => { if (confirming) void run(confirming); }}
            >
              {pending === undefined ? null : <Loader2 className="size-4 animate-spin" />}
              {t('actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
