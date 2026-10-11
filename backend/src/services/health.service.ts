import { sequelize } from "../config/database";
import { env } from "../config/env";
import { redis } from "../config/redis";
import { systemQueue } from "../queues/system.queue";

type CheckResult = {
  status: "ok" | "down";
  latencyMs: number;
  detail?: Record<string, unknown>;
  error?: string;
};

const CHECK_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function run(fn: () => Promise<Record<string, unknown> | void>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const detail = await withTimeout(fn(), CHECK_TIMEOUT_MS);
    return { status: "ok", latencyMs: Date.now() - start, ...(detail ? { detail } : {}) };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      // Don't leak connection details in production
      ...(env.NODE_ENV !== "production" ? { error: (err as Error).message } : {}),
    };
  }
}

export const healthService = {
  async check() {
    const [database, cache, queue] = await Promise.all([
      run(async () => { await sequelize.query("SELECT 1"); }),
      run(async () => {
        const reply = await redis.ping();
        if (reply !== "PONG") throw new Error(`unexpected reply: ${reply}`);
      }),
      run(async () => {
        const [counts, workers] = await Promise.all([
          systemQueue.getJobCounts("waiting", "active", "failed"),
          systemQueue.getWorkers(),
        ]);
        return { ...counts, workers: workers.length };
      }),
    ]);

    const checks = { database, redis: cache, queue };
    const healthy = Object.values(checks).every((c) => c.status === "ok");

    return {
      healthy,
      body: {
        status: healthy ? "ok" : "degraded",
        service: "pistislibrary-api",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        checks,
      },
    };
  },
};
