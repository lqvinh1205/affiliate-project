"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Eye, Gauge, Loader2, MessageSquareText, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Status } from "@/generated/prisma/enums";
import type { Result } from "@/platform/errors";
import { isAllowedImageUrl } from "@/platform/images";
import { slugify } from "@/platform/slug";
import type { CategoryOption } from "@/modules/categories/types";
import { CategorySelect } from "@/modules/categories/components/category-select";
import type { PickerProduct } from "@/modules/products/types";
import { ProductPicker } from "@/modules/products/components/product-picker.client";
import { deletePost, savePost, setPostStatus } from "@/modules/posts/actions";
import {
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_TARGET,
  POST_SEO_TITLE_TARGET,
  POST_TITLE_TARGET,
} from "@/modules/posts/constants";
import { postInputSchema, type PostFormValues } from "@/modules/posts/schema";
import type { ArticlePost } from "@/modules/posts/components/post-article";
import { PostBodyEditor } from "@/modules/posts/components/post-body-editor.client";
import { PostStatusBadge } from "@/modules/posts/components/post-status-badge";
import { PostTypePicker } from "@/modules/posts/components/post-type-picker.client";
import { PreviewSheet } from "@/modules/posts/components/preview-sheet.client";
import { SeoScore } from "@/modules/posts/components/seo-score";
import { callAction } from "@/components/shared/call-action";
import { CmsForm } from "@/components/shared/cms-form.client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog.client";
import { UploadField } from "@/components/shared/upload-field.client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Action AI cũ (`app/cms/actions.ts`, tới Epic 4) do Screen truyền vào — module không import `app/` (AD-2).
export type PostAiActions = {
  seoCheck: (input: {
    title: string;
    seoTitle: string;
    seoDescription: string;
    content: string;
    keywords: string[];
  }) => Promise<Result<{ report: { score: number; suggestions: string[] } }>>;
  threads: (input: { title: string; content: string; slug: string }) => Promise<Result<{ posts: string[] }>>;
};

const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

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
export function PostForm({
  defaultValues,
  status: initialStatus,
  publishedAt,
  categories,
  products,
  productResults,
  productQuery,
  ai,
}: {
  defaultValues: PostFormValues;
  status: Status;
  publishedAt: string | null;
  categories: CategoryOption[];
  products: PickerProduct[];
  productResults: PickerProduct[];
  productQuery: string;
  ai: PostAiActions;
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(postInputSchema), defaultValues });
  const [status, setStatus] = useState(initialStatus);
  const [savedSlug, setSavedSlug] = useState(defaultValues.slug);
  const [picked, setPicked] = useState(products);
  const [uploading, setUploading] = useState(0);
  const [preview, setPreview] = useState<{ post: Omit<ArticlePost, "readingMinutes">; content: string } | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "unpublish" | null>(null);
  const [busy, setBusy] = useState<"status" | "delete" | "seo" | "threads" | null>(null);
  const [seo, setSeo] = useState<{ score: number; suggestions: string[] } | null>(null);
  const [threads, setThreads] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const title = useWatch({ control: form.control, name: "title" });

  const act = (key: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(key);
    startTransition(async () => {
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    });
  };

  const changeStatus = (next: Status) =>
    act("status", async () => {
      const res = await callAction(() => setPostStatus({ id: defaultValues.id, status: next }));
      setConfirm(null);
      if (!res.ok) return void toast.error(res.error);
      setStatus(res.status);
      toast.success(next === "PUBLISHED" ? "Đã xuất bản" : "Đã chuyển bài về nháp");
      router.refresh();
    });

  const onPublish = () => {
    if (form.formState.isDirty) {
      toast.error("Bạn có thay đổi chưa lưu. Lưu trước rồi xuất bản.");
      return;
    }
    changeStatus("PUBLISHED");
  };

  const onDelete = () =>
    act("delete", async () => {
      const res = await callAction(() => deletePost({ id: defaultValues.id }));
      if (!res.ok) {
        setConfirm(null);
        return void toast.error(res.error);
      }
      toast.success("Đã xoá bài");
      router.push("/cms/bai-viet");
    });

  const openPreview = () => {
    const v = form.getValues();
    const category = categories.find((c) => c.id === v.categoryId);
    setPreview({
      content: v.content,
      post: {
        title: v.title.trim() || "Chưa có tiêu đề",
        postType: v.postType,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        featuredImage: v.featuredImage.trim() && isAllowedImageUrl(v.featuredImage.trim()) ? v.featuredImage.trim() : null,
        tags: [...new Set(toList(v.tags))],
        category: category ? { name: category.name, slug: category.slug } : null,
        // Trang public chỉ hiện Sản phẩm đang hiện, đúng thứ tự trong bài.
        products: picked.filter((p) => !p.hidden),
      },
    });
  };

  const onSeo = () =>
    act("seo", async () => {
      const v = form.getValues();
      const res = await callAction(() =>
        ai.seoCheck({
          title: v.title,
          seoTitle: v.seoTitle,
          seoDescription: v.seoDescription,
          content: v.content,
          keywords: toList(v.seoKeywords),
        }),
      );
      if (!res.ok) return void toast.error(res.error);
      setSeo(res.report);
    });

  const onThreads = () =>
    act("threads", async () => {
      const v = form.getValues();
      const res = await callAction(() => ai.threads({ title: v.title, content: v.content, slug: savedSlug }));
      if (!res.ok) return void toast.error(res.error);
      setThreads(res.posts);
    });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép");
    } catch {
      toast.error("Chưa sao chép được, thử chọn và sao chép tay");
    }
  };

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-wrap items-center gap-space-sm">
        <PostStatusBadge status={status} />
        {status === "PUBLISHED" && (
          <Link
            href={`/bai-viet/${savedSlug}`}
            target="_blank"
            className="inline-flex min-h-touch-target items-center text-label-md text-primary hover:underline"
          >
            Xem trên site<span className="sr-only"> (mở tab mới)</span>
          </Link>
        )}
        <div className="flex w-full flex-wrap gap-space-sm sm:ml-auto sm:w-auto">
          <Button type="button" variant="outline" size="lg" onClick={openPreview}>
            <Eye aria-hidden /> Xem trước
          </Button>
          {status === "PUBLISHED" ? (
            <Button type="button" variant="outline" size="lg" disabled={!!busy} onClick={() => setConfirm("unpublish")}>
              <Undo2 aria-hidden /> Chuyển về nháp
            </Button>
          ) : (
            <Button type="button" size="lg" disabled={!!busy} onClick={onPublish}>
              {busy === "status" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {busy === "status" ? "Đang xuất bản…" : "Xuất bản"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="text-destructive hover:text-destructive"
            disabled={!!busy}
            onClick={() => setConfirm("delete")}
          >
            <Trash2 aria-hidden /> Xoá
          </Button>
        </div>
      </div>

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
              <FieldLabel id="post-content-label">Thân bài</FieldLabel>
              <PostBodyEditor
                id="post-content"
                labelledBy="post-content-label"
                describedBy="post-content-hint"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
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
            <Button type="button" variant="outline" size="lg" className="w-full" disabled={!!busy} onClick={onSeo}>
              {busy === "seo" ? <Loader2 className="animate-spin" aria-hidden /> : <Gauge aria-hidden />}
              {busy === "seo" ? "AI đang chấm điểm…" : "Chấm điểm SEO bằng AI"}
            </Button>
            {seo && (
              <div aria-live="polite" className="flex flex-col items-center gap-space-md rounded-xl border p-space-md sm:flex-row sm:items-start">
                <SeoScore score={seo.score} className="shrink-0" />
                <ul className="list-disc space-y-1.5 pl-5 text-body-sm">
                  {seo.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>

        <details className="rounded-xl border p-space-md">
          <summary className="min-h-touch-target cursor-pointer content-center text-headline-sm">Chuỗi Threads (AI)</summary>
          <div className="mt-space-md space-y-space-md">
            <p className="text-body-sm text-on-surface-variant">
              AI chia bài thành chuỗi bài ngắn cho Threads/Facebook, bài cuối chứa link về website.
              {status !== "PUBLISHED" && " Bài chưa xuất bản nên link sẽ chưa mở được."}
            </p>
            <Button type="button" variant="outline" size="lg" className="w-full" disabled={!!busy} onClick={onThreads}>
              {busy === "threads" ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquareText aria-hidden />}
              {busy === "threads" ? "AI đang viết chuỗi…" : threads.length ? "Tạo lại chuỗi Threads" : "Tạo chuỗi Threads"}
            </Button>
            {threads.length > 0 && (
              <>
                <ol className="space-y-2" aria-live="polite">
                  {threads.map((t, i) => (
                    <li key={i} className="flex gap-3 rounded-xl border p-3">
                      <span className="text-label-md text-primary">{i + 1}</span>
                      <p className="flex-1 whitespace-pre-wrap text-body-sm">{t}</p>
                      <Button type="button" variant="ghost" size="icon-lg" aria-label={`Sao chép bài ${i + 1}`} onClick={() => copy(t)}>
                        <Copy aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ol>
                <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => copy(threads.join("\n\n"))}>
                  <Copy aria-hidden /> Sao chép toàn bộ chuỗi
                </Button>
              </>
            )}
          </div>
        </details>
      </CmsForm>

      <PreviewSheet
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
        post={preview?.post ?? EMPTY_PREVIEW}
        content={preview?.content ?? ""}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Xoá bài "${defaultValues.title}"?`}
        description="Bài biến khỏi website và không khôi phục được. Sản phẩm đã gắn vẫn còn trong Kho."
        pending={busy === "delete"}
        onConfirm={onDelete}
      />
      <ConfirmDialog
        open={confirm === "unpublish"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Chuyển bài "${defaultValues.title}" về nháp?`}
        description="Bài biến khỏi website cho tới khi xuất bản lại; link đã chia sẻ tạm không mở được."
        confirmLabel="Chuyển về nháp"
        pendingLabel="Đang chuyển…"
        pending={busy === "status"}
        onConfirm={() => changeStatus("DRAFT")}
      />
    </div>
  );
}

const EMPTY_PREVIEW: Omit<ArticlePost, "readingMinutes"> = {
  title: "",
  postType: "MEO_VAT",
  publishedAt: null,
  featuredImage: null,
  tags: [],
  category: null,
  products: [],
};
