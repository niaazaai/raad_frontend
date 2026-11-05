import { useSyncExternalStore } from 'react';
import { useTranslation } from './i18n';
import { Switch } from '@/components/ui/switch';
import type { MasterStatus, StatusToggle } from './use-status-toggle';

/**
 * The row's active/inactive switch, drawn in the actions column before edit and delete.
 *
 * No word beside it: the status column already says "Active" or "Inactive" in its green or
 * red badge, so the switch is the control and the badge is the reading — colour is never
 * the only signal (06-ui-ux §6). The hover title and the accessible name say what it does.
 *
 * It follows its own row's pending state through the toggle's subscription, so a save in
 * flight re-renders this switch alone: the columns are not rebuilt, the cells are not
 * remounted, and keyboard focus stays on the switch that was pressed.
 *
 * While it saves it is `aria-disabled`, not `disabled`: a browser moves focus off an element
 * that becomes disabled, which would undo the point of the paragraph above. A press in the
 * meantime is ignored by the toggle itself (one change in flight at a time).
 *
 * The wrapper is a 32px target like the icon buttons beside it, and is marked as a control:
 * the grid ignores clicks inside it for opening the row, and the switch ignores the second
 * click of a double-click — so a double-click toggles once and never opens the edit sheet.
 */
export function StatusSwitch<TRow>({
  row, status, toggle,
}: {
  row: TRow;
  status: MasterStatus;
  toggle: StatusToggle<TRow>;
}) {
  const { t } = useTranslation();
  const pending = useSyncExternalStore(toggle.subscribe, () => toggle.isPending(row));
  const label = t('table.toggleStatus', { name: toggle.nameOf(row) });

  return (
    <span data-row-control="" className="inline-flex size-8 items-center justify-center">
      <Switch
        size="sm"
        checked={status === 'active'}
        aria-disabled={pending}
        className="aria-disabled:cursor-wait aria-disabled:opacity-50"
        // People here double-click rows to open them, and some will double-click this too.
        // The second click of a double-click must not flip it straight back — a fast save
        // can finish between the two. `detail` counts clicks; a key press is 0.
        onClick={(event) => { if (event.detail > 1) event.preventDefault(); }}
        onCheckedChange={() => toggle.toggle(row)}
        aria-label={label}
        title={label}
      />
    </span>
  );
}
