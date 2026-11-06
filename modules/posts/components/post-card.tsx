import Link from "next/link";
import { formatDate } from "@/platform/format";
import { highlightParts } from "@/platform/search-text";
import type { PostCardData } from "@/modules/posts/types";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { ImageFallback } from "@/components/shared/image-fallback.client";

type CardPost = Pick<
  PostCardData,
  "slug" | "title" | "excerpt" | "featuredImage" | "postType" | "readingMinutes" | "publishedAt"
>;

type PostCardProps = {
  post: CardPost;
  variant?: "featured" | "grid" | "row" | "rank";
  headingLevel?: "h2" | "h3";
  // Ảnh trong khung nhìn đầu tiên (Bài nổi bật): tải sớm cho LCP.
  preload?: boolean;
  // *rank*: thứ hạng 1–5 (hiện "01"–"05", chỉ trang trí — danh sách là `<ol>`).
  rank?: number;
  // Từ khoá đã gấp không dấu (tìm kiếm): tô các đoạn tiêu đề khớp (SearchResultItem — UX-DR32).
  highlight?: string[];
};

// Tiêu đề, tô nền `primary-fixed` các đoạn khớp từ khoá (khớp không dấu — FR-36).
function TitleText({ title, highlight }: { title: string; highlight?: string[] }) {
  if (!highlight?.length) return title;
  return highlightParts(title, highlight).map((part, i) =>
    part.match ? (
      <mark key={i} className="rounded-sm bg-primary-fixed text-on-primary-fixed">
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}

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
// *featured*: Bài nổi bật Trang chủ (badge trên ảnh, tiêu đề lớn; thẻ rộng: ảnh 7 cột + chữ 5 cột);
// *grid*: lưới; *row*: thumbnail trái 80px; *rank*: số `01`–`05` (`headline-lg`, `outline-variant`, `aria-hidden`) +
// tiêu đề + ngày · phút đọc, không ảnh — khu "Xem nhiều" (UX-DR16, UX-DR90).
export function PostCard({ post, variant = "grid", headingLevel = "h3", preload = false, rank, highlight }: PostCardProps) {
  const Title = headingLevel;
  const href = `/bai-viet/${post.slug}`;

  if (variant === "rank") {
    return (
      <Link href={href} className="group flex items-start gap-space-md py-space-md outline-offset-2">
        <span aria-hidden className="w-10 shrink-0 text-headline-lg text-outline-variant tabular-nums">
          {String(rank ?? 0).padStart(2, "0")}
        </span>
        <div className="flex min-w-0 flex-col gap-space-xs">
          <PostTypeBadge postType={post.postType} className="self-start" />
          <Title className={`line-clamp-3 text-headline-sm ${TITLE_HOVER}`}>{post.title}</Title>
          <Meta post={post} />
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link href={href} className="group flex gap-space-md py-space-md outline-offset-2">
        <span className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
          <ImageFallback src={post.featuredImage} alt="" fill sizes="80px" className={IMAGE_HOVER} />
        </span>
        <div className="flex min-w-0 flex-col gap-space-xs">
          <PostTypeBadge postType={post.postType} className="self-start" />
          <Title className={`line-clamp-3 text-headline-sm ${TITLE_HOVER}`}>
            <TitleText title={post.title} highlight={highlight} />
          </Title>
          <Meta post={post} />
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    // Ảnh và chữ đứng cạnh nhau (ảnh 7 cột + chữ 5 cột) khi thẻ rộng ≥ 48rem; hẹp hơn (mobile, hoặc cột 7/12 cạnh
    // "Xem nhiều" trên desktop) thì xếp dọc — theo bề rộng khung chứa, không theo màn hình.
    return (
      <div className="@container">
        <Link
          href={href}
          className="group grid overflow-hidden rounded-xl bg-surface-container-lowest outline-offset-2 @3xl:grid-cols-12 @3xl:items-center"
        >
          <span className="relative block aspect-video overflow-hidden bg-surface-container @3xl:col-span-7">
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
          <div className="flex flex-col gap-space-sm p-space-md @3xl:col-span-5 @3xl:p-space-lg">
            <Title className={`text-headline-lg-mobile lg:text-headline-display ${TITLE_HOVER}`}>{post.title}</Title>
            {post.excerpt && <span className="line-clamp-3 text-body-regular text-on-surface-variant">{post.excerpt}</span>}
            <Meta post={post} />
          </div>
        </Link>
      </div>
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
