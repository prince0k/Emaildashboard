import dotenv from "dotenv";
import mongoose from "mongoose";
import Redis from "ioredis";
import LinkToken from "./models/LinkToken.js";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  db: parseInt(process.env.REDIS_DB || "0", 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/email_core");

console.log("🚀 Worker started");

const BATCH_SIZE = 100;

while (true) {
  try {
    const items = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const item = await redis.rpop("token_queue");
      if (!item) break;
      items.push(JSON.parse(item));
    }

    if (items.length === 0) {
      await new Promise(r => setTimeout(r, 50));
      continue;
    }

    await LinkToken.collection.insertMany(items, {
      ordered: false,
      writeConcern: { w: 0 }
    });

    console.log("Inserted:", items.length);

  } catch (err) {
    console.error("Worker error:", err);
  }
}
