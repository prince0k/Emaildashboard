import { google } from "googleapis";
import OpenLog from "../models/OpenLog.js";
import ClickLog from "../models/ClickLog.js";
import UnsubLog from "../models/UnsubLog.js";
import OptoutLog from "../models/OptoutLog.js";

const auth = new google.auth.GoogleAuth({
  keyFile: "config/google-service.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "YOUR_SHEET_ID";
const SHEET_NAME = "Sheet1";

export async function syncGoogleSheet() {
  const today = new Date().toISOString().slice(0, 10);

  // 👉 step 1: sheet read
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
  });

  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
  const row = rows[i];

  const offer_id = row[27]; // AB column
  const day = row[1];       // B column

  if (!offer_id || !day) continue;

  // 👉 Mongo query
  const [open, uniqueOpen, click, unsub] = await Promise.all([
    OpenLog.countDocuments({ offer_id, day }),
    OpenLog.countDocuments({ offer_id, day, email: { $ne: null } }),
    ClickLog.countDocuments({ offer_id, day, is_bot_click: false }),
    UnsubLog.countDocuments({ offer_id, day }),
  ]);

  const sent = Number(row[14] || 0); // O column

  const openRate = sent ? (open / sent) * 100 : 0;
  const uniqueOpenRate = sent ? (uniqueOpen / sent) * 100 : 0;
  const ctr = sent ? (click / sent) * 100 : 0;
  const unsubRate = sent ? (unsub / sent) * 100 : 0;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Sheet1!P${i + 1}:U${i + 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        open,
        click,
        openRate.toFixed(2),
        uniqueOpenRate.toFixed(2),
        ctr.toFixed(2),
        unsubRate.toFixed(2)
      ]],
    },
  });

  console.log(`✅ Updated row ${i + 1} (${offer_id})`);
}
}