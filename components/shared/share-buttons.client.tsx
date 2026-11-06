"use client";

import { useSyncExternalStore } from "react";
import { AtSign, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { shareLinks } from "@/components/shared/share-links";

const ROUND =
  "inline-flex size-touch-target shrink-0 items-center justify-center rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary";
const SECONDARY = `${ROUND} bg-surface-container-low text-on-surface-variant hover:text-primary`;
const PRIMARY = `${ROUND} bg-primary text-on-primary`;

// Chữ "f" của Facebook (lucide không có icon thương hiệu), nét đặc theo màu chữ.
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z" />
    </svg>
  );
}

// Chia sẻ gốc của hệ điều hành chỉ trên thiết bị cảm ứng (điện thoại, máy tính bảng) có `navigator.share`; máy tính
// để bàn dùng nút Sao chép link. Trên server và lúc hydrate coi như không có (tránh lệch HTML).
function canNativeShare() {
  return typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
}
const noSubscribe = () => () => {};

// ShareButtons (FR-37, UX-DR26): nút tròn 44px Facebook, Threads (mở trang chia sẻ ở tab mới) và nút chính nền
// `primary`: "Sao chép link" (ghi URL canonical + Toast), hoặc trên điện thoại có `navigator.share` thì mở chia sẻ gốc
// (huỷ → không làm gì). Clipboard bị chặn → Toast hướng dẫn chép tay.
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const native = useSyncExternalStore(noSubscribe, canNativeShare, () => false);
  const links = shareLinks(url, title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Đã sao chép liên kết");
    } catch {
      toast("Chưa sao chép được, bạn giữ ngón tay lên thanh địa chỉ để chép nhé");
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title, url });
    } catch (e) {
      // Người dùng huỷ → không làm gì; lỗi khác (bị chặn) → sao chép link thay.
      if (!(e instanceof DOMException && e.name === "AbortError")) await copy();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ lên Facebook" className={SECONDARY}>
        <FacebookIcon />
      </a>
      <a href={links.threads} target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ lên Threads" className={SECONDARY}>
        <AtSign className="size-5" strokeWidth={1.5} aria-hidden />
      </a>
      {native ? (
        <button type="button" onClick={shareNative} aria-label="Chia sẻ bài viết" className={PRIMARY}>
          <Share2 className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      ) : (
        <button type="button" onClick={copy} aria-label="Sao chép link" className={PRIMARY}>
          <Link2 className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </div>
  );
}
