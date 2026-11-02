// Host ảnh được phép — dùng chung cho next.config (remotePatterns) và validate form CMS.
// "*.x" = mọi subdomain của x.
export const IMAGE_HOSTS = ["down-vn.img.susercontent.com", "cf.shopee.vn", "*.supabase.co"];

export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      IMAGE_HOSTS.some((h) => (h.startsWith("*.") ? hostname.endsWith(h.slice(1)) : hostname === h))
    );
  } catch {
    return false;
  }
}
