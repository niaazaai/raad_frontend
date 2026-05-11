# AGENTS.md — Raad LMS Frontend

> Operational field guide for coding agents. Read this before writing a single line. For full patterns, complete examples, and edge cases see **`README.FRONTEND.LLM.md`** and **`DESIGN.md`**.

---

## Mission

Every change must stay consistent with: **module-scoped features → React Query for server state → Zustand for client state → Tailwind + design tokens for UI**. When in doubt, open an existing module (e.g. `UserManagement`) and mirror it exactly.

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript 5.7 (strict) |
| Build | Vite 6 + Bun |
| Styling | Tailwind CSS v4 (CSS-first, no `tailwind.config.js`) + shadcn/ui |
| Server state | TanStack Query v5 via `useQueryApi` / `useMutationApi` |
| Client state | Zustand 5 |
| Forms | React Hook Form + Zod |
| Routing | React Router v7 (lazy routes) |
| HTTP | Apisauce via `callApi` (never raw `fetch` / `axios`) |
| Toasts | Sonner |
| Icons | `iconoir-react` **only** (no Lucide) |
| Loading | `Spinner` from `@/components/ui/spinner` |

---

## Project Layout

```
src/
├── assets/css/index.css          # Tailwind v4 @theme + all CSS tokens
├── components/ui/                # shadcn primitives (Button, DataTable, Drawer, …)
├── data/
│   ├── constants/                # API_ENDPOINTS, REQUEST_METHODS
│   ├── enums/                    # Shared TypeScript enums
│   └── models/                  # Global Zod schemas (User, etc.)
├── features/auth/                # AuthWrapper, ProtectedRoute, Can, useAuth
├── hooks/common/                 # useApi, useQueryApi, useMutationApi, useDataTableParams
├── layouts/                      # MainLayout, Sidebar, Header
├── modules/                      # Feature modules (self-contained, see template below)
├── pages/                        # Top-level pages (Dashboard, auth pages, errors)
├── providers/                    # QueryProvider
├── routes/                       # AppRoutes, ProtectedRoutes, Routes.ts
├── services/                     # callApi, apiClient
├── store/                        # authStore, layoutStore, errorStore
├── types/                        # api.ts, base.ts, datatable.ts, routes.ts
└── utils/                        # routeHandling.ts, formatters
```

---

## Module Structure Template

Every feature lives in `src/modules/<FeatureName>/`:

```
MyFeature/
├── data/
│   ├── constants/
│   │   └── endpoints.ts      # MY_ENDPOINTS + MY_QUERY_KEYS
│   └── models/
│       ├── MyItem.ts         # Zod schema + inferred type + enums
│       └── index.ts          # barrel export
├── features/
│   └── MyItemList/
│       └── MyItemList.tsx    # List component with DataTable
├── hooks/
│   ├── useMyItems.ts         # useQueryApi / useMutationApi wrappers
│   └── index.ts              # barrel export
├── routes/
│   └── index.tsx             # ProtectedRouteType[] with permissions
└── index.ts                  # barrel export
```

---

## Core Coding Patterns

### Component

```tsx
import { useState } from "react";
import { SomeIcon } from "iconoir-react";
import { Button, Card, CardContent } from "@/components/ui";
import { useAuth } from "@/features/auth";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent = ({ title, onAction }: MyComponentProps) => {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {hasPermission("my-items.create") && (
          <Button onClick={onAction}>
            <SomeIcon className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MyComponent;
```

Rules: arrow function, typed `interface` props, `export default` at bottom, `@/` alias, no `React.FC`.

### Data Fetching

```tsx
// modules/MyFeature/data/constants/endpoints.ts
export const MY_ENDPOINTS = {
  ITEMS: {
    BASE: "/my-items",
    BY_ID: (id: number) => `/my-items/${id}`,
  },
} as const;

export const MY_QUERY_KEYS = {
  items: ["my-items"] as const,
  item: (id: number) => ["my-items", id] as const,
};

// modules/MyFeature/hooks/useMyItems.ts
import { useQueryApi, useMutationApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { MY_ENDPOINTS, MY_QUERY_KEYS } from "../data/constants/endpoints";

export function useMyItems(params?: Record<string, unknown>) {
  return useQueryApi<MyItem[]>({
    queryKey: [...MY_QUERY_KEYS.items, params],
    url: MY_ENDPOINTS.ITEMS.BASE,
    method: RequestMethod.GET,
    params,
  });
}

export function useCreateMyItem() {
  return useMutationApi<MyItem, CreateMyItemData>({
    url: MY_ENDPOINTS.ITEMS.BASE,
    method: RequestMethod.POST,
    invalidateKeys: [MY_QUERY_KEYS.items],
  });
}

export function useUpdateMyItem(id: number) {
  return useMutationApi<MyItem, UpdateMyItemData>({
    url: MY_ENDPOINTS.ITEMS.BY_ID(id),
    method: RequestMethod.PUT,
    invalidateKeys: [MY_QUERY_KEYS.items],
  });
}

export function useDeleteMyItem(id: number) {
  return useMutationApi<void, void>({
    url: MY_ENDPOINTS.ITEMS.BY_ID(id),
    method: RequestMethod.DELETE,
    invalidateKeys: [MY_QUERY_KEYS.items],
  });
}
```

### Zod Schema (schema first, type inferred)

```tsx
// modules/MyFeature/data/models/MyItem.ts
import * as z from "zod";

export enum MyItemStatus {
  ACTIVE = "active",
  DRAFT = "draft",
}

export const MyItemStatusDisplayLabels: Record<MyItemStatus, string> = {
  [MyItemStatus.ACTIVE]: "Active",
  [MyItemStatus.DRAFT]: "Draft",
};

export const MyItemStatusColors: Record<MyItemStatus, string> = {
  [MyItemStatus.ACTIVE]: "success",
  [MyItemStatus.DRAFT]: "secondary",
};

export const MyItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.nativeEnum(MyItemStatus),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MyItem = z.infer<typeof MyItemSchema>;

export const CreateMyItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  status: z.nativeEnum(MyItemStatus).optional(),
});
export type CreateMyItemData = z.infer<typeof CreateMyItemSchema>;

export const UpdateMyItemSchema = CreateMyItemSchema.partial();
export type UpdateMyItemData = z.infer<typeof UpdateMyItemSchema>;
```

### Form (React Hook Form + Zod)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@/components/ui";
import { CreateMyItemSchema, type CreateMyItemData } from "../data/models";

interface MyItemFormProps { onSuccess?: () => void; }

const MyItemForm = ({ onSuccess }: MyItemFormProps) => {
  const { mutateAsync, isPending } = useCreateMyItem();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateMyItemData>({
    resolver: zodResolver(CreateMyItemSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: CreateMyItemData) => {
    try {
      await mutateAsync(data);
      reset();
      onSuccess?.();
    } catch {
      // toast shown by callApi
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} placeholder="Enter name" />
        {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
      </div>
      <Button type="submit" loading={isPending}>Create</Button>
    </form>
  );
};
```

### List Page with DataTable

```tsx
import { Plus } from "iconoir-react";
import { DataTable, Button, useConfirmDialog, confirmPresets } from "@/components/ui";
import { Can } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import { useMyItems, useDeleteMyItem } from "../hooks";
import type { MyItem } from "../data/models";

function extractList(res: unknown): MyItem[] {
  if (!res || typeof res !== "object") return [];
  const d = (res as { data?: unknown }).data;
  if (Array.isArray(d)) return d as MyItem[];
  if (d && typeof d === "object" && Array.isArray((d as { data?: unknown }).data))
    return (d as { data: MyItem[] }).data;
  return [];
}

function extractPagination(res: unknown): DataTablePaginationMeta | null {
  if (!res || typeof res !== "object") return null;
  return (res as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}

const MyItemList = () => {
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });

  const { data, isLoading } = useMyItems({
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    ...params.filters,
  });

  const items = extractList(data);
  const pagination = extractPagination(data);
  const { confirm } = useConfirmDialog();
  const { mutate: deleteItem } = useDeleteMyItem(0); // id passed per row

  const config: DataTableConfig<MyItem> = {
    columns: [
      { key: "name", header: "Name", render: (row) => <span>{row.name}</span>, sortable: true },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: "Search items...",
    filtersEnabled: true,
    paginationEnabled: true,
    emptyMessage: "No items yet.",
    actions: [
      {
        key: "delete", label: "Delete", variant: "danger" as const,
        onClick: async (row) => {
          if (await confirm(confirmPresets.delete("Item"))) deleteItem({ id: row.id } as unknown as void);
        },
        permission: "my-items.delete",
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Items</h1>
          <p className="text-sm text-muted-foreground">Manage your items</p>
        </div>
        <Can permission="my-items.create">
          <Button><Plus className="h-4 w-4" /> Add Item</Button>
        </Can>
      </div>
      <DataTable data={items} config={config} params={params} onParamsChange={updateParams}
        pagination={pagination} isLoading={isLoading} />
    </div>
  );
};

export default MyItemList;
```

### Route Registration

```tsx
// modules/MyFeature/routes/index.tsx
import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const MyItemList = lazy(() => import("../features/MyItemList/MyItemList"));

export const MyFeatureRoutes: ProtectedRouteType[] = [
  { path: "/my-items", component: <MyItemList />, permission: "my-items.read" },
];
```

Spread into `ProtectedRoutes.tsx`: `...MyFeatureRoutes`  
Add to `src/routes/Routes.ts` for menus/breadcrumbs.

---

## Permission Guards

```tsx
import { Can, CanAny } from "@/features/auth";

<Can permission="my-items.create">
  <Button onClick={handleCreate}>Add</Button>
</Can>

<CanAny permissions={["my-items.update", "my-items.delete"]}>
  <ActionsMenu />
</CanAny>
```

Always guard both the route (`ProtectedRoute permission=`) and action UI (`<Can>`).

---

## Icons Quick Reference (Iconoir)

| Use Case | Icon name |
|---|---|
| Add / Create | `Plus` |
| Edit | `EditPencil` |
| Delete | `Trash` |
| View / Eye | `Eye`, `EyeOff` |
| Save | `FloppyDisk` |
| Close / Cancel | `Xmark` |
| Search | `Search` |
| Chevron right/left | `NavArrowRight`, `NavArrowLeft` |
| Users / Group | `Community`, `Group` |
| Roles | `Shield` |
| Permissions | `Key` |
| Overflow menu | `MoreVert` |
| Grid layout | `ViewGrid` |
| Mark all read | `DoubleCheck` |
| Courses | `BookStack` |
| Instructor | `Hat` |

Always look up the exact Iconoir name at [iconoir.com](https://iconoir.com) — they differ from Lucide.

---

## Design Token Quick Reference

| Token | Value | Tailwind class |
|---|---|---|
| Primary blue | `#0069B4` | `text-primary`, `bg-primary` |
| Primary hover | `#005A9A` | `bg-primary-active` |
| Auxiliary purple | `#9B3D9A` | `text-auxiliary`, `bg-auxiliary` |
| Danger | `#ef4444` | `text-danger`, `bg-danger` |
| Success | `#22c55e` | `text-success`, `bg-success` |
| Warning | `#f59e0b` | `text-warning`, `bg-warning` |
| Info | `#3b82f6` | `text-info`, `bg-info` |
| Muted text | `oklch(0.556 0 0)` | `text-muted-foreground` |
| Page bg | `--layout-body` | `bg-layout-body` |

Tinted backgrounds: `bg-primary/10`, `bg-success/10`, `bg-danger/10`, `bg-light-primary`, etc.

---

## Status Badge Pattern

```tsx
// Prefer light-background + matching text, no heavy shadows
<span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
  Active
</span>
<span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
  Inactive
</span>
```

Use `UserStatusDisplayLabels` (not `UserStatusLabels`) for read-only display. `UserStatusLabels` is for action buttons/confirm dialogs.

---

## New Feature Checklist

1. `modules/<F>/data/constants/endpoints.ts` — `ENDPOINTS` + `QUERY_KEYS`
2. `modules/<F>/data/models/<Entity>.ts` — Zod schema, type, enum + display/action labels
3. `modules/<F>/data/models/index.ts` — barrel export
4. `modules/<F>/hooks/use<Entity>.ts` — `useQueryApi` / `useMutationApi` wrappers
5. `modules/<F>/hooks/index.ts` — barrel export
6. `modules/<F>/features/<Entity>List/<Entity>List.tsx` — DataTable list
7. (optional) `modules/<F>/features/<Entity>Form/<Entity>Form.tsx` — Drawer form
8. `modules/<F>/routes/index.tsx` — `ProtectedRouteType[]` with permissions
9. Spread routes in `src/routes/ProtectedRoutes.tsx`
10. Add route aggregate to `src/routes/Routes.ts`
11. Add sidebar link in `src/layouts/components/Sidebar.tsx`
12. Verify permission guards on route **and** every UI action

---

## Zustand Store Rules

- Auth, layout (sidebar/theme), error state → Zustand
- API / server data → React Query (never Zustand)
- Persist keys must be prefixed: `raad-lms-<domain>` (e.g. `raad-lms-layout`)
- Export both the hook and the state interface from `src/store/index.ts`

---

## API Response Extraction Pattern

Backend always returns:
```ts
{ success: true, message: "...", data: T }                       // single
{ success: true, data: T[], meta: { pagination: {...} }, links: {...} }  // list
```

Use the `extractList` / `extractPagination` helper pattern (see List Page example above) — do not access `.data.data` chains inline in JSX.

---

## DO

- Keep every feature self-contained inside its `modules/<F>/` folder
- Define endpoints and query keys **before** writing hooks
- Handle **loading**, **empty**, **error**, and **permission-denied** states in every page
- Use `Spinner` from `@/components/ui/spinner` for loading states
- Keep TypeScript strict — use `unknown` instead of `any`
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Follow the DataTable server-side contract: `search`, `page`, `per_page`, `sort_by`, `sort_dir`, filters

## DO NOT

- Use `lucide-react` — Iconoir only
- Use `fetch()` or `axios` directly — always `callApi`
- Put server state in Zustand
- Use inline styles — Tailwind classes only
- Skip Zod validation on forms
- Hardcode API URL strings — use endpoint constants
- Skip permission checks on routes or action UI
- Use `React.FC` — use typed props directly
- Add `console.log` / `console.warn` / `console.error` in committed code
- Use `any` type — use `unknown` or proper types
- Create duplicate loading spinners inside buttons — use `loading` prop on `<Button>`
- Import from `lucide-react` or any icon library other than `iconoir-react`

---

## Reference

- **`README.FRONTEND.LLM.md`** — Full patterns, complete code examples, API contract, Course module
- **`DESIGN.md`** — Visual tokens, layout rules, component specs, dark mode, interaction states
