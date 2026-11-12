import type { MetadataRoute } from "next";
import { SITE_URL } from "@/platform/site";
import { BIO_PATH } from "@/app/(site)/_components/site-nav";
import { POST_TYPES } from "@/modules/posts/constants";
import { getPublishedSlugs, listCategoriesWithPostCounts } from "@/modules/posts/queries";

// AD-26: trang chủ, Trang bio, trang Loại bài và Danh mục có bài đã xuất bản (rỗng là trang mỏng, `noindex`),
// Bài web. Trang phân trang `/…/trang/n` không vào sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([getPublishedSlugs(), listCategoriesWithPostCounts()]);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}${BIO_PATH}`, changeFrequency: "daily", priority: 0.8 },
    ...Object.entries(POST_TYPES)
      .filter(([postType]) => posts.some((p) => p.postType === postType))
      .map(([, t]) => ({
        url: `${SITE_URL}/${t.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ...categories
      .filter((c) => c.posts > 0)
      .map((c) => ({
        url: `${SITE_URL}/${c.slug}`,
        lastModified: c.updatedAt,
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
