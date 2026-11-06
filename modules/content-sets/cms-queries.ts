import "server-only";
import type { Platform } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import { facebookPayloadSchema, linkCommentPayloadSchema, threadsPayloadSchema } from "@/modules/content-sets/schema";

const iso = (d: Date | null) => d?.toISOString() ?? null;

// Bộ nội dung cho màn `/cms/bo-noi-dung/[id]` (UX-DR75) và cho lần gọi AI trong `after()`: Sản phẩm theo thứ tự
// (kèm Link affiliate cho Bình luận), Góc viết, Người đọc, Bài web đích, bài mạng xã hội đã Duyệt. Ngày → ISO (AD-8).
export async function getContentSetForCms(id: string) {
  const row = await db.contentSet.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      angleId: true,
      angleName: true,
      angleHook: true,
      angleEdit: true,
      audienceId: true,
      audienceName: true,
      audienceReason: true,
      audienceEdit: true,
      createdAt: true,
      post: { select: { id: true, title: true, excerpt: true, status: true } },
      products: {
        orderBy: { sortOrder: "asc" },
        select: { product: { select: { id: true, name: true, image: true, affiliateUrl: true, hidden: true } } },
      },
      socialPosts: {
        select: {
          id: true,
          platform: true,
          parts: true,
          linkComment: true,
          firstCopiedAt: true,
          postedAt: true,
          postUrl: true,
        },
      },
    },
  });
  if (!row) return null;
  const { products, socialPosts, createdAt, ...rest } = row;
  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    products: products.map((p) => p.product),
    socialPosts: socialPosts.map((s) => ({
      ...s,
      firstCopiedAt: iso(s.firstCopiedAt),
      postedAt: iso(s.postedAt),
    })),
  };
}

// Bộ nội dung có Bài web này làm đích (link "← Bộ nội dung", SocialFromPostDialog — UX-DR72, UX-DR55).
export async function getContentSetIdForPostForCms(postId: string) {
  const row = await db.contentSet.findUnique({ where: { postId }, select: { id: true } });
  return row?.id ?? null;
}

// Bài mạng xã hội (cho action sửa: biết nền tảng để parse đúng Zod).
export async function getSocialPostForCms(id: string) {
  return db.socialPost.findUnique({ where: { id }, select: { id: true, platform: true } });
}

// Sản phẩm đã lên nền tảng nào (FR-20, `/cms/san-pham` và Chi tiết Sản phẩm): Website = có Bài web đã xuất bản gắn
// Sản phẩm; Threads/Facebook = có bài trong Bộ nội dung của Sản phẩm đã đánh dấu đã đăng. Đặt ở `content-sets` vì
// chạm bảng của `content-sets` và `posts` (AD-2: query ở module tầng cao nhất).
export async function listPostedPlatformsByProductForCms(productIds: string[]) {
  const result = new Map<string, Platform[]>(productIds.map((id) => [id, []]));
  if (productIds.length === 0) return result;
  const [web, social] = await Promise.all([
    db.postProduct.findMany({
      where: { productId: { in: productIds }, post: { status: "PUBLISHED" } },
      select: { productId: true },
      distinct: ["productId"],
    }),
    db.contentSetProduct.findMany({
      where: { productId: { in: productIds } },
      select: {
        productId: true,
        contentSet: { select: { socialPosts: { where: { postedAt: { not: null } }, select: { platform: true } } } },
      },
    }),
  ]);
  for (const w of web) result.get(w.productId)?.push("WEBSITE");
  for (const s of social) {
    const list = result.get(s.productId);
    for (const p of s.contentSet.socialPosts) if (list && !list.includes(p.platform)) list.push(p.platform);
  }
  const order: Platform[] = ["WEBSITE", "THREADS", "FACEBOOK"];
  for (const list of result.values()) list.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return result;
}

// Bộ nội dung đang dùng Sản phẩm (khu "Nơi đang dùng" của Chi tiết Sản phẩm), mới nhất trước.
export async function listContentSetsForProductForCms(productId: string) {
  const rows = await db.contentSet.findMany({
    where: { products: { some: { productId } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 20,
    select: {
      id: true,
      angleName: true,
      createdAt: true,
      post: { select: { title: true } },
      socialPosts: { select: { platform: true, postedAt: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.angleName ?? r.post?.title ?? "Bộ nội dung",
    createdAt: r.createdAt.toISOString(),
    posted: r.socialPosts.filter((s) => s.postedAt).map((s) => s.platform),
  }));
}

// Đọc payload Json của gợi ý `THREADS_POST` / `FACEBOOK_POST` / `LINK_COMMENT` (AD-15: đọc ra phải parse). Đặt ở đây
// để `suggestions/cms-queries.ts` dùng Zod của miền chủ đích mà không import `prompts/` (AD-2). Sai schema → null.
export function parseThreadsPayload(payload: unknown) {
  const r = threadsPayloadSchema.safeParse(payload);
  return r.success ? r.data : null;
}

export function parseFacebookPayload(payload: unknown) {
  const r = facebookPayloadSchema.safeParse(payload);
  return r.success ? r.data : null;
}

export function parseLinkCommentPayload(payload: unknown) {
  const r = linkCommentPayloadSchema.safeParse(payload);
  return r.success ? r.data : null;
}
