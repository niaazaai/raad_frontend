import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The "+ New …" button every list screen has, in one shape.
 *
 * Rendered twice by a screen: on the toolbar line (inside `TabbedToolbar`, at the inline
 * end) and as the empty state's action — the moment somebody needs to create the first row
 * is the worst moment for the button to be missing. `show` is the create permission, so a
 * user without it sees neither.
 */
export function NewButton({ show = true, onNew, label }: { show?: boolean; onNew: () => void; label: string }) {
  if (!show) return null;

  return (
    <Button size="sm" onClick={onNew}>
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
