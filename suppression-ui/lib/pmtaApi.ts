const API = process.env.NEXT_PUBLIC_API_URL || "";

export async function getPmtaServers() {
  const res = await fetch(`${API}/api/pmta/servers`, {
    credentials: "include"
  });
  return res.json();
}

export async function getPmtaStats() {
  const res = await fetch(`${API}/api/pmta/stats`, {
    credentials: "include"
  });
  return res.json();
}

export async function getPmtaQueues() {
  const res = await fetch(`${API}/api/pmta/queues`, {
    credentials: "include"
  });
  return res.json();
}

export async function getPmtaDomains() {
  const res = await fetch(`${API}/api/pmta/domains`, {
    credentials: "include"
  });
  return res.json();
}