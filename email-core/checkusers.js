import "dotenv/config";
import connectMongo from "./config/mongo.js";
import mongoose from "mongoose";

await connectMongo();
const db = mongoose.connection.db;
const users = await db.collection("users").find({}).toArray();
console.log("Users:", JSON.stringify(users, null, 2));
process.exit();