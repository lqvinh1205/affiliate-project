import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./lib/images";

const nextConfig: NextConfig = {
  images: {
    // Ảnh sản phẩm Shopee và ảnh upload lên Supabase Storage.
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
