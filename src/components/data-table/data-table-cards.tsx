import type { KeyboardEvent } from 'react';
import { useTranslation } from './i18n';
import { flexRender, type Cell, type Row } from '@tanstack/react-table';
import { Checkbox, tableCheckboxClassName } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { SelectionApi } from './use-data-table';

/** Key fields under the title — two rows of two on a phone (06-ui-ux §3.3 says two to four). */
const FIELDS = 4;

const isActions = <T,>(cell: Cell<T, unknown>): boolean => cell.column.id === 'actions';
const isStatus = <T,>(cell: Cell<T, unknown>): boolean => cell.column.id === 'status';

/**
 * The rows as cards, for a Tier A or B screen below `md` (PLT-UI-006, 06-ui-ux §3.3).
 *
 * Each card has a head and a body. The head is the title — the `name` column when the row
 * has one, with its `code` underneath, otherwise the first column — then the status badge
 * and the row's actions. The body is up to four key fields in a two-column grid, each label
 * above its value, so a long value wraps instead of pushing its label off the card. Nothing
 * is filtered or sorted here: the cards are the same page of the same server answer the
 * table would have shown.
 *
 * Touch: the card opens on a tap anywhere and on Enter or Space, the checkbox and the actions
 * sit in 44px targets, and neither opens the card.
 */
export function DataTableCards<TData>({
  rows, onRowClick, selection, getRowId,
}: {
  rows: Array<Row<TData>>;
  onRowClick?: (row: TData) => void;
  selection?: SelectionApi;
  getRowId?: (row: TData) => string;
}) {
  const { t } = useTranslation();

  return (
    <ul className="flex flex-col gap-2" aria-label={t('table.cards')}>
      {rows.map((row) => {
        const cells = row.getVisibleCells();
        const actions = cells.find(isActions);
        const status = cells.find(isStatus);
        const content = cells.filter((cell) => !isActions(cell) && !isStatus(cell));

        // A master row is "code, name, …": the name is what a person recognises, so it leads
        // and the code sits under it. Any other row leads with its first column.
        const name = content.find((cell) => cell.column.id === 'name');
        const code = name ? content.find((cell) => cell.column.id === 'code') : undefined;
        const title = name ?? content[0];
        const fields = content
          .filter((cell) => cell !== title && cell !== code)
          .filter((cell) => (cell.column.columnDef.meta?.priority ?? 1) <= 2)
          .slice(0, FIELDS);

        const id = getRowId?.(row.original);
        const selected = id !== undefined && selection?.isSelected(id) === true;
        const open = onRowClick ? () => onRowClick(row.original) : undefined;

        const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
          if (open && (event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
            event.preventDefault();
            open();
          }
        };

        return (
          <li
            key={row.id}
            data-state={selected ? 'selected' : undefined}
            className="elevated overflow-hidden rounded-xl border bg-card data-[state=selected]:border-primary data-[state=selected]:bg-primary/5"
          >
            <div className="flex items-start gap-1 p-1.5 pe-1">
              {selection !== undefined && id !== undefined ? (
                <span className="flex size-11 shrink-0 items-center justify-center">
                  <Checkbox className={tableCheckboxClassName} checked={selected} onCheckedChange={() => selection.toggle(id)} aria-label={t('table.selectRow')} />
                </span>
              ) : null}

              <div
                role={open ? 'button' : undefined}
                tabIndex={open ? 0 : undefined}
                onClick={open}
                onKeyDown={onKeyDown}
                className={cn(
                  'flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-md py-1',
                  selection === undefined && 'ps-1.5',
                  open && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0 flex-1 truncate font-medium leading-tight">
                    {title ? flexRender(title.column.columnDef.cell, title.getContext()) : null}
                  </div>
                  {status ? <div className="shrink-0">{flexRender(status.column.columnDef.cell, status.getContext())}</div> : null}
                </div>
                {code ? (
                  <div className="min-w-0 truncate text-muted-foreground">
                    {flexRender(code.column.columnDef.cell, code.getContext())}
                  </div>
                ) : null}
              </div>

              {actions ? (
                // Row actions grow to a 44px target on touch. The status switch is a button too,
                // but a square one is no longer a switch: its wrapper takes the 44px instead.
                <div
                  className="flex shrink-0 items-center [&_[data-row-control]]:size-11 [&_button:not([role=switch])]:size-11"
                  onClick={(event) => event.stopPropagation()}
                >
                  {flexRender(actions.column.columnDef.cell, actions.getContext())}
                </div>
              ) : null}
            </div>

            {fields.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t bg-muted/30 px-3 py-2.5 text-sm">
                {fields.map((cell) => (
                  <div key={cell.id} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="truncate text-xs text-muted-foreground">
                      {String(cell.column.columnDef.meta?.shortLabel ?? cell.column.id)}
                    </dt>
                    <dd className={cn('min-w-0 break-words', cell.column.columnDef.meta?.numeric === true && 'tabular')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
