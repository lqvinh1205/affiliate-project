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
