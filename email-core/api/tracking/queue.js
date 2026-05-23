// queue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  db: parseInt(process.env.REDIS_DB || "0", 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

export const clickQueue = new Queue("clickQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,   // retry
    backoff: {
      type: "exponential",
      delay: 500,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});