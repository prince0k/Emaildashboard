import { google } from "googleapis";
import { runWorker } from "/root/seed-checker/worker.js";

// ===== GOOGLE AUTH =====
const auth = new google.auth.GoogleAuth({
  keyFile: "/var/www/email-core/config/google-service.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "1v_QtGn8DKnYGoQVrGFDCFZ5JHZOpOppi40E9uZhJ1EI";

// ===== HELPERS =====
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function humanDelay(min, max) {
  const avg = (min + max) / 2;
  const sigma = (max - min) / 6;
  let val = avg + sigma * (Math.random() * 2 - 1);
  return Math.max(min, Math.min(max, val));
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ===== MAIN START =====
async function start() {

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  console.log("🚀 System started (infinite mode)");

  while (true) {

    // 🔥 FETCH FROM SHEET EVERY CYCLE (IMPORTANT)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "PROXY!B2:I",
    });

    const rows = res.data.values || [];

    const seeds = rows.map((row, i) => {
      const [email, , , appPass, ip, port, proxyUser, proxyPass] = row;

      if (!email || !ip) return null;

      return {
        seed: `${email}:x:x:${appPass}`,
        proxy: `${ip}:${port}:${proxyUser}:${proxyPass}`,
        row: i + 2,
        email
      };
    }).filter(Boolean);

    // 🧠 map for updates
    const emailRowMap = {};
    seeds.forEach(s => {
      emailRowMap[s.email] = s.row;
    });

    // 🔥 update handler
    const onUpdate = async ({ email, message, time }) => {
      const row = emailRowMap[email];
      if (!row) return;

      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `PROXY!L${row}:N${row}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[time, "", message]],
          },
        });
      } catch (e) {
        console.log("Sheet update error:", e.message);
      }
    };

    // 🌙 Night mode
    const hour = new Date().getHours();
    let minGap = 120000;
    let maxGap = 600000;

    if (hour < 8 || hour > 23) {
      console.log("🌙 Night mode active");
      minGap = 300000;
      maxGap = 1200000;
    }

    const seedList = shuffle([...seeds]);

    console.log(`🔁 New cycle | Seeds: ${seedList.length}`);

    let success = 0;
    let failed = 0;

    for (const item of seedList) {

      console.log(`▶️ Processing: ${item.email}`);

      try {
        await runWorker(item.seed, item.proxy, onUpdate);
        success++;
      } catch (e) {
        failed++;
        console.log(`❌ Worker error: ${e.message}`);
      }

      const gap = humanDelay(minGap, maxGap);
      console.log(`⏳ Waiting ${(gap / 1000).toFixed(0)} sec`);

      await sleep(gap);
    }

    console.log(`📊 Cycle done | Success: ${success} | Failed: ${failed}`);

    const breakTime = humanDelay(1800000, 7200000);
    console.log(`😴 Sleeping ${(breakTime / 60000).toFixed(1)} min`);

    await sleep(breakTime);
  }
}

// ===== SAFE START =====
process.on("uncaughtException", (err) => {
  console.log("🔥 Uncaught:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.log("🔥 Rejection:", err);
});

// ===== RUN =====
start();