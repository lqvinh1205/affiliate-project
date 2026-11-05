import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { categoryInputSchema } from "@/modules/categories/schema";
import { saveCategoryRecord } from "@/modules/categories/service";
import { loadCategory } from "@/app/(site)/[danh-muc]/_components/load-category";

// `permanentRedirect`/`notFound` của Next ném lỗi điều khiển; ở đây ném lỗi có thể so được.
vi.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`308 ${url}`);
  },
  notFound: () => {
    throw new Error("404");
  },
}));

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("loadCategory (AD-20)", () => {
  it("đường dẫn hiện tại trả Danh mục", async () => {
    await saveCategoryRecord(categoryInputSchema.parse({ name: "Nhà bếp", slug: "", description: "" }));
    expect(await loadCategory("nha-bep")).toMatchObject({ name: "Nhà bếp", slug: "nha-bep" });
  });

  it("đổi đường dẫn: đường cũ 308 sang đường mới, giữ đuôi /trang/n", async () => {
    const c = await saveCategoryRecord(categoryInputSchema.parse({ name: "Nhà bếp", slug: "", description: "" }));
    await saveCategoryRecord(categoryInputSchema.parse({ id: c.id, name: "Nhà bếp", slug: "bep", description: "" }));
    await expect(loadCategory("nha-bep")).rejects.toThrow("308 /bep");
    await expect(loadCategory("nha-bep", "/trang/3")).rejects.toThrow("308 /bep/trang/3");
  });

  it("đường dẫn lạ → 404", async () => {
    await expect(loadCategory("khong-co")).rejects.toThrow("404");
  });
});
