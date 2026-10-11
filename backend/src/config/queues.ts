import type { JobsOptions } from "bullmq";

/**
 * Queue names. Phase 1 only needs `system`; later phases add
 * notifications (Phase 7), email, book processing and analytics.
 */
export const QUEUE_NAMES = {
  SYSTEM: "system",
} as const;

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};
