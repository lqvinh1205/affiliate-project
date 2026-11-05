import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_OG_IMAGE, MAIN_CONTENT_ID, SITE_NAME, SITE_URL } from "@/platform/site";
import "./globals.css";

const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

// Nền SEO toàn site (NFR-8, AD-26): title template, OpenGraph mặc định kèm ảnh; trang con tự đặt canonical.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Mẹo hay & đồ đẹp mỗi ngày`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Mẹo vặt nhà cửa, bếp núc, làm đẹp và tổng hợp đồ xinh giá tốt được chọn lọc kỹ.",
  openGraph: { siteName: SITE_NAME, locale: "vi_VN", type: "website", images: [DEFAULT_OG_IMAGE] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* UX-DR87: link đầu trang, chỉ hiện khi focus bằng bàn phím. */}
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="sr-only z-50 rounded-lg bg-primary px-space-md py-space-sm text-label-md text-on-primary focus:not-sr-only focus:fixed focus:top-space-sm focus:left-space-sm"
        >
          Bỏ qua tới nội dung
        </a>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
