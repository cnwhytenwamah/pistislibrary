import { redis, isRedisUnavailable } from "../config/redis";

/**
 * Thin Redis cache. PostgreSQL stays the source of truth: every method fails open,
 * so a Redis outage only means cache misses.
 *
 * Keys in use: `categories:all`, `book:{id}` and `book:{slug}`.
 */
export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    if (isRedisUnavailable()) return null;
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number) {
    if (isRedisUnavailable()) return;
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // ignore
    }
  },

  /** Returns the cached value, or loads it, caches it and returns it. Errors from `loader` propagate (and are not cached). */
  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return value;
  },

  async del(...keys: string[]) {
    if (keys.length === 0 || isRedisUnavailable()) return;
    try {
      await redis.del(...keys);
    } catch {
      // ignore
    }
  },

  /** Deletes every key starting with `prefix` (SCAN based, safe on large keyspaces). */
  async delByPrefix(prefix: string) {
    if (isRedisUnavailable()) return;
    try {
      let cursor = "0";
      do {
        const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 200);
        cursor = next;
        if (keys.length) await redis.del(...keys);
      } while (cursor !== "0");
    } catch {
      // ignore
    }
  },
};
