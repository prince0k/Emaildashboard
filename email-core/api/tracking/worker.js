import { Worker } from "bullmq";
import IORedis from "ioredis";

import ClickLog from "../models/ClickLog.js";
import LinkToken from "../models/LinkToken.js";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
});

// same bot function copy kar ya import kar
function isBot(userAgent = "") {
  const bots = ["googlebot","bingbot","yahoo","bot","crawler","scanner"];
  return bots.some(b => userAgent.toLowerCase().includes(b));
}

new Worker(
  "clickQueue",
  async (job) => {
    const { token, link, deploy, redirectUrl, ip, userAgent, country } = job.data;

    const day = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });

    const bot = isBot(userAgent);

    await ClickLog.create({
      offer_id: link.offer_id,
      campaignId: deploy?.campaignId || null,
      offerId: deploy?.offerId || null,
      email: link.email || null,
      send_domain: link.send_domain || null,
      vmta: link.vmta || null,
      list_id: link.list_id || null,
      rl: link.rl,
      url: redirectUrl,
      ip,
      userAgent,
      country,
      day,
      is_bot_click: bot,
    });

    await LinkToken.updateOne(
      { token },
      {
        $inc: { click_count: 1 },
        $set: {
          last_click_at: new Date(),
          click_ip: ip,
          click_ua: userAgent,
          is_bot_click: bot,
        },
      }
    );
  },
  { connection }
);