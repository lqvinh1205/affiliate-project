import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { CategoryBadge } from "@/components/site/category-badge";
import { StatusBadge } from "@/components/cms/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default function CmsHome() {
  return (
    <>
      <h1 className="mb-4 text-2xl">Bài viết</h1>
      <Suspense fallback={<ListSkeleton />}>
        <PostList />
      </Suspense>
    </>
  );
}

async function PostList() {
  await connection();
  const posts = await db.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, category: true, updatedAt: true, _count: { select: { products: true } } },
  });

  if (posts.length === 0) {
    return (
      <p className="rounded-md bg-background p-6 text-center text-muted-foreground">
        Chưa có bài nào. Bấm <Link href="/cms/new" className="font-semibold text-primary">Tạo mới</Link> để bắt đầu.
      </p>
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-background">
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/cms/posts/${p.id}`} className="flex items-center gap-3 p-4 active:bg-muted">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <CategoryBadge category={p.category} className="text-[11px]" />
              </div>
              <p className="line-clamp-2 font-semibold leading-snug">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                Sửa {formatDate(p.updatedAt)} · {p._count.products} sản phẩm
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-px overflow-hidden rounded-md border bg-background">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-2 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
