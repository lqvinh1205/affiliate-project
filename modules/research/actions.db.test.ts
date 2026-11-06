import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { saveResearchProfile } from "@/modules/research/actions";
import { getResearchProfileForCms } from "@/modules/research/cms-queries";
import type { ResearchProfileData } from "@/modules/research/types";

const data: ResearchProfileData = {
  info: [{ id: "info-1", text: "Rửa được bằng máy", sourceUrl: "https://example.com/a" }],
  infoNote: null,
  imageDescription: null,
  reviewSummary: null,
  audiences: [{ id: "doc-gia-1", name: "Sinh viên", reason: "Bếp nhỏ" }],
  angles: [
    { id: "goc-viet-1", name: "A", hook: "a" },
    { id: "goc-viet-2", name: "B", hook: "b" },
    { id: "goc-viet-3", name: "C", hook: "c" },
  ],
};

async function product() {
  return db.product.create({ data: { name: "Nồi", affiliateUrl: "https://s.shopee.vn/a" } });
}

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("saveResearchProfile", () => {
  it("sửa hồ sơ đã Duyệt: lưu nội dung mới, không đổi trạng thái gợi ý, updateTag research", async () => {
    const p = await product();
    await db.researchProfile.create({ data: { productId: p.id, data } });
    const s = await db.suggestion.create({
      data: { kind: "RESEARCH", productId: p.id, promptId: "x", promptVersion: 1, status: "APPROVED", payload: data },
    });
    const res = await saveResearchProfile({
      productId: p.id,
      data: { ...data, imageDescription: " Màu kem ", audiences: [{ ...data.audiences[0], name: "Người đi làm" }] },
    });
    expect(res.ok).toBe(true);
    const saved = await getResearchProfileForCms(p.id);
    expect(saved?.data).toMatchObject({ imageDescription: "Màu kem", audiences: [{ id: "doc-gia-1", name: "Người đi làm" }] });
    expect((await db.suggestion.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("APPROVED");
    expect(actionTest.updatedTags).toEqual(["research"]);
  });

  it("chưa có hồ sơ đã Duyệt thì báo UserError, không tạo hồ sơ", async () => {
    const p = await product();
    expect(await saveResearchProfile({ productId: p.id, data })).toEqual({
      ok: false,
      error: "Chưa có Hồ sơ nghiên cứu đã duyệt cho Sản phẩm này. Tải lại trang.",
    });
    expect(await db.researchProfile.count()).toBe(0);
  });

  it("nội dung sai schema báo lỗi tại trường; chưa đăng nhập bị chặn", async () => {
    const p = await product();
    await db.researchProfile.create({ data: { productId: p.id, data } });
    const bad = await saveResearchProfile({ productId: p.id, data: { ...data, angles: [] } });
    expect(bad.ok).toBe(false);
    actionTest.authorization = null;
    expect(await saveResearchProfile({ productId: p.id, data })).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
  });
});

describe("getResearchProfileForCms", () => {
  it("data hỏng thì trả null thay vì làm vỡ màn hình", async () => {
    const p = await product();
    await db.researchProfile.create({ data: { productId: p.id, data: { sai: true } } });
    expect(await getResearchProfileForCms(p.id)).toBeNull();
  });
});
