import { useMemo, useState } from 'react';
import { useTranslation } from './i18n';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateField } from '@/components/form';
import { cn } from '@/lib/utils';
import type { ColumnFilterSpec, FilterOption } from './types';
import type { FilterOp, FilterValue } from './query';
import { columnIdOf, type FacetMap } from './use-data-table';

/**
 * Column filters, generated from `meta.filter` rather than written per screen.
 *
 * Everything here is server-side (06-ui-ux §11). There is deliberately no client-side
 * fallback "for small lists": it would work on seeded data and fail in production, which is
 * the worst possible moment to discover the difference.
 */

export interface FilterableColumn {
  id: string;
  label: string;
  spec: ColumnFilterSpec;
}

export function filterableColumns<TRow>(
  columns: ColumnDef<TRow, unknown>[],
  labelOf: (column: ColumnDef<TRow, unknown>) => string,
): FilterableColumn[] {
  return columns.flatMap((column) => {
    const spec = column.meta?.filter;
    const id = columnIdOf(column);

    // A column with no `filter` appears in no filter menu. Not an error — most columns are
    // there to be read, not to be narrowed by.
    if (spec === undefined || id === undefined) return [];

    return [{ id, label: labelOf(column), spec }];
  });
}

const defaultOpFor = (spec: ColumnFilterSpec): FilterOp => {
  if (spec.type === 'faceted') return 'in';
  if (spec.type === 'text') return spec.ops?.[0] ?? 'like';
  if (spec.type === 'boolean') return 'eq';

  return spec.ops?.[0] ?? 'eq';
};

export function DataTableFilters({
  columns, active, facets, onChange, onRequestFacets,
}: {
  columns: FilterableColumn[];
  active: Record<string, FilterValue>;
  facets: FacetMap;
  onChange: (columnId: string, value: FilterValue | undefined) => void;
  onRequestFacets: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FilterableColumn | undefined>(undefined);

  if (columns.length === 0) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onRequestFacets();
        if (!next) setEditing(undefined);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="size-4" />
          <span className="hidden sm:inline">{t('table.filter')}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0">
        {editing === undefined ? (
          <Command>
            <CommandInput placeholder={t('table.filterSearch')} />
            <CommandList>
              <CommandEmpty>{t('table.filterNone')}</CommandEmpty>
              <CommandGroup>
                {columns.map((column) => (
                  <CommandItem key={column.id} value={column.label} onSelect={() => setEditing(column)}>
                    <span className="flex-1">{column.label}</span>
                    {active[column.id] ? <Check className="size-4 text-primary" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <FilterEditor
            column={editing}
            value={active[editing.id]}
            options={facets[editing.id]}
            onBack={() => setEditing(undefined)}
            onChange={(value) => onChange(editing.id, value)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function FilterEditor({
  column, value, options, onBack, onChange,
}: {
  column: FilterableColumn;
  value: FilterValue | undefined;
  options: FilterOption[] | undefined;
  onBack: () => void;
  onChange: (value: FilterValue | undefined) => void;
}) {
  const { t } = useTranslation();
  const { spec } = column;
  const op = value?.op ?? defaultOpFor(spec);

  const single = typeof value?.value === 'string' ? value.value : '';
  const many = Array.isArray(value?.value) ? value.value : [];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{column.label}</span>
        <Button variant="ghost" size="xs" onClick={onBack}>{t('actions.back')}</Button>
      </div>

      {spec.type === 'faceted' ? (
        <FacetedEditor
          spec={spec}
          options={options}
          selected={many}
          onChange={(next) => onChange(next.length === 0 ? undefined : { op: 'in', value: next })}
        />
      ) : null}

      {spec.type === 'text' ? (
        <>
          <OperatorSelect ops={spec.ops ?? ['like', 'eq']} value={op} onChange={(next) => onChange(single === '' ? undefined : { op: next, value: single })} />
          <Input
            value={single}
            aria-label={column.label}
            onChange={(event) => onChange(event.target.value === '' ? undefined : { op, value: event.target.value })}
          />
        </>
      ) : null}

      {spec.type === 'numeric' ? (
        <>
          <OperatorSelect ops={spec.ops ?? ['eq', 'gte', 'lte']} value={op} onChange={(next) => onChange(single === '' ? undefined : { op: next, value: single })} />
          {/*
            `type="text"` with `inputMode="decimal"`, never `type="number"` — a number input
            exposes `valueAsNumber`, and a numeric value is exactly what must never touch a
            quantity or a price (AD-044, 06-ui-ux §11). The value stays a string all the way
            to the query string.
          */}
          <Input
            value={single}
            inputMode="decimal"
            aria-label={column.label}
            onChange={(event) => onChange(event.target.value === '' ? undefined : { op, value: event.target.value })}
          />
        </>
      ) : null}

      {spec.type === 'date' ? (
        <>
          <OperatorSelect ops={spec.ops ?? ['eq', 'gte', 'lte']} value={op} onChange={(next) => onChange(single === '' ? undefined : { op: next, value: single })} />
          {/*
            The shared Jalali-aware picker. It displays in the user's calendar and emits ISO
            — never a Jalali string in a payload (AD-016).
          */}
          <DateField
            label={column.label}
            value={single === '' ? undefined : single}
            onChange={(next) => onChange(next === undefined || next === null || next === '' ? undefined : { op, value: next })}
          />
        </>
      ) : null}

      {spec.type === 'boolean' ? (
        <Select
          value={single === '' ? undefined : single}
          onValueChange={(next) => onChange({ op: 'eq', value: next })}
        >
          <SelectTrigger><SelectValue placeholder={t('table.filterAny')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t('boolean.yes')}</SelectItem>
            <SelectItem value="false">{t('boolean.no')}</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      {value ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
          {t('table.filterClearOne')}
        </Button>
      ) : null}
    </div>
  );
}

function OperatorSelect({
  ops, value, onChange,
}: {
  ops: readonly FilterOp[];
  value: FilterOp;
  onChange: (op: FilterOp) => void;
}) {
  const { t } = useTranslation();

  if (ops.length < 2) return null;

  return (
    <Select value={value} onValueChange={(next) => onChange(next as FilterOp)}>
      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
      <SelectContent>
        {ops.map((op) => (
          // Operator labels are user-visible strings and go through the catalogue too
          // (AD-046) — "is at least" is not a symbol everybody reads the same way.
          <SelectItem key={op} value={op}>{t(`table.op.${op}`)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The checkbox list (#5).
 *
 * Options and counts come from the SERVER, because the loaded page is 50 of 40,000 rows and
 * a list built from it would silently omit values the user is looking for. When the facets
 * endpoint is unavailable the menu degrades to the inline options, or to an explanation —
 * never to a guess assembled from the current page.
 */
function FacetedEditor({
  spec, options, selected, onChange,
}: {
  spec: Extract<ColumnFilterSpec, { type: 'faceted' }>;
  options: FilterOption[] | undefined;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();

  const available = useMemo<FilterOption[]>(() => {
    if (spec.source !== 'facets') return spec.source.options;

    return options ?? [];
  }, [spec, options]);

  if (available.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">{t('table.filterUnavailable')}</p>;
  }

  return (
    <Command>
      <CommandInput placeholder={t('table.filterSearch')} />
      <CommandList className="max-h-56">
        <CommandEmpty>{t('table.filterNone')}</CommandEmpty>
        <CommandGroup>
          {available.map((option) => {
            const checked = selected.includes(option.value);

            return (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => onChange(
                  checked ? selected.filter((each) => each !== option.value) : [...selected, option.value],
                )}
              >
                <Checkbox checked={checked} className="pointer-events-none" tabIndex={-1} />
                <span className="flex-1">{option.label}</span>
                {/*
                  The count is rendered as the string the server sent. Not parsed, not
                  formatted with arithmetic — every number on the wire is a string (AD-024)
                  and a facet count has no reason to be the exception.
                */}
                {option.count === undefined
                  ? null
                  : <span className="tabular text-xs text-muted-foreground">{option.count}</span>}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/** Active filters, as removable chips — so what is narrowing the list is never invisible. */
/**
 * What a chip shows for one value: the option's label, never a raw id. "Company in
 * 01J8Z…" tells nobody anything; "Company in North Co" is the filter they chose.
 */
function chipLabel(spec: ColumnFilterSpec, value: string, facetOptions: FilterOption[] | undefined): string {
  if (spec.type !== 'faceted') return value;

  const inline = spec.source === 'facets' ? undefined : spec.source.options;
  const found = (inline ?? facetOptions)?.find((option) => option.value === value);

  return found?.label ?? spec.labelFor?.(value) ?? value;
}

export function DataTableFilterChips({
  columns, active, facets, onRemove, onClear,
}: {
  columns: FilterableColumn[];
  active: Record<string, FilterValue>;
  facets?: FacetMap;
  onRemove: (columnId: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const entries = Object.entries(active);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([columnId, value]) => {
        const column = columns.find((each) => each.id === columnId);
        const values = Array.isArray(value.value) ? value.value : [value.value];
        const shown = column
          ? values.map((each) => chipLabel(column.spec, each, facets?.[columnId])).join(', ')
          : values.join(', ');

        return (
          <Badge key={columnId} variant="secondary" className="gap-1 ps-2 pe-1">
            <span className="text-xs">
              {column?.label ?? columnId} {t(`table.op.${value.op}`)} {shown}
            </span>
            <button
              type="button"
              onClick={() => onRemove(columnId)}
              aria-label={t('table.filterRemove', { column: column?.label ?? columnId })}
              className={cn('rounded-sm p-0.5 hover:bg-muted-foreground/20')}
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      })}

      <Button variant="ghost" size="xs" onClick={onClear}>{t('actions.clearFilters')}</Button>
    </div>
  );
}
