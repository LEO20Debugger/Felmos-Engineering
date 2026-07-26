import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Photography is hot-linked from Unsplash but proxied and re-encoded by
    // next/image, so the browser only ever requests our own origin.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    // Unsplash URLs are stable; cache the optimized results for a month.
    minimumCacheTTL: 2592000,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
