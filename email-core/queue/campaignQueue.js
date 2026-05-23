import Queue from "bull";
import dotenv from "dotenv";

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const campaignQueue = new Queue("campaigns", {
  redis: redisConfig,
});

console.log(`🔌 Bull: campaignQueue initialized on redis://${redisConfig.host}:${redisConfig.port}`);
