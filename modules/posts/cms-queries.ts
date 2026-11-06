import "server-only";
import type { Status } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import { publicProductSelect } from "@/modules/products/queries";
import { CMS_POST_PAGE_SIZE } from "@/modules/posts/constants";
import { webPostPayloadSchema } from "@/modules/posts/prompts/web-post.prompt";

// Danh mục theo thứ tự hiển thị kèm số Bài web và Sản phẩm đang dùng; đặt ở `posts` vì chạm bảng
// của `posts`, `products`, `categories` (spine AD-2).
export async function listCategoriesForCms() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true, slug: true, _count: { select: { posts: true, products: true } } },
  });
}

// "Nơi đang dùng" của một Sản phẩm: các Bài web gắn nó, theo tiêu đề (chạm `PostProduct` + `Post` — AD-2).
export async function listPostsUsingProductForCms(productId: string) {
  const rows = await db.postProduct.findMany({
    where: { productId },
    orderBy: [{ post: { title: "asc" } }, { postId: "asc" }],
    select: { post: { select: { id: true, title: true, status: true } } },
  });
  return rows.map((r) => r.post);
}

// Danh sách Bài web cho CMS (`/cms/bai-viet`): lọc trạng thái, tiêu đề chứa `q` (không phân biệt hoa thường),
// sửa gần nhất trước. `page` từ 1; vượt trang cuối thì kẹp về trang cuối (trả `page` đã kẹp).
export async function listPostsForCms({ status, q, page }: { status: Status | null; q: string; page: number }) {
  const where = {
    ...(status && { status }),
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
  };
  return db.$transaction(async (tx) => {
    const total = await tx.post.count({ where });
    const current = Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / CMS_POST_PAGE_SIZE)));
    const items = await tx.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (current - 1) * CMS_POST_PAGE_SIZE,
      take: CMS_POST_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        postType: true,
        updatedAt: true,
        category: { select: { name: true } },
        _count: { select: { postProducts: true } },
      },
    });
    return { items, total, page: current };
  });
}

// Bài web để sửa, kèm Sản phẩm đã gắn theo thứ tự (cả Sản phẩm đang ẩn, có cờ `hidden`).
export async function getPostForCms(id: string) {
  return db.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      postType: true,
      categoryId: true,
      content: true,
      tags: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      status: true,
      publishedAt: true,
      postProducts: {
        orderBy: { sortOrder: "asc" },
        select: { product: { select: { ...publicProductSelect, hidden: true } } },
      },
    },
  });
}

// Đọc payload Json của gợi ý `WEB_POST` (AD-15: đọc ra phải parse). Đặt ở đây để `suggestions/cms-queries.ts` dùng
// được Zod của miền chủ đích mà không import `prompts/` (AD-2). Sai schema → null.
export function parseWebPostPayload(payload: unknown) {
  const r = webPostPayloadSchema.safeParse(payload);
  return r.success ? r.data : null;
}
