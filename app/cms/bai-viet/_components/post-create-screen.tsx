import { connection } from "next/server";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { NewPostForm } from "@/modules/posts/components/new-post-form.client";
import { createPost } from "@/app/cms/actions";
import { PostScreenHeader } from "@/app/cms/bai-viet/_components/post-screen-header";

// Danh mục đọc lúc request (CMS không cache — AD-7).
export async function PostCreateScreen() {
  await connection();
  const categories = await listCategoryOptionsForCms();
  return (
    <>
      <PostScreenHeader title="Tạo Bài web" />
      <p className="mb-space-lg text-body-sm text-on-surface-variant">
        Nhập chủ đề, AI viết bản nháp để bạn duyệt trước khi đăng. Sản phẩm gắn trong trình soạn, chọn từ Kho Sản phẩm.
      </p>
      <NewPostForm categories={categories} createPost={createPost} />
    </>
  );
}
