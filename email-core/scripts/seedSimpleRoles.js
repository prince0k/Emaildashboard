import mongoose from "mongoose";
import "dotenv/config";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 0. Clear existing roles
    await Role.deleteMany({});
    console.log("🗑️ Cleared all existing roles");

    // 1. Get all permissions
    const allPermissions = await Permission.find({});
    const allPermIds = allPermissions.map(p => p._id);

    // 2. Define Basic Mailer Permissions
    const mailerPermNames = [
      "campaign.view",
      "offer.view",
      "reports.view",
      "sender.view"
    ];
    const mailerPermIds = allPermissions
      .filter(p => mailerPermNames.includes(p.name))
      .map(p => p._id);

    // 3. Upsert Admin Role
    await Role.findOneAndUpdate(
      { name: "admin" },
      {
        name: "admin",
        description: "Full system access",
        permissions: allPermIds,
        isSystem: true
      },
      { upsert: true, new: true }
    );
    console.log("✅ Admin role seeded");

    // 4. Upsert Mailer Role
    await Role.findOneAndUpdate(
      { name: "mailer" },
      {
        name: "mailer",
        description: "Limited access - can request additional permissions",
        permissions: mailerPermIds,
        isSystem: true
      },
      { upsert: true, new: true }
    );
    console.log("✅ Mailer role seeded");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
