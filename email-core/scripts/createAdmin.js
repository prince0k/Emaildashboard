import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";
import Role from "../models/Role.js";

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find the super_admin role
    const adminRole = await Role.findOne({ name: "super_admin" });
    if (!adminRole) {
      console.error("❌ super_admin role not found. Run 'npm run seed:roles' first.");
      process.exit(1);
    }

    const adminEmail = "admin@example.com";
    const adminPassword = "adminpassword123";

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`ℹ️ User ${adminEmail} already exists. Updating password and role...`);
      existingUser.password = adminPassword; // Will be hashed by pre-save hook
      existingUser.role = adminRole._id;
      existingUser.active = true;
      await existingUser.save();
    } else {
      console.log(`➕ Creating new super_admin: ${adminEmail}`);
      const newUser = new User({
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: adminRole._id,
        active: true
      });
      await newUser.save();
    }

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

createAdmin();
