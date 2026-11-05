import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from './i18n';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Check, Loader2, Save, Star, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, apiFetch, newId } from '@/api/client';
import { useConfirm } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferenceScope } from '@/lib/permission';
import type { FilterValue } from './query';
import type { Density } from './types';
import type { DataTableApi } from './use-data-table';

/** One saved view (PLT-UI-016, amendment §8). */
export interface SavedView {
  id: string;
  name: string;
  is_default: boolean;
  is_shared: boolean;
  is_mine: boolean;
  filters: { filter?: Record<string, FilterValue>; q?: string };
  sort: string | null;
  columns: Record<string, boolean>;
  widths: Record<string, number>;
  density: Density | null;
}

const OPS: readonly string[] = ['eq', 'like', 'in', 'gte', 'lte'];

function isFilterValue(value: unknown): value is FilterValue {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as { op?: unknown; value?: unknown };

  return typeof candidate.op === 'string' && OPS.includes(candidate.op)
    && (typeof candidate.value === 'string' || (Array.isArray(candidate.value) && candidate.value.every((v) => typeof v === 'string')));
}

const viewsKey = (scope: string, table: string) => ['haltoon', 'platform', 'table-views', scope, table] as const;

/** Whether the URL already says what to show — then the default view must not override it. */
function urlNamesAList(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);

  return [...params.keys()].some((key) => key === 'q' || key === 'sort' || key.startsWith('filter['));
}

/**
 * Saved views, in the toolbar of every list (06-ui-ux §9, PLT-UI-016).
 *
 * A view is the list's filter, search and sort plus its layout — columns, widths, density.
 * Saving one captures what is on screen now; applying one puts it back. A view can be the one
 * the list opens with, and can be shared with the organisation; only its owner changes it.
 * A link that already carries a filter wins over the default view — the link is what the
 * person followed.
 */
export function DataTableViews<TRow>({ api }: { api: DataTableApi<TRow> }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const confirm = useConfirm();
  const scope = usePreferenceScope();
  const table = api.options.key;
  const [applied, setApplied] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const defaultTried = useRef(false);
  // Read at the first render: the list writes its own default sort into the URL as it mounts,
  // so asking later would always find one and the default view would never apply.
  const [linkNamedAList] = useState(urlNamesAList);

  const views = useQuery({
    queryKey: viewsKey(scope, table),
    queryFn: () => apiFetch<{ data: SavedView[] }>(`/table-views?table_key=${encodeURIComponent(table)}`)
      .then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: scope !== 'anon',
    staleTime: 5 * 60_000,
  });

  const refresh = (): void => void client.invalidateQueries({ queryKey: viewsKey(scope, table) });

  const { controls, preferences } = api;

  const apply = (view: SavedView): void => {
    controls.clearFilters();
    for (const [column, value] of Object.entries(view.filters.filter ?? {})) {
      // A view saved by an older build may carry a shape this one does not read; skip it
      // rather than send the server a filter it would reject.
      if (isFilterValue(value)) controls.setFilter(column, value);
    }
    if (view.filters.q) controls.setSearch(view.filters.q);
    if (view.sort !== null) controls.setSort(view.sort);
    preferences.replace({
      columns: view.columns,
      widths: view.widths,
      density: view.density ?? preferences.density,
      order: preferences.order,
    });
    setApplied(view.id);
  };

  // The default view, once, when the list opens with nothing in the URL.
  const list = views.data;
  useEffect(() => {
    if (defaultTried.current || list === undefined) return undefined;
    defaultTried.current = true;
    const preferred = list.find((view) => view.is_default);
    if (!preferred || linkNamedAList) return undefined;

    // After this render commits: applying sets the list's own state, which an effect must not
    // do synchronously.
    const timer = setTimeout(() => apply(preferred), 0);

    return () => clearTimeout(timer);
    // `apply` closes over the current controls; running once per mount is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const current = list?.find((view) => view.id === applied);

  const snapshot = () => ({
    filters: { filter: controls.query.filter, q: controls.query.q },
    sort: controls.query.sort,
    columns: preferences.columns,
    widths: preferences.widths,
    density: preferences.density,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch<{ data: SavedView }>(`/table-views/${id}`, { method: 'PATCH', body }),
    onSuccess: refresh,
    onError: (error) => toast.error(t('views.failed'), { description: error instanceof ApiError ? error.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/table-views/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setApplied(undefined);
      refresh();
    },
    onError: (error) => toast.error(t('views.failed'), { description: error instanceof ApiError ? error.message : undefined }),
  });

  const onDelete = async (view: SavedView): Promise<void> => {
    const ok = await confirm({
      title: t('views.deleteTitle', { name: view.name }),
      body: view.is_shared ? t('views.deleteSharedBody') : undefined,
      confirmLabel: t('actions.delete'),
      destructive: true,
    });
    if (ok) remove.mutate(view.id, { onSuccess: () => toast.success(t('views.deleted', { name: view.name })) });
  };

  if (scope === 'anon') return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-tour="table-views"
            variant="outline"
            size="sm"
            className="max-w-48"
            aria-label={current ? t('views.labelCurrent', { name: current.name }) : t('views.label')}
          >
            <Bookmark className="size-4" aria-hidden />
            <span className="hidden truncate sm:inline" aria-hidden>{current?.name ?? t('views.label')}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{t('views.label')}</DropdownMenuLabel>

          {views.isLoading ? (
            <DropdownMenuItem disabled><Loader2 className="size-4 animate-spin" />{t('states.loading')}</DropdownMenuItem>
          ) : (list ?? []).length === 0 ? (
            <DropdownMenuItem disabled>{t('views.none')}</DropdownMenuItem>
          ) : (
            (list ?? []).map((view) => (
              <DropdownMenuItem key={view.id} onSelect={() => apply(view)} className="gap-2">
                {view.id === applied ? <Check className="size-4" /> : <span className="size-4" aria-hidden />}
                <span className="min-w-0 flex-1 truncate">{view.name}</span>
                {view.is_default ? <Star className="size-3.5 text-muted-foreground" aria-label={t('views.isDefault')} /> : null}
                {view.is_shared ? <Users className="size-3.5 text-muted-foreground" aria-label={view.is_mine ? t('views.sharedByMe') : t('views.sharedWithMe')} /> : null}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setSaving(true)}>
            <Save className="size-4" />
            {t('views.saveCurrent')}
          </DropdownMenuItem>

          {current?.is_mine ? (
            <>
              <DropdownMenuItem onSelect={() => update.mutate({ id: current.id, body: snapshot() }, { onSuccess: () => toast.success(t('views.updated', { name: current.name })) })}>
                <Save className="size-4" />
                {t('views.updateCurrent', { name: current.name })}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => update.mutate({ id: current.id, body: { is_default: !current.is_default } })}>
                <Star className="size-4" />
                {current.is_default ? t('views.unsetDefault') : t('views.setDefault')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void onDelete(current)} className="text-destructive focus:text-destructive">
                <Trash2 className="size-4" />
                {t('views.delete')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveViewDialog
        open={saving}
        table={table}
        snapshot={snapshot}
        onClose={() => setSaving(false)}
        onSaved={(view) => {
          setApplied(view.id);
          refresh();
        }}
      />
    </>
  );
}

function SaveViewDialog({
  open, table, snapshot, onClose, onSaved,
}: {
  open: boolean;
  table: string;
  snapshot: () => Record<string, unknown>;
  onClose: () => void;
  onSaved: (view: SavedView) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const save = useMutation({
    mutationFn: () => apiFetch<{ data: SavedView }>('/table-views', {
      method: 'POST',
      body: { table_key: table, name: name.trim(), is_default: isDefault, is_shared: isShared, ...snapshot() },
      idempotencyKey: newId(),
    }).then((r) => r.data),
    onSuccess: (view) => {
      toast.success(t('views.saved', { name: view.name }));
      onSaved(view);
      close();
    },
    onError: (e) => setError(e instanceof ApiError ? (e.fieldErrors['name']?.[0] ?? e.message) : t('views.failed')),
  });

  const close = (): void => {
    setName('');
    setIsDefault(false);
    setIsShared(false);
    setError(undefined);
    onClose();
  };

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setError(t('views.nameRequired'));

      return;
    }
    save.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t('views.saveTitle')}</DialogTitle>
            <DialogDescription>{t('views.saveBody')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="view-name">{t('views.name')}</Label>
            <Input
              id="view-name"
              value={name}
              maxLength={150}
              autoFocus
              onChange={(event) => { setName(event.target.value); setError(undefined); }}
              aria-invalid={error !== undefined}
              aria-describedby={error ? 'view-name-error' : undefined}
            />
            {error ? <p id="view-name-error" role="alert" className="text-xs text-destructive">{error}</p> : null}
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
            {t('views.openWithThis')}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox checked={isShared} onCheckedChange={(v) => setIsShared(v === true)} />
            <span className="flex flex-col">
              {t('views.share')}
              <span className="text-xs text-muted-foreground">{t('views.shareHint')}</span>
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>{t('actions.cancel')}</Button>
            <Button type="submit" loading={save.isPending}>{t('views.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
