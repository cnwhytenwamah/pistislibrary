import IORedis from "ioredis";
import { env } from "./env";

/**
 * General-purpose client: cache, rate limiting, short-lived data.
 * Commands fail fast when Redis is unreachable so callers can degrade gracefully.
 */
export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  commandTimeout: 1500,
  retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
});

/** True while the connection is down/reconnecting (callers should skip Redis instead of waiting). */
export const isRedisUnavailable = () =>
  redis.status === "reconnecting" || redis.status === "close" || redis.status === "end";

redis.on("error", (err) => {
  console.error("[redis]", err.message);
});

/**
 * BullMQ needs its own connections with `maxRetriesPerRequest: null`
 * (blocking commands must wait for Redis instead of failing).
 * Queues, workers and queue-events should each get their own connection.
 */
export const createBullConnection = () => {
  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  connection.on("error", (err) => console.error("[bullmq:redis]", err.message));
  return connection;
};
