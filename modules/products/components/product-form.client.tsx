"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatShortDate } from "@/platform/format";
import type { CategoryOption } from "@/modules/categories/types";
import { saveProduct } from "@/modules/products/actions";
import { PRODUCT_NAME_MAX, PRODUCT_PRICE_TEXT_MAX } from "@/modules/products/constants";
import { productInputSchema, type ProductFormValues } from "@/modules/products/schema";
import { CmsForm } from "@/components/shared/cms-form.client";
import { UploadField } from "@/components/shared/upload-field.client";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


// Native <select>: dễ dùng trên điện thoại; cùng kiểu viền/focus với Input, `data-slot="input"` để cao 44px trong CMS mobile.
const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

// Form tạo/sửa Sản phẩm (UX-DR74): tên, Link affiliate, giá tham khảo, ảnh, Danh mục, Dữ liệu thô.
// Chỉ đọc `defaultValues` lúc mount (AD-12). Tạo xong chuyển sang màn sửa; sửa xong làm mới ngày giá
// và "nơi đang dùng".
export function ProductForm({
  defaultValues,
  categories,
  priceUpdatedAt,
}: {
  defaultValues: ProductFormValues;
  categories: CategoryOption[];
  priceUpdatedAt: string | null;
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(productInputSchema), defaultValues });
  // Số file đang tải lên: > 0 thì chặn Lưu (URL chưa có trong form).
  const [uploading, setUploading] = useState(0);
  const onUploadingChange = (active: boolean) => setUploading((n) => n + (active ? 1 : -1));

  return (
    <CmsForm
      form={form}
      action={saveProduct}
      busyLabel={uploading > 0 ? "Đang tải ảnh…" : null}
      onSaved={(saved, values) => {
        if (!values.id) router.replace(`/cms/san-pham/${saved.id}`);
        else router.refresh();
      }}
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="product-name">
              Tên ({field.value.length}/{PRODUCT_NAME_MAX})
            </FieldLabel>
            <Input
              id="product-name"
              autoComplete="off"
              maxLength={PRODUCT_NAME_MAX}
              aria-invalid={fieldState.invalid}
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="affiliateUrl"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="product-affiliate-url">Link affiliate</FieldLabel>
            <Input
              id="product-affiliate-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://s.shopee.vn/…"
              aria-invalid={fieldState.invalid}
              aria-describedby="product-affiliate-url-hint"
              {...field}
            />
            <FieldDescription id="product-affiliate-url-hint">
              Link tạo từ Shopee Affiliate (shopee.vn, s.shopee.vn, shope.ee).
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="priceText"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="product-price">Giá tham khảo</FieldLabel>
            <Input
              id="product-price"
              autoComplete="off"
              maxLength={PRODUCT_PRICE_TEXT_MAX}
              placeholder="~89.000đ"
              aria-invalid={fieldState.invalid}
              aria-describedby="product-price-hint"
              {...field}
            />
            <FieldDescription id="product-price-hint">
              {priceUpdatedAt
                ? `Cập nhật ${formatShortDate(new Date(priceUpdatedAt))}. Đổi giá thì ngày cập nhật đổi theo.`
                : "Không bắt buộc. Lưu giá thì ghi ngày cập nhật."}
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="product-image">Ảnh</FieldLabel>
            <UploadField
              id="product-image"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="https://down-vn.img.susercontent.com/…"
              invalid={fieldState.invalid}
              describedBy="product-image-hint"
              onUploadingChange={onUploadingChange}
              onError={(message) =>
                message ? form.setError("image", { message }) : form.clearErrors("image")
              }
            />
            <FieldDescription id="product-image-hint">
              Chụp/chọn ảnh từ máy hoặc dán link ảnh Shopee. Không bắt buộc.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="categoryId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="product-category">Danh mục</FieldLabel>
            <select
              id="product-category"
              data-slot="input"
              className={SELECT_CLASS}
              aria-invalid={fieldState.invalid}
              {...field}
            >
              <option value="">Chưa chọn</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <FieldSet>
        <FieldLegend>Dữ liệu thô</FieldLegend>
        <FieldDescription>Chép từ trang Shopee để AI viết sau này. Không hiện trên website.</FieldDescription>
        <Controller
          name="rawText"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="product-raw-text">Mô tả, thông số</FieldLabel>
              <Textarea id="product-raw-text" rows={4} aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="rawReviews"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="product-raw-reviews">Đánh giá</FieldLabel>
              <Textarea id="product-raw-reviews" rows={4} aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="rawImageUrls"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="product-raw-images">URL ảnh</FieldLabel>
              <Textarea
                id="product-raw-images"
                rows={3}
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
                aria-describedby="product-raw-images-hint"
                {...field}
              />
              <FieldDescription id="product-raw-images-hint">
                Mỗi dòng một link ảnh. Ảnh tải lên được thêm thành một dòng mới.
              </FieldDescription>
              <UploadField
                mode="append"
                id="product-raw-images-upload"
                invalid={fieldState.invalid}
                onUploadingChange={onUploadingChange}
                onUploaded={(url) => {
                  // Đọc giá trị lúc tải xong: người dùng có thể đã sửa ô trong lúc chờ.
                  const current = form.getValues("rawImageUrls");
                  field.onChange(current.trim() ? `${current.trimEnd()}\n${url}` : url);
                }}
                onError={(message) =>
                  message ? form.setError("rawImageUrls", { message }) : form.clearErrors("rawImageUrls")
                }
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldSet>
    </CmsForm>
  );
}
