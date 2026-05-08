import fs from "fs";
import readline from "readline";
import crypto from "crypto";
import path from "path";

import LinkToken from "../models/LinkToken.js";
import Offer from "../models/Offer.js";
import { PATHS } from "../config/paths.js";

const BATCH_SIZE = 20000;
const MAX_CONCURRENT_DB = 4;

function genToken() {
  return crypto.randomBytes(16).toString("hex");
}

export async function generateTokens({ filePath, offerId }) {
  try {
    /* ================= FETCH OFFER ================= */
    const offer = await Offer.findById(offerId).lean();
    if (!offer) throw new Error("Offer not found");

    const clickCount = Array.isArray(offer.redirectLinks)
      ? offer.redirectLinks.length
      : 0;

    if (clickCount <= 0)
      throw new Error("No redirectLinks found in offer");

    console.log("🔥 CLICK COUNT:", clickCount);

    /* ================= FILE ================= */
    const inputPath = path.join(PATHS.output, filePath);
    const outputPath = path.join(
      PATHS.output,
      `${filePath}.tokens.txt`
    );

    const readStream = fs.createReadStream(inputPath, {
      highWaterMark: 1024 * 1024 * 4,
    });

    const writeStream = fs.createWriteStream(outputPath, {
      highWaterMark: 1024 * 1024 * 4,
    });

    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    /* ================= STATE ================= */
    let batch = [];
    let processed = 0;
    const dbQueue = [];

    const flushBatch = async (data) => {
      if (!data.length) return;

      const p = LinkToken.insertMany(data, {
        ordered: false,
      }).catch((err) => {
        console.error("DB ERROR:", err.message);
      });

      dbQueue.push(p);

      // limit concurrency
      if (dbQueue.length >= MAX_CONCURRENT_DB) {
        await Promise.race(dbQueue);
        // clean resolved promises
        for (let i = dbQueue.length - 1; i >= 0; i--) {
          if (dbQueue[i].isFulfilled || dbQueue[i].isRejected) {
            dbQueue.splice(i, 1);
          }
        }
      }
    };

    /* ================= PROCESS ================= */
    for await (const line of rl) {
      if (!line) continue;

      const parts = line.split("|");
      const email = parts[1]?.trim();
      if (!email) continue;

      /* TOKENS */
      const open = genToken();
      const unsub = genToken();
      const optout = genToken();

      const clicks = new Array(clickCount);
      for (let i = 0; i < clickCount; i++) {
        clicks[i] = genToken();
      }

      /* FILE WRITE (FAST) */
      writeStream.write(
        `${email}|${open}|${clicks.join("|")}|${unsub}|${optout}\n`
      );

      /* DB BUILD */
      batch.push(
        { token: open, type: "open", offer_id: offerId, email },
        ...clicks.map((t, i) => ({
          token: t,
          type: "click",
          offer_id: offerId,
          email,
          rl: i + 1,
        })),
        { token: unsub, type: "unsub", offer_id: offerId, email },
        { token: optout, type: "optout", offer_id: offerId, email }
      );

      /* BULK FLUSH */
      if (batch.length >= BATCH_SIZE) {
        const temp = batch;
        batch = [];
        flushBatch(temp); // no await 🚀
      }

      processed++;

      if (processed % 100000 === 0) {
        console.log(`⚡ Processed: ${processed}`);
      }
    }

    /* FINAL FLUSH */
    if (batch.length > 0) {
      await flushBatch(batch);
    }

    /* WAIT ALL DB */
    await Promise.all(dbQueue);

    writeStream.end();

    console.log("✅ DONE:", processed);

    return {
      tokenFile: `${filePath}.tokens.txt`,
      totalProcessed: processed,
      clickCount,
    };

  } catch (err) {
    console.error("❌ TOKEN GENERATOR ERROR:", err);
    throw err;
  }
}