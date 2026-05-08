import { google } from "googleapis";
import Offer from "../models/Offer.js";
import Creative from "../models/Creative.js";
import SenderServer from "../models/SenderServer.js";

const auth = new google.auth.GoogleAuth({
  keyFile: "config/google-service.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1v_QtGn8DKnYGoQVrGFDCFZ5JHZOpOppi40E9uZhJ1EI";
const SHEET_NAME = "Campaign_create";

const normalize = (v) => v?.toString().trim();

/* 🔥 DATE FIX */
function formatDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatSegment(segment) {
  if (!segment) return "";

  return segment.endsWith(".txt")
    ? segment
    : `${segment}.txt`;
}

/* 🔥 CLEAN NUMBER (IMPORTANT) */
function cleanNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")   // keep only digits   // remove leading zeros
    .trim();
}

export async function syncCampaignCreateSheet() {

  const { default: createCampaign } = await import(
    "../api/campaigns/createCampaign.js"
  );

  console.log("📡 Campaign Create Sync Started...");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:K200`,
  });

  const rows = res.data.values || [];
  if (!rows.length) return;

  const updates = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2;

    const [
      serverName,
      sid,
      cid,
      offerName,
      creativeName,
      isp,
      scheduledDate,
      segment,
      campaignName,
      offerIdSheet,
      status
    ] = row.map(normalize);

    if (!status || status.toUpperCase() !== "CREATE") continue;

    try {
      console.log(`⚡ Processing row ${rowIndex}`);

      updates.push({
        range: `${SHEET_NAME}!K${rowIndex}`,
        values: [["PROCESSING"]],
      });

      /* ================= SENDER ================= */
      const sender = await SenderServer.findOne({
        code: serverName?.toUpperCase(),
        active: true,
      });

      if (!sender) throw new Error(`Sender not found: ${serverName}`);

      /* ================= OFFER ================= */
      const cleanSid = cleanNumber(sid);
      const cleanCid = cleanNumber(cid);

      console.log("🔍 Searching Offer:", { cleanSid, cleanCid });

      let offer;

      if (offerIdSheet) {
        offer = await Offer.findById(offerIdSheet);
      } else {
        offer = await Offer.findOne({
          sid: { $regex: `^${cleanSid}$` },
          cid: { $regex: `^${cleanCid}$` },
          isActive: true,
          isDeleted: false,
        });
      }

      if (!offer) {
        throw new Error(`Offer not found (SID: ${cleanSid}, CID: ${cleanCid})`);
      }

      /* ================= CREATIVE ================= */
      const creative = await Creative.findOne({
        name: creativeName,
      });

      if (!creative) throw new Error("Creative not found");

      /* ================= DATE ================= */
      const formattedDate = formatDate(scheduledDate);

      /* ================= CREATE ================= */
      let responseData;

      const fakeReq = {
        body: {
          sender: sender._id,
          campaignName,
          creativeId: creative._id,
          offerId: offer._id,
          isp,
          segmentName: formatSegment(segment),
          scheduledDate: formattedDate,
        },
        user: {
          userId: "sheet_worker",
          permissions: ["campaign.create"],
          _id: "000000000000000000000000",
        },
      };

      const fakeRes = {
        json: (data) => {
          responseData = data;
        },
        status: () => fakeRes,
      };

      await createCampaign(fakeReq, fakeRes);

      if (!responseData || responseData.error) {
        throw new Error(responseData?.error || "Campaign failed");
      }

      /* ================= SUCCESS ================= */
      updates.push({
        range: `${SHEET_NAME}!K${rowIndex}`,
        values: [["CREATED"]],
      });

      updates.push({
        range: `${SHEET_NAME}!J${rowIndex}`,
        values: [[responseData.offerId || ""]],
      });

      console.log(`✅ Created: ${campaignName}`);

    } catch (err) {
      console.error(`❌ Row ${rowIndex}:`, err.message);

      updates.push({
        range: `${SHEET_NAME}!K${rowIndex}`,
        values: [["FAILED"]],
      });

      updates.push({
        range: `${SHEET_NAME}!L${rowIndex}`,
        values: [[err.message]],
      });
    }
  }

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: updates,
      },
    });

    console.log(`🚀 Updated ${updates.length} cells`);
  } else {
    console.log("⚠️ No updates needed");
  }
}