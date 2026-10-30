import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },

  images: {
    formats: ["image/avif", "image/webp"], // ✅ better compression
    minimumCacheTTL: 60 * 60 * 24 * 7,    // ✅ cache optimized images 7 days
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ibb.co", pathname: "/**" },
      // ⚠️ try to avoid serving images from API domain if possible
      { protocol: "https", hostname: "api.khushbuwaala.com", pathname: "/**" },
      { protocol: "http", hostname: "api.khushbuwaala.com", pathname: "/**" },
    ],
  },

  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"], // ✅ helps bundle
  },
};

export default nextConfig;
