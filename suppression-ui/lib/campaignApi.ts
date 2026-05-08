async function request(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(path, {
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let errorMessage = "API request failed";
      try {
        const errorJson = await res.json();
        errorMessage =
          errorJson?.error || errorJson?.message || errorMessage;
      } catch {
        const errorText = await res.text();
        if (errorText) errorMessage = errorText;
      }

      throw new Error(errorMessage);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  }
}



export const campaignApi = {
  create: (data: any) =>
  request(`/api/campaigns/create`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  review: (campaign: string) =>
    request(`/api/campaigns/${campaign}/review`),

  get: (campaign: string) =>
    request(`/api/campaigns/${campaign}/review`),

  run: (campaign: string, data: any) =>
    request(`/api/campaigns/${campaign}/run`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ✅ ADD THIS
  suppress: (campaign: string) =>
    request(`/api/campaigns/${campaign}/suppress`, {
      method: "POST",
    }),

  creative: (campaign: string) =>
    request(`/api/campaigns/${campaign}/creative`),

  saveCreative: (campaign: string, html: string) =>
    request(`/api/campaigns/${campaign}/creative`, {
      method: "POST",
      body: JSON.stringify({ html }),
    }),

  resetCreative: (campaign: string) =>
    request(`/api/campaigns/${campaign}/creative/reset`, {
      method: "POST",
    }),

  liveStatus: (id?: string, runtimeOfferId?: string) => {
  const params = new URLSearchParams();

  if (id) params.append("id", id);
  if (runtimeOfferId) params.append("runtimeOfferId", runtimeOfferId);

  const query = params.toString();

  return request(
    `/api/campaigns/live-status${query ? `?${query}` : ""}`
  );
},

  saveConfig: (campaign: string, data: any) =>
  request(`/api/campaigns/${campaign}/save-config`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
};