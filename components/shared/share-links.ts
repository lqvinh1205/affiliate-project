// Đường dẫn chia sẻ bài (FR-37, UX-DR26) — hàm thuần để test; `ShareButtons` chỉ gọi. `url` là URL canonical.
export function shareLinks(url: string, title: string) {
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    threads: `https://www.threads.com/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`,
  };
}
