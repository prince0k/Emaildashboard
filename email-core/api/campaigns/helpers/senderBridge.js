/**
 * senderBridge.js (CLEAN + SECURE VERSION)
 */

import axios from "axios";
import SenderServer from "../../../models/SenderServer.js";

export async function callSender(senderId, path, payload = {}, method = "POST") {
  if (!path || typeof path !== "string") {
    throw new Error("invalid_sender_path");
  }

  let sender;

  if (senderId) {
    sender = await SenderServer.findOne({
      _id: senderId,
      active: true,
    }).lean();
  } else {
    sender = await SenderServer.findOne({ active: true })
      .sort({ priority: -1 })
      .lean();
  }

  if (!sender) {
    throw new Error("sender_not_found_or_inactive");
  }

  if (!sender.baseUrl) {
    throw new Error("sender_invalid_config");
  }

const safePath = path.replace(/^\//, "").replace(/\.\./g, "");
const baseUrl = sender.baseUrl.replace(/\/$/, "");
const url = `${baseUrl}/${safePath}`;

console.log("🚀 Sender URL:", url);
console.log("📦 Payload:", payload);

  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.SENDER_INTERNAL_KEY,
      },
      timeout: 60000,
      validateStatus: () => true,
    };

    let res;

    if (method === "GET") {
      res = await axios.get(url, config);
    } else {
      res = await axios.post(url, payload, config);
    }

    if (res.status !== 200) {
      console.error("❌ Sender HTTP Error:", res.status);
      console.error("❌ Sender Response:", res.data);
      throw new Error(`sender_http_${res.status}`);
    }

    if (typeof res.data !== "object") {
      throw new Error("sender_invalid_json");
    }

    return res.data;

  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("sender_timeout");
    }

    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      throw new Error("sender_unreachable");
    }

    throw err;
  }
}