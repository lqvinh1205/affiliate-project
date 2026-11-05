import Link from "next/link";
import type { PostCardData } from "@/modules/posts/types";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { ImageFallback } from "@/components/shared/image-fallback.client";

type PostCardProps = {
  post: Pick<PostCardData, "slug" | "title" | "excerpt" | "featuredImage" | "postType" | "readingMinutes">;
};

// PostCard *grid*: cả thẻ là một link tới bài. Không có ảnh thì dùng ảnh mặc định; ảnh lỗi → ImageFallback.
export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
        <ImageFallback
          src={post.featuredImage || "/placeholder.svg"}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
      </div>
      <div className="space-y-2 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PostTypeBadge postType={post.postType} />
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} phút đọc</span>
        </div>
        <h3 className="line-clamp-3 text-xl decoration-primary/40 decoration-2 underline-offset-4 group-hover:underline">
          {post.title}
        </h3>
        {post.excerpt && <p className="line-clamp-2 text-[15px] text-muted-foreground">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

// PostCard *row*: ảnh nhỏ bên trái, dùng cho cột/khối phụ.
export function PostListItem({ post }: PostCardProps) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group flex gap-4 py-4">
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-28">
        <ImageFallback src={post.featuredImage || "/placeholder.svg"} alt={post.title} fill sizes="112px" className="object-cover" />
      </div>
      <div className="min-w-0 space-y-1.5">
        <PostTypeBadge postType={post.postType} />
        <h3 className="line-clamp-3 text-base decoration-primary/40 decoration-2 underline-offset-4 group-hover:underline sm:text-lg">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground">{post.readingMinutes} phút đọc</p>
      </div>
    </Link>
  );
}
