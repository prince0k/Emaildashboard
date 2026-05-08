import { google } from "googleapis";
import Offer from "../models/Offer.js";

const auth = new google.auth.GoogleAuth({
  keyFile: "config/google-service.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1v_QtGn8DKnYGoQVrGFDCFZ5JHZOpOppi40E9uZhJ1EI";
const SHEET_NAME = "Offer_Update";

const normalize = (v) => v?.toString().trim().toLowerCase();

const makeMd5FileName = ({ sponsor, cid, vid }) =>
  `${normalize(sponsor)}_${normalize(cid)}_${normalize(vid)}.txt`;

const makeZipFileName = ({ sponsor, cid }) =>
  `${normalize(sponsor)}_${normalize(cid)}.zip`;

export async function syncOfferSheet() {
  console.log("📡 Offer Sync Started...");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:J500`,
  });

  const rows = res.data.values || [];
  const updates = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const actualRow = i + 2;

    const [
      sid,
      sponsor,
      cid,
      offerName,
      vid,
      vertical,
      redirectLink,
      optoutLink,
      accessKey,
      status,
    ] = row;

    if (status === "done") continue;
    if (!sid || !cid || !sponsor || !offerName) continue;

    try {
      let offer = await Offer.findOne({
        sid: normalize(sid),
        cid: normalize(cid),
        isDeleted: false,
      });

      if (offer) {
        // 🔄 UPDATE
        offer.vid = normalize(vid);
        offer.vertical = normalize(vertical);

        if (redirectLink) {
          offer.redirectLinks = [redirectLink.trim()];
        }

        if (optoutLink) {
          offer.optoutLink = optoutLink.trim();
        }

        if (accessKey) {
          offer.optizmoAccessKey = accessKey.trim();
        }

        await offer.save();
        console.log("🔄 Updated:", cid);

      } else {
        // 🆕 CREATE
        const md5FileName = makeMd5FileName({ sponsor, cid, vid });
        const zipFileName = makeZipFileName({ sponsor, cid });

        await Offer.create({
          sid: normalize(sid),
          sponsor: normalize(sponsor),
          cid: normalize(cid),
          offer: normalize(offerName),
          vid: normalize(vid),
          vertical: normalize(vertical),
          redirectLinks: [redirectLink],
          optoutLink,
          optizmoAccessKey: accessKey,
          md5FileName,
          zipFileName,
        });

        console.log("🆕 Created:", cid);
      }

      // ✅ mark done
      updates.push({
        range: `${SHEET_NAME}!J${actualRow}`,
        values: [["done"]],
      });

    } catch (err) {
      console.log("❌ Error:", err.message);
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: updates,
      },
    });

    console.log(`🚀 Done: ${updates.length} rows`);
  }
}