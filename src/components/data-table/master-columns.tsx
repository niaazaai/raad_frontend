import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from './i18n';
import { SquarePen, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statusVariant } from '@/lib/status';
import { DataTableInlineActions, DataTableRowActions, type RowAction } from './data-table-row-actions';
import { StatusSwitch } from './status-switch';
import type { StatusToggle } from './use-status-toggle';

/**
 * The column shapes the eight master lists share.
 *
 * Built as functions rather than copied per screen, so a code cell renders identically on
 * every one of them — and a code that renders LTR on one screen and reversed on another is
 * the kind of inconsistency people stop trusting the whole app over.
 *
 * **Each takes `t` as an argument rather than calling `useTranslation`.** These are plain
 * functions that build column definitions, not components, so a hook is not available —
 * and making them components to get one would mean a column definition that cannot be
 * built outside a render. The caller already has `t` and memoises the column array on it.
 */

/** A tenant code. Stays LTR inside RTL text, or `COUNT_VARIANCE` renders reversed. */
export function codeColumn<T extends { code: string }>(t: TFunction): ColumnDef<T, unknown> {
  return {
    id: 'code',
    header: t('common:fields.code'),
    meta: { priority: 1, sortKey: 'code', shortLabel: t('common:fields.code') },
    cell: ({ row }) => (
      <bdi dir="ltr" className="font-mono text-xs">{row.original.code}</bdi>
    ),
  };
}

export function nameColumn<T extends { name: string }>(
  t: TFunction,
  header?: string,
): ColumnDef<T, unknown> {
  const label = header ?? t('common:fields.name');

  return {
    id: 'name',
    header: label,
    meta: { priority: 1, sortKey: 'name', shortLabel: label },
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  };
}

/**
 * The `⋯` menu, always last and always in the same place.
 *
 * `alwaysVisible` keeps it out of the column chooser: a user who hid it would have a grid
 * with no way to act on a row and no obvious way back. `inline` draws the actions as icon
 * buttons instead of a menu — for rows with only an edit and a delete.
 *
 * Pass a `toggle` from `useStatusToggle` and the row's active/inactive switch leads the
 * column, before edit — the inline start, so it mirrors in Dari and Pashto with the rest.
 * The status column keeps the badge, so the state is read there and changed here. A user
 * without the update permission, or a row the toggle's `statusOf` gives no switch, gets none.
 */
export function actionsColumn<T>(
  t: TFunction,
  build: (row: T) => RowAction[],
  inline = false,
  toggle?: StatusToggle<T>,
  /**
   * Model-specific actions that are not edit, delete, or the status switch.
   * Drawn first, then the switch, then edit, then delete. Document direction
   * places that sequence at the inline start, so English reads left to right
   * and RTL reads from the right.
   */
  leading?: (row: T) => RowAction[],
): ColumnDef<T, unknown> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">{t('common:fields.actions')}</span>,
    enableHiding: false,
    meta: { priority: 1, alwaysVisible: true, exportable: false, shortLabel: t('common:fields.actions') },
    cell: ({ row }) => {
      const status = toggle?.can === true ? toggle.statusOf(row.original) : null;
      const extras = leading?.(row.original) ?? [];

      return (
        <div className="flex items-center justify-end gap-1">
          {extras.length > 0 ? <DataTableInlineActions actions={extras} /> : null}
          {status !== null && toggle ? <StatusSwitch row={row.original} status={status} toggle={toggle} /> : null}
          {inline
            ? <DataTableInlineActions actions={build(row.original)} />
            : <DataTableRowActions actions={build(row.original)} />}
        </div>
      );
    },
  };
}

/**
 * Edit and delete, the pair almost every master row has.
 *
 * `SquarePen` and `Trash2` — the bin with bars — on every grid, so the two icons a clerk
 * learns on one screen are the two they find on the next.
 */
export function editDeleteActions({
  t, onEdit, onDelete, canUpdate, canDelete, updatePermission, deletePermission,
  deleteLabel, deleteIcon, deleteBlockedReason,
}: {
  t: TFunction;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  /** This model's update permission. The button hides without it. */
  updatePermission?: string;
  /** This model's delete permission. The button hides without it. */
  deletePermission?: string;
  deleteLabel?: string;
  /**
   * For a "delete" that removes nothing — an item's DELETE discontinues it, and a bin would
   * say the row is about to vanish. Keep the bin wherever the row really goes.
   */
  deleteIcon?: ReactNode;
  /** Set when the row exists but cannot be deleted — a seeded system row, say. */
  deleteBlockedReason?: string;
}): RowAction[] {
  return [
    {
      id: 'edit',
      label: t('common:actions.edit'),
      icon: <SquarePen className="size-4" aria-hidden="true" />,
      onSelect: onEdit,
      permission: updatePermission,
      // Hidden, not disabled: editing is not this user's to do at all.
      hidden: !canUpdate,
    },
    {
      id: 'delete',
      label: deleteLabel ?? t('common:actions.delete'),
      icon: deleteIcon ?? <Trash2 className="size-4" aria-hidden="true" />,
      onSelect: onDelete,
      destructive: true,
      permission: deletePermission,
      hidden: !canDelete,
      // Disabled WITH a reason: the action is theirs, this row just cannot take it.
      disabled: Boolean(deleteBlockedReason),
      disabledReason: deleteBlockedReason,
    },
  ];
}

/** A row of small flags — "Sellable", "Lots", "Approval". */
export function FlagBadges({ flags }: { flags: Array<[boolean, string]> }) {
  const on = flags.filter(([enabled]) => enabled);

  if (on.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {on.map(([, label]) => (
        <Badge key={label} variant="secondary" className="font-normal">{label}</Badge>
      ))}
    </div>
  );
}

/**
 * A whole master list's columns from a compact spec.
 *
 * Eight of these lists exist and they differ only in their middle columns, so the shape —
 * code, name, ...middle, actions — is declared once. Writing each out longhand meant eight
 * chances for the actions column to end up somewhere different.
 */
export interface MasterColumnSpec<T> {
  id: string;
  header: string;
  priority?: 1 | 2 | 3;
  numeric?: boolean;
  sortKey?: string;
  headerAddon?: ReactNode;
  /** Words the printout and spreadsheet write. The cell is often a badge. */
  plainText?: (row: T) => string;
  cell: (row: T) => React.ReactNode;
}

export function buildMasterColumns<T extends { code: string; name: string }>({
  t, middle = [], actions, inlineActions = false, nameHeader,
}: {
  t: TFunction;
  middle?: MasterColumnSpec<T>[];
  /** Omit on a read-only list — the `⋯` column is then not rendered at all. */
  actions?: (row: T) => RowAction[];
  /** Icon buttons in the row instead of the `⋯` menu. */
  inlineActions?: boolean;
  nameHeader?: string;
}): ColumnDef<T, unknown>[] {
  const columns: ColumnDef<T, unknown>[] = [
    codeColumn<T>(t),
    nameColumn<T>(t, nameHeader),
    ...middle.map((spec): ColumnDef<T, unknown> => ({
      id: spec.id,
      header: spec.header,
      meta: {
        priority: spec.priority ?? 2,
        numeric: spec.numeric,
        sortKey: spec.sortKey,
        shortLabel: spec.header,
        headerAddon: spec.headerAddon,
        plainText: spec.plainText as ((row: unknown) => string) | undefined,
      },
      cell: ({ row }) => spec.cell(row.original),
    })),
  ];

  return actions ? [...columns, actionsColumn<T>(t, actions, inlineActions)] : columns;
}

/**
 * A status as a badge, through `statusVariant` — the one place a status becomes a colour
 * (06-ui-ux §1). `label` is the translated word; the colour follows the raw value.
 */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge variant={statusVariant(status)} className="font-normal">{label}</Badge>;
}

/**
 * Active / inactive, the lifecycle every master shares, as a sortable, facet-filterable column.
 *
 * Always a badge — green for active, red for inactive, through `statusVariant`. The switch
 * that changes it lives in the actions column (`actionsColumn(…, toggle)`).
 */
export function statusColumn<T extends { status: string }>(t: TFunction): ColumnDef<T, unknown> {
  return {
    id: 'status',
    header: t('common:fields.status'),
    meta: {
      priority: 2,
      sortKey: 'status',
      shortLabel: t('common:fields.status'),
      filter: { type: 'faceted', source: 'facets', labelFor: (value) => t(`common:status.${value}`) },
      plainText: (row) => {
        const status = (row as { status: string }).status;
        return t(`common:status.${status}`, { defaultValue: status });
      },
    },
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status}
        label={t(`common:status.${row.original.status}`, { defaultValue: row.original.status })}
      />
    ),
  };
}

/**
 * The "any" choice and the two master statuses, for a status column's `ColumnFunnel`.
 *
 * The empty value is "any" and comes first — that is how the funnel knows which option
 * clears the filter.
 */
export function statusFilterOptions(t: TFunction): { value: string; label: string }[] {
  return [
    { value: '', label: t('common:table.anyStatus') },
    { value: 'active', label: t('common:status.active') },
    { value: 'inactive', label: t('common:status.inactive') },
  ];
}

/**
 * A column with a control beside its sort chevron — in practice its `ColumnFunnel`.
 *
 * A header filter belongs to its column, not to the toolbar: the funnel sits over the very
 * values it narrows, and the toolbar keeps its one line for search, tabs and New.
 */
export function withHeaderAddon<T>(column: ColumnDef<T, unknown>, addon: ReactNode): ColumnDef<T, unknown> {
  return { ...column, meta: { ...column.meta, headerAddon: addon } };
}
