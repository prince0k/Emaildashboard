import "dotenv/config";
import connectMongo from "./config/mongo.js";
import bcrypt from "bcrypt";
import Role from "./models/Role.js";
import User from "./models/User.js";

await connectMongo();

const adminRole = await Role.findOne({ name: "admin" });
if (!adminRole) {
  console.error("❌ Admin role not found. Please run seed scripts first.");
  process.exit(1);
}

const hashedPassword = await bcrypt.hash("Admin@123", 10);

await User.updateOne(
  { email: "admin@blastbees.com" },
  {
    $set: {
      password: hashedPassword,
      role: adminRole._id,
      active: true,
      permissions: [] // or omit if unused directly
    }
  },
  { upsert: true }
);

console.log("✅ Admin user created/updated!");
console.log("Email: admin@blastbees.com");
console.log("Password: Admin@123");
process.exit();