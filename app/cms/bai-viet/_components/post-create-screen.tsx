import { connection } from "next/server";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { createPost, createPostDraft, importPostFromUrl, rewritePostDraft } from "@/modules/posts/actions";
import { NewPostForm } from "@/modules/posts/components/new-post-form.client";
import { PostImport } from "@/modules/posts/components/post-import.client";
import { PostScreenHeader } from "@/app/cms/bai-viet/_components/post-screen-header";

// Danh mục đọc lúc request (CMS không cache — AD-7). Khối "Nhập từ URL" (FR-39) ở đầu màn; chưa nhập thì form
// "Tạo bản nháp" thường hiện bên dưới.
export async function PostCreateScreen() {
  await connection();
  const categories = await listCategoryOptionsForCms();
  return (
    <>
      <PostScreenHeader title="Tạo Bài web" />
      <p className="mb-space-lg text-body-sm text-on-surface-variant">
        Bài mới luôn là bản nháp. Sản phẩm gắn trong trình soạn, chọn từ Kho Sản phẩm.
      </p>
      <PostImport
        importPost={importPostFromUrl}
        createDraft={createPostDraft}
        rewrite={rewritePostDraft}
        categories={categories}
      >
        <NewPostForm categories={categories} createPost={createPost} />
      </PostImport>
    </>
  );
}
