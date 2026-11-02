import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostEditor } from "@/components/cms/post-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";

export default function EditPostPage({ params }: PageProps<"/cms/posts/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/cms/posts/[id]">, "params">) {
  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    include: { products: { orderBy: { sortOrder: "asc" } } },
  });
  if (!post) notFound();

  return (
    <PostEditor
      key={post.updatedAt.toISOString()}
      id={post.id}
      initialStatus={post.status}
      initial={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        featuredImage: post.featuredImage ?? "",
        category: post.category,
        content: post.content,
        tags: post.tags,
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
        seoKeywords: post.seoKeywords,
        products: post.products.map((p) => ({
          name: p.name,
          image: p.image ?? "",
          price: p.price ?? "",
          affiliateUrl: p.affiliateUrl,
        })),
      }}
    />
  );
}

function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
