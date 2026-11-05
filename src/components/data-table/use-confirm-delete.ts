import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from './i18n';
import type { UseMutateFunction } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useConfirm } from '@/components/feedback/use-confirm';

/**
 * Optional wording when "delete" is really another named action — retiring a catalogue
 * item, for example. Defaults keep the shared Delete copy every master list uses.
 */
export interface ConfirmDeleteCopy {
  title?: (name: string) => string;
  body?: (name: string) => string;
  confirmLabel?: string;
  successToast?: string;
}

/**
 * Ask, then delete — the one delete flow every list shares.
 *
 * The centred confirm dialog names the row, so nobody deletes "NSJ-C1" believing it was
 * "NSJ-C2". A refusal — a seeded row, a site that still has locations, a type items still
 * use — comes back as the server's own sentence in the toast, not as silence or a generic
 * failure.
 *
 * Takes the delete mutation's `mutate`, which is stable, rather than the whole mutation
 * result, which is a new object on every render: a column array memoised on the caller
 * stays memoised. Optional `copy` is read through a ref for the same reason.
 */
export function useConfirmDelete(
  copy?: ConfirmDeleteCopy,
): (name: string, id: string, remove: UseMutateFunction<unknown, Error, string>) => void {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const copyRef = useRef(copy);

  useEffect(() => {
    copyRef.current = copy;
  }, [copy]);

  return useCallback((name, id, remove) => {
    void (async () => {
      const wording = copyRef.current;
      const ok = await confirm({
        title: wording?.title?.(name) ?? t('common:dialog.confirmDelete', { name }),
        body: wording?.body?.(name) ?? t('common:dialog.confirmDeleteBody'),
        confirmLabel: wording?.confirmLabel ?? t('common:actions.delete'),
        destructive: true,
      });

      if (!ok) return;

      remove(id, {
        onSuccess: () => toast.success(wording?.successToast ?? t('common:toast.deleted')),
        onError: (error) => toast.error(t('common:toast.failed'), {
          description: error instanceof ApiError ? error.message : undefined,
        }),
      });
    })();
  }, [t, confirm]);
}
