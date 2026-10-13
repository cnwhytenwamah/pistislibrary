import "server-only";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiHttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Server-side GET against the Express API. `clientIp` is forwarded so the API's
 * per-IP rate limits apply to the visitor rather than to this server.
 */
export async function apiGet<T>(path: string, opts: { clientIp?: string } = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: {
      Accept: "application/json",
      ...(opts.clientIp ? { "X-Forwarded-For": opts.clientIp } : {}),
    },
  });
  if (!res.ok) throw new ApiHttpError(res.status, `API ${path} responded ${res.status}`);
  return (await res.json()) as T;
}
