import { vi } from "vitest";

// Khung test Server Action (spine AD-16), nạp trước mọi `*.db.test.ts` (`setupFiles` của `vitest.db.config.ts`):
// action chạy thật tới DB test, chỉ thay hai API của Next không có ngoài server:
// - `next/headers`: `headers()` trả header Basic Auth trong `actionTest.authorization`;
// - `next/cache`: `updateTag` ghi tag vào `actionTest.updatedTags`; `cacheTag`, `cacheLife` không làm gì
//   (query `"use cache"` chạy thẳng, không cache); `cacheTag` ghi tag vào `actionTest.cacheTags`.
vi.mock("next/headers", async () => {
  const { actionTest } = await import("@/vitest.db.helpers");
  return {
    headers: async () => new Headers(actionTest.authorization ? { authorization: actionTest.authorization } : {}),
  };
});

vi.mock("next/cache", async () => {
  const { actionTest } = await import("@/vitest.db.helpers");
  return {
    updateTag: (tag: string) => {
      actionTest.updatedTags.push(tag);
    },
    cacheTag: (...tags: string[]) => {
      actionTest.cacheTags.push(...tags);
    },
    cacheLife: () => {},
  };
});
