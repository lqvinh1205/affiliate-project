import { Suspense } from "react";
import { MAIN_CONTENT_ID } from "@/platform/site";
import { listNavCategories } from "@/modules/posts/queries";
import { BottomTabBar, BottomTabBarView } from "@/app/(site)/_components/bottom-tab-bar.client";
import { SiteFooter } from "@/app/(site)/_components/site-footer";
import { SiteHeader } from "@/app/(site)/_components/site-header";

// Toàn bộ trang public phải tĩnh hoàn toàn (tốt cho SEO); URL chưa prerender sẽ chờ
// bản tĩnh thay vì stream shell trước → notFound() trả đúng mã 404.
export const ensureStatic = "navigation";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const categories = await listNavCategories();
  return (
    <>
      <SiteHeader categories={categories} />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter categories={categories} />
      {/* `usePathname` treo ở trang có tham số chưa prerender: fallback là thanh tab chưa chọn mục nào. */}
      <Suspense fallback={<BottomTabBarView categories={categories} active={null} />}>
        <BottomTabBar categories={categories} />
      </Suspense>
    </>
  );
}
