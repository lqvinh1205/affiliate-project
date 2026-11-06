import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_URL } from "@/platform/site";
import type { PostListPage } from "@/modules/posts/types";
import { PostCard } from "@/modules/posts/components/post-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/app/(site)/_components/json-ld";
import { Pagination } from "@/app/(site)/_components/pagination";

// Màn trang Danh mục / Loại bài (UX-DR28, UX-DR29, UX-DR64, UX-DR65): Breadcrumb một cấp, mô tả hoặc nhãn
// Loại bài, lưới PostCard, Pagination; rỗng → EmptyState với `emptyTitle`. JSON-LD `BreadcrumbList` (AD-26).
export function PostListScreen({
  title,
  description,
  badge,
  base,
  page,
  data,
  emptyTitle,
}: {
  title: string;
  emptyTitle: string;
  description: string | null;
  badge?: ReactNode;
  base: string;
  page: number;
  data: PostListPage;
}) {
  return (
    <div className="mx-auto max-w-container-max px-margin py-space-lg lg:px-margin-desktop lg:py-space-xl">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}${base}` },
          ],
        }}
      />
      <header className="mb-space-xl space-y-space-sm border-b pb-space-lg">
        <Breadcrumb label={title} />
        {badge}
        <h1 className="text-headline-lg-mobile lg:text-headline-display">
          {title}
          {page > 1 && <span className="text-on-surface-variant"> · Trang {page}</span>}
        </h1>
        {description && <p className="max-w-2xl text-body-lead text-on-surface-variant">{description}</p>}
      </header>

      {data.total === 0 ? (
        <EmptyState title={emptyTitle} description="Bài mới sẽ sớm có. Ghé Trang chủ đọc bài khác nhé.">
          <Link href="/" className={buttonVariants({ size: "lg", className: "min-h-touch-target" })}>
            Về Trang chủ
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-space-xl">
          <div className="grid gap-x-gutter-desktop gap-y-space-xl sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
          <Pagination base={base} page={page} pages={data.pages} />
        </div>
      )}
    </div>
  );
}
