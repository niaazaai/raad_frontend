---
version: "2.0"
name: "Raad LMS Unified Design System"
description: "Complete visual and layout contract for Raad LMS. Feed this to any agent working on UI."
---

## 1. Tokens & Colors

All tokens live in `src/assets/css/index.css` as CSS custom properties and are exposed as Tailwind classes via `@theme inline`.

### Semantic Colors

| Token | Light | Dark | Tailwind |
|---|---|---|---|
| `--primary` | `#0069B4` | `#3399D6` | `text-primary`, `bg-primary` |
| `--primary-active` | `#005A9A` | `#0069B4` | `bg-primary-active` (hover/focus) |
| `--auxiliary` | `#9B3D9A` | `#B85CB7` | `text-auxiliary`, `bg-auxiliary` |
| `--danger` | `#ef4444` | `#dc2626` | `text-danger`, `bg-danger` |
| `--success` | `#22c55e` | (same) | `text-success`, `bg-success` |
| `--warning` | `#f59e0b` | (same) | `text-warning`, `bg-warning` |
| `--info` | `#3b82f6` | (same) | `text-info`, `bg-info` |

### Surface Colors

| Token | Light | Dark | Tailwind |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `#0f0f0f` | `bg-background` |
| `--foreground` | `#071437` | `#e7e7e7` | `text-foreground` |
| `--card` | `oklch(1 0 0)` | `#1a1a1a` | `bg-card` |
| `--border` | `oklch(0.922 0 0)` | `#2d2d2d` | `border-border` |
| `--muted` | `oklch(0.97 0 0)` | `#2d2d2d` | `bg-muted` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#a1a1a1` | `text-muted-foreground` |
| `--layout-body` | `#f8fafd` | `#1a1a1a` | `bg-layout-body` |

### Tinted Backgrounds (light variants)

| Use | Class |
|---|---|
| Light primary fill | `bg-primary/10` or `bg-light-primary` |
| Light success fill | `bg-success/10` or `bg-light-success` |
| Light danger fill | `bg-danger/10` or `bg-light-danger` |
| Light warning fill | `bg-warning/10` or `bg-light-warning` |
| Light info fill | `bg-info/10` or `bg-light-info` |
| Light auxiliary fill | `bg-auxiliary/10` or `bg-light-auxiliary` |

---

## 2. Typography

Font family: **Inter** (system fallback: `system-ui, -apple-system, sans-serif`).

| Role | Tailwind classes |
|---|---|
| Page title (h1) | `text-2xl font-bold text-foreground` |
| Section title (h2) | `text-lg font-semibold text-foreground` |
| Card heading | `text-base font-semibold text-foreground` |
| Body | `text-sm text-foreground` |
| Supporting / caption | `text-sm text-muted-foreground` |
| Label | `text-sm font-medium text-foreground` |
| Tiny / badge | `text-xs font-medium` |

---

## 3. Spacing & Layout

Use the **4px grid**. Standard rhythm: `gap-4`, `gap-6`, `space-y-4`, `space-y-6`.

### Page Shell

```tsx
<div className="space-y-6">
  {/* Page header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Page Title</h1>
      <p className="text-sm text-muted-foreground">Optional subtitle</p>
    </div>
    <Button>Primary Action</Button>
  </div>

  {/* Content blocks */}
  <div className="rounded-xl border border-border bg-card p-6">
    {/* content */}
  </div>
</div>
```

### Cards

```tsx
<div className="rounded-xl border border-border bg-card p-6">
  {/* flat, border-separated, no heavy shadow */}
</div>
```

Prefer `rounded-xl border border-border` over shadow-based elevation. Match dark mode automatically via CSS tokens.

### Multi-Step Wizard (full-height, no document scroll)

```tsx
// Page root must be in the flex chain from MainLayout
<div className="flex h-full max-h-full flex-col overflow-hidden">
  {/* stepper sidebar — fixed */}
  <div className="flex flex-1 min-h-0 overflow-hidden">
    <aside className="flex flex-col min-h-0 overflow-y-auto">...</aside>
    <main className="flex-1 min-h-0 overflow-y-auto p-6">...</main>
  </div>
</div>
```

Inset-scroll only — the document must not scroll. Every scrollable region needs `overflow-y-auto` on a flex child with `min-h-0`.

---

## 4. Shapes & Radius

| Use | Token | Tailwind |
|---|---|---|
| Button, Input | `--radius-md` (calc − 2px) | `rounded-md` |
| Card, Panel | `--radius-lg` (0.625rem) | `rounded-lg` / `rounded-xl` |
| Badge, Pill | full | `rounded-full` |
| Drawer, Dialog | `--radius-xl` (calc + 4px) | `rounded-xl` |

---

## 5. Elevation

The design is intentionally **low elevation**. Prefer borders over shadows.

| Rule | |
|---|---|
| Cards and panels | `border border-border` only — no box-shadow |
| Dropdowns, popovers | shadcn defaults (subtle shadow via Radix) |
| Focus states | `ring-2 ring-ring/50` or `border-primary` — no glowing |
| Active/hover states | background shift (`bg-muted`, `bg-primary/10`) — not shadow |

---

## 6. Buttons

### Variants

| Variant | When to use |
|---|---|
| `default` | Primary action (blue) |
| `destructive` | Irreversible / delete |
| `outline` | Secondary / cancel |
| `secondary` | Tertiary / neutral |
| `ghost` | Toolbar / icon-only actions |
| `success` | Confirm / approve |
| `warning` | Caution action |
| `info` | Informational action |

```tsx
<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="icon"><EditPencil className="h-4 w-4" /></Button>

{/* Loading state — use Button's loading prop, not a custom spinner */}
<Button loading={isPending}>Saving…</Button>
```

### Sizes

`default` | `sm` | `lg` | `icon`

Icon-only buttons: `size="icon"` + `aria-label`.

---

## 7. Form Fields

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Name <span className="text-danger">*</span></Label>
  <Input id="name" {...register("name")} placeholder="Enter name" />
  {errors.name && (
    <p className="text-sm text-danger">{errors.name.message}</p>
  )}
</div>
```

- Required indicator: `<span className="text-danger">*</span>`
- Error state: `text-sm text-danger` below the field
- Disabled state: `opacity-50 cursor-not-allowed` (handled by Input component)
- Grid layouts: `grid grid-cols-1 gap-4 sm:grid-cols-2`

---

## 8. Status Badges

```tsx
{/* Semantic tint + full pill */}
<span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Active</span>
<span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">Inactive</span>
<span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">Pending</span>
<span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">Processing</span>
<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">Draft</span>
```

**Always use `UserStatusDisplayLabels` (not `UserStatusLabels`) for read-only status badges.** `UserStatusLabels` is for toggle action buttons and confirm dialogs.

---

## 9. DataTable

Use `DataTable` from `@/components/ui/data-table` for every list/CRUD page.

| Requirement | Implementation |
|---|---|
| Server-side search | `searchable: true` + `debouncedSearch` from `useDataTableParams` |
| Server-side pagination | `paginationEnabled: true` + `pagination` prop |
| Server-side sort | `sortable: true` per column |
| Column filter | `filterable: true` + `filterOptions` per column |
| Row actions | `actions` array in `DataTableConfig` |
| Empty state | `emptyMessage` |
| Loading | `isLoading` prop |

Table scrolls **horizontally only** — the page must not scroll horizontally. Use `overflow-x-auto` wrapper inside DataTable (already handled by the component).

Action column: dropdown (`MoreVert` icon). Individual actions with `permission` key are hidden when the user lacks that permission.

---

## 10. Drawers

Use `Drawer + DrawerContent + DrawerOverlay` for slide-in forms and detail views (not modals).

```tsx
<Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  <DrawerOverlay />
  <DrawerContent>
    {/* Header */}
    <div className="flex items-center justify-between border-b border-border p-4">
      <h2 className="text-lg font-semibold text-foreground">Edit Item</h2>
      <button onClick={() => setDrawerOpen(false)}>
        <Xmark className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
    {/* Scrollable body */}
    <div className="flex-1 overflow-y-auto p-4">
      <MyItemForm onSuccess={() => setDrawerOpen(false)} />
    </div>
    {/* Sticky footer (optional) */}
    <div className="border-t border-border p-4">
      <Button type="submit" form="my-form" loading={isPending}>Save</Button>
    </div>
  </DrawerContent>
</Drawer>
```

For forms with searchable selects that expand: add `flex flex-col min-h-0` to the drawer body so content doesn't clip.

---

## 11. Loading States

```tsx
import { Spinner } from "@/components/ui/spinner";

{/* Full-page loader */}
<div className="flex h-64 items-center justify-center">
  <Spinner className="h-8 w-8 text-muted-foreground" />
</div>

{/* Inline/button: use Button loading prop */}
<Button loading={isPending}>Save</Button>

{/* Skeleton card */}
<div className="skeleton h-32 rounded-xl" />
```

Use `Spinner` for dynamic content areas. Use `skeleton` CSS class for initial page skeleton (uses CSS shimmer animation from `index.css`).

---

## 12. Empty States

```tsx
<div className="rounded-xl border border-border bg-card p-12 text-center">
  <SomeIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
  <h3 className="text-lg font-semibold text-foreground">No items yet</h3>
  <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first item.</p>
  <Button className="mt-4"><Plus className="h-4 w-4" /> Add Item</Button>
</div>
```

---

## 13. Error States

```tsx
<div className="rounded-lg border border-danger/20 bg-light-danger p-6 text-center">
  <p className="text-sm font-medium text-danger">Failed to load data. Please try again.</p>
</div>
```

---

## 14. Permission Denied

Use `PermissionDeniedCard` from `@/features/auth/components/PermissionDeniedCard` for full-page permission errors.

---

## 15. Navigation / Sidebar

- Sidebar is fixed at `w-52` (expanded) or `w-[4.25rem]` (collapsed)
- Active leaf: `bg-primary text-white rounded-md`
- Active group: `bg-primary/10 text-primary`
- Hover: `hover:bg-muted hover:text-foreground`
- Nav text: `text-xs font-medium`

---

## 16. Dark Mode

Dark mode is toggled by the `dark` class on `<html>` (managed by `layoutStore`). All tokens switch via `:root` / `.dark` in `index.css`.

Rules:
- Never hardcode color values — always use token classes
- Semantic tints (`bg-primary/10`, `bg-danger/10`) adapt automatically
- Surface swaps: `bg-card`, `bg-background`, `bg-muted` all switch via tokens
- Test every new component in dark mode before considering it done

---

## 17. Transitions & Animation

- Page transitions: `.page-transition` class (0.2s slide-up, defined in `index.css`)
- Button loading: CSS spinner via `.loading` class (no JS spinner)
- Sidebar collapse: `transition-all duration-300`
- Dropdown/accordion: shadcn default transitions via Radix
- Custom animations: define in `index.css` with `@keyframes`, not inline styles

---

## 18. Responsive Breakpoints

| Breakpoint | Tailwind prefix |
|---|---|
| Mobile-first default | (no prefix) |
| Small ≥ 640px | `sm:` |
| Medium ≥ 768px | `md:` |
| Large ≥ 1024px | `lg:` |
| XL ≥ 1280px | `xl:` |
| 2XL ≥ 1536px | `2xl:` |
| 3XL ≥ 1920px | `3xl:` (custom token) |

Mobile pattern: single column `grid-cols-1`, stack vertically, sidebar hidden (`-translate-x-full`) with overlay. Desktop: sidebar fixed, multi-column grids.

---

## 19. Accessibility

- All interactive elements must be keyboard-reachable
- Icon-only buttons: `aria-label="…"` required
- Images: `alt` text or `alt=""` for decorative
- Form fields: `<Label htmlFor>` connected to `id` on input
- Focus states: use ring tokens, not custom outlines
- Color alone must not convey state — pair with text/icon

---

## Do's and Don'ts

**Do:**
- Reuse existing tokens before introducing new colors, sizes, or radius values
- Match dark mode parity for every new component
- Prefer border-based separation over shadows
- Use semantic color variants (`bg-success/10 text-success`) over hardcoded hex
- Keep consistent component structure (header, body, footer) in cards and drawers

**Don't:**
- Introduce one-off colors or spacing values without adding tokens to `index.css`
- Use inline `style={{}}` — Tailwind utility classes only
- Create custom table/list patterns when DataTable fits
- Mix icon libraries — Iconoir only
- Use `animate-spin` on raw SVG for loading — use `Spinner` or the `loading` Button prop
- Skip loading/empty/error states
- Use `text-2xl font-bold` for anything other than page-level h1
