import { RequestMethod } from '@/data/constants/methods';
import { callApi } from '@/services';

export class ApiError extends Error {
  status: number;
  code: string;
  requestId?: string;
  fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    extras?: { code?: string; requestId?: string; fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = extras?.code ?? 'ERROR';
    this.requestId = extras?.requestId;
    this.fieldErrors = extras?.fieldErrors ?? {};
  }
}

export interface ListEnvelope<T> {
  data: T[];
  meta: {
    has_more: boolean;
    next_cursor: string | null;
    pagination?: {
      total?: number;
      current_page?: number;
      has_more_pages?: boolean;
    };
  };
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function fieldErrorsOf(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== 'object' || !('errors' in body)) return {};
  const errors = (body as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') return {};

  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) out[key] = value.map(String);
    else if (typeof value === 'string') out[key] = [value];
  }
  return out;
}

/** Laravel's paginator becomes the cursor-shaped envelope the grid already reads. */
function mapEnvelope(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;

  const record = body as {
    data?: unknown;
    meta?: { pagination?: { has_more_pages?: boolean; current_page?: number } };
  };
  let data = record.data;
  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    data = (data as { data: unknown[] }).data;
  }

  const pagination = record.meta?.pagination;
  if (!pagination || !Array.isArray(data)) return body;

  const current = pagination.current_page ?? 1;
  const hasMore = Boolean(pagination.has_more_pages);

  return {
    ...record,
    data,
    meta: {
      ...record.meta,
      has_more: hasMore,
      next_cursor: hasMore ? String(current + 1) : null,
    },
  };
}

export async function apiFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown; idempotencyKey?: string },
): Promise<T> {
  const [url, search = ''] = path.split('?');
  const params = Object.fromEntries(new URLSearchParams(search));
  const method = (init?.method ?? RequestMethod.GET).toUpperCase() as RequestMethod;

  const response = await callApi<unknown>({
    url,
    method,
    params,
    data: init?.body ?? {},
    shouldPopError: false,
    shouldPopSuccess: false,
    headers: init?.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {},
  });

  if (!response.ok) {
    const body = response.data;
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Request failed';
    throw new ApiError(message, response.status ?? 0, { fieldErrors: fieldErrorsOf(body) });
  }

  return mapEnvelope(response.data) as T;
}
