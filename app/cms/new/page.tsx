import { NewPostForm } from "@/components/cms/new-post-form";

export default function NewPostPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl">Tạo bài mới</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Nhập sản phẩm kèm link affiliate, AI sẽ viết bản nháp để bạn duyệt trước khi đăng.
      </p>
      <NewPostForm />
    </>
  );
}
