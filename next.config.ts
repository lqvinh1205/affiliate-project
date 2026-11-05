import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./platform/images";

const nextConfig: NextConfig = {
  images: {
    // Ảnh sản phẩm Shopee.
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
