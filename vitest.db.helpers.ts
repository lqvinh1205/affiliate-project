import { db } from "@/platform/db";

// Chỉ dùng trong `*.db.test.ts`: xoá sạch mọi bảng nghiệp vụ của DB test trước từng test.
export async function resetTestDb() {
  await db.$executeRawUnsafe(`TRUNCATE "PostProduct", "Post", "Product", "Category" CASCADE`);
}
