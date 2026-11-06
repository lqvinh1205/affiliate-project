import { describe, expect, it } from "vitest";
import { UserError } from "@/platform/errors";
import { LINK_COMMENT_MAX, THREADS_POST_MAX } from "@/modules/content-sets/constants";
import { socialContentError } from "@/modules/content-sets/components/social-content-error";
import { stripUrls } from "@/modules/content-sets/schema";
import { toFacebookPayload } from "@/modules/content-sets/prompts/facebook-post.prompt";
import { LinkCommentTooLongError, toLinkCommentPayload } from "@/modules/content-sets/prompts/link-comment.prompt";
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
      { platform: "FACEBOOK", products, disclosure: null },
    );
    expect(payload.comment).toContain("https://s.shopee.vn/aaa");
    expect(payload.comment).not.toContain("bit.ly");
    expect(payload.comment).toContain("👉 Chảo: https://s.shopee.vn/bbb");
    expect(payload.comment).toContain("👉 Kệ: https://shopee.vn/ke-i.1.2");
  });

  it("có câu công khai thì luôn có trong bình luận; trống thì không thêm", () => {
    const withDisclosure = toLinkCommentPayload(
      { comment: "Link dưới nha", riskWarnings: [] },
      { platform: "FACEBOOK", products: products.slice(0, 1), disclosure: "Mình nhận hoa hồng từ link này." },
    );
    expect(withDisclosure.payload.comment.endsWith("Mình nhận hoa hồng từ link này.")).toBe(true);
    const without = toLinkCommentPayload({ comment: "Link dưới nha", riskWarnings: [] }, { platform: "FACEBOOK", products: products.slice(0, 1), disclosure: null });
    expect(without.payload.comment).toBe("Link dưới nha\n👉 Nồi chiên: https://s.shopee.vn/aaa");
  });

  it("bình luận quá dài: cắt phần chữ, link và câu công khai vẫn nguyên", () => {
    const { payload } = toLinkCommentPayload(
      { comment: `${"chữ ".repeat(600)}https://s.shopee.vn/aaa`, riskWarnings: [] },
      { platform: "FACEBOOK", products, disclosure: "Có hoa hồng." },
    );
    expect(payload.comment.length).toBeLessThanOrEqual(LINK_COMMENT_MAX);
    for (const p of products) expect(payload.comment).toContain(p.affiliateUrl);
    expect(payload.comment).toContain("Có hoa hồng.");
  });

  it("Threads: bình luận ≤ 500 ký tự (mỗi trả lời Threads như một bài — FR-14); Facebook theo LINK_COMMENT_MAX", () => {
    const long = { comment: `${"chữ ".repeat(300)}https://s.shopee.vn/aaa`, riskWarnings: [] };
    const threads = toLinkCommentPayload(long, { platform: "THREADS", products, disclosure: "Có hoa hồng." });
    expect(threads.payload.comment.length).toBeLessThanOrEqual(THREADS_POST_MAX);
    for (const p of products) expect(threads.payload.comment).toContain(p.affiliateUrl);
    expect(threads.payload.comment).toContain("Có hoa hồng.");
    expect(toLinkCommentPayload(long, { platform: "FACEBOOK", products, disclosure: null }).payload.comment.length).toBeGreaterThan(
      THREADS_POST_MAX,
    );
  });

  it("link + câu công khai quá dài: rút tên Sản phẩm; vẫn quá → lỗi riêng nói cần rút gọn link", () => {
    const longName = (n: string) => `${n} ${"rất dài ".repeat(25)}`;
    const urls = ["a", "b", "c"].map((x) => `https://shopee.vn/product/${x}?${"utm=1&".repeat(18)}`);
    const named = urls.map((affiliateUrl, i) => ({ name: longName(`Món ${i}`), affiliateUrl }));
    const { payload } = toLinkCommentPayload({ comment: "Link nè", riskWarnings: [] }, { platform: "THREADS", products: named, disclosure: null });
    expect(payload.comment.length).toBeLessThanOrEqual(THREADS_POST_MAX);
    for (const u of urls) expect(payload.comment).toContain(u);

    const huge = urls.map((u) => ({ name: "Món", affiliateUrl: `${u}${"x".repeat(300)}` }));
    expect(() =>
      toLinkCommentPayload({ comment: "Link nè", riskWarnings: [] }, { platform: "THREADS", products: huge, disclosure: null }),
    ).toThrow(LinkCommentTooLongError);
    expect(() =>
      toLinkCommentPayload({ comment: "Link nè", riskWarnings: [] }, { platform: "THREADS", products: huge, disclosure: null }),
    ).toThrow("Rút gọn Link affiliate ở Sản phẩm rồi Tạo lại.");
  });

  it("bỏ cả link không có http (tên miền trần) mà AI bịa", () => {
    const { payload } = toLinkCommentPayload(
      { comment: "Mua ở shope.ee/abc123 hoặc www.example.com nha https://s.shopee.vn/aaa", riskWarnings: [] },
      { platform: "FACEBOOK", products: products.slice(0, 1), disclosure: null },
    );
    expect(payload.comment).toBe("Mua ở hoặc nha https://s.shopee.vn/aaa");
  });
});

describe("stripUrls (FR-14, FR-15: không link trong thân bài)", () => {
  it("bỏ link có http, www. và tên miền trần; giữ chữ thường, số thập phân, email", () => {
    expect(stripUrls("Xem shope.ee/abc123 nhé")).toBe("Xem nhé");
    expect(stripUrls("Vào www.example.com hoặc s.shopee.vn/xyz ngay")).toBe("Vào hoặc ngay");
    expect(stripUrls("Có bán trên Shopee.vn đó")).toBe("Có bán trên đó");
    expect(stripUrls("Nặng 3.5kg, v.v. Hơi ồn.Co giãn tốt")).toBe("Nặng 3.5kg, v.v. Hơi ồn.Co giãn tốt");
    expect(stripUrls("Dòng 1 https://x.vn/a?b=1\nDòng 2")).toBe("Dòng 1\nDòng 2");
  });
});

describe("socialContentError (AD-14: form dùng cùng schema với server)", () => {
  it("Facebook trống / quá dài, Bình luận Threads > 500, Threads đếm sau khi bỏ khoảng trắng", () => {
    expect(socialContentError({ kind: "FACEBOOK_POST", body: "  " }, "FACEBOOK")).toBe("Bài đang trống");
    expect(socialContentError({ kind: "FACEBOOK_POST", body: "x".repeat(8001) }, "FACEBOOK")).toBe("Tối đa 8000 ký tự");
    expect(socialContentError({ kind: "LINK_COMMENT", comment: "x".repeat(501) }, "THREADS")).toBe(
      "Bình luận Threads vượt 500 ký tự",
    );
    expect(socialContentError({ kind: "LINK_COMMENT", comment: "x".repeat(501) }, "FACEBOOK")).toBeNull();
    expect(socialContentError({ kind: "LINK_COMMENT", comment: "" }, "FACEBOOK")).toBe("Bình luận đang trống");
    expect(socialContentError({ kind: "THREADS_POST", posts: [`  ${"x".repeat(500)}  `] }, "THREADS")).toBeNull();
    expect(socialContentError({ kind: "THREADS_POST", posts: ["a", "x".repeat(501)] }, "THREADS")).toBe("Bài 2 vượt 500 ký tự");
  });
});
