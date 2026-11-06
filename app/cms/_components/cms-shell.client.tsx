"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { ExternalLink, Menu } from "lucide-react";
import { MAIN_CONTENT_ID } from "@/platform/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/components/ui/lib/utils";

type NavItem = { label: string; href: string; match: (pathname: string) => boolean };

// Thứ tự theo IA CMS (EXPERIENCE.md › CMS); chỉ khai báo mục đã có màn. Mục sau thêm đúng chỗ:
// Bài web, Sản phẩm, Cảm hứng, Danh mục, Banner, Trang bio, Hồ sơ phong cách, Styleguide.
const NAV_ITEMS: NavItem[] = [
  { label: "Bài web", href: "/cms/bai-viet", match: (p) => p === "/cms/bai-viet" || p.startsWith("/cms/bai-viet/") },
  { label: "Sản phẩm", href: "/cms/san-pham", match: (p) => p === "/cms/san-pham" || p.startsWith("/cms/san-pham/") },
  { label: "Danh mục", href: "/cms/danh-muc", match: (p) => p === "/cms/danh-muc" || p.startsWith("/cms/danh-muc/") },
  { label: "Hồ sơ phong cách", href: "/cms/phong-cach", match: (p) => p.startsWith("/cms/phong-cach") },
  { label: "Styleguide", href: "/cms/styleguide", match: (p) => p.startsWith("/cms/styleguide") },
];

const BRAND = "CMS · Mẹo Vặt";

function ActivePathname({ children }: { children: (pathname: string) => ReactNode }) {
  return children(usePathname());
}

// usePathname() là dữ liệu runtime → bọc Suspense; fallback là bản chưa đánh dấu mục đang mở.
function WithPathname({ children }: { children: (pathname: string) => ReactNode }) {
  return (
    <Suspense fallback={children("")}>
      <ActivePathname>{children}</ActivePathname>
    </Suspense>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Điều hướng CMS">
      <ul className="space-y-1 text-label-md">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-touch-target items-center rounded-lg px-3 transition-colors motion-reduce:transition-none",
                  active
                    // Chữ on-surface (primary trên nền này chỉ 4.02:1 ở dark); vạch primary + đậm 600 báo mục đang mở.
                    ? "bg-surface-container-high font-semibold text-on-surface shadow-[inset_3px_0_0_var(--primary)]"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ViewSiteLink() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener"
      className="flex min-h-touch-target items-center gap-2 rounded-lg px-3 text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    >
      Xem site
      <span className="sr-only">(mở tab mới)</span>
      <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
    </a>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-lg" aria-label="Mở menu" className="size-touch-target!" />}
      >
        <Menu strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent side="left" className="p-space-md shadow-level-1!">
        <SheetTitle className="px-3 pt-2">
          <span className="text-headline-sm">{BRAND}</span>
        </SheetTitle>
        <WithPathname>{(pathname) => <NavList pathname={pathname} onNavigate={() => setOpen(false)} />}</WithPathname>
        <div className="mt-auto">
          <ViewSiteLink />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function currentLabel(pathname: string) {
  return NAV_ITEMS.find((item) => item.match(pathname))?.label ?? "CMS";
}

// Khung CMS (UX-DR38): < 1024px thanh trên dính + Sheet trái; ≥ 1024px sidebar cố định.
export function CmsShell({ children }: { children: ReactNode }) {
  return (
    <div data-cms-shell className="min-h-dvh bg-surface lg:flex">
      <aside aria-label="Thanh bên CMS" className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-space-md border-r bg-surface-container-low p-space-md lg:flex">
        <p className="px-3 pt-2 text-headline-sm">{BRAND}</p>
        <WithPathname>{(pathname) => <NavList pathname={pathname} />}</WithPathname>
        <div className="mt-auto">
          <ViewSiteLink />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky-bar sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-2 shadow-sticky-top lg:hidden">
          <MobileMenu />
          <p className="truncate text-headline-sm">
            <WithPathname>{currentLabel}</WithPathname>
          </p>
        </header>
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-2xl px-margin pb-space-xl pt-space-md outline-none lg:pt-space-xl"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
