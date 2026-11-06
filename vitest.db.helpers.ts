import { resetAiCooldowns } from "@/platform/ai/ask";
import { fakeAi } from "@/platform/ai/providers/fake";
import { db } from "@/platform/db";

// Chỉ dùng trong `*.db.test.ts`.

// Trạng thái của khung test Server Action (`vitest.db.mocks.ts` mock `next/headers`, `next/cache` đọc/ghi ở đây):
// - `authorization`: header Basic Auth mà `requireAdmin()` thấy; mặc định là tài khoản admin của
//   `vitest.db.config.ts`, đặt `null` để thử gọi khi chưa đăng nhập;
// - `updatedTags`: mọi tag action đã `updateTag`, theo thứ tự gọi;
// - `cacheTags`: mọi tag query `"use cache"` đã gắn bằng `cacheTag` (kiểm AD-7: query gắn tag mọi bảng nó đọc);
// - `afterCallbacks`: việc action xếp bằng `after()` (chạy bằng `runAfterCallbacks`).
export const actionTest = {
  authorization: null as string | null,
  updatedTags: [] as string[],
  cacheTags: [] as string[],
  afterCallbacks: [] as (() => unknown)[],
};

// Chạy (theo thứ tự) mọi việc đã xếp bằng `after()` rồi xoá hàng đợi. Lỗi ném ra được gom và ném lại sau cùng.
export async function runAfterCallbacks() {
  const callbacks = actionTest.afterCallbacks.splice(0);
  const errors: unknown[] = [];
  for (const cb of callbacks) {
    try {
      await cb();
    } catch (e) {
      errors.push(e);
    }
  }
  if (errors.length > 0) throw errors[0];
}

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

// Xoá sạch mọi bảng nghiệp vụ của DB test và đặt lại trạng thái khung test action (kể cả AI giả lập) trước từng test.
export async function resetTestDb() {
  actionTest.authorization = adminAuthorization();
  actionTest.updatedTags = [];
  actionTest.cacheTags = [];
  actionTest.afterCallbacks = [];
  // AI giả lập (AD-16): xoá câu trả lời và cooldown của test trước.
  fakeAi.reset();
  resetAiCooldowns();
  await db.$executeRawUnsafe(`TRUNCATE "ResearchProfile", "Suggestion", "PostSlugRedirect", "PostProduct", "Post", "Product", "CategorySlugRedirect", "Category" CASCADE`);
}
