import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne({ email: "admin@example.com" })
      .populate({
        path: "role",
        populate: { path: "permissions" }
      });

    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log(`User: ${user.email}`);
    console.log(`Role: ${user.role?.name || "None"}`);
    console.log("Permissions:", user.role?.permissions?.map(p => p.name) || []);

    // Check all available permissions
    const allPerms = await Permission.find({});
    console.log("All available permissions in DB:", allPerms.map(p => p.name));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAdmin();
