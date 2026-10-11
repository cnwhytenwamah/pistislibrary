
import { env } from "./config/env";
import { sequelize } from "./config/database";
import { redis } from "./config/redis";
import { systemQueue } from "./queues/system.queue";
import "./database/models";

async function start() {
  // Ensure Redis is ready before importing the app and initializing rate limiters.
  await redis.ping();

  // Verify PostgreSQL is reachable.
  await sequelize.authenticate();

  // Import only after Redis is ready because app initialization creates rate limiters.
  const { default: app } = await import("./app");

  const server = app.listen(env.PORT, () =>
    console.log(`PistisLibrary API running on :${env.PORT}`)
  );

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);

    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();

    server.close();

    await Promise.allSettled([
      systemQueue.close(),
      redis.quit(),
      sequelize.close(),
    ]);

    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});