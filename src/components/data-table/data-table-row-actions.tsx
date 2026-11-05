import type { ReactNode } from 'react';
import { useTranslation } from './i18n';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissionCheck } from '@/lib/permission';
import { cn } from '@/lib/utils';

export interface RowAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Rendered in the destructive colour and pushed below a separator. */
  destructive?: boolean;
  /**
   * Disable rather than hide, and say why.
   *
   * A disabled item with a reason teaches; a hidden one leaves somebody hunting for a
   * button that was there yesterday. Hiding is right only when the action is not theirs to
   * take at all — that is what `hidden` is for.
   */
  disabled?: boolean;
  disabledReason?: string;
  hidden?: boolean;
  /**
   * Checked **per row**, not per screen.
   *
   * Two rows of the same list can differ: a user may edit a draft and not an approved
   * document. Gating the whole column on one check is how a screen ends up offering an
   * action that 403s on half its rows.
   *
   * The endpoint behind it enforces the same permission regardless — hiding it here is
   * convenience, never control (07-security §4).
   */
  permission?: string;
}

/**
 * The one row-actions menu (PLT-UI-002).
 *
 * Every grid in the system gets the same affordance in the same place, which matters more
 * than it sounds: a user who learns "the ⋯ at the end of the row" once should never have to
 * learn it again on the next screen. Inline buttons per row were the alternative and they
 * blow the row width out the moment a third action appears.
 */
export function DataTableRowActions({
  actions, label, align = 'end',
}: {
  actions: RowAction[];
  label?: string;
  align?: 'start' | 'end';
}) {
  const { t } = useTranslation();
  const can = usePermissionCheck();
  const menuLabel = label ?? t('table.rowActions');

  const visible = actions.filter((action) => !action.hidden && can(action.permission));

  if (visible.length === 0) return null;

  const ordinary = visible.filter((action) => !action.destructive);
  const destructive = visible.filter((action) => action.destructive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={menuLabel}
          // The row itself may be clickable; the menu must not also trigger it.
          onClick={(event) => event.stopPropagation()}
          className="data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-48"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">{menuLabel}</DropdownMenuLabel>

        {ordinary.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}

        {destructive.length > 0 && ordinary.length > 0 ? <DropdownMenuSeparator /> : null}

        {destructive.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionItem({ action }: { action: RowAction }) {
  return (
    <DropdownMenuItem
      disabled={action.disabled}
      onSelect={action.onSelect}
      // The reason a disabled action is disabled, on hover and to a screen reader.
      title={action.disabled ? action.disabledReason : undefined}
      className={cn(action.destructive && 'text-destructive focus:text-destructive')}
    >
      {action.icon}
      <span className="flex-1">{action.label}</span>
    </DropdownMenuItem>
  );
}

/**
 * The same actions as icon buttons, straight in the row — no menu to open first.
 *
 * For lists whose rows carry two actions at most (a master's edit and delete), where the
 * extra click of the `⋯` menu buys nothing. A row with three or more keeps the menu: the
 * width argument above still holds.
 */
export function DataTableInlineActions({ actions }: { actions: RowAction[] }) {
  const can = usePermissionCheck();
  const visible = actions.filter((action) => !action.hidden && can(action.permission));

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {visible.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={action.disabled}
          aria-label={action.label}
          // The label on hover; a disabled action shows why instead.
          title={action.disabled ? action.disabledReason : action.label}
          onClick={(event) => {
            event.stopPropagation();
            action.onSelect();
          }}
          className={cn(
            action.destructive && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
          )}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  );
}
