/** Date value for a filter that this app's lists do not use yet. */
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (next: string | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span>{label}</span>
      <input
        type="date"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
        className="h-8 rounded-md border bg-background px-2"
      />
    </label>
  );
}
