import { google } from "googleapis";
import OpenLog from "../models/OpenLog.js";
import ClickLog from "../models/ClickLog.js";
import UnsubLog from "../models/UnsubLog.js";
import OptoutLog from "../models/OptoutLog.js";
import LinkToken from "../models/LinkToken.js";
import Campaign from "../models/Campaign.js";

const auth = new google.auth.GoogleAuth({
  keyFile: "config/google-service.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1v_QtGn8DKnYGoQVrGFDCFZ5JHZOpOppi40E9uZhJ1EI";

// 🔥 SHEET NAME
const SHEETS = ["IP Wise_Count"];

const normalize = (v) => String(v || "").trim().toLowerCase();
const safeIp = (v) => String(v || "").trim().replace(/\./g, "_");

function addSenderMetric(map, offerId, senderKey, value, caster = (v) => v) {
  const raw = String(senderKey || "").trim();
  const normalized = normalize(raw);
  const safe = safeIp(raw);
  const keys = new Set([raw, normalized, safe]);

  keys.forEach((k) => {
    if (!k) return;
    map[`${offerId}_${k}`] = caster(value);
  });
}

function readSenderMetric(map, offerId, senderKeys = []) {
  for (const senderKey of senderKeys) {
    const raw = String(senderKey || "").trim();
    const normalized = normalize(raw);
    const safe = safeIp(raw);
    const variants = [raw, normalized, safe];

    for (const variant of variants) {
      if (!variant) continue;
      const key = `${offerId}_${variant}`;
      if (map[key] !== undefined) return map[key];
    }
  }
  return undefined;
}

export async function syncGoogleSheet() {
  for (const SHEET_NAME of SHEETS) {
    await syncIPSheet(SHEET_NAME);
  }
}

async function syncIPSheet(SHEET_NAME) {
  const START_ROW = 2;
  const END_ROW = 500;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A${START_ROW}:Z${END_ROW}`,
  });

  const rows = res.data.values || [];
  if (!rows.length) return;

  const IP_COL = 2; // column C
  const OFFER_COL = 3; // column D

  // collect all identifiers + offer pairs
  const pairs = rows.map(r => ({
  vmta: String(r[IP_COL] || "").replace(/\./g, "_").trim(),
  offerId: r[OFFER_COL]
}))
    .filter(r => r.offerId);

  if (!pairs.length) return;

  const offerIds = [...new Set(pairs.map(p => String(p.offerId || "").trim()).filter(Boolean))];

  /* ========================= FETCH CAMPAIGNS ========================= */

  const campaigns = await Campaign.find({
    runtimeOfferId: { $in: offerIds }
  }).select(
    "runtimeOfferId execution.vmtaStats execution.vmtaHard execution.vmtaSoft execution.delivered execution.hardBounce execution.softBounce"
  ).lean();

  // MAP: offerId + (vmta/ip) -> delivered / bounce
  const vmtaMap = {};
  const bounceMap = {};
  const offerDeliveredMap = {};
  const offerBounceMap = {};

  campaigns.forEach(c => {
    const offerId = c.runtimeOfferId;
    const vmtaStats = c.execution?.vmtaStats || {};
    const vmtaHard = c.execution?.vmtaHard || {};
    const vmtaSoft = c.execution?.vmtaSoft || {};

    offerDeliveredMap[offerId] = Number(c.execution?.delivered || 0);
    offerBounceMap[offerId] = Number(c.execution?.hardBounce || 0) + Number(c.execution?.softBounce || 0);

    Object.entries(vmtaStats).forEach(([senderKey, count]) => {
      addSenderMetric(vmtaMap, offerId, senderKey, count, (v) => Number(v || 0));
    });

    const bounceKeys = new Set([...Object.keys(vmtaHard), ...Object.keys(vmtaSoft)]);
    bounceKeys.forEach(senderKey => {
      const hard = Number(vmtaHard[senderKey] || 0);
      const soft = Number(vmtaSoft[senderKey] || 0);
      addSenderMetric(bounceMap, offerId, senderKey, hard + soft, (v) => Number(v || 0));
    });
  });

  /* ========================= OPEN / CLICK / OPT / UNS / CMP ========================= */

  const [openAgg, clickAgg, unsubAgg, optoutAgg, complaintAgg] = await Promise.all([

    OpenLog.aggregate([
      {
        $match: {
          offer_id: { $in: offerIds },
        }
      },
      {
        $group: {
          _id: {
  key: {
    $ifNull: ["$vmta", "$ip"]
  },
  offer_id: "$offer_id"
},
          total: { $sum: 1 },
          emails: { $addToSet: "$email" }
        }
      },
      {
        $project: {
          total: 1,
          unique: { $size: "$emails" }
        }
      }
    ]),

    ClickLog.aggregate([
      {
        $match: {
          offer_id: { $in: offerIds },
          is_bot_click: false,
        }
      },
      {
        $group: {
          _id: {
  key: {
    $ifNull: ["$vmta", "$ip"]
  },
  offer_id: "$offer_id"
},
          total: { $sum: 1 },
          emails: { $addToSet: "$email" }
        }
      },
      {
        $project: {
          total: 1,
          unique: { $size: "$emails" }
        }
      }
    ]),

    UnsubLog.aggregate([
      {
        $match: {
          offer_id: { $in: offerIds },
        }
      },
      { $group: { _id: {
  key: {
    $ifNull: ["$vmta", "$ip"]
  },
  offer_id: "$offer_id"
}, count: { $sum: 1 } } }
    ]),

    OptoutLog.aggregate([
      {
        $match: {
          offer_id: { $in: offerIds },
        }
      },
      { $group: { _id: {
  key: {
    $ifNull: ["$vmta", "$ip"]
  },
  offer_id: "$offer_id"
}, count: { $sum: 1 } } }
    ]),

    LinkToken.aggregate([
      {
        $match: {
          offer_id: { $in: offerIds },
          complaint: true,
        }
      },
      { $group: { _id: {
  key: {
    $ifNull: ["$vmta", "$ip"]
  },
  offer_id: "$offer_id"
}, count: { $sum: 1 } } }
    ]),
  ]);

  // MAPS
  const openMap = {};
  openAgg.forEach(i => {
    const vmtaRaw = (i._id.key || "").trim();
    addSenderMetric(openMap, i._id.offer_id, vmtaRaw, i);
  });

  const clickMap = {};
  clickAgg.forEach(i => {
    const vmtaRaw = (i._id.key || "").trim();
addSenderMetric(clickMap, i._id.offer_id, vmtaRaw, i);
  });

  const unsubMap = {};
  unsubAgg.forEach(i => {
    const vmtaRaw = (i._id.key || "").trim();
addSenderMetric(unsubMap, i._id.offer_id, vmtaRaw, i.count);
  });

  const optoutMap = {};
  optoutAgg.forEach(i => {
    const vmtaRaw = (i._id.key || "").trim();
addSenderMetric(optoutMap, i._id.offer_id, vmtaRaw, i.count);
  });

  const complaintMap = {};
  complaintAgg.forEach(i => {
    const vmtaRaw = (i._id.key || "").trim();
addSenderMetric(complaintMap, i._id.offer_id, vmtaRaw, i.count);
  });

  /* ========================= UPDATE SHEET ========================= */

  const updates = [];


  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const actualRow = START_ROW + i;

    const rawIp = String(row[IP_COL] || "").trim();
    const safeVmta = rawIp.replace(/\./g, "_");


    const offerId = String(row[OFFER_COL] || "").trim();

    if (!offerId) continue;

    const senderCandidates = [rawIp, safeVmta];

    const delivered =
      readSenderMetric(vmtaMap, offerId, senderCandidates) ??
      offerDeliveredMap[offerId] ??
      0;
    const totalBounce =
      readSenderMetric(bounceMap, offerId, senderCandidates) ??
      offerBounceMap[offerId] ??
      0;

    const openData = readSenderMetric(openMap, offerId, senderCandidates) || { total: 0, unique: 0 };
    const clickData = readSenderMetric(clickMap, offerId, senderCandidates) || { total: 0, unique: 0 };

    const open = openData.total || 0;
    const uniqueOpen = openData.unique || 0;

    const click = clickData.total || 0;
    const uniqueClick = clickData.unique || 0;

    const unsub = readSenderMetric(unsubMap, offerId, senderCandidates) || 0;
    const optout = readSenderMetric(optoutMap, offerId, senderCandidates) || 0;
    const complaints = readSenderMetric(complaintMap, offerId, senderCandidates) || 0;

    const openRate = delivered ? (open / delivered) * 100 : 0;
    const uniqueOpenRate = delivered ? (uniqueOpen / delivered) * 100 : 0;
    const ctr = uniqueOpen ? (uniqueClick / uniqueOpen) * 100 : 0;
    const optRate = delivered ? (optout / delivered) * 100 : 0;
    const unsubRate = delivered ? (unsub / delivered) * 100 : 0;
    const complaintRate = delivered ? (complaints / delivered) * 100 : 0;
    const sentApprox = delivered + totalBounce;
    const bounceRate = sentApprox ? (totalBounce / sentApprox) * 100 : 0;

    updates.push({
      range: `${SHEET_NAME}!E${actualRow}:N${actualRow}`,
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
        bounceRate.toFixed(2),
      ]]
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

    console.log(`🔥 ${SHEET_NAME} Updated (${updates.length} rows)`);
  } else {
    console.log(`⚠️ No updates`);
  }
}