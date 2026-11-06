import { TriangleAlert } from "lucide-react";

// Cảnh báo trong CMS khi link đích là một Bài web không còn công khai: Banner bị ẩn khỏi Trang chủ (tránh dẫn người đọc
// tới 404) cho tới khi bài xuất bản lại hoặc đổi link.
export function BannerTargetWarning() {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-tertiary-fixed px-space-sm py-2 text-body-sm text-on-tertiary-fixed">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>Bài đích chưa xuất bản hoặc đã bị xoá, nên Banner đang ẩn trên Trang chủ. Xuất bản lại bài hoặc đổi link đích.</span>
    </p>
  );
}
