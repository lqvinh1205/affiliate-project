"use client";

import { useEffect, useRef } from "react";
import { recordPostView } from "@/modules/engagement/actions";
import { OWNER_BROWSER_KEY, VIEWED_POST_KEY_PREFIX } from "@/modules/engagement/constants";

function readFlag(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return undefined; // localStorage bị chặn
  }
}

// Gửi Lượt xem của bài (FR-33): một lần mỗi trình duyệt mỗi bài (chống trùng `localStorage` — AD-23); trình duyệt
// đã vào `/cms` (của Vinh) không gửi; không đọc được `localStorage` thì không gửi (không chống trùng được). Chạy lúc
// trình duyệt rảnh sau khi trang hiện để không làm chậm nội dung chính (NFR-5). Không hiện gì: site không công khai
// số Lượt xem (UX Q5).
export function PostViewTracker({ postId }: { postId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    const key = VIEWED_POST_KEY_PREFIX + postId;
    const send = () => {
      if (sent.current) return; // route hiện lại từ `<Activity>` chạy lại effect ([NX-59])
      const owner = readFlag(OWNER_BROWSER_KEY);
      const seen = readFlag(key);
      if (owner !== null || seen !== null) return;
      sent.current = true;
      void recordPostView({ postId })
        .then((res) => {
          if (res.ok) localStorage.setItem(key, "1");
        })
        .catch(() => {}); // mất mạng: bỏ qua, lần mở sau gửi lại
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(send, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(send, 1000);
    return () => window.clearTimeout(id);
  }, [postId]);

  return null;
}
