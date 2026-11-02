import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "./category-badge";
import type { CategoryKey } from "@/lib/categories";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  category: CategoryKey;
  readingMinutes: number;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
        <Image
          src={post.featuredImage || "/placeholder.svg"}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
      </div>
      <div className="space-y-2 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CategoryBadge category={post.category} />
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} phút đọc</span>
        </div>
        <h3 className="line-clamp-3 text-xl decoration-primary/40 decoration-2 underline-offset-4 group-hover:underline">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-2 text-[15px] text-muted-foreground">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

// Dạng danh sách ngang: ảnh nhỏ bên trái, dùng cho cột/khối phụ.
export function PostListItem({ post }: { post: PostCardData }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group flex gap-4 py-4">
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-28">
        <Image
          src={post.featuredImage || "/placeholder.svg"}
          alt={post.title}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 space-y-1.5">
        <CategoryBadge category={post.category} />
        <h3 className="line-clamp-3 text-base decoration-primary/40 decoration-2 underline-offset-4 group-hover:underline sm:text-lg">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground">{post.readingMinutes} phút đọc</p>
      </div>
    </Link>
  );
}
