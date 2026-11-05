import Link from "next/link";
import type { NavCategory } from "@/modules/posts/types";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { BIO_PATH, POST_TYPE_LINKS } from "@/app/(site)/_components/site-nav";

const FOOTER_LINK = "inline-flex min-h-touch-target items-center text-body-sm text-on-surface-variant hover:text-primary";

// SiteFooter (UX-DR14): tên + giới thiệu, link Danh mục, link `/bio`, AffiliateDisclosure dạng chữ, ©.
// Mobile chừa đáy cho BottomTabBar.
export function SiteFooter({ categories }: { categories: NavCategory[] }) {
  return (
    <footer className="mt-space-xl bg-surface-container-low pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto grid max-w-container-max gap-space-lg px-margin py-space-xl lg:grid-cols-[2fr_1fr_1fr] lg:px-margin-desktop">
        <div className="space-y-space-sm">
          <p className="text-headline-sm">
            Mẹo Vặt <span className="text-primary">Cuộc Sống</span>
          </p>
          <p className="max-w-md text-body-sm text-on-surface-variant">
            Mẹo hay cho nhà cửa, bếp núc, làm đẹp và những món đồ xinh giá tốt được chọn lọc mỗi ngày.
          </p>
          <AffiliateDisclosure variant="text" />
        </div>
        <nav aria-label="Danh mục">
          <p className="text-label-meta uppercase text-on-surface-variant">Danh mục</p>
          <ul className="grid grid-cols-2 gap-x-space-md lg:grid-cols-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className={FOOTER_LINK}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Khám phá">
          <p className="text-label-meta uppercase text-on-surface-variant">Khám phá</p>
          <ul>
            {POST_TYPE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={FOOTER_LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={BIO_PATH} prefetch={false} className={FOOTER_LINK}>
                Đồ hay
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-container-max border-t px-margin py-space-md text-label-sm text-on-surface-variant lg:px-margin-desktop">
        © Mẹo Vặt Cuộc Sống
      </p>
    </footer>
  );
}
