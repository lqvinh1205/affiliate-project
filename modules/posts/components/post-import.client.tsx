"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import type { CategoryOption } from "@/modules/categories/types";
import { importPostInputSchema, type ImportPostInput, type PostDraftFormValues } from "@/modules/posts/schema";
import type { ImportedPost } from "@/modules/posts/types";
import { ImportPostForm } from "@/modules/posts/components/import-post-form.client";
import type { RewriteAction } from "@/modules/posts/components/post-ai-rewrite.client";
import { callAction } from "@/components/shared/call-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog.client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// ImportFromUrl (`/cms/bai-viet/moi`, FR-39, R-9): ô URL → `posts.importPostFromUrl` (AI đọc trang, có thể tới 90
// giây). Chưa nhập: hiện `children` (form "Tạo bản nháp" thường). Đã nhập: hiện ImportPostForm điền sẵn, chưa lưu.
// Lỗi: thông báo dưới ô URL, giữ URL và form đang có. Nhập lại khi form đang hiện → ConfirmDialog trước khi gọi.
export function PostImport({
  importPost,
  createDraft,
  rewrite,
  categories,
  children,
}: {
  importPost: (input: ImportPostInput) => Promise<Result<ImportedPost>>;
  createDraft: (input: PostDraftFormValues) => Promise<Result<{ id: string; slug: string }>>;
  rewrite: RewriteAction;
  categories: CategoryOption[];
  children: ReactNode;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<{ post: ImportedPost; key: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const fetchPost = () =>
    startTransition(async () => {
      const res = await callAction(() => importPost({ url }));
      if (!res.ok) return void setError(res.error);
      const { title, excerpt, content, imageUrls } = res;
      setImported((prev) => ({ post: { title, excerpt, content, imageUrls }, key: (prev?.key ?? 0) + 1 }));
      toast.success("Đã lấy nội dung — chưa lưu");
    });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Kiểm dạng URL trước: sai thì không gọi AI.
    const parsed = importPostInputSchema.shape.url.safeParse(url);
    if (!parsed.success) return void setError(parsed.error.issues[0].message);
    setError(null);
    if (imported) return void setConfirming(true);
    fetchPost();
  };

  return (
    <div className="space-y-space-lg">
      <form onSubmit={onSubmit} noValidate className="rounded-xl border p-space-md">
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="import-url" className="text-headline-sm">
            Nhập từ URL
          </FieldLabel>
          <FieldDescription id="import-url-hint">
            Nội dung lấy từ trang khác — hãy viết lại trước khi xuất bản.
          </FieldDescription>
          <div className="flex flex-col gap-space-sm sm:flex-row">
            <Input
              id="import-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={pending}
              aria-invalid={!!error}
              aria-describedby="import-url-hint import-url-error"
            />
            <Button type="submit" size="lg" className="shrink-0" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
              {pending ? "Đang đọc trang…" : "Lấy nội dung"}
            </Button>
          </div>
          <div id="import-url-error" aria-live="polite">
            {error && <FieldError>{error}</FieldError>}
          </div>
        </Field>
      </form>

      {imported ? (
        <ImportPostForm
          key={imported.key}
          imported={imported.post}
          categories={categories}
          createDraft={createDraft}
          rewrite={rewrite}
        />
      ) : (
        children
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Ghi đè nội dung đang soạn?"
        description="Nội dung trong form bài sẽ được thay bằng nội dung lấy từ URL mới."
        confirmLabel="Ghi đè"
        onConfirm={() => {
          setConfirming(false);
          fetchPost();
        }}
      />
    </div>
  );
}
