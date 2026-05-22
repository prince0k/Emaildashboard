import mongoose from "mongoose";
import "dotenv/config";
import SenderServer from "../models/SenderServer.js";

async function addMockSender() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const mockSender = {
      name: "Local Dev Sender",
      code: "LOCAL",
      baseUrl: "http://127.0.0.1:8080", // Point to our emulated PHP server
      active: true,
      routes: [
        {
          vmta: "vmta1",
          domain: "localhost",
          from_user: "welcome",
          active: true,
        }
      ]
    };

    const existing = await SenderServer.findOne({ code: "LOCAL" });
    if (existing) {
      console.log("ℹ️ Mock sender already exists. Updating...");
      await SenderServer.updateOne({ code: "LOCAL" }, mockSender);
    } else {
      console.log("➕ Adding new mock sender...");
      await new SenderServer(mockSender).save();
    }

    console.log("✅ Mock sender ready!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

addMockSender();
