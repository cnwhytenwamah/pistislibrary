import type { HealthResponse } from "@/types/health";

/** The API answers 503 with the same JSON shape when a dependency is down, so we read the body either way. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch("/api/v1/health", { cache: "no-store", signal });
  const body = (await res.json().catch(() => null)) as HealthResponse | null;
  if (!body?.checks) throw new Error(`Unexpected health response (${res.status})`);
  return body;
}
