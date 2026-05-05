import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT set output:"standalone" for Vercel — Vercel handles its own build output
  images: {
    // Keep unoptimized for now since images are local PNGs served from /public
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
