import mongoose from "mongoose";

/* ================= ERROR ================= */

const errorSchema = new mongoose.Schema({
  message: String,
  code: String,
  provider: String,
  isTemporary: Boolean,
  raw: String   // 👈 ADD THIS
}, { _id: false });

/* ================= QUEUE ================= */

const queueSchema = new mongoose.Schema({
  queue: String,
  rcpt: Number,
  kb: Number,
  conn: Number,
  retry: String,
  error: errorSchema
}, { _id: false });

/* ================= DOMAIN ================= */

const domainSchema = new mongoose.Schema({
  domain: String,
  rcpt: Number,
  kb: Number,
  conn: Number,
  error: errorSchema
}, { _id: false });

/* ================= TRAFFIC ================= */

const trafficSchema = new mongoose.Schema({
  inbound_msgs: Number,
  outbound_msgs: Number
}, { _id: false });

/* ================= MAIN ================= */

const pmtaSnapshotSchema = new mongoose.Schema({
  server: String,

  status: String,
  uptime: String,

  traffic: {
    total: trafficSchema,
    last_hour: trafficSchema,
    top_hour: trafficSchema,
    last_min: trafficSchema,
    top_min: trafficSchema
  },

  queues: [queueSchema],

  // 🔥 FIXED
  domains: [domainSchema],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("PmtaSnapshot", pmtaSnapshotSchema);