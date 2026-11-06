import { describe, expect, it } from "vitest";
import { shareLinks } from "@/components/shared/share-links";

describe("shareLinks", () => {
  it("Facebook nhận URL canonical, Threads nhận tiêu đề + URL, đều mã hoá", () => {
    const links = shareLinks("https://meovat.vn/bai-viet/noi-chien", "Nồi chiên & mẹo");
    expect(links.facebook).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmeovat.vn%2Fbai-viet%2Fnoi-chien");
    expect(links.threads).toBe(
      "https://www.threads.com/intent/post?text=N%E1%BB%93i%20chi%C3%AAn%20%26%20m%E1%BA%B9o%20https%3A%2F%2Fmeovat.vn%2Fbai-viet%2Fnoi-chien",
    );
  });
});
