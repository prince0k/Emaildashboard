import "dotenv/config";
import connectMongo from "../config/mongo.js";
import User from "../models/User.js";
import Role from "../models/Role.js";

async function run() {
  await connectMongo();

  const role = await Role.findOne({ name: "super_admin" });

  if (!role) {
    console.log("❌ super_admin role not found. Run seedRoles first.");
    process.exit(1);
  }

  const existing = await User.findOne({ email: "admin@example.com" });

  if (existing) {
    console.log("⚠ Admin already exists.");
    process.exit(0);
  }

  await User.create({
    email: "admin@example.com",
    password: "Admin@12345",
    role: role._id,
    active: true,
  });

  console.log("✅ Super admin created");
  process.exit(0);
}

run();