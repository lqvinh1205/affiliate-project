import { vi } from "vitest";

// Khung test Server Action (spine AD-16), nạp trước mọi `*.db.test.ts` (`setupFiles` của `vitest.db.config.ts`):
// action chạy thật tới DB test, chỉ thay hai API của Next không có ngoài server:
// - `next/headers`: `headers()` trả header Basic Auth trong `actionTest.authorization`;
// - `next/cache`: `updateTag` ghi tag vào `actionTest.updatedTags`; `cacheTag`, `cacheLife` không làm gì
//   (query `"use cache"` chạy thẳng, không cache); `cacheTag` ghi tag vào `actionTest.cacheTags`;
// - `next/server`: `after(cb)` không chạy ngay mà xếp `cb` vào `actionTest.afterCallbacks`; test gọi
//   `runAfterCallbacks()` để chạy phần việc sau phản hồi (gọi AI giả lập — spine AD-18) đúng lúc mình muốn.
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

vi.mock("next/server", async (importOriginal) => {
  const { actionTest } = await import("@/vitest.db.helpers");
  return {
    ...(await importOriginal<typeof import("next/server")>()),
    after: (cb: () => unknown) => {
      actionTest.afterCallbacks.push(cb);
    },
  };
});
