/**
 * buildRoutes.js (HARDENED)
 * -------------------------
 * Normalize and validate sender routes
 */

export function buildRoutes(routes = []) {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("routes_required");
  }

  const seen = new Set();

  const normalized = routes.map((r, index) => {
    if (!r || typeof r !== "object") {
      throw new Error(`invalid_route_at_index_${index}`);
    }

    const domain = String(r.domain || "").trim().toLowerCase();
    const from_user = String(r.from_user || "").trim();
    const vmta = String(r.vmta || "").trim().toLowerCase();

    if (!domain || !from_user || !vmta) {
      throw new Error(`missing_route_fields_at_index_${index}`);
    }

    // Basic domain format validation
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!domainRegex.test(domain)) {
      throw new Error(`invalid_domain_format_at_index_${index}`);
    }

    const routeKey = `${domain}:${from_user}:${vmta}`;
    if (seen.has(routeKey)) {
      throw new Error(`duplicate_route_at_index_${index}`);
    }

    seen.add(routeKey);

    return {
      domain,
      from_user,
      vmta,
    };
  });

  return normalized;
}
