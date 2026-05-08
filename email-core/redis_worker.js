import mongoose from "mongoose";
import Redis from "ioredis";
import LinkToken from "./models/LinkToken.js";

const redis = new Redis("redis://127.0.0.1:6379");

await mongoose.connect("mongodb://127.0.0.1:27017/email_core");

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
