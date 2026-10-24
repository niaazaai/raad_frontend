/** HTTP failure from `callApi`, so React Query can skip retries by status. */
export class ApiRequestError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 429;
}

/**
 * One retry for network and 5xx failures.
 * Never retry 429 or other 4xx responses.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (isRateLimited(error)) return false;
  if (error instanceof ApiRequestError && error.status != null && error.status >= 400 && error.status < 500) {
    return false;
  }
  return true;
}
