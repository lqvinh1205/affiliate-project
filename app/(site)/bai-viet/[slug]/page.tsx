import type { Metadata } from "next";
import { Suspense } from "react";
import { DEFAULT_OG_IMAGE } from "@/platform/site";
import { getPostBySlug, getPublishedSlugs } from "@/modules/posts/queries";
import { loadPost } from "@/app/(site)/bai-viet/[slug]/_components/load-post";
import { PostScreen } from "@/app/(site)/bai-viet/[slug]/_components/post-screen";
import { PostSkeleton } from "@/app/(site)/bai-viet/[slug]/_components/post-skeleton";

export async function generateStaticParams() {
  const posts = await getPublishedSlugs();
  return posts.map((p) => ({ slug: p.slug }));
}

// AD-26: canonical chính nó; OpenGraph lấy ảnh đại diện → ảnh Sản phẩm đầu tiên đang hiện (query lo fallback, qua
// `publicProductSelect`) → ảnh mặc định của site.
export async function generateMetadata({ params }: PageProps<"/bai-viet/[slug]">): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return {};
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  return {
    title: post.seoTitle ?? post.title,
    description,
    keywords: post.seoKeywords,
    alternates: { canonical: `/bai-viet/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/bai-viet/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: [post.featuredImage ? { url: post.featuredImage, alt: post.title } : DEFAULT_OG_IMAGE],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/bai-viet/[slug]">) {
  // Tra slug và lịch sử slug trước `<Suspense>` để 404/308 là mã HTTP thật (AD-12, AD-20).
  const post = await loadPost((await params).slug);
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostScreen post={post} />
    </Suspense>
  );
}
