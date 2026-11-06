import { describe, expect, it } from "vitest";
import {
  productCategoryPayloadSchema,
  researchProductPrompt,
  researchProfileSchema,
  toResearchPayloads,
  type ResearchOutput,
} from "@/modules/research/prompts/research-product.prompt";

const categories = [
  { id: "0b6f4c3e-6c1a-4d8e-9f00-000000000001", name: "Nhà bếp" },
  { id: "0b6f4c3e-6c1a-4d8e-9f00-000000000002", name: "Làm đẹp" },
];

function output(patch: Partial<ResearchOutput> = {}): ResearchOutput {
  return {
    info: [
      { text: " Rửa được bằng máy ", sourceUrl: "https://vi.wikipedia.org/wiki/Noi" },
      { text: "Ý không nguồn", sourceUrl: "javascript:alert(1)" },
    ],
    infoNote: null,
    imageDescription: "Nồi màu kem, vỏ nhựa",
    reviewSummary: { praise: ["Nấu nhanh", " "], complaints: ["Hơi ồn"], fit: ["Nhà 2–3 người"] },
    audiences: [{ name: "Sinh viên", reason: "Ở trọ, bếp nhỏ" }],
    angles: [
      { name: "Tiết kiệm", hook: "Một nồi nấu cả tuần" },
      { name: "Gọn", hook: "Bếp nhỏ vẫn đủ chỗ" },
      { name: "Nhanh", hook: "Mười phút có cơm" },
    ],
    category: { categoryId: categories[0].id, reason: "Đồ dùng nấu ăn" },
    ...patch,
  };
}

const ctx = { hasReviews: true, hasImages: true, categories };

describe("toResearchPayloads", () => {
  it("gán id ổn định cho Người đọc, Góc viết và ý Thông tin; bỏ link nguồn không phải http(s)", () => {
    const { profile } = toResearchPayloads(output(), ctx);
    expect(profile.audiences.map((a) => a.id)).toEqual(["doc-gia-1"]);
    expect(profile.angles.map((a) => a.id)).toEqual(["goc-viet-1", "goc-viet-2", "goc-viet-3"]);
    expect(profile.info).toEqual([
      { id: "info-1", text: "Rửa được bằng máy", sourceUrl: "https://vi.wikipedia.org/wiki/Noi" },
      { id: "info-2", text: "Ý không nguồn", sourceUrl: null },
    ]);
    expect(profile.reviewSummary).toEqual({ praise: ["Nấu nhanh"], complaints: ["Hơi ồn"], fit: ["Nhà 2–3 người"] });
  });

  it("không có đánh giá dán vào thì bỏ Khen/Chê/Phù hợp dù AI có trả (FR-8)", () => {
    expect(toResearchPayloads(output(), { ...ctx, hasReviews: false }).profile.reviewSummary).toBeNull();
  });

  it("không có ảnh (hoặc AI không đọc được ảnh) thì không có mô tả ảnh (FR-7)", () => {
    expect(toResearchPayloads(output(), { ...ctx, hasImages: false }).profile.imageDescription).toBeNull();
  });

  it("Danh mục gợi ý chỉ nhận id có trong danh sách đã gửi (FR-11)", () => {
    expect(toResearchPayloads(output(), ctx).category).toEqual({
      categoryId: categories[0].id,
      categoryName: "Nhà bếp",
      reason: "Đồ dùng nấu ăn",
    });
    const invented = output({ category: { categoryId: "khong-co", reason: "x" } });
    expect(toResearchPayloads(invented, ctx).category).toBeNull();
    const none = output({ category: { categoryId: null, reason: "" } });
    expect(toResearchPayloads(none, ctx).category).toBeNull();
  });

  it("cắt về giới hạn cứng: tối đa 3 Người đọc, 6 Góc viết, chữ quá dài bị cắt", () => {
    const many = output({
      audiences: Array.from({ length: 5 }, (_, i) => ({ name: `Nhóm ${i}`, reason: "r".repeat(900) })),
      angles: Array.from({ length: 9 }, (_, i) => ({ name: `Góc ${i}`, hook: "h" })),
    });
    const { profile } = toResearchPayloads(many, ctx);
    expect(profile.audiences).toHaveLength(3);
    expect(profile.audiences[0].reason).toHaveLength(500);
    expect(profile.angles).toHaveLength(6);
  });
});

describe("researchProfileSchema (payload RESEARCH, form sửa hồ sơ)", () => {
  const valid = toResearchPayloads(output(), ctx).profile;

  it("parse lại payload đã lưu cho kết quả y hệt (đọc ra parse được — AD-15)", () => {
    expect(researchProfileSchema.parse(JSON.parse(JSON.stringify(valid)))).toEqual(valid);
  });

  it("ô mô tả ảnh để trống thành null; ý Khen để trống bị bỏ", () => {
    const parsed = researchProfileSchema.parse({
      ...valid,
      imageDescription: "  ",
      reviewSummary: { ...valid.reviewSummary!, praise: ["", "Bền"] },
    });
    expect(parsed.imageDescription).toBeNull();
    expect(parsed.reviewSummary?.praise).toEqual(["Bền"]);
  });

  it("thiếu Góc viết (< 3) hoặc tên Người đọc trống thì báo lỗi tiếng Việt", () => {
    expect(researchProfileSchema.safeParse({ ...valid, angles: valid.angles.slice(0, 2) }).success).toBe(false);
    const r = researchProfileSchema.safeParse({ ...valid, audiences: [{ ...valid.audiences[0], name: " " }] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Nhập tên nhóm");
  });

  it("link nguồn javascript: bị từ chối", () => {
    const bad = { ...valid, info: [{ id: "info-1", text: "x", sourceUrl: "javascript:alert(1)" }] };
    expect(researchProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("productCategoryPayloadSchema (payload PRODUCT_CATEGORY)", () => {
  it("cần id Danh mục dạng uuid", () => {
    expect(productCategoryPayloadSchema.safeParse({ categoryId: "x", categoryName: "A", reason: "" }).success).toBe(false);
    expect(
      productCategoryPayloadSchema.safeParse({ categoryId: categories[1].id, categoryName: "Làm đẹp", reason: "" }).success,
    ).toBe(true);
  });
});

describe("researchProductPrompt", () => {
  it("đưa danh sách Danh mục (id: tên), đánh giá, số ảnh và chỉ dẫn Tạo lại vào lời nhắc", () => {
    const user = researchProductPrompt.user({
      name: "Nồi chiên",
      priceText: null,
      affiliateUrl: "https://s.shopee.vn/abc",
      rawText: null,
      rawReviews: null,
      imageCount: 0,
      categories,
      instruction: "bỏ phần giá",
    });
    expect(user).toContain(`${categories[0].id}: Nhà bếp`);
    expect(user).toContain("reviewSummary phải là null");
    expect(user).toContain("imageDescription phải là null");
    expect(user).toContain("Chỉ dẫn khi viết lại: bỏ phần giá");
  });
});
