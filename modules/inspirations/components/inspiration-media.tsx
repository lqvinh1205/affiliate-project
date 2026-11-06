import { ImageFallback } from "@/components/shared/image-fallback.client";

// File Cảm hứng đã tải lên (FR-1): ảnh xem trước, video có điều khiển phát (chỉ tải metadata khi mở màn).
export function InspirationMedia({ url, kind }: { url: string; kind: "image" | "video" }) {
  if (kind === "video") {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        playsInline
        className="max-h-96 w-full rounded-lg bg-surface-container"
        aria-label="Video Cảm hứng đã tải lên"
      />
    );
  }
  return (
    <div className="relative aspect-square w-48 overflow-hidden rounded-lg bg-surface-container">
      <ImageFallback src={url} alt="Ảnh Cảm hứng đã tải lên" fill sizes="192px" className="object-cover" />
    </div>
  );
}
