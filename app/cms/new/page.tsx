import { Suspense } from "react";
import { connection } from "next/server";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { NewPostForm } from "@/components/cms/new-post-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewPostPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl">Tạo bài mới</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Nhập chủ đề, AI sẽ viết bản nháp để bạn duyệt trước khi đăng. Sản phẩm quản lý trong Kho Sản phẩm.
      </p>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewPostFormWithCategories />
      </Suspense>
    </>
  );
}

// Danh mục đọc lúc request (CMS không cache — AD-7).
async function NewPostFormWithCategories() {
  await connection();
  return <NewPostForm categories={await listCategoryOptionsForCms()} />;
}
