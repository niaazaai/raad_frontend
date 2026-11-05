import type { ReactNode } from 'react';
import type { ColumnDef, RowData } from '@tanstack/react-table';

/**
 * Column metadata this application needs on top of TanStack's ColumnDef.
 *
 * Declared as data on the column rather than as CSS or JSX per screen — that is what lets ONE
 * DataTable implementation handle responsiveness, sorting, filtering, resizing and export for
 * every grid in the system, instead of each screen re-solving them slightly differently
 * (06-ui-ux §3.3, §9).
 *
 * A screen author writing a new list supplies a column array, a query key and an endpoint.
 * Everything below is the vocabulary for that array.
 */
export interface HaltoonColumnMeta {
  /**
   * 1 = always visible, even on a phone
   * 2 = visible from `lg`
   * 3 = visible from `xl`
   *
   * A grid with ten priority-1 columns has not been thought about. Two or three columns
   * are what a person can actually read on a 375px screen.
   */
  priority?: 1 | 2 | 3;

  /**
   * Right-align in LTR, left in RTL. For money and quantities, which read by decimal point.
   *
   * It affects ALIGNMENT ONLY. It does not permit arithmetic: money and quantity cross the
   * wire as strings (AD-024) and are rendered through `formatMoney` / `formatQty`.
   */
  numeric?: boolean;

  /**
   * Sort key sent to the API. Omit to make the column unsortable — a column without one
   * renders no chevron and no click target, which is not an error.
   */
  sortKey?: string;

  /** Shown above the column in the card layout on small screens, and in the column chooser. */
  shortLabel?: string;

  /**
   * A control drawn beside the sort chevron — a column's own filter, not a second toolbar.
   */
  headerAddon?: ReactNode;

  /** Keep this column out of the column chooser — a row's actions, a selection checkbox. */
  alwaysVisible?: boolean;

  /**
   * How this column can be filtered, as data.
   *
   * Absent means the column appears in no filter menu — also not an error. Every operator
   * here serialises to the query grammar in 05-conventions §4; nothing is filtered on the
   * client (06-ui-ux §11).
   */
  filter?: ColumnFilterSpec;

  /** Pixel widths. `min` is what stops a column being dragged to zero and lost. */
  width?: { default: number; min: number; max?: number };

  /** Defaults to true when `width` is set, false otherwise. */
  resizable?: boolean;

  /** Defaults to true. A column excluded here is omitted from every export format. */
  exportable?: boolean;

  /**
   * The words a printout or spreadsheet writes for this cell.
   *
   * The on-screen cell is often a badge or a translated enum. Without this, the file would
   * contain the raw code (`consumable`) or nothing at all.
   */
  plainText?: (row: unknown) => string;

  /**
   * What an export writes for this column: paths into the row the API returned, because the
   * cell on screen is often built from several fields — `company.name`, not the uuid in
   * `company_id`. Defaults to the column id with the column's own label. Two entries become
   * two spreadsheet columns, e.g. a name cell that also shows the code.
   */
  exportAs?: Array<{ key: string; label?: string }>;
}

export interface FilterOption {
  value: string;
  label: string;
  /**
   * A string, because every number on the wire is a string (AD-024) — and because a facet
   * count of 40,000 has no business being parsed into a float on its way to a label.
   */
  count?: string;
}

/**
 * The five filter shapes.
 *
 * `numeric` keeps its value as a string for the same reason every other number does: the
 * moment it becomes a `number` it has been through a float, and AD-044 exists because that
 * is irreversible and silent.
 */
export type ColumnFilterSpec =
  | {
    type: 'faceted';
    ops?: ['in'];
    source: 'facets' | { options: FilterOption[] };
    /**
     * Display label for a facet value. The server labels id facets (a company's name) but
     * not enums — `active` is translated HERE, in the reader's language, not on the server.
     */
    labelFor?: (value: string) => string;
  }
  | { type: 'text'; ops?: ('like' | 'eq')[] }
  | { type: 'numeric'; ops?: ('eq' | 'gte' | 'lte')[] }
  | { type: 'date'; ops?: ('eq' | 'gte' | 'lte')[] }
  | { type: 'boolean'; ops?: ['eq'] };

/**
 * Teach TanStack about our column metadata, so `column.columnDef.meta.priority` is typed
 * rather than `unknown` at every call site.
 */
declare module '@tanstack/react-table' {
  /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */
  interface ColumnMeta<TData extends RowData, TValue> extends HaltoonColumnMeta {}
  /* eslint-enable */
}

export type HaltoonColumnDef<TData> = ColumnDef<TData>;

export type Density = 'comfortable' | 'standard' | 'compact';

/**
 * 48 / 40 / 32px. A clerk entering data all day picks compact, a manager reviewing does not.
 * Do not choose for them (06-ui-ux §1).
 */
export const DENSITY_ROW_HEIGHT: Record<Density, string> = {
  comfortable: 'h-12',
  standard: 'h-10',
  compact: 'h-8',
};

/**
 * Cell padding, not just the row's height class.
 *
 * `p-2` on every cell is already taller than a compact row, so switching density changed
 * a class the padding ignored and the rows did not move.
 */
export const DENSITY_CELL: Record<Density, string> = {
  comfortable: 'py-3',
  standard: 'py-2',
  compact: 'py-0.5',
};

/**
 * The header row, sized to the body rows beneath it.
 *
 * A fixed 40px header over 32px compact rows read as padding nobody asked for — the header
 * was the tallest row in a grid the user had just made compact.
 */
export const DENSITY_HEADER: Record<Density, string> = {
  comfortable: 'h-11',
  standard: 'h-9',
  compact: 'h-8',
};

/** Row heights in pixels — the virtualiser needs a number, not a class. */
export const DENSITY_ROW_PX: Record<Density, number> = {
  comfortable: 48,
  standard: 40,
  compact: 32,
};

/** 200 is a hard cap enforced server-side in a base Form Request (AD-023, 07 §5). */
export const PER_PAGE_OPTIONS = [25, 50, 100, 200] as const;

export type PerPage = (typeof PER_PAGE_OPTIONS)[number];

/**
 * Virtualise above this many rows (06-ui-ux §8).
 *
 * Below it the DOM cost is irrelevant and a virtualiser only adds a scroll container that
 * behaves subtly differently from the page's.
 */
export const VIRTUALISE_ABOVE = 100;
