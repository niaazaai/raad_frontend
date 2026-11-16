import { useTranslation } from './i18n';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DENSITY_HEADER, type Density } from './types';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * Cursor pagination, so there are no page numbers — and this is the honest shape, not a
 * missing feature.
 *
 * `OFFSET 50000` makes Postgres scan and discard 50,000 rows, which is why AD-023 chose
 * keyset. The price is that the server never computes a total, so **"Page 3 of 27" cannot be
 * rendered without a count query that costs exactly what keyset exists to avoid**. What is
 * shown instead is what is actually known: how many rows are on screen, and whether more
 * exist.
 *
 * Previous works by popping a stack of visited cursors. A cursor encodes one direction of
 * travel through `(sort_value, id)`; there is no way to invert one, and synthesising a
 * backwards token is how a page boundary starts skipping rows.
 */
const PAGER: Record<Density, { button: string; field: string; icon: string; text: string }> = {
  comfortable: { button: 'size-8', field: 'h-8', icon: 'size-4', text: 'text-sm' },
  standard: { button: 'size-7', field: 'h-7', icon: 'size-3.5', text: 'text-xs' },
  compact: { button: 'size-6', field: 'h-6', icon: 'size-3', text: 'text-[11px]' },
};

export function DataTablePagination({
  loaded, hasMore, canGoPrevious, pageIndex, perPage, perPageOptions,
  onPrevious, onNext, onPerPageChange, isFetching, density = 'standard',
}: {
  loaded: number;
  hasMore: boolean;
  canGoPrevious: boolean;
  pageIndex: number;
  perPage: number;
  perPageOptions: readonly number[];
  onPrevious: () => void;
  onNext: () => void;
  onPerPageChange: (perPage: number) => void;
  isFetching: boolean;
  /** Same heights as the column header: comfortable 44px, standard 36px, compact 32px. */
  density?: Density;
}) {
  const { t } = useTranslation();
  const pager = PAGER[density];

  return (
    <div className={cn('flex h-full w-full items-center gap-2 px-3 text-muted-foreground', DENSITY_HEADER[density], pager.text)}>
      <span className="tabular-nums">
        <bdi dir="ltr">{loaded}</bdi>
        {' '}
        {t('table.showingWord')}
      </span>
      {pageIndex > 0 ? <span className="truncate">{t('table.pageDepth', { page: pageIndex + 1 })}</span> : null}

      {/* `ms-auto` packs the controls to the inline end: the right in English, the left in
          Dari and Pashto. The row itself mirrors, so previous stays on the leading side. */}
      <div className="ms-auto flex items-center gap-1">
        <label className="flex items-center gap-1.5">
          <span>{t('table.rows')}</span>
          <Select
            value={String(perPage)}
            // Changing the page size resets the cursor stack: a cursor is only valid for the
            // page size it was minted under, so reusing one across sizes lands mid-row.
            onValueChange={(value) => onPerPageChange(Number.parseInt(value, 10))}
          >
            <SelectTrigger
              size="sm"
              aria-label={t('table.rowsPerPage')}
              className={cn(
                'w-auto min-w-[4.5rem] gap-1 border-0 bg-transparent px-2 shadow-none [&>span:first-child]:shrink-0 [&>span:last-child]:m-0 [&>span:last-child]:p-0',
                pager.field,
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {perPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <Button
          variant="ghost"
          size="icon-sm"
          className={pager.button}
          onClick={onPrevious}
          disabled={!canGoPrevious || isFetching}
          aria-label={t('table.previous')}
        >
          <ChevronLeft className={cn(pager.icon, 'rtl:rotate-180')} />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className={pager.button}
          onClick={onNext}
          disabled={!hasMore || isFetching}
          aria-label={t('table.next')}
        >
          <ChevronRight className={cn(pager.icon, 'rtl:rotate-180')} />
        </Button>
      </div>
    </div>
  );
}
