"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import type { CategoryOption } from "@/modules/categories/types";
import { CategorySelect } from "@/modules/categories/components/category-select";
import { POST_EXCERPT_MAX, POST_TITLE_TARGET } from "@/modules/posts/constants";
import { postDraftInputSchema, type PostDraftFormValues } from "@/modules/posts/schema";
import type { ImportedPost } from "@/modules/posts/types";
import { PostBodyEditor } from "@/modules/posts/components/post-body-editor.client";
import { PostTypePicker } from "@/modules/posts/components/post-type-picker.client";
import { RiskWarningList } from "@/modules/posts/components/risk-warning-list.client";
import { PostAiRewrite, usePostRewrite, type RewriteAction } from "@/modules/posts/components/post-ai-rewrite.client";
import { CmsForm } from "@/components/shared/cms-form.client";
import { CopyButton } from "@/components/shared/copy-button.client";
import { UploadField } from "@/components/shared/upload-field.client";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const BLANK: PostDraftFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  featuredImage: "",
  postType: "MEO_VAT",
  categoryId: "",
  content: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

// Form bài từ nội dung nhập (`/cms/bai-viet/moi`, FR-39): Loại bài, Danh mục, tiêu đề, tóm tắt, ảnh đại diện, thân bài;
// thẻ, SEO, Sản phẩm thêm ở trình soạn sau khi lưu. Nội dung nhập điền vào form ngay khi mount như sửa tay
// (`shouldDirty`) để UnsavedChangesGuard bật; chưa ghi DB cho tới "Lưu nháp" (`posts.createPostDraft`) — xong chuyển sang
// trình soạn. Khối "Ảnh trong bài gốc": link + nút copy, không tự tải ảnh, không gán ảnh đại diện. "AI chỉnh sửa"
// (FR-40) như trình soạn.
export function ImportPostForm({
  imported,
  categories,
  createDraft,
  rewrite: rewriteAction,
}: {
  imported: ImportedPost;
  categories: CategoryOption[];
  createDraft: (input: PostDraftFormValues) => Promise<Result<{ id: string; slug: string }>>;
  rewrite: RewriteAction;
}) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(postDraftInputSchema),
    defaultValues: { ...BLANK, title: imported.title, excerpt: imported.excerpt, content: imported.content },
  });
  const [uploading, setUploading] = useState(0);
  const rewrite = usePostRewrite(form);

  // Form mount với nội dung nhập làm giá trị (PostEditor đọc được ngay), rồi lấy form trống làm mốc "sạch": form
  // dirty như sửa tay, UnsavedChangesGuard bật. Nhập lại thì PostImport mount form mới (`key`).
  useEffect(() => {
    form.reset(BLANK, { keepValues: true });
  }, [form]);

  return (
    <CmsForm
      form={form}
      action={createDraft}
      submitLabel="Lưu nháp"
      successMessage="Đã tạo bản nháp"
      busyLabel={uploading > 0 ? "Đang tải ảnh…" : null}
      onSaved={(res) => router.push(`/cms/bai-viet/${res.id}`)}
    >
      <Controller
        name="postType"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel id="import-post-type-label">Loại bài</FieldLabel>
            <PostTypePicker value={field.value} onChange={field.onChange} labelledBy="import-post-type-label" />
          </Field>
        )}
      />
      <Controller
        name="categoryId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="import-post-category">Danh mục</FieldLabel>
            <CategorySelect id="import-post-category" options={categories} aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="title"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="import-post-title">
              Tiêu đề
              <span className={field.value.length > POST_TITLE_TARGET ? "text-destructive" : "text-on-surface-variant"}>
                {" "}
                ({field.value.length}/{POST_TITLE_TARGET})
              </span>
            </FieldLabel>
            <Textarea
              id="import-post-title"
              rows={2}
              aria-invalid={fieldState.invalid}
              className="text-headline-sm"
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="excerpt"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="import-post-excerpt">
              Tóm tắt
              <span className={field.value.length > POST_EXCERPT_MAX ? "text-destructive" : "text-on-surface-variant"}>
                {" "}
                ({field.value.length}/{POST_EXCERPT_MAX})
              </span>
            </FieldLabel>
            <Textarea id="import-post-excerpt" rows={3} aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="featuredImage"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="import-post-image">Ảnh đại diện</FieldLabel>
            <UploadField
              id="import-post-image"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="https://down-vn.img.susercontent.com/…"
              invalid={fieldState.invalid}
              describedBy="import-post-image-hint"
              previewClassName="aspect-video"
              onUploadingChange={(active) => setUploading((n) => n + (active ? 1 : -1))}
              onError={(message) =>
                message ? form.setError("featuredImage", { message }) : form.clearErrors("featuredImage")
              }
            />
            <FieldDescription id="import-post-image-hint">
              Ảnh 16:9. Ảnh của bài gốc không tự tải về: lưu ảnh từ link bên dưới rồi tải lên nếu được phép dùng.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <SourceImages urls={imported.imageUrls} />
      <Controller
        name="content"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <FieldLabel id="import-post-content-label">Thân bài</FieldLabel>
              <PostAiRewrite
                rewrite={rewriteAction}
                getDraft={rewrite.getDraft}
                onApply={rewrite.onApply}
                onUndo={rewrite.onUndo}
              />
            </div>
            <RiskWarningList
              warnings={rewrite.warnings ?? []}
              onSelect={rewrite.highlightWarning}
            />
            <PostBodyEditor
              key={rewrite.editorKey}
              id="import-post-content"
              labelledBy="import-post-content-label"
              describedBy="import-post-content-hint"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={fieldState.invalid}
              highlight={rewrite.highlight}
              onHighlightMissing={() => toast.info("Không còn thấy câu này trong thân bài — có thể bạn đã sửa.")}
            />
            <FieldDescription id="import-post-content-hint">
              Nội dung lấy từ trang khác — hãy viết lại trước khi xuất bản. Thẻ, SEO và Sản phẩm thêm ở trình soạn sau
              khi lưu nháp.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </CmsForm>
  );
}

// "Ảnh trong bài gốc": link + nút copy để Vinh tự lưu ảnh rồi tải lên; không hiện ảnh, không tự tải.
function SourceImages({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <section aria-labelledby="import-images-title" className="rounded-xl border p-space-md">
      <h2 id="import-images-title" className="text-label-md">
        Ảnh trong bài gốc ({urls.length})
      </h2>
      <ul className="mt-space-sm space-y-space-sm">
        {urls.map((url, i) => (
          <li key={url} className="flex items-center gap-space-sm">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-body-sm text-primary underline-offset-2 hover:underline"
            >
              {url}
            </a>
            <CopyButton text={url} label={`Sao chép link ảnh ${i + 1}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
