"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/components/ui/lib/utils";

// Ảnh ngoài (Shopee CDN, upload) có khung dự phòng (DESIGN.md › ImageFallback): lỗi tải hoặc không có
// `src` thì hiện khung `surface-container` cùng chỗ (dùng với `fill` trong khung có tỉ lệ cố định) và
// icon `image-off`; `alt` giữ nguyên trên khung.
export function ImageFallback({
  src,
  alt,
  className,
  ...props
}: Omit<ImageProps, "src" | "onError"> & { src: string | null | undefined }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className="absolute inset-0 flex items-center justify-center bg-surface-container"
      >
        <ImageOff className="size-6 text-outline" strokeWidth={1.5} aria-hidden />
      </span>
    );
  }
  return <Image src={src} alt={alt} className={cn(className)} onError={() => setFailed(src)} {...props} />;
}
