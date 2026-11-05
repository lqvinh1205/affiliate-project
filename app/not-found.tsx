import type { Metadata } from "next";
import { MAIN_CONTENT_ID } from "@/platform/site";
import { NotFoundScreen } from "@/app/(site)/_components/not-found-screen";

export const metadata: Metadata = { title: "Không tìm thấy trang", robots: { index: false } };

// 404 gốc: chỉ bắt URL không khớp route nào (không có header/footer site — AD-12).
export default function RootNotFound() {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex flex-1 items-center outline-none">
      <NotFoundScreen />
    </main>
  );
}
