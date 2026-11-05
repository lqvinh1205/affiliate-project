import type { MetadataRoute } from "next";
import { SITE_URL } from "@/platform/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cms", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
