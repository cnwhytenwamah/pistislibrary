/**
 * Phase 1 foundation check: `npm run verify:foundation`
 *
 * Expects the frontend (npm run dev), the API (npm run dev) and the worker
 * (npm run worker) to be running, plus PostgreSQL and Redis.
 */
import { QueueEvents } from "bullmq";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../config/queues";
import { createBullConnection, redis } from "../config/redis";
import { systemQueue } from "../queues/system.queue";

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

async function check(name: string, fn: () => Promise<string>) {
  try {
    results.push({ name, ok: true, detail: await fn() });
  } catch (err) {
    results.push({ name, ok: false, detail: (err as Error).message });
  }
}

async function fetchWithTimeout(url: string, ms = 5000) {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}

async function main() {
  const apiUrl = `http://localhost:${env.PORT}/api/v1`;

  await check("Frontend → Running", async () => {
    const res = await fetchWithTimeout(env.CLIENT_URL);
    if (!res.ok) throw new Error(`${env.CLIENT_URL} responded ${res.status}`);
    return env.CLIENT_URL;
  });

  await check("Backend → Running", async () => {
    const res = await fetchWithTimeout(`${apiUrl}/health/live`);
    if (!res.ok) throw new Error(`responded ${res.status}`);
    return apiUrl;
  });

  await check("PostgreSQL → Connected", async () => {
    const [row] = await sequelize.query<{ version: string }>("SELECT version() AS version", {
      type: QueryTypes.SELECT,
    });
    return row.version.split(" ").slice(0, 2).join(" ");
  });

  await check("Sequelize → Connected", async () => {
    await sequelize.authenticate();
    const [row] = await sequelize.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM "SequelizeMeta"',
      { type: QueryTypes.SELECT }
    );
    const n = row.n;
    if (n === 0) throw new Error("connected, but no migrations applied (run `npm run migrate`)");
    return `${n} migrations applied`;
  });

  await check("Redis → Connected", async () => {
    const key = `verify:${Date.now()}`;
    await redis.set(key, "ok", "EX", 10);
    const value = await redis.get(key);
    await redis.del(key);
    if (value !== "ok") throw new Error("read/write round trip failed");
    return "PING + SET/GET ok";
  });

  await check("BullMQ → Connected", async () => {
    const events = new QueueEvents(QUEUE_NAMES.SYSTEM, { connection: createBullConnection() });
    try {
      await events.waitUntilReady();
      const job = await systemQueue.add("ping", {}, { removeOnComplete: true });
      try {
        await job.waitUntilFinished(events, 8000);
      } catch {
        throw new Error("job was queued but no worker processed it (is `npm run worker` running?)");
      }
      return "ping job processed by worker";
    } finally {
      await events.close();
    }
  });

  await check("Health endpoint → Working", async () => {
    const res = await fetchWithTimeout(`${apiUrl}/health`);
    const body = (await res.json()) as {
      status: string;
      checks: Record<string, { status: string; detail?: { workers?: number } }>;
    };
    if (!res.ok || body.status !== "ok") {
      throw new Error(`status ${res.status}: ${JSON.stringify(body.checks)}`);
    }
    return `database/redis/queue ok, ${body.checks.queue.detail?.workers ?? 0} worker(s)`;
  });

  const width = Math.max(...results.map((r) => r.name.length));
  console.log("");
  for (const r of results) {
    console.log(`${r.ok ? "✔" : "✘"} ${r.name.padEnd(width)}  ${r.detail}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed === 0 ? "\nFoundation verified. Ready for Phase 2." : `\n${failed} check(s) failed.`);

  await Promise.allSettled([systemQueue.close(), redis.quit(), sequelize.close()]);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
