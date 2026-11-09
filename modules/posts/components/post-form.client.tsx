"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Status } from "@/generated/prisma/enums";
import { isAllowedImageUrl } from "@/platform/images";
import { slugify } from "@/platform/slug";
import type { CategoryOption } from "@/modules/categories/types";
import { CategorySelect } from "@/modules/categories/components/category-select";
import type { PickerProduct } from "@/modules/products/types";
import { ProductPicker } from "@/modules/products/components/product-picker.client";
import { savePost } from "@/modules/posts/actions";
import {
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_TARGET,
  POST_SEO_TITLE_TARGET,
  POST_TITLE_TARGET,
} from "@/modules/posts/constants";
import { postInputSchema, type PostFormValues } from "@/modules/posts/schema";
import type { ArticlePost, PublishLock, RiskWarning } from "@/modules/posts/types";
import { PostActionBar } from "@/modules/posts/components/post-action-bar.client";
import { PostBodyEditor } from "@/modules/posts/components/post-body-editor.client";
import { RiskWarningList } from "@/modules/posts/components/risk-warning-list.client";
import { PostSeoCheck, type SeoCheckAction } from "@/modules/posts/components/post-seo-check.client";
import { PostAiRewrite, usePostRewrite, type RewriteAction } from "@/modules/posts/components/post-ai-rewrite.client";
import { PostTypePicker } from "@/modules/posts/components/post-type-picker.client";
import { PreviewSheet } from "@/modules/posts/components/preview-sheet.client";
import { CmsForm } from "@/components/shared/cms-form.client";
import { UploadField } from "@/components/shared/upload-field.client";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Action AI của màn soạn (chấm SEO — `posts.checkPostSeo`; AI chỉnh sửa — `posts.rewritePostDraft`) do Screen truyền vào.
export type PostAiActions = { seoCheck: SeoCheckAction; rewrite: RewriteAction };

type PreviewPost = Omit<ArticlePost, "readingMinutes">;

// Bộ đếm ký tự cạnh nhãn: đỏ khi vượt mục tiêu mềm (không chặn lưu) hoặc giới hạn cứng.
function Counter({ value, max, min }: { value: string; max: number; min?: number }) {
  const n = value.length;
  const off = n > max || (min !== undefined && n > 0 && n < min);
  return (
    <span className={off ? "text-destructive" : "text-on-surface-variant"}>
      {" "}
      ({n}/{min !== undefined ? `${min}–${max}` : max})
    </span>
  );
}

// Trình soạn Bài web (`/cms/bai-viet/[id]`, UX-DR50, UX-DR59, UX-DR60): tiêu đề, Loại bài, Danh mục, đường dẫn,
// tóm tắt, ảnh đại diện, thân bài (PostEditor), Sản phẩm (ProductPicker), thẻ, SEO; Xem trước (PreviewSheet, cả thay
// đổi chưa lưu); Xuất bản / Chuyển về nháp / Xoá (ConfirmDialog). Chỉ đọc `defaultValues` lúc mount (AD-12).
// Bài của Bộ nội dung (AD-19, Story 5.7): `publishLock` khoá nút Xuất bản khi gợi ý AI còn Đang tạo / Chờ duyệt (chỉ
// ở giao diện); `riskWarnings` của gợi ý hiện trên thân bài, chạm mục thì bôi câu trong PostEditor (UX-DR43).
// "AI chỉnh sửa" (FR-40): kết quả điền form chưa lưu, cảnh báo của lần viết lại thay cảnh báo của gợi ý; PostEditor chỉ
// đọc `value` lúc mount nên đổi `key` sau khi viết lại / hoàn tác.
export function PostForm({
  defaultValues,
  status: initialStatus,
  publishedAt,
  categories,
  products,
  productResults,
  productQuery,
  ai,
  publishLock = null,
  riskWarnings = [],
}: {
  defaultValues: PostFormValues;
  status: Status;
  publishedAt: string | null;
  categories: CategoryOption[];
  products: PickerProduct[];
  productResults: PickerProduct[];
  productQuery: string;
  ai: PostAiActions;
  publishLock?: PublishLock | null;
  riskWarnings?: RiskWarning[];
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(postInputSchema), defaultValues });
  const [status, setStatus] = useState(initialStatus);
  const [savedSlug, setSavedSlug] = useState(defaultValues.slug);
  const [picked, setPicked] = useState(products);
  const [uploading, setUploading] = useState(0);
  const [preview, setPreview] = useState<{ post: PreviewPost; content: string } | null>(null);
  const rewrite = usePostRewrite(form);
  const title = useWatch({ control: form.control, name: "title" });

  const canPublish = () => {
    if (!form.formState.isDirty) return true;
    toast.error("Bạn có thay đổi chưa lưu. Lưu trước rồi xuất bản.");
    return false;
  };

  const openPreview = () => {
    const v = form.getValues();
    const category = categories.find((c) => c.id === v.categoryId);
    // Trang public chỉ hiện Sản phẩm đang hiện, đúng thứ tự trong bài; ngày giá đổi lại `Date` cho ProductCard.
    const visible = picked
      .filter((p) => !p.hidden)
      .map((p) => ({ ...p, priceUpdatedAt: p.priceUpdatedAt ? new Date(p.priceUpdatedAt) : null }));
    const image = v.featuredImage.trim();
    setPreview({
      content: v.content,
      post: {
        title: v.title.trim() || "Chưa có tiêu đề",
        postType: v.postType,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        // Cùng fallback với trang public: ảnh đại diện → ảnh Sản phẩm đang hiện đầu tiên.
        featuredImage: (image && isAllowedImageUrl(image) ? image : null) ?? visible[0]?.image ?? null,
        tags: postInputSchema.shape.tags.safeParse(v.tags).data ?? [],
        category: category ? { name: category.name, slug: category.slug } : null,
        products: visible,
      },
    });
  };

  return (
    <div className="space-y-space-lg">
      <PostActionBar
        id={defaultValues.id}
        title={title}
        slug={savedSlug}
        status={status}
        onStatusChange={setStatus}
        canPublish={canPublish}
        onPreview={openPreview}
        publishLock={publishLock}
      />

      <CmsForm
        form={form}
        action={savePost}
        busyLabel={uploading > 0 ? "Đang tải ảnh…" : null}
        onSaved={(saved, values) => {
          setSavedSlug(saved.slug);
          // Đường dẫn để trống đã được server tạo từ tiêu đề: hiện lại giá trị đã lưu.
          if (values.slug !== saved.slug) form.reset({ ...values, slug: saved.slug });
          router.refresh();
        }}
      >
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-title">
                Tiêu đề
                <Counter value={field.value} max={POST_TITLE_TARGET} />
              </FieldLabel>
              <Textarea id="post-title" rows={2} aria-invalid={fieldState.invalid} className="text-headline-sm" {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="postType"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel id="post-type-label">Loại bài</FieldLabel>
              <PostTypePicker value={field.value} onChange={field.onChange} labelledBy="post-type-label" />
            </Field>
          )}
        />
        <Controller
          name="categoryId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-category">Danh mục</FieldLabel>
              <CategorySelect
                id="post-category"
                options={categories}
                aria-invalid={fieldState.invalid}
                aria-describedby="post-category-hint"
                {...field}
              />
              <FieldDescription id="post-category-hint">
                Bài hiện ở trang Danh mục và bài liên quan khi đã xuất bản.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-slug">Đường dẫn</FieldLabel>
              <Input
                id="post-slug"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={slugify(title) || "meo-hay"}
                aria-invalid={fieldState.invalid}
                aria-describedby="post-slug-hint"
                {...field}
              />
              <FieldDescription id="post-slug-hint">
                /bai-viet/… — chữ thường không dấu, số, gạch ngang. Để trống thì tạo từ tiêu đề. Đổi đường dẫn bài đã
                xuất bản thì link cũ vẫn tự chuyển sang link mới.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="excerpt"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-excerpt">
                Tóm tắt
                <Counter value={field.value} max={POST_EXCERPT_MAX} />
              </FieldLabel>
              <Textarea id="post-excerpt" rows={3} aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="featuredImage"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-image">Ảnh đại diện</FieldLabel>
              <UploadField
                id="post-image"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="https://down-vn.img.susercontent.com/…"
                invalid={fieldState.invalid}
                describedBy="post-image-hint"
                previewClassName="aspect-video"
                onUploadingChange={(active) => setUploading((n) => n + (active ? 1 : -1))}
                onError={(message) =>
                  message ? form.setError("featuredImage", { message }) : form.clearErrors("featuredImage")
                }
              />
              <FieldDescription id="post-image-hint">
                Ảnh 16:9. Để trống thì dùng ảnh Sản phẩm đầu tiên của bài.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="content"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <FieldLabel id="post-content-label">Thân bài</FieldLabel>
                <PostAiRewrite
                  rewrite={ai.rewrite}
                  getDraft={rewrite.getDraft}
                  onApply={rewrite.onApply}
                  onUndo={rewrite.onUndo}
                />
              </div>
              <RiskWarningList
                warnings={rewrite.warnings ?? riskWarnings}
                onSelect={rewrite.highlightWarning}
              />
              <PostBodyEditor
                key={rewrite.editorKey}
                id="post-content"
                labelledBy="post-content-label"
                describedBy="post-content-hint"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                highlight={rewrite.highlight}
                onHighlightMissing={() => toast.info("Không còn thấy câu này trong thân bài — có thể bạn đã sửa.")}
              />
              <FieldDescription id="post-content-hint">
                Không chèn link, ảnh hay giá vào thân bài: Sản phẩm hiện riêng bên dưới bài. Nội dung dán từ nơi khác
                được lọc còn định dạng cho phép.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="productIds"
          control={form.control}
          render={({ fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-products-search">Sản phẩm trong bài</FieldLabel>
              <ProductPicker
                id="post-products-search"
                value={picked}
                onChange={(next) => {
                  setPicked(next);
                  form.setValue(
                    "productIds",
                    next.map((p) => p.id),
                    { shouldDirty: true, shouldValidate: true },
                  );
                }}
                results={productResults}
                query={productQuery}
                invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="tags"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-tags">Thẻ</FieldLabel>
              <Input id="post-tags" autoComplete="off" aria-invalid={fieldState.invalid} aria-describedby="post-tags-hint" {...field} />
              <FieldDescription id="post-tags-hint">Cách nhau bằng dấu phẩy. Hiện cuối bài dạng #thẻ.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <details className="group rounded-xl border p-space-md">
          <summary className="min-h-touch-target cursor-pointer content-center text-headline-sm">SEO</summary>
          <div className="mt-space-md space-y-space-lg">
            <Controller
              name="seoTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="post-seo-title">
                    Tiêu đề SEO
                    <Counter value={field.value} max={POST_SEO_TITLE_TARGET} />
                  </FieldLabel>
                  <Input id="post-seo-title" autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="seoDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="post-seo-description">
                    Mô tả SEO
                    <Counter
                      value={field.value}
                      min={POST_SEO_DESCRIPTION_TARGET.min}
                      max={POST_SEO_DESCRIPTION_TARGET.max}
                    />
                  </FieldLabel>
                  <Textarea id="post-seo-description" rows={3} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="seoKeywords"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="post-seo-keywords">Từ khoá SEO</FieldLabel>
                  <Input
                    id="post-seo-keywords"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    aria-describedby="post-seo-keywords-hint"
                    {...field}
                  />
                  <FieldDescription id="post-seo-keywords-hint">Cách nhau bằng dấu phẩy.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <PostSeoCheck
              seoCheck={ai.seoCheck}
              getInput={() => {
                const v = form.getValues();
                return {
                  title: v.title,
                  seoTitle: v.seoTitle,
                  seoDescription: v.seoDescription,
                  content: v.content,
                  keywords: postInputSchema.shape.seoKeywords.safeParse(v.seoKeywords).data ?? [],
                };
              }}
            />
          </div>
        </details>

      </CmsForm>

      <PreviewSheet
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
        post={preview?.post ?? EMPTY_PREVIEW}
        content={preview?.content ?? ""}
      />
    </div>
  );
}

const EMPTY_PREVIEW: PreviewPost = {
  title: "",
  postType: "MEO_VAT",
  publishedAt: null,
  featuredImage: null,
  tags: [],
  category: null,
  products: [],
};
