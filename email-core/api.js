import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

import connectMongo from "./config/mongo.js";
// import { startPmtaMonitor } from "./workers/pmtaMonitorWorker.js";
import { startBullWorker } from "./workers/bullWorker.js"; // Import the queue worker starter

/* ======================
  ROUTES
====================== */
import offerRoutes from "./api/offers.js";
import suppressionRoutes from "./api/suppression.js";
import md5Status from "./api/md5Status.js";
import md5Download from "./api/md5Download.js";
import deployOffer from "./api/deployOffer.js";
import deployHistory from "./api/deployHistory.js";
import undeployOffer from "./api/undeployOffer.js";
import redeployOffer from "./api/redeployOffer.js";
import clickReport from "./api/reports/clickReport.js";
import openReport from "./api/reports/openReport.js";
import senderDailyStats from "./api/reports/senderDailyStats.js";
import campaignRoutes from "./api/campaigns/index.js";
import creativesRoutes from "./api/offers/creatives/index.js";
import updatePmtaStats from "./api/campaigns/updatePmtaStats.js";
import updateTotalSent from "./api/campaigns/updateTotalSent.js";
import updateStatusPublic from "./api/campaigns/updateStatusPublic.js";
import login from "./api/auth/login.js";
import register from "./api/auth/register.js";
import logout from "./api/auth/logout.js";
import me from "./api/auth/me.js";

import senderRoutes from "./api/senders/index.js";
import listSegments from "./api/segments/list.js";
import buildSegment from "./api/segments/build.js";
import previewSegment from "./api/segments/preview.js";
import removeSegment from "./api/segments/delete.js";
import trimSegment from "./api/segments/trim.js";
import combineSegments from "./api/segments/combine.js";
import splitSegment from "./api/segments/split.js";
/* TRACKING (PUBLIC) */
import leadStats from "./api/leads/stats.js";
import sendWelcome from "./api/welcome/send.js";
import sendVerify from "./api/welcome/sendVerify.js";
import sendPersonalised from "./api/welcome/sendPersonalised.js";
import triggerRoutes from "./api/triggers/index.js";
import permissionRequestRoutes from "./api/permission-requests/index.js";
import pmtaStats from "./api/pmta/stats.js";
import pmtaHistory from "./api/pmta/history.js";
import commandRoute from "./api/pmta/command.js";
import senderPerformance from "./api/reports/senderPerformance.js";
/* MIDDLEWARE */
import auth from "./middleware/auth.js";
import checkPermission from "./middleware/checkPermission.js";

import roleRoutes from "./api/roles.js";
import permissionRoutes from "./api/permissions.js";
import userRoutes from "./api/users/index.js";
import testIdsRoutes from "./api/testIds.js";
const app = express();

/* ======================
  SECURITY HARDENING
====================== */

app.disable("x-powered-by");
app.set("trust proxy", 1);
console.log("TRUST PROXY VALUE:", app.get("trust proxy"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      },
    }
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/* ======================
  PATH SETUP
====================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/* ======================
  GLOBAL MIDDLEWARE
====================== */

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use(compression());
app.use(globalLimiter);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [],
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setTimeout(0); // no timeout
  next();
});
/* ======================
  ROLES
====================== */
app.use("/api/roles", auth, checkPermission("role.view"), roleRoutes);

/* ======================
  PERMISSIONS
====================== */
app.use("/api/permissions", auth, permissionRoutes);

/* ======================
  USERS
====================== */
app.use("/api/users", auth, checkPermission("user.view"), userRoutes);


/* ======================
  PUBLIC ROUTES
====================== */

app.post("/api/auth/login", loginLimiter, login);
app.post("/api/auth/logout", logout);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

/* Tracking — NEVER protect */
app.post("/api/campaigns/updateTotalSent", updateTotalSent);
app.post("/api/campaigns/updatePmtaStats", updatePmtaStats);
app.post("/api/campaigns/updateStatus", updateStatusPublic);

/* Welcome & Verification (Auth handled internally via X-Internal-Key) */
app.post("/api/welcome/send", sendWelcome);
app.post("/api/welcome/send-verify", sendVerify);
app.post("/api/welcome/send-personalised", sendPersonalised);

/* ======================
  AUTH REQUIRED ROUTES
====================== */

app.get("/api/auth/me", auth, me);

app.post(
  "/api/auth/register",
  auth,
  checkPermission("user.create"),
  register
);

/* ======================
  OFFERS
====================== */

app.use("/api/offers", auth, offerRoutes);
app.use("/api/offers/creatives", auth, creativesRoutes);
/* ======================
  SUPPRESSION
====================== */

app.use("/api/suppression", auth, suppressionRoutes);

/* ======================
  MD5 DOWNLOAD
====================== */

app.use("/api", md5Download);
app.use("/api", md5Status);
/* ======================
  CAMPAIGNS
====================== */

import { listTriggers, createTrigger, deleteTrigger, testTrigger } from "./api/triggers/campaignTriggers.js";
app.get("/api/campaign-triggers", auth, listTriggers);
app.post("/api/campaign-triggers", auth, createTrigger);
app.post("/api/campaign-triggers/test", auth, testTrigger);
app.delete("/api/campaign-triggers/:id", auth, deleteTrigger);

app.use("/api/campaigns", auth, campaignRoutes);

/* ======================
  DEPLOY
====================== */

app.post(
  "/api/deployoffer",
  auth,
  checkPermission("deploy.run"),
  deployOffer
);

app.post(
  "/api/redeployoffer",
  auth,
  checkPermission("deploy.redeploy"),
  redeployOffer
);

app.post(
  "/api/undeployoffer",
  auth,
  checkPermission("deploy.redeploy"),
  undeployOffer
);

app.get(
  "/api/deployhistory",
  auth,
  checkPermission("deploy.run"),
  deployHistory
);

/* ======================
  REPORTS
====================== */

app.get(
  "/api/reports/clicks",
  auth,
  checkPermission("reports.view"),
  clickReport
);

app.get(
  "/api/reports/openReport",
  auth,
  checkPermission("reports.view"),
  openReport
);

app.get(
  "/api/reports/senderDailyStats",
  auth,
  checkPermission("reports.view"),
  senderDailyStats
);

app.get(
  "/api/reports/senderPerformance",
  auth,
  checkPermission("reports.view"),
  senderPerformance
);
/* ======================
  SENDERS
====================== */

app.use(
  "/api/senders",
  auth,
  senderRoutes
);

app.use("/api/triggers", triggerRoutes);
app.use("/api/permission-requests", permissionRequestRoutes);

app.use("/api/test-ids", auth, testIdsRoutes);

app.use("/api/pmta/stats", auth, pmtaStats);
app.use("/api/pmta/history", auth, pmtaHistory);
app.use(
  "/api/pmta/command",
  auth,
  commandRoute
);
/* ======================
  SEGMENTS
====================== */

app.get(
  "/api/segments/list",
  auth,
  checkPermission("campaign.create"),
  listSegments
);

app.get(
  "/api/segments/preview",
  auth,
  checkPermission("campaign.create"),
  previewSegment
);

app.post(
  "/api/segments/build",
  auth,
  checkPermission("campaign.create"),
  buildSegment
);

app.post(
  "/api/segments/combine",
  auth,
  checkPermission("campaign.create"),
  combineSegments
);

app.post(
  "/api/segments/split",
  auth,
  checkPermission("campaign.create"),
  splitSegment
);

app.delete(
  "/api/segments/remove/:name",
  auth,
  checkPermission("campaign.create"),
  removeSegment
);

app.post(
  "/api/segments/trim",
  auth,
  checkPermission("campaign.create"),
  trimSegment
);


/* ======================
  STATIC OUTPUT FILES (OPTIONAL)
====================== */

app.use(
  "/output",
  express.static(path.join(process.env.DATA_ROOT || "", "output"), {
    index: false,
    fallthrough: false,
  })
);

app.use(
  "/creative_assets",
  express.static(path.join(process.env.DATA_ROOT || "", "creative_assets"))
);


/* ======================
  404
====================== */

app.use((req, res) => {
  console.log(`404 NOT FOUND: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

/* ======================
  ERROR HANDLER
====================== */

app.use((err, req, res, next) => {
  console.error("🔥 UNHANDLED ERROR:", err);

  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error",
      ...(process.env.NODE_ENV !== "production" && {
        message: err.message,
      }),
    });
  }
});

/* ======================
  START SERVER
====================== */

async function start() {
  await connectMongo();
  await startBullWorker();

  // 🔹 Start PMTA monitoring worker
  // startPmtaMonitor();

  const PORT = process.env.PORT || 3001;

  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`✅ API running on 127.0.0.1:${PORT}`);
  });

  // ✅ Keep-alive timeouts
  server.keepAliveTimeout = 60000;   // 60 sec
  server.headersTimeout = 65000;

  // ✅ Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        const { campaignQueue } = await import("./queue/campaignQueue.js");
        await campaignQueue.close();
        console.log("✅ Bull queue closed");
      } catch (e) {
        console.warn("⚠️ Bull queue close failed:", e.message);
      }
      try {
        const mongoose = (await import("mongoose")).default;
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed");
      } catch (e) {
        console.warn("⚠️ MongoDB close failed:", e.message);
      }
      console.log("✅ Graceful shutdown complete");
      process.exit(0);
    });

    // Force exit after 15 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error("🔥 Forced exit after timeout");
      process.exit(1);
    }, 15000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
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
  process.exit(1);
});