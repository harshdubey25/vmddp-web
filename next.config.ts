import type { NextConfig } from "next";

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

export default nextConfig;
