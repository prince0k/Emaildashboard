// scripts/seedRoles.js

import dotenv from "dotenv";
import connectMongo from "../config/mongo.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

dotenv.config(); // 🔥 THIS WAS MISSING

async function seed() {
  try {
    await connectMongo();
    console.log("Mongo connected");

    const allPermissions = await Permission.find({});
    if (!allPermissions.length) {
      throw new Error(
        "No permissions found. Run seed:permissions first."
      );
    }

    const allPermissionIds = allPermissions.map(p => p._id);

    const viewPermissions = allPermissions
      .filter(p => p.name.endsWith(".view"))
      .map(p => p._id);

    await Role.updateOne(
      { name: "super_admin" },
      {
        $set: {
          name: "super_admin",
          description: "Full system access",
          permissions: allPermissionIds,
          isSystem: true,
        },
      },
      { upsert: true }
    );

    await Role.updateOne(
      { name: "admin" },
      {
        $set: {
          name: "admin",
          description: "Operational admin",
          permissions: allPermissionIds,
          isSystem: true,
        },
      },
      { upsert: true }
    );

    const managerPerms = allPermissions
      .filter(p =>
        p.name.startsWith("campaign.") ||
        p.name.startsWith("offer.") ||
        p.name.endsWith(".view")
      )
      .map(p => p._id);

    await Role.updateOne(
      { name: "manager" },
      {
        $set: {
          name: "manager",
          description: "Campaign manager",
          permissions: managerPerms,
        },
      },
      { upsert: true }
    );

    await Role.updateOne(
      { name: "viewer" },
      {
        $set: {
          name: "viewer",
          description: "Read-only access",
          permissions: viewPermissions,
        },
      },
      { upsert: true }
    );

    console.log("Roles seeded successfully");
    process.exit(0);

  } catch (err) {
    console.error("Role seeding failed:", err);
    process.exit(1);
  }
}

seed();