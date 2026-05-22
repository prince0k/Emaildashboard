import type { NextConfig } from "next";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: process.env.BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
