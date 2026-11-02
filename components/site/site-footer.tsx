import Link from "next/link";
import { NAV_LINKS } from "./nav-links";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <p className="font-heading text-lg font-bold">
            Mẹo Vặt <span className="text-primary">Cuộc Sống</span>
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Mẹo hay cho nhà cửa, bếp núc, làm đẹp và những món đồ xinh giá tốt được
            chọn lọc mỗi ngày. Một số liên kết trên trang là link tiếp thị liên kết.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
