import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";
import Role from "../models/Role.js";

async function repair() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminRole = await Role.findOne({ name: "admin" });
    const mailerRole = await Role.findOne({ name: "mailer" });

    if (!adminRole) {
      console.log("❌ Admin role not found. Run seed script first.");
      process.exit(1);
    }

    // Assign Admin role to the main admin account
    const adminUser = await User.findOneAndUpdate(
      { email: "admin@example.com" },
      { role: adminRole._id },
      { new: true }
    );
    
    if (adminUser) {
      console.log(`✅ Repaired admin user: ${adminUser.email}`);
    } else {
      console.log("⚠️ admin@example.com not found. Assigning first user as Admin.");
      const firstUser = await User.findOneAndUpdate({}, { role: adminRole._id });
      if (firstUser) console.log(`✅ Assigned Admin role to ${firstUser.email}`);
    }

    // Assign Mailer role to everyone else who doesn't have a role
    const updated = await User.updateMany(
      { role: { $nin: [adminRole._id] } },
      { role: mailerRole._id }
    );
    console.log(`✅ Assigned Mailer role to ${updated.modifiedCount} users`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repair();
