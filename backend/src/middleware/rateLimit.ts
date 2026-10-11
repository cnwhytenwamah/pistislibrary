import rateLimit from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { isRedisUnavailable, redis } from "../config/redis";

type LimiterOptions = {
  /** Used in the Redis key prefix, so each limiter keeps its own counters. */
  name: string;
  windowMs: number;
  limit: number;
  message?: string;
};

/**
 * Redis-backed rate limiter (counters are shared across API instances).
 * If Redis is unavailable the request is allowed through rather than failing.
 */
export function createLimiter({ name, windowMs, limit, message }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisStore({
      prefix: `rl:${name}:`,
      sendCommand: (command: string, ...args: string[]) => {
        // Fail fast during an outage; passOnStoreError then lets the request through
        if (isRedisUnavailable()) return Promise.reject(new Error("Redis unavailable"));
        return redis.call(command, ...args) as Promise<RedisReply>;
      },
    }),
    message: { message: message ?? "Too many requests. Please try again later." },
  });
}

const MINUTE = 60 * 1000;

// Whole API (per IP)
export const generalLimiter = createLimiter({ name: "general", windowMs: 15 * MINUTE, limit: 600 });

// Register, login, Google sign-in
export const authLimiter = createLimiter({
  name: "auth",
  windowMs: 15 * MINUTE,
  limit: 30,
  message: "Too many attempts. Please try again later.",
});

// Library search / listing
export const searchLimiter = createLimiter({ name: "search", windowMs: MINUTE, limit: 60 });

// Signed download links
export const downloadLimiter = createLimiter({
  name: "download",
  windowMs: 10 * MINUTE,
  limit: 30,
  message: "Too many download requests. Please slow down.",
});

// Phase 6 will add a limiter for book requests.
