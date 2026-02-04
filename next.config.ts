import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
  generateStatsFile: true,
  statsFilename: 'stats.json',
})
const nextConfig: NextConfig = {
  // Ensure proper headers for Cloudflare Pages
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
