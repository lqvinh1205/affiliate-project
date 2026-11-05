import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/app/(site)/_components/site-header";

// Toàn bộ trang public phải tĩnh hoàn toàn (tốt cho SEO); URL chưa prerender sẽ chờ
// bản tĩnh thay vì stream shell trước → notFound() trả đúng mã 404.
export const ensureStatic = "navigation";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
