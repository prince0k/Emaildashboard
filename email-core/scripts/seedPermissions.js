// scripts/seedPermissions.js

import dotenv from "dotenv";
import connectMongo from "../config/mongo.js";
import Permission from "../models/Permission.js";

dotenv.config();

const permissions = [
  { name: "campaign.create", module: "campaign" },
  { name: "campaign.edit", module: "campaign" },
  { name: "campaign.delete", module: "campaign" },
  { name: "campaign.view", module: "campaign" },
  { name: "campaign.review", module: "campaign" },
  { name: "campaign.send", module: "campaign" },

  { name: "offer.create", module: "offer" },
  { name: "offer.edit", module: "offer" },
  { name: "offer.delete", module: "offer" },
  { name: "offer.view", module: "offer" },
  
  { name: "creative.create", module: "offer" },
  { name: "creative.edit", module: "offer" },
  { name: "creative.delete", module: "offer" },
  { name: "creative.view", module: "offer" },

  { name: "deploy.run", module: "deploy" },
  { name: "deploy.redeploy", module: "deploy" },
  { name: "deploy.view_history", module: "deploy" },

  { name: "suppression.manage", module: "suppression" },
  { name: "suppression.view", module: "suppression" },

  { name: "reports.view", module: "reports" },
  { name: "reports.export", module: "reports" },

  { name: "sender.view", module: "sender" },
{ name: "sender.manage", module: "sender" },

  { name: "user.create", module: "user" },
  { name: "user.update", module: "user" },
  { name: "user.delete", module: "user" },
  { name: "user.view", module: "user" },
  { name: "user.assignRole", module: "user" },
  { name: "permission.create", module: "permission" },
  { name: "permission.update", module: "permission" },
  { name: "permission.delete", module: "permission" },
  { name: "permission.view", module: "permission" },
  { name: "role.create", module: "role" },
  { name: "role.update", module: "role" },
  { name: "role.delete", module: "role" },
  { name: "role.view", module: "role" },
];

async function seed() {
  try {
    await connectMongo();
    console.log("Mongo connected");

    for (const perm of permissions) {
      await Permission.updateOne(
        { name: perm.name },
        { $setOnInsert: perm },
        { upsert: true }
      );
    }

    console.log("Permissions seeded successfully");
    process.exit(0);

  } catch (err) {
    console.error("Permission seeding failed:", err);
    process.exit(1);
  }
}

seed();