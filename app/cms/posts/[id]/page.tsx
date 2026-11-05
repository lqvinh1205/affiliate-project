import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostEditor } from "@/components/cms/post-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/platform/db";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";

export default function EditPostPage({ params }: PageProps<"/cms/posts/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/cms/posts/[id]">, "params">) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    db.post.findUnique({
      where: { id },
      include: {
        postProducts: {
          orderBy: { sortOrder: "asc" },
          select: { product: { select: { id: true, name: true, hidden: true } } },
        },
      },
    }),
    listCategoryOptionsForCms(),
  ]);
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
        category: post.postType,
        categoryId: post.categoryId ?? "",
        content: post.content,
        tags: post.tags,
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
        seoKeywords: post.seoKeywords,
      }}
      products={post.postProducts.map(({ product }) => product)}
      categories={categories}
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
