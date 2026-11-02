import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getPublishedSlugs } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedSlugs();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...Object.values(CATEGORIES).map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/bai-viet/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
