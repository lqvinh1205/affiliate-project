// Host ảnh được phép — dùng chung cho next.config (remotePatterns) và validate form CMS.
export const IMAGE_HOSTS = ["down-vn.img.susercontent.com", "cf.shopee.vn"];

// Đường dẫn của file upload (Story 2.8): `platform/storage` trả URL `/uploads/<tên>`, route
// `app/uploads/[...path]/route.ts` phục vụ. Là đường dẫn trong site nên `isAllowedImageUrl` nhận sẵn.
export const UPLOADS_PATH = "/uploads/";

const SAME_ORIGIN = "https://x.invalid";

export function isAllowedImageUrl(url: string): boolean {
  try {
    // Đường dẫn tương đối trong site: phải giữ nguyên origin ("//host", "/\t/host" là URL tới host khác) và không
    // có `?`/`#` (next/image từ chối ảnh nội bộ có query khi không khai báo `localPatterns.search`).
    if (url.startsWith("/")) return !/[?#]/.test(url) && new URL(url, SAME_ORIGIN).origin === SAME_ORIGIN;
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && IMAGE_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}
