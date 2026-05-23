import mongoose from "mongoose";

const sourceUri = "mongodb://127.0.0.1:27017/email_core";
const targetUri = "mongodb://127.0.0.1:27017/email_core_v2";

async function run() {
  console.log("🔌 Connecting to source database (email_core)...");
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  
  console.log("🔌 Connecting to target database (email_core_v2)...");
  const targetConn = await mongoose.createConnection(targetUri).asPromise();

  // Collections needed to allow logging in with the same users
  const collections = ["users", "roles", "permissions"];
  
  for (const colName of collections) {
    console.log(`🔄 Copying collection: ${colName}...`);
    const sourceCol = sourceConn.collection(colName);
    const targetCol = targetConn.collection(colName);

    const documents = await sourceCol.find({}).toArray();
    if (documents.length > 0) {
      // Clear any existing seeded roles/permissions to avoid conflicts
      await targetCol.deleteMany({});
      await targetCol.insertMany(documents);
      console.log(`   ✅ Successfully copied ${documents.length} documents to target`);
    } else {
      console.log(`   ⚠️ Source collection ${colName} is empty, skipping`);
    }
  }

  await sourceConn.close();
  await targetConn.close();
  console.log("🎉 Database migration completed successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
