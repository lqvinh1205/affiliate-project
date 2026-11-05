import Link from "next/link";
import { MobileNav } from "@/components/site/mobile-nav";
import { NAV_LINKS } from "@/components/site/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight sm:text-xl">
          Mẹo Vặt <span className="text-primary">Cuộc Sống</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
