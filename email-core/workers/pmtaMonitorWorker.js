import PmtaSnapshot from "../models/PmtaSnapshot.js";
import { fetchPmtaStats } from "../services/pmtaHttpService.js";
import SenderServer from "../models/SenderServer.js";


function parseError(err) {
  if (!err) return null

  const codeMatch = err.match(/\b(\d{3})\b/)
  const providerMatch = err.match(/gmail|yahoo|outlook|hotmail|comcast/i)

  return {
    message: err,
    raw: err, // 🔥 ADD THIS
    code: codeMatch ? codeMatch[1] : "",
    provider: providerMatch ? providerMatch[0].toLowerCase() : "",
    isTemporary: codeMatch ? codeMatch[1].startsWith("4") : false
  }
}

export async function runPmtaMonitor() {
  console.log("🚀 Worker started");

  const servers = await SenderServer.find({});
  console.log("📡 Servers found:", servers.length);

  if (!servers.length) {
    console.log("⚠️ No servers found in DB");
    return;
  }

  for (const server of servers) {
    try {
      console.log(`➡️ Fetching: ${server.name}`);

      const data = await fetchPmtaStats(server);

      console.log(`📊 Data received for ${server.name}`);

      await PmtaSnapshot.create({
        server: server.name,
        status: data.status,
        uptime: data.uptime,

        queues: (data.queues || []).map(q => ({
          queue: q.queue,
          rcpt: q.rcpt || 0,
          kb: q.kb || 0,
          conn: q.conn || 0,
          retry: q.retry || "",
          error: parseError(q.error)
        })),

        domains: (data.domains || []).map(d => ({
          domain: d.domain,
          rcpt: d.rcpt,
          kb: d.kb,
          conn: d.conn,
          error: parseError(d.error)
        })),

        traffic: {
          total: data.traffic?.total || {},
          last_hour: data.traffic?.last_hour || {},
          top_hour: data.traffic?.top_hour || {},
          last_min: data.traffic?.last_min || {},
          top_min: data.traffic?.top_min || {}
        }
      });

      console.log(`✅ Saved: ${server.name}`);

    } catch (err) {
      console.error(`❌ Error in ${server.name}:`, err.message);
    }
  }

  console.log("🏁 Worker finished");
}