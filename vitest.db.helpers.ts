import { db } from "@/platform/db";

// Chỉ dùng trong `*.db.test.ts`.

// Trạng thái của khung test Server Action (`vitest.db.mocks.ts` mock `next/headers`, `next/cache` đọc/ghi ở đây):
// - `authorization`: header Basic Auth mà `requireAdmin()` thấy; mặc định là tài khoản admin của
//   `vitest.db.config.ts`, đặt `null` để thử gọi khi chưa đăng nhập;
// - `updatedTags`: mọi tag action đã `updateTag`, theo thứ tự gọi;
// - `cacheTags`: mọi tag query `"use cache"` đã gắn bằng `cacheTag` (kiểm AD-7: query gắn tag mọi bảng nó đọc).
export const actionTest = {
  authorization: null as string | null,
  updatedTags: [] as string[],
  cacheTags: [] as string[],
};

// Tag mà `fn` gắn bằng `cacheTag` (không trùng lặp).
export async function cacheTagsOf(fn: () => Promise<unknown>) {
  actionTest.cacheTags = [];
  await fn();
  return [...new Set(actionTest.cacheTags)];
}

const basic = (s: string) => `Basic ${Buffer.from(s).toString("base64")}`;

export function adminAuthorization() {
  return basic(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`);
}

// Xoá sạch mọi bảng nghiệp vụ của DB test và đặt lại trạng thái khung test action trước từng test.
export async function resetTestDb() {
  actionTest.authorization = adminAuthorization();
  actionTest.updatedTags = [];
  actionTest.cacheTags = [];
  await db.$executeRawUnsafe(`TRUNCATE "PostProduct", "Post", "Product", "CategorySlugRedirect", "Category" CASCADE`);
}
