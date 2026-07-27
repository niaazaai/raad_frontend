import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavArrowDown, Xmark } from "iconoir-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import type { SearchableSelectOption } from "./searchable-select";

export interface SearchableMultiSelectProps {
  options: SearchableSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  id?: string;
  max?: number;
}

interface DropdownCoords {
  top: number;
  left: number;
  width: number;
}

/**
 * Multi-select combobox with typeahead. Selected values stay visible in the option list.
 * Dropdown is portaled so it is not clipped by modal/drawer overflow.
 */
const SearchableMultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  label,
  required,
  disabled,
  emptyMessage = "No matches.",
  id,
  max,
}: SearchableMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<DropdownCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.value)),
    [options, selectedSet]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = useCallback(
    (v: string) => {
      if (selectedSet.has(v)) {
        onChange(value.filter((x) => x !== v));
        return;
      }
      if (max != null && value.length >= max) return;
      onChange([...value, v]);
    },
    [max, onChange, selectedSet, value]
  );

  const remove = useCallback(
    (v: string) => {
      onChange(value.filter((x) => x !== v));
    },
    [onChange, value]
  );

  const atMax = max != null && value.length >= max;

  const dropdown =
    open && coords
      ? createPortal(
          <div
            ref={panelRef}
            className="bg-popover text-popover-foreground fixed z-[200] rounded-lg border border-border shadow-lg"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            role="listbox"
            aria-multiselectable="true"
          >
            <div className="p-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9"
                autoFocus
              />
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">{emptyMessage}</li>
              ) : (
                filtered.map((o) => {
                  const selected = selectedSet.has(o.value);
                  const blocked = !selected && atMax;
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={blocked}
                        className={cn(
                          "hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-start text-sm",
                          selected && "bg-primary/10 font-medium text-primary",
                          blocked && "cursor-not-allowed opacity-50"
                        )}
                        onClick={() => toggle(o.value)}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {selected ? "✓" : ""}
                        </span>
                        <span className="truncate">{o.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
          {max != null ? (
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              ({value.length}/{max})
            </span>
          ) : null}
        </Label>
      ) : null}

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <span
              key={o.value}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
            >
              <span className="truncate">{o.label}</span>
              <button
                type="button"
                disabled={disabled}
                className="shrink-0 rounded hover:bg-primary/20"
                onClick={() => remove(o.value)}
                aria-label={`Remove ${o.label}`}
              >
                <Xmark className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <Button
        ref={triggerRef}
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn("h-10 w-full justify-between font-normal")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
          {value.length === 0
            ? placeholder
            : `${value.length} selected${atMax ? " (max)" : ""}`}
        </span>
        <NavArrowDown className="h-4 w-4 shrink-0 opacity-60" />
      </Button>

      {dropdown}
    </div>
  );
};

export default SearchableMultiSelect;
