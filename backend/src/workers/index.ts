import { Worker } from "bullmq";
import { sequelize } from "../config/database";
import { createBullConnection, redis } from "../config/redis";
import { QUEUE_NAMES } from "../config/queues";
import "../database/models";

/**
 * Background worker process: `npm run worker` (separate from the API process).
 * Later phases register their processors here (notifications, email, book processing...).
 */
async function start() {
  await sequelize.authenticate();

  const systemWorker = new Worker(
    QUEUE_NAMES.SYSTEM,
    async (job) => {
      switch (job.name) {
        case "ping":
          return { pong: true, processedAt: new Date().toISOString() };
        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    },
    { connection: createBullConnection(), concurrency: 5 }
  );

  systemWorker.on("failed", (job, err) => console.error(`[worker] ${job?.name} failed:`, err.message));
  console.log("PistisLibrary worker started (queues: system)");

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received, shutting down`);
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    await systemWorker.close();
    await Promise.allSettled([redis.quit(), sequelize.close()]);
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
