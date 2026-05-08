export async function fetchPmtaStats(server) {

  let baseUrl = server.baseUrl;

  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error("Invalid URL - missing");
  }

  baseUrl = baseUrl.trim().replace(/\/$/, "");

  const finalUrl = `${baseUrl}/pmtaStats.php`;

  const res = await fetch(finalUrl, {
    method: "GET",
    headers: {
      "X-INTERNAL-KEY": process.env.SENDER_INTERNAL_KEY // ✅ FIX
    }
  });

  const text = await res.text();
  console.log("👉 STATUS:", res.status);
  console.log("👉 RESPONSE:", text);

  if (!res.ok) {
    throw new Error("PMTA_FETCH_FAILED");
  }

  return JSON.parse(text);
}