import { google } from "googleapis";
import OpenLog from "../models/OpenLog.js";
import ClickLog from "../models/ClickLog.js";
import UnsubLog from "../models/UnsubLog.js";
import OptoutLog from "../models/OptoutLog.js";
import Campaign from "../models/Campaign.js";
import Creative from "../models/Creative.js";
import SubjectLine from "../models/SubjectLine.js";
import FromLine from "../models/FromLine.js";
import LinkToken from "../models/LinkToken.js";
import ComplaintLog from "../models/ComplaintLog.js";

const auth = new google.auth.GoogleAuth({
  keyFile: "config/google-service.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const normalize = (v) => v?.toString().trim();

const SPREADSHEET_ID = "1v_QtGn8DKnYGoQVrGFDCFZ5JHZOpOppi40E9uZhJ1EI";

// 🔥 MULTIPLE SHEETS
const SHEETS = [
  "COMCAST_Daily_Send",
  "YAHOO_Daily_Send"
];

export async function syncGoogleSheet() {
  console.log("📡 Sync started...");

  for (const SHEET_NAME of SHEETS) {
    try {
      console.log(`📄 Syncing: ${SHEET_NAME}`);
      await syncSingleSheet(SHEET_NAME);
    } catch (err) {
      console.error(`❌ Error in ${SHEET_NAME}:`, err.message);
    }
  }
}

// 🔥 SINGLE SHEET LOGIC
async function syncSingleSheet(SHEET_NAME) {
  const START_ROW = 2; // 🔥 safer for all sheets
  const END_ROW = 500;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${START_ROW}:AH${END_ROW}`,
  });

  const rows = res.data.values || [];

  if (!rows.length) {
    console.log(`⚠️ No rows in ${SHEET_NAME}`);
    return;
  }

  // 🔥 unique offerIds
  const OFFER_COL = 29; // ⚠️ ek baar sheet me confirm kar lena

  const offerIds = [
    ...new Set(
      rows.map(r => normalize(r[OFFER_COL])).filter(Boolean)
    )
  ];
  if (!offerIds.length) {
    console.log(`⚠️ No offerIds in ${SHEET_NAME}`);
    return;
  }

  // 🔥 campaign fetch
  const campaigns = await Campaign.find({
  runtimeOfferId: { $in: offerIds }
})
.populate("creativeId", "name")
.select("runtimeOfferId offerId creativeId execution sendConfig segmentName") // 🔥 ADD
.lean();


  

  const campaignMap = {};
  campaigns.forEach(c => {
  campaignMap[normalize(c.runtimeOfferId)] = c;
});

  const rawOfferIds = rows
  .map(r => r[OFFER_COL])
  .filter(Boolean);

const match = {
  offer_id: { $in: rawOfferIds },
};

  // 🔥 FIXED OPEN AGGREGATION (IMPORTANT)
  const [openAgg, clickAgg, unsubAgg, optoutAgg, complaintAgg] = await Promise.all([

    OpenLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$offer_id",
          total: { $sum: 1 },
          unique: {
            $addToSet: "$email"
          }
        }
      },
      {
        $project: {
          total: 1,
          unique: {
            $size: {
              $filter: {
                input: "$unique",
                as: "e",
                cond: { $ne: ["$$e", null] }
              }
            }
          }
        }
      }
    ]),

    ClickLog.aggregate([
      { $match: { ...match, is_bot_click: false } },
      {
        $group: {
          _id: "$offer_id",
          total: { $sum: 1 },
          emails: { $addToSet: "$email" }
        }
      },
      {
        $project: {
          total: 1,
          unique: {
            $size: {
              $filter: {
                input: "$emails",
                as: "e",
                cond: { $ne: ["$$e", null] }
              }
            }
          }
        }
      }
    ]),

    UnsubLog.aggregate([
      { $match: match },
      { $group: { _id: "$offer_id", count: { $sum: 1 } } }
    ]),

    OptoutLog.aggregate([
      { $match: match },
      { $group: { _id: "$offer_id", count: { $sum: 1 } } }
    ]),

    ComplaintLog.aggregate([
  {
    $match: {
      offer_id: { $in: offerIds },
    },
  },
  {
    $group: {
      _id: "$offer_id",
      count: { $sum: 1 },
    },
  },
])
  ]);

  // 🔥 MAPS
  const openMap = {};
  openAgg.forEach(i => openMap[i._id] = i);

  const clickMap = {};
  clickAgg.forEach(i => clickMap[i._id] = i);

  const unsubMap = {};
  unsubAgg.forEach(i => unsubMap[i._id] = i.count);

  const optoutMap = {};
  optoutAgg.forEach(i => optoutMap[i._id] = i.count);

  const complaintMap = {};
  complaintAgg.forEach(i => complaintMap[i._id] = i.count);

  const updates = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const actualRow = START_ROW + i;

    const offer_id = row[OFFER_COL]?.toString().trim();

    const status = row[14]; // column N (Status)

    if (!offer_id || status !== "Sent") continue;
    
    const campaign = campaignMap[normalize(offer_id)];

    if (!campaign) {
      console.log("❌ NOT FOUND:", offer_id);
      continue;
    }

    if (!campaign?.segmentName) {
      console.log("❌ SEGMENT MISSING:", offer_id, campaign);
    }
    if (!campaign) continue;

    const sent = campaign?.execution?.totalSent || 0;
    const delivered = campaign?.execution?.delivered || 0;
    const hardBounce = campaign?.execution?.hardBounce || 0;
    const softBounce = campaign?.execution?.softBounce || 0;
    // const segment = campaign?.segmentName || "NA";

    const subject = campaign?.sendConfig?.subject || "";
    const fromLine = campaign?.sendConfig?.fromName || "";
    const creativeName = campaign?.creativeId?.name || campaign?.creativeName || "";
    const totalBounce = hardBounce + softBounce;

    const openData = openMap[offer_id] || { total: 0, unique: 0 };
    const clickData = clickMap[offer_id] || { total: 0, unique: 0 };

    const open = openData.total;
    const uniqueOpen = openData.unique;

    const click = clickData.total;
    const uniqueClick = clickData.unique;

    const unsub = unsubMap[offer_id] || 0;
    const optout = optoutMap[offer_id] || 0;
    const complaints = complaintMap[offer_id] || 0;

    const openRate = delivered ? (open / delivered) * 100 : 0;
    const uniqueOpenRate = delivered ? (uniqueOpen / delivered) * 100 : 0;
    const ctr = uniqueOpen ? (uniqueClick / uniqueOpen) * 100 : 0;
    const unsubRate = delivered ? (unsub / delivered) * 100 : 0;
    const optRate = delivered ? (optout / delivered) * 100 : 0;
    const complaintRate = delivered ? (complaints / delivered) * 100 : 0;
    const bounceRate = sent ? (totalBounce / sent) * 100 : 0;

    updates.push({
    range: `${SHEET_NAME}!P${actualRow}:Y${actualRow}`,
    values: [[
      delivered,
      open,
      click,
      openRate.toFixed(2),
      uniqueOpenRate.toFixed(2),
      ctr.toFixed(2),
      optRate.toFixed(2),
      unsubRate.toFixed(2),
      complaintRate.toFixed(2),
      bounceRate.toFixed(2)
    ]]
    });
      updates.push({
      range: `${SHEET_NAME}!AE${actualRow}:AG${actualRow}`,
      values: [[
        creativeName,
        fromLine,
        subject
      ]]
    });
    
      updates.push({
      range: `${SHEET_NAME}!AC${actualRow}`,
      values: [[campaign?.segmentName || ""]]
    });
  }
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: updates,
      },
    });

    console.log(`🚀 ${SHEET_NAME}: Updated ${updates.length} rows`);
  } else {
    console.log(`⚠️ ${SHEET_NAME}: No updates`);
  }
}