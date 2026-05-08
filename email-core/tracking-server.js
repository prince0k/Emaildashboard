import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";

/* ROUTES */
import trackClick from "./api/tracking/click.js";
import trackOpen from "./api/tracking/open.js";
import trackOptout from "./api/tracking/optout.js";
import trackUnsub from "./api/tracking/unsub.js";
import registerToken from "./api/token.js";

const app = express();

/* ======================
   BASIC HARDENING
====================== */

// tracking me heavy security mat daal — speed important hai
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(compression());

app.use(express.json({ limit: "10mb" }));

/* ======================
   DB CONNECT
====================== */

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,
    });
    console.log("✅ Mongo connected (tracking)");
  } catch (err) {
    console.error("❌ Mongo error:", err);
    process.exit(1);
  }
}

/* ======================
   HEALTH CHECK
====================== */

app.get("/health-tracking", (req, res) => {
  res.json({ status: "tracking-ok", uptime: process.uptime() });
});

/* ======================
   TOKEN (IMPORTANT)
====================== */

app.post("/t/token", registerToken);

/* ======================
   TRACKING ROUTES
====================== */

// ⚠️ NEVER protect with auth

app.get("/t/click", trackClick);
app.get("/t/open", trackOpen);
app.get("/t/optout", trackOptout);
app.get("/t/unsub", trackUnsub);

/* ======================
   404
====================== */

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

/* ======================
   ERROR HANDLER
====================== */

app.use((err, req, res, next) => {
  console.error("🔥 TRACKING ERROR:", err);

  if (!res.headersSent) {
    res.status(500).send("error");
  }
});

/* ======================
   START SERVER
====================== */

async function start() {
  await connectMongo();

  const PORT = process.env.TRACKING_PORT || 4000;

  const server = app.listen(PORT, () => {
    console.log(`🔥 Tracking server running on ${PORT}`);
  });

  // important for high traffic
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

start();

/* ======================
   CRASH SAFETY
====================== */

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED PROMISE:", err);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});