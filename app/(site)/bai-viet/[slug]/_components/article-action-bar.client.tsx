"use client";

import type { ReactNode } from "react";
import { ShoppingBag } from "lucide-react";
import { PRODUCTS_SECTION_ID } from "@/modules/posts/constants";

// ArticleActionBar (UX-DR27, token `article-action-bar`): dính đáy trang bài < 1024px, thay chỗ BottomTabBar
// (`data-article-action-bar`, globals.css). Trái: LikeButton (`like`) + "Sản phẩm" (cuộn tới khối Sản phẩm, tắt cuộn
// mượt khi reduced-motion; bài không có Sản phẩm thì ẩn nút); phải: ShareButtons (`share`). Màn rất hẹp (< 380px)
// "Sản phẩm" chỉ còn icon (chữ vẫn đọc được) để cả hàng vừa 360px.
export function ArticleActionBar({ hasProducts, like, share }: { hasProducts: boolean; like: ReactNode; share: ReactNode }) {
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
      <div className="mx-auto flex max-w-container-max items-center justify-between gap-space-sm px-margin py-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          {like}
          {hasProducts && (
            <button
              type="button"
              onClick={scrollToProducts}
              className="inline-flex min-h-touch-target min-w-touch-target shrink-0 items-center justify-center gap-1 rounded-full bg-surface-container-low px-3 text-label-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden />
              <span className="max-[379px]:sr-only">Sản phẩm</span>
            </button>
          )}
        </div>
        {share}
      </div>
    </nav>
  );
}
