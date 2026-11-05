import "server-only";
import { db } from "@/platform/db";

export async function getCategoryForCms(id: string) {
  return db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, description: true },
  });
}

// Danh mục để chọn trong form (Sản phẩm…), theo thứ tự hiển thị.
export async function listCategoryOptionsForCms() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}
