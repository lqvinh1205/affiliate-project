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
