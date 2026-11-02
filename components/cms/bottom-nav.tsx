"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// usePathname() là dữ liệu runtime → bọc Suspense, fallback là thanh nav chưa đánh dấu mục đang mở.
export function CmsBottomNav() {
  return (
    <Suspense fallback={<Nav pathname="" />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

function Nav({ pathname }: { pathname: string }) {
  const item = (active: boolean) =>
    cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium", active ? "text-primary" : "text-muted-foreground");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center">
        <Link href="/cms" className={item(pathname === "/cms" || pathname.startsWith("/cms/posts"))}>
          <FileText className="size-5" />
          Bài viết
        </Link>
        <Link href="/cms/new" className={item(pathname === "/cms/new")}>
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Plus className="size-5" />
          </span>
          Tạo mới
        </Link>
      </div>
    </nav>
  );
}
