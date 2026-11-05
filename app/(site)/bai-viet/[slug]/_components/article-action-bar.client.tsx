"use client";

import { ShoppingBag } from "lucide-react";
import { PRODUCTS_SECTION_ID } from "@/modules/posts/constants";

// ArticleActionBar (UX-DR27, token `article-action-bar`): dính đáy trang bài < 1024px, thay chỗ BottomTabBar. Nút
// "Sản phẩm" cuộn tới khối Sản phẩm (tắt cuộn mượt khi reduced-motion); bài không có Sản phẩm thì ẩn nút — hiện chưa
// có nút nào khác (LikeButton, ShareButtons ở Epic 8) nên ẩn cả thanh và BottomTabBar hiện lại (`data-article-action-bar`).
export function ArticleActionBar({ hasProducts }: { hasProducts: boolean }) {
  if (!hasProducts) return null;
  const scrollToProducts = () => {
    const target = document.getElementById(PRODUCTS_SECTION_ID);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  };
  return (
    <nav
      aria-label="Thao tác bài viết"
      data-article-action-bar
      className="sticky-bar fixed inset-x-0 bottom-0 z-40 shadow-sticky-bottom pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-container-max items-center gap-space-sm px-margin py-space-sm">
        <button
          type="button"
          onClick={scrollToProducts}
          className="inline-flex min-h-touch-target items-center gap-space-sm rounded-full bg-surface-container-low px-space-md text-label-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden />
          Sản phẩm
        </button>
      </div>
    </nav>
  );
}
