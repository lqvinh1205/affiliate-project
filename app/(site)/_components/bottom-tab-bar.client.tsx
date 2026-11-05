"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, Lightbulb, ShoppingBag, Tag, type LucideIcon } from "lucide-react";
import type { NavCategory } from "@/modules/posts/types";
import { POST_TYPES } from "@/modules/posts/constants";
import { BIO_PATH } from "@/app/(site)/_components/site-nav";
import { CategorySheet } from "@/app/(site)/_components/category-sheet.client";

type TabKey = "home" | "meo-vat" | "gom-link" | "danh-muc" | "bio";

// Tab khớp đoạn đầu của đường dẫn, kể cả `/…/trang/n`; trang Danh mục chọn tab "Danh mục".
export function activeTab(pathname: string, categories: NavCategory[]): TabKey | null {
  const first = pathname.split("/")[1] ?? "";
  if (first === "") return "home";
  if (first === POST_TYPES.MEO_VAT.slug) return "meo-vat";
  if (first === POST_TYPES.GOM_LINK.slug) return "gom-link";
  if (`/${first}` === BIO_PATH) return "bio";
  if (categories.some((c) => c.slug === first)) return "danh-muc";
  return null;
}

const TAB = "flex min-h-touch-target w-full flex-col items-center justify-center gap-0.5 whitespace-nowrap py-1 text-label-meta";

// Ghép chuỗi thường, không qua `cn`: tailwind-merge coi `text-label-meta` và `text-primary` cùng nhóm, bỏ mất cỡ chữ.
function tabClass(active: boolean) {
  return `${TAB} ${active ? "font-semibold text-primary" : "text-on-surface-variant"}`;
}

function TabLink({ href, label, Icon, active }: { href: string; label: string; Icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      prefetch={href === BIO_PATH ? false : undefined}
      aria-current={active ? "page" : undefined}
      className={tabClass(active)}
    >
      <Icon className="size-6" strokeWidth={1.5} aria-hidden />
      {label}
    </Link>
  );
}

// Thân thanh tab; `active` null khi chưa biết đường dẫn (fallback trong <Suspense>).
export function BottomTabBarView({ categories, active }: { categories: NavCategory[]; active: TabKey | null }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      data-bottom-tab-bar
      className="sticky-bar fixed inset-x-0 bottom-0 z-40 shadow-sticky-bottom pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-container-max grid-cols-5">
        <li>
          <TabLink href="/" label="Tạp chí" Icon={House} active={active === "home"} />
        </li>
        <li>
          <TabLink href={`/${POST_TYPES.MEO_VAT.slug}`} label="Mẹo vặt" Icon={Lightbulb} active={active === "meo-vat"} />
        </li>
        <li>
          <TabLink href={`/${POST_TYPES.GOM_LINK.slug}`} label="Gom link" Icon={Tag} active={active === "gom-link"} />
        </li>
        <li>
          <CategorySheet
            categories={categories}
            // Nút mở hộp thoại, không phải link: không `aria-current`; đang ở trang Danh mục chỉ đổi kiểu chữ.
            trigger={(open) => (
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                className={tabClass(active === "danh-muc")}
              >
                <LayoutGrid className="size-6" strokeWidth={1.5} aria-hidden />
                Danh mục
              </button>
            )}
          />
        </li>
        <li>
          <TabLink href={BIO_PATH} label="Đồ hay" Icon={ShoppingBag} active={active === "bio"} />
        </li>
      </ul>
    </nav>
  );
}

// BottomTabBar (UX-DR12): < 1024px, 5 tab. Trang bài có ArticleActionBar thì thanh đó thay chỗ: CSS ẩn BottomTabBar
// khi trang có `[data-article-action-bar]` (globals.css) — bài không có Sản phẩm vẫn còn BottomTabBar.
export function BottomTabBar({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  return <BottomTabBarView categories={categories} active={activeTab(pathname, categories)} />;
}
