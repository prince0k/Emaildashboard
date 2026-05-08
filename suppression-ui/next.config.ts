import type { NextConfig } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      // OFFERS
      {
        source: "/api/offers/:path*",
        destination: `${API_BASE}/api/offers/:path*`,
      },

      // MD5 SUPPRESSION
      {
        source: "/api/md5-suppression",
        destination: `${API_BASE}/api/md5-suppression`,
      },

      // SUPPRESSION PORTAL
      {
        source: "/api/suppression/:path*",
        destination: `${API_BASE}/api/suppression/:path*`,
      },
    ];
  },
};

export default nextConfig;
