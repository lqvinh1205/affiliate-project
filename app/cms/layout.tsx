import type { Metadata } from "next";
import Link from "next/link";
import { CmsBottomNav } from "@/components/cms/bottom-nav";

export const metadata: Metadata = {
  title: "CMS",
  robots: { index: false, follow: false },
};

// Gọi AI có thể mất 20–40 giây; AD-18 đặt trần 120 giây cho route kích hoạt AI.
export const maxDuration = 120;

export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  return (
    <div className="min-h-dvh bg-muted/50">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/cms" className="font-heading font-bold">
            CMS · <span className="text-primary">Mẹo Vặt</span>
          </Link>
          <Link href="/" target="_blank" className="text-sm text-muted-foreground hover:text-primary">
            Xem site ↗
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>
      <CmsBottomNav />
    </div>
  );
}
