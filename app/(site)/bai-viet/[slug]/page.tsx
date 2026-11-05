import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedSlugs } from "@/modules/posts/queries";
import { PostScreen } from "@/app/(site)/bai-viet/[slug]/_components/post-screen";
import { PostSkeleton } from "@/app/(site)/bai-viet/[slug]/_components/post-skeleton";

export async function generateStaticParams() {
  const posts = await getPublishedSlugs();
  return posts.map((p) => ({ slug: p.slug }));
}

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
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/bai-viet/[slug]">) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostScreen post={post} />
    </Suspense>
  );
}
