import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Photography is hot-linked from Unsplash and Pexels but proxied and
    // re-encoded by next/image, so the browser only ever requests our own
    // origin. Both hosts must be allowlisted or next/image refuses the URL.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    // Both providers serve stable URLs; cache the optimized results for a month.
    minimumCacheTTL: 2592000,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    /* NOT available here: `turbopackPersistentCaching: true` would let Turbopack
       keep its dev cache on disk across restarts, but on a stable release Next
       throws CanaryOnlyError at startup and the dev server refuses to boot.
       Revisit when it ships in stable — it is the fix for the ~7s recompile
       every `npm run dev` still pays. */
  },
};

export default nextConfig;
