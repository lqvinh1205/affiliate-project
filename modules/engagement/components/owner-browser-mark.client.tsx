"use client";

import { useEffect } from "react";
import { OWNER_BROWSER_KEY } from "@/modules/engagement/constants";

// Đánh dấu trình duyệt đã vào `/cms` là của Vinh: trang bài public không gửi Lượt xem từ trình duyệt này (FR-33,
// AD-23). Cùng origin nên `localStorage` dùng chung giữa CMS và site. Không hiện gì.
export function OwnerBrowserMark() {
  useEffect(() => {
    try {
      localStorage.setItem(OWNER_BROWSER_KEY, "1");
    } catch {
      // localStorage bị chặn: không đánh dấu được (trang bài cũng không gửi Lượt xem khi không đọc được).
    }
  }, []);
  return null;
}
