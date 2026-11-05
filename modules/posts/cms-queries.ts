import "server-only";
import { db } from "@/platform/db";

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
