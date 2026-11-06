import { connection } from "next/server";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { createPost } from "@/modules/posts/actions";
import { NewPostForm } from "@/modules/posts/components/new-post-form.client";
import { PostScreenHeader } from "@/app/cms/bai-viet/_components/post-screen-header";

// Danh mục đọc lúc request (CMS không cache — AD-7).
export async function PostCreateScreen() {
  await connection();
  const categories = await listCategoryOptionsForCms();
  return (
    <>
      <PostScreenHeader title="Tạo Bài web" />
      <p className="mb-space-lg text-body-sm text-on-surface-variant">
        Bài mới luôn là bản nháp. Sản phẩm gắn trong trình soạn, chọn từ Kho Sản phẩm.
      </p>
      <NewPostForm categories={categories} createPost={createPost} />
    </>
  );
}
