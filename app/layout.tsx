import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME, SITE_URL } from "@/platform/site";
import "./globals.css";

const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Mẹo hay & đồ đẹp mỗi ngày`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Mẹo vặt nhà cửa, bếp núc, làm đẹp và tổng hợp đồ xinh giá tốt được chọn lọc kỹ.",
  openGraph: { siteName: SITE_NAME, locale: "vi_VN", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
