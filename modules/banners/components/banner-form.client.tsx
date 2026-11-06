"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveBanner } from "@/modules/banners/actions";
import {
  BANNER_DESCRIPTION_MAX,
  BANNER_IMAGE_RATIO_LABEL,
  BANNER_LINK_MAX,
  BANNER_TITLE_MAX,
} from "@/modules/banners/constants";
import { bannerInputSchema, type BannerFormValues } from "@/modules/banners/schema";
import { CmsForm } from "@/components/shared/cms-form.client";
import { UploadField } from "@/components/shared/upload-field.client";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Form tạo/sửa Banner (FR-32, UX-DR79): ảnh (UploadField, tỉ lệ khuyến nghị dưới trường), tiêu đề, mô tả ngắn, link
// đích, bật/tắt, lịch theo giờ Việt Nam. Chỉ đọc `defaultValues` lúc mount (AD-12). Tạo xong chuyển sang màn sửa; sửa
// xong làm mới StatusBadge.
export function BannerForm({ defaultValues }: { defaultValues: BannerFormValues }) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(bannerInputSchema), defaultValues });
  const [uploading, setUploading] = useState(false);

  return (
    <CmsForm
      form={form}
      action={saveBanner}
      busyLabel={uploading ? "Đang tải ảnh…" : null}
      onSaved={(saved, values) => {
        if (!values.id) router.replace(`/cms/banner/${saved.id}`);
        else router.refresh();
      }}
    >
      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="banner-image">Ảnh</FieldLabel>
            <UploadField
              id="banner-image"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              previewClassName="aspect-[2/1]"
              invalid={fieldState.invalid}
              describedBy="banner-image-hint"
              onUploadingChange={setUploading}
              onError={(message) => (message ? form.setError("image", { message }) : form.clearErrors("image"))}
            />
            <FieldDescription id="banner-image-hint">
              Tỉ lệ khuyến nghị {BANNER_IMAGE_RATIO_LABEL}. Ảnh lệch tỉ lệ bị cắt giữa theo khung.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="title"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="banner-title">
              Tiêu đề ({field.value.length}/{BANNER_TITLE_MAX})
            </FieldLabel>
            <Input
              id="banner-title"
              autoComplete="off"
              maxLength={BANNER_TITLE_MAX}
              placeholder="Săn đồ bếp xinh dịp 11.11"
              aria-invalid={fieldState.invalid}
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="banner-description">
              Mô tả ngắn ({field.value.length}/{BANNER_DESCRIPTION_MAX})
            </FieldLabel>
            <Textarea
              id="banner-description"
              rows={2}
              maxLength={BANNER_DESCRIPTION_MAX}
              aria-invalid={fieldState.invalid}
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="linkUrl"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="banner-link">Link đích</FieldLabel>
            <Input
              id="banner-link"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={BANNER_LINK_MAX}
              placeholder="https://s.shopee.vn/… hoặc /bio"
              aria-invalid={fieldState.invalid}
              aria-describedby="banner-link-hint"
              {...field}
            />
            <FieldDescription id="banner-link-hint">
              Link Shopee Affiliate (shopee.vn, s.shopee.vn, shope.ee) mở tab mới; đường dẫn trong site (bắt đầu bằng /)
              mở cùng tab.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="enabled"
        control={form.control}
        render={({ field }) => (
          <Field>
            <label htmlFor="banner-enabled" className="flex min-h-touch-target cursor-pointer items-center gap-space-sm text-label-md">
              <Switch
                id="banner-enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-describedby="banner-enabled-hint"
              />
              Bật Banner
            </label>
            <FieldDescription id="banner-enabled-hint">
              Tắt thì Banner không lên site dù đang trong lịch.
            </FieldDescription>
          </Field>
        )}
      />
      <FieldSet>
        <FieldLegend>Lịch hiển thị</FieldLegend>
        <FieldDescription>Giờ Việt Nam. Để trống thì không giới hạn phía đó.</FieldDescription>
        <div className="grid gap-space-md sm:grid-cols-2">
          <Controller
            name="startsAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="banner-starts-at">Bắt đầu</FieldLabel>
                <Input id="banner-starts-at" type="datetime-local" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="endsAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="banner-ends-at">Kết thúc</FieldLabel>
                <Input id="banner-ends-at" type="datetime-local" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
      </FieldSet>
    </CmsForm>
  );
}
