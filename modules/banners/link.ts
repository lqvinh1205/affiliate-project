import { shopeeAffiliateUrl } from "@/platform/validation/fields";

const SAME_ORIGIN = "https://x.invalid";

// Link đích của Banner (FR-32): link Shopee chính chủ (FR-25 — render qua `AffiliateLink`, tab mới) hoặc đường dẫn
// trong site (`/…`, link thường cùng tab). Đường dẫn phải giữ nguyên origin ("//host", "/\\host" là link ra ngoài).
// Link khác → null (form báo lỗi).
export function bannerLinkKind(url: string): "shopee" | "internal" | null {
  if (url.startsWith("/")) {
    try {
      return new URL(url, SAME_ORIGIN).origin === SAME_ORIGIN ? "internal" : null;
    } catch {
      return null;
    }
  }
  return shopeeAffiliateUrl.safeParse(url).success ? "shopee" : null;
}

const POST_PATH = /^\/bai-viet\/([^/]+)\/?$/;

// Slug Bài web nếu link đích là trang bài (`/bai-viet/<slug>`, bỏ qua query/hash); không phải thì null. Trang chủ ẩn
// Banner trỏ tới bài không còn công khai, CMS hiện cảnh báo (tránh Banner dẫn người đọc tới 404).
export function bannerPostSlug(url: string): string | null {
  if (bannerLinkKind(url) !== "internal") return null;
  const match = POST_PATH.exec(new URL(url, SAME_ORIGIN).pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
