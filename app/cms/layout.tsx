import type { Metadata } from "next";
import { OwnerBrowserMark } from "@/modules/engagement/components/owner-browser-mark.client";
import { Toaster } from "@/components/ui/sonner";
import { CmsShell } from "@/app/cms/_components/cms-shell.client";

export const metadata: Metadata = {
  title: "CMS",
  robots: { index: false, follow: false },
};

// Gọi AI có thể mất 20–40 giây; AD-18 đặt trần 120 giây cho route kích hoạt AI.
export const maxDuration = 120;

// `OwnerBrowserMark`: trình duyệt đã vào CMS không gửi Lượt xem trên site (FR-33, AD-23). Toast CMS ở đỉnh màn
// (site đặt Toast riêng ở đáy — UX-DR36).
export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  return (
    <>
      <OwnerBrowserMark />
      <CmsShell>{children}</CmsShell>
      <Toaster position="top-center" />
    </>
  );
}
