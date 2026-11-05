import Link from "next/link";

// Breadcrumb một cấp (DESIGN.md › Breadcrumb): "Trang chủ › {Danh mục}", cấp cuối không là link.
export function Breadcrumb({ label }: { label: string }) {
  return (
    <nav aria-label="Vị trí trang" className="text-label-sm text-on-surface-variant">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/" className="inline-flex min-h-touch-target items-center hover:text-primary">
            Trang chủ
          </Link>
        </li>
        <li aria-hidden>›</li>
        <li aria-current="page">{label}</li>
      </ol>
    </nav>
  );
}
