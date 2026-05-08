// queue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
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