import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

function TagInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength = 40,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim().slice(0, maxLength))
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const tag of parts) {
      if (!next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        next.push(tag);
      }
    }
    onChange(next);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 shadow-xs",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            className="rounded-sm text-primary/70 hover:text-primary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(value.filter((item) => item !== tag))}
            aria-label={`Remove ${tag}`}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={value.length === 0 ? placeholder : ""}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        className="h-7 min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

export default TagInput;
