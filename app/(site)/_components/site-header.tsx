import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import type { NavCategory } from "@/modules/posts/types";
import {
  BIO_PATH,
  DESKTOP_NAV_CATEGORIES,
  POST_TYPE_LINKS,
  SEARCH_PATH,
} from "@/app/(site)/_components/site-nav";
import { MoreMenu } from "@/app/(site)/_components/more-menu.client";
import { SiteLogoText } from "@/app/(site)/_components/site-logo-text";

const NAV_LINK = "inline-flex min-h-touch-target items-center rounded-lg px-2 text-label-md hover:text-primary";

// SiteHeader (UX-DR11, UX-DR93): logo chữ + dòng phụ, nút tìm. ≥ 1024px thêm nav ngang (Mẹo vặt, Gom link,
// Danh mục theo thứ tự; phần dư gom vào "Thêm") và nút "Đồ hay".
export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const inline = categories.slice(0, DESKTOP_NAV_CATEGORIES);
  const more = categories.slice(DESKTOP_NAV_CATEGORIES);
  return (
    <header className="sticky-bar sticky top-0 z-40 shadow-sticky-top">
      <div className="mx-auto flex h-16 max-w-container-max items-center justify-between gap-space-md px-margin lg:px-margin-desktop">
        <Link href="/" className="flex min-h-touch-target shrink-0 flex-col justify-center">
          <span className="text-headline-sm">
            <SiteLogoText />
          </span>
          <span className="text-label-meta text-on-surface-variant">Tạp chí tổ ấm nhỏ</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center gap-space-xs lg:flex">
          {POST_TYPE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={NAV_LINK}>
              {l.label}
            </Link>
          ))}
          {inline.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className={NAV_LINK}>
              {c.name}
            </Link>
          ))}
          {more.length > 0 && (
            // `usePathname` treo ở trang có tham số chưa prerender: fallback là nhãn tĩnh.
            <Suspense fallback={<span className={NAV_LINK}>Thêm</span>}>
              <MoreMenu categories={more} linkClassName={NAV_LINK} />
            </Suspense>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-space-sm">
          <Link
            href={SEARCH_PATH}
            prefetch={false}
            aria-label="Tìm kiếm"
            className="inline-flex size-touch-target items-center justify-center rounded-full hover:bg-surface-container"
          >
            <Search className="size-5" strokeWidth={1.5} aria-hidden />
          </Link>
          <Link
            href={BIO_PATH}
            prefetch={false}
            className="hidden min-h-touch-target items-center rounded-full bg-primary-fixed px-4 text-label-md text-on-primary-fixed lg:inline-flex"
          >
            Đồ hay
          </Link>
        </div>
      </div>
    </header>
  );
}
