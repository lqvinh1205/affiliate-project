import Link from "next/link";
import { formatDate } from "@/platform/format";
import type { PostCardData } from "@/modules/posts/types";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { ImageFallback } from "@/components/shared/image-fallback.client";

type CardPost = Pick<
  PostCardData,
  "slug" | "title" | "excerpt" | "featuredImage" | "postType" | "readingMinutes" | "publishedAt"
>;

type PostCardProps = {
  post: CardPost;
  variant?: "featured" | "grid" | "row";
  headingLevel?: "h2" | "h3";
  // Ảnh trong khung nhìn đầu tiên (Bài nổi bật): tải sớm cho LCP.
  preload?: boolean;
};

function Meta({ post }: { post: CardPost }) {
  return (
    <span className="block text-label-meta text-on-surface-variant">
      {post.publishedAt && (
        <>
          <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden> · </span>
        </>
      )}
      {post.readingMinutes} phút đọc
    </span>
  );
}

// Ghép chuỗi thường với lớp `text-headline-*`, không qua `cn` ([NO-25]: tailwind-merge bỏ mất cỡ chữ token).
const TITLE_HOVER = "decoration-primary/40 decoration-2 underline-offset-4 group-hover:text-primary group-hover:underline";
const IMAGE_HOVER = "object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100";

// PostCard (UX-DR16, token `post-card`): cả thẻ là một link tới bài; PostTypeBadge, tiêu đề, tóm tắt (featured/grid),
// ngày · phút đọc; không Lượt xem/Lượt tim/tác giả. Ảnh 16:9, không có ảnh hoặc ảnh lỗi → ImageFallback.
// *featured*: Bài nổi bật Trang chủ (badge trên ảnh, tiêu đề lớn; desktop ảnh 7 cột + chữ 5 cột);
// *grid*: lưới; *row*: thumbnail trái 80px.
export function PostCard({ post, variant = "grid", headingLevel = "h3", preload = false }: PostCardProps) {
  const Title = headingLevel;
  const href = `/bai-viet/${post.slug}`;

  if (variant === "row") {
    return (
      <Link href={href} className="group flex gap-space-md py-space-md outline-offset-2">
        <span className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
          <ImageFallback src={post.featuredImage} alt="" fill sizes="80px" className={IMAGE_HOVER} />
        </span>
        <div className="flex min-w-0 flex-col gap-space-xs">
          <PostTypeBadge postType={post.postType} className="self-start" />
          <Title className={`line-clamp-3 text-headline-sm ${TITLE_HOVER}`}>{post.title}</Title>
          <Meta post={post} />
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={href}
        className="group grid overflow-hidden rounded-xl bg-surface-container-lowest outline-offset-2 lg:grid-cols-12 lg:items-center"
      >
        <span className="relative block aspect-video overflow-hidden bg-surface-container lg:col-span-7">
          <ImageFallback
            src={post.featuredImage}
            alt=""
            fill
            preload={preload}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className={IMAGE_HOVER}
          />
          <PostTypeBadge postType={post.postType} className="absolute top-space-md left-space-md" />
        </span>
        <div className="flex flex-col gap-space-sm p-space-md lg:col-span-5 lg:p-space-lg">
          <Title className={`text-headline-lg-mobile lg:text-headline-display ${TITLE_HOVER}`}>{post.title}</Title>
          {post.excerpt && <span className="line-clamp-3 text-body-regular text-on-surface-variant">{post.excerpt}</span>}
          <Meta post={post} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest outline-offset-2">
      <span className="relative block aspect-video overflow-hidden bg-surface-container">
        <ImageFallback
          src={post.featuredImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={IMAGE_HOVER}
        />
      </span>
      <div className="flex flex-1 flex-col gap-space-sm p-space-md">
        <PostTypeBadge postType={post.postType} className="self-start" />
        <Title className={`line-clamp-3 text-headline-md ${TITLE_HOVER}`}>{post.title}</Title>
        {post.excerpt && <span className="line-clamp-2 text-body-regular text-on-surface-variant">{post.excerpt}</span>}
        <span className="mt-auto">
          <Meta post={post} />
        </span>
      </div>
    </Link>
  );
}
