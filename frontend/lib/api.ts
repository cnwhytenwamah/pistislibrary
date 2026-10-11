/**
 * Minimal API client. All requests go to the same origin (/api/v1/*), which
 * next.config.ts proxies to the Express API, so auth cookies stay first-party.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? res.statusText, body?.details);
  }
  return body as T;
}
