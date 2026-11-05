// Host ảnh được phép — dùng chung cho next.config (remotePatterns) và validate form CMS.
export const IMAGE_HOSTS = ["down-vn.img.susercontent.com", "cf.shopee.vn"];

const SAME_ORIGIN = "https://x.invalid";

export function isAllowedImageUrl(url: string): boolean {
  try {
    // Đường dẫn tương đối trong site: phải giữ nguyên origin ("//host", "/\t/host" là URL tới host khác).
    if (url.startsWith("/")) return new URL(url, SAME_ORIGIN).origin === SAME_ORIGIN;
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && IMAGE_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}
