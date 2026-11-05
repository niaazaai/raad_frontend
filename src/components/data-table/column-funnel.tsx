import { Funnel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { funnelValues } from './funnel-values';

/** Compact rows: a column's filter can list every site or category the tenant has. */
const ITEM = 'py-1 pe-2 text-[13px]';

/**
 * A column's own filter, drawn beside the sort chevron. Multi-select.
 *
 * Each option is a checkbox; ticking several matches any of them. The value stays ONE
 * string, comma-joined (`"active,inactive"`), because that is exactly what the list
 * endpoints read (`InventoryMasterController::anyOf`) and what the URL already carries — so a
 * caller's state, its URL sync and its request params need no new shape.
 *
 * The "any" choice is the option whose value is `""`; callers pass it first. It is ticked
 * while nothing else is, and choosing it clears the filter. The menu stays open while
 * options are toggled — closing after every tick would make picking three a six-click job.
 */
export function ColumnFunnel({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected = funnelValues(value);
  const anyOption = options.find((option) => option.value === '');
  const choices = options.filter((option) => option.value !== '');

  const toggle = (choice: string, on: boolean): void => {
    const next = on ? [...selected, choice] : selected.filter((piece) => piece !== choice);
    // Kept in the options' order, so the same selection is always the same string — and
    // the same query key, the same URL.
    onChange(choices.map((option) => option.value).filter((piece) => next.includes(piece)).join(','));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn('relative size-6', selected.length > 0 ? 'text-primary' : 'text-muted-foreground')}
          aria-label={label}
        >
          <Funnel className="size-3.5" aria-hidden="true" />
          {selected.length > 1 ? (
            <span className="absolute -top-1 -end-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
              {selected.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      {/* The list scrolls INSIDE the padded panel, not the panel itself: a scrolling rounded
          box draws its scrollbar straight through its own corners. Vertically only — the
          panel is as wide as its longest label, so nothing is ever cut off or scrolled sideways. */}
      <DropdownMenuContent align="end" className="w-max min-w-44 overflow-hidden p-1">
        <div className="scrollbar-themed scrollbar-slim max-h-72 overflow-x-hidden overflow-y-auto">
          {anyOption ? (
            <>
              <DropdownMenuCheckboxItem
                checked={selected.length === 0}
                onCheckedChange={() => onChange('')}
                onSelect={(event) => event.preventDefault()}
                className={cn(ITEM, 'font-medium')}
              >
                {anyOption.label}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator className="my-0.5" />
            </>
          ) : null}

          {choices.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
              onSelect={(event) => event.preventDefault()}
              className={ITEM}
            >
              <span className="whitespace-nowrap">{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
