import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small list used by the grid's unused capability filters. Not shown while those stay off. */
export function Command({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

export function CommandInput({
  placeholder,
  value,
  onValueChange,
}: {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(event) => onValueChange?.(event.target.value)}
      className="h-9 border-b bg-transparent px-3 text-sm outline-none"
    />
  );
}

export function CommandList({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn("max-h-64 overflow-y-auto p-1", className)}>{children}</div>;
}

export function CommandEmpty({ children }: { children?: ReactNode }) {
  return <p className="px-2 py-3 text-center text-sm text-muted-foreground">{children}</p>;
}

export function CommandGroup({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

export function CommandItem({
  children,
  onSelect,
  value,
}: {
  children?: ReactNode;
  value?: string;
  onSelect?: (value: string) => void;
}) {
  return (
    <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted" onClick={() => onSelect?.(value ?? "")}>
      {children}
    </button>
  );
}
