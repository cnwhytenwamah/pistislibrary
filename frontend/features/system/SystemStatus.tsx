"use client";

import { useEffect, useState } from "react";
import { fetchHealth } from "@/services/health";
import type { HealthResponse } from "@/types/health";

type State =
  | { phase: "loading" }
  | { phase: "unreachable" }
  | { phase: "ready"; health: HealthResponse };

export function SystemStatus() {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const health = await fetchHealth(controller.signal);
        setState({ phase: "ready", health });
      } catch {
        if (!controller.signal.aborted) setState({ phase: "unreachable" });
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const rows =
    state.phase === "ready"
      ? [
          { label: "API", ok: true, note: "reachable" },
          { label: "PostgreSQL", ok: state.health.checks.database.status === "ok" },
          { label: "Redis", ok: state.health.checks.redis.status === "ok" },
          {
            label: "Job queue",
            ok: state.health.checks.queue.status === "ok",
            note:
              state.health.checks.queue.status === "ok"
                ? `${state.health.checks.queue.detail?.workers ?? 0} worker(s)`
                : undefined,
          },
        ]
      : [];

  return (
    <section
      aria-labelledby="system-status-heading"
      className="w-full max-w-md rounded-2xl border border-line bg-surface/80 p-5 shadow-glow backdrop-blur"
    >
      <h2 id="system-status-heading" className="text-sm font-medium tracking-wide text-ink-soft">
        System status
      </h2>

      <div role="status" aria-live="polite" className="mt-4">
        {state.phase === "loading" && <p className="text-sm text-ink-soft">Checking services…</p>}

        {state.phase === "unreachable" && (
          <p className="text-sm text-copper-soft">
            The API isn&apos;t reachable. Start the backend and refresh.
          </p>
        )}

        {state.phase === "ready" && (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ${row.ok ? "bg-copper-bright shadow-glow" : "bg-red-500"}`}
                  />
                  {row.label}
                </span>
                <span className="text-ink-soft">
                  {row.ok ? (row.note ?? "connected") : "down"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
