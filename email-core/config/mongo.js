import mongoose from "mongoose";

export default async function connectMongo() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Refusing to start.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
    });

    console.log("✅ MongoDB connected (mongoose)");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  }
}
