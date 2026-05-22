import mongoose from "mongoose";
import "dotenv/config";
import SenderServer from "../models/SenderServer.js";

/**
 * CONNECT REAL SENDER SERVER
 * 
 * Fill in the details below to link your production sender server (running the PHP scripts)
 * to this Email-Core instance.
 */

const SENDER_CONFIG = {
  name: "Production Sender 01",     // Friendly name
  code: "PROD_01",                  // Unique code (e.g., S1, S2, etc.)
  baseUrl: "http://your-vps-ip",    // URL where your PHP sender server is located
  priority: 1,                      // 1 = highest priority
  routes: [
    {
      vmta: "vmta1",                // Must match a VMTA defined in your PMTA config
      domain: "yourdomain.com",     // Domain associated with this VMTA
      from_user: "support",         // Becomes support@yourdomain.com
      active: true,
    }
    // Add more routes if your server has multiple IPs/Domains
  ]
};

async function connect() {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not found in .env");
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await SenderServer.findOne({ code: SENDER_CONFIG.code });
    
    if (existing) {
      console.log(`ℹ️ Updating existing sender: ${SENDER_CONFIG.name}...`);
      await SenderServer.updateOne({ code: SENDER_CONFIG.code }, SENDER_CONFIG);
    } else {
      console.log(`➕ Connecting new sender: ${SENDER_CONFIG.name}...`);
      await new SenderServer(SENDER_CONFIG).save();
    }

    // Set other senders to inactive or lower priority if desired
    // await SenderServer.updateMany({ code: { $ne: SENDER_CONFIG.code } }, { active: false });

    console.log("\n🚀 SENDER CONNECTED SUCCESSFULLY!");
    console.log("-----------------------------------");
    console.log(`Name:   ${SENDER_CONFIG.name}`);
    console.log(`URL:    ${SENDER_CONFIG.baseUrl}`);
    console.log(`Routes: ${SENDER_CONFIG.routes.length} active`);
    console.log("-----------------------------------");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ CONNECTION FAILED:", err.message);
    process.exit(1);
  }
}

connect();
