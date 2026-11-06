import { describe, expect, it } from "vitest";
import { UserError } from "@/platform/errors";
import { LINK_COMMENT_MAX } from "@/modules/content-sets/constants";
import { toFacebookPayload } from "@/modules/content-sets/prompts/facebook-post.prompt";
import { toLinkCommentPayload } from "@/modules/content-sets/prompts/link-comment.prompt";
import { threadsApprovalSchema, toThreadsPayload } from "@/modules/content-sets/prompts/threads-post.prompt";

const products = [
  { name: "Nồi chiên", affiliateUrl: "https://s.shopee.vn/aaa" },
  { name: "Chảo", affiliateUrl: "https://s.shopee.vn/bbb" },
  { name: "Kệ", affiliateUrl: "https://shopee.vn/ke-i.1.2" },
];

describe("toThreadsPayload (FR-14)", () => {
  it("bỏ link khỏi thân bài, bỏ bài trống, giữ bài dài để Vinh thấy và sửa", () => {
    const long = "x".repeat(600);
    const { payload, riskWarnings } = toThreadsPayload({
      posts: [" Hook https://s.shopee.vn/aaa nè ", "", long],
      riskWarnings: [{ sentence: " Hook ", reason: "" }],
    });
    expect(payload.posts).toEqual(["Hook nè", long]);
    expect(riskWarnings).toEqual([{ sentence: "Hook", reason: "Câu có thể gây rủi ro" }]);
  });

  it("không còn bài nào → UserError (thẻ báo lỗi, phần khác giữ nguyên)", () => {
    expect(() => toThreadsPayload({ posts: [" ", "https://x.vn"], riskWarnings: [] })).toThrow(UserError);
  });

  it("Duyệt: bài > 500 ký tự hoặc trống báo đúng số bài (UX-DR41)", () => {
    const r = threadsApprovalSchema.safeParse({ posts: ["ok", "x".repeat(501)] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Bài 2 vượt 500 ký tự");
    const e = threadsApprovalSchema.safeParse({ posts: ["  "] });
    if (!e.success) expect(e.error.issues[0].message).toBe("Bài 1 đang trống");
    expect(threadsApprovalSchema.parse({ posts: [" a ", "x".repeat(500)] }).posts[0]).toBe("a");
  });
});

describe("toFacebookPayload (FR-15)", () => {
  it("bỏ link, giữ xuống dòng", () => {
    const { payload } = toFacebookPayload({ body: "Câu 1.\nXem link https://abc.vn ở bình luận", riskWarnings: [] });
    expect(payload.body).toBe("Câu 1.\nXem link ở bình luận");
  });
});

describe("toLinkCommentPayload (FR-17, FR-18)", () => {
  it("giữ nguyên Link affiliate, bỏ link lạ, thêm dòng cho Sản phẩm thiếu link", () => {
    const { payload } = toLinkCommentPayload(
      { comment: "Link đây nè: https://s.shopee.vn/aaa và https://bit.ly/fake", riskWarnings: [] },
      { products, disclosure: null },
    );
    expect(payload.comment).toContain("https://s.shopee.vn/aaa");
    expect(payload.comment).not.toContain("bit.ly");
    expect(payload.comment).toContain("👉 Chảo: https://s.shopee.vn/bbb");
    expect(payload.comment).toContain("👉 Kệ: https://shopee.vn/ke-i.1.2");
  });

  it("có câu công khai thì luôn có trong bình luận; trống thì không thêm", () => {
    const withDisclosure = toLinkCommentPayload(
      { comment: "Link dưới nha", riskWarnings: [] },
      { products: products.slice(0, 1), disclosure: "Mình nhận hoa hồng từ link này." },
    );
    expect(withDisclosure.payload.comment.endsWith("Mình nhận hoa hồng từ link này.")).toBe(true);
    const without = toLinkCommentPayload({ comment: "Link dưới nha", riskWarnings: [] }, { products: products.slice(0, 1), disclosure: null });
    expect(without.payload.comment).toBe("Link dưới nha\n👉 Nồi chiên: https://s.shopee.vn/aaa");
  });

  it("bình luận quá dài: cắt phần chữ, link và câu công khai vẫn nguyên", () => {
    const { payload } = toLinkCommentPayload(
      { comment: `${"chữ ".repeat(600)}https://s.shopee.vn/aaa`, riskWarnings: [] },
      { products, disclosure: "Có hoa hồng." },
    );
    expect(payload.comment.length).toBeLessThanOrEqual(LINK_COMMENT_MAX);
    for (const p of products) expect(payload.comment).toContain(p.affiliateUrl);
    expect(payload.comment).toContain("Có hoa hồng.");
  });
});
