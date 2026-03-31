import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tv-logo.tradingviewapi.com",
      },
    ],
  },
  turbopack: {
    root: "../../",
  },
};

export default nextConfig;
