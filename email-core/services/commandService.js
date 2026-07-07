import SenderServer from "../models/SenderServer.js";

/* ✅ SAME HELPER (stats जैसा) */
function buildServerUrl(baseUrl, endpoint = "") {
  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error("Invalid baseUrl");
  }

  let url = baseUrl.trim().replace(/\/$/, "");

  return endpoint ? `${url}/${endpoint}` : url;
}

export async function runCommand({ action, target, source_ip, serverId }) {

  let servers;

  if (serverId) {
    const server = await SenderServer.findById(serverId);
    if (!server) throw new Error("Server not found");
    servers = [server];
  } else {
    servers = await SenderServer.find({});
  }

  const results = [];

  for (const server of servers) {
    try {
      // Parse remote domain/IP from server baseUrl and route to secure agent port (default 8443)
      const u = new URL(server.baseUrl);
      const agentPort = process.env.AGENT_PORT || "8443";
      const url = `${u.protocol}//${u.hostname}:${agentPort}/run`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Token": process.env.SENDER_INTERNAL_KEY
        },
        body: JSON.stringify({
          action,
          target,
          ip: source_ip
        })
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = JSON.parse(text);

      results.push({
        server: server.name,
        url,
        success: true,
        data
      });

    } catch (err) {
      results.push({
        server: server.name,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}