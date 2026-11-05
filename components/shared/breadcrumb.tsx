import Link from "next/link";

// Breadcrumb một cấp (UX-DR28, DESIGN.md › Breadcrumb): "Trang chủ › {Danh mục}". Ở trang Danh mục, cấp cuối là
// trang đang xem nên không là link (`href` bỏ trống); ở trang bài, Danh mục là link (`href`) vì trang đang xem là bài.
// Dùng ở trang Danh mục/Loại bài và trang bài (kể cả bản xem trước trong CMS).
export function Breadcrumb({ label, href }: { label: string; href?: string }) {
  return (
    <nav aria-label="Vị trí trang" className="text-label-sm text-on-surface-variant">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/" className="inline-flex min-h-touch-target items-center hover:text-primary">
            Trang chủ
          </Link>
        </li>
        <li aria-hidden>›</li>
        {href ? (
          <li>
            <Link href={href} className="inline-flex min-h-touch-target items-center hover:text-primary">
              {label}
            </Link>
          </li>
        ) : (
          <li aria-current="page">{label}</li>
        )}
      </ol>
    </nav>
  );
}
