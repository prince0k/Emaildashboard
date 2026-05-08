import mongoose from "mongoose";
import { fetchComplaintEmails } from "../services/complaintFetcher.js";

await mongoose.connect(process.env.MONGO_URI);

fetchComplaintEmails()
  .then(() => {
    console.log("🎯 Completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });