import { Queue } from "bullmq";
import { createBullConnection } from "../config/redis";
import { QUEUE_NAMES, defaultJobOptions } from "../config/queues";

/** Used for infrastructure jobs such as the `ping` job that verifies BullMQ end to end. */
export const systemQueue = new Queue(QUEUE_NAMES.SYSTEM, {
  connection: createBullConnection(),
  defaultJobOptions,
});
