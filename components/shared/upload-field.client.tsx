"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Camera, X } from "lucide-react";
import { isAllowedImageUrl } from "@/platform/images";
import { acceptAttribute, UPLOAD_ENDPOINT, uploadError, type UploadKind } from "@/platform/upload-rules";
import { NETWORK_ERROR } from "@/components/shared/call-action";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/lib/utils";

const AUTH_ERROR = "Phiên đăng nhập CMS đã hết. Tải lại trang rồi thử lại.";

type Upload = { name: string; percent: number; xhr: XMLHttpRequest };

type CommonProps = {
  id: string;
  kind?: UploadKind;
  invalid?: boolean;
  describedBy?: string;
  // Lỗi tại trường (sai loại, quá cỡ, lỗi mạng); null để xoá lỗi. Các trường khác của form giữ nguyên.
  onError: (message: string | null) => void;
  // Lớp tỉ lệ khung xem trước theo đúng tỉ lệ đích (vd `aspect-square` cho ảnh Sản phẩm 1:1).
  previewClassName?: string;
  // Báo form đang tải file (true) / xong hoặc huỷ (false), để form chặn nút Lưu.
  onUploadingChange?: (uploading: boolean) => void;
};

// `single`: một URL — ô dán URL + nút chọn file, tải xong thay giá trị, có xem trước.
// `append`: chỉ nút chọn file — tải xong gọi `onUploaded(url)` (vd thêm một dòng vào danh sách URL); nơi gọi
// đọc giá trị hiện tại của trường lúc đó (`form.getValues`), không dùng giá trị lúc bắt đầu tải.
type UploadFieldProps = CommonProps &
  (
    | { mode?: "single"; value: string; onChange: (url: string) => void; onBlur?: () => void; placeholder?: string }
    | { mode: "append"; onUploaded: (url: string) => void }
  );

// Gửi file thô tới route upload (AD-24) bằng XHR để có tiến trình và huỷ được; trình duyệt tự gửi kèm
// Basic Auth đã nhập cho `/cms`.
function send(file: File, onProgress: (percent: number) => void) {
  const xhr = new XMLHttpRequest();
  const done = new Promise<{ ok: true; url: string } | { ok: false; error: string } | null>((resolve) => {
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status === 401) return resolve({ ok: false, error: AUTH_ERROR });
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve({ ok: false, error: NETWORK_ERROR });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: NETWORK_ERROR });
    xhr.onabort = () => resolve(null);
  });
  xhr.open("POST", UPLOAD_ENDPOINT);
  xhr.setRequestHeader("Content-Type", file.type);
  xhr.send(file);
  return { xhr, done };
}

// UploadField (UX-DR54, DESIGN.md › UploadField): chọn/chụp file hoặc dán URL ảnh, thanh tiến trình,
// huỷ được, xem trước đúng tỉ lệ; lỗi tại trường.
export function UploadField(props: UploadFieldProps) {
  const { id, kind = "image", invalid, describedBy, onError, onUploadingChange, previewClassName = "aspect-square" } =
    props;
  const fileInput = useRef<HTMLInputElement>(null);
  const activeXhr = useRef<XMLHttpRequest | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  // Rời màn khi đang tải: huỷ request, không để file tải nốt rồi gọi lại form đã gỡ.
  useEffect(() => () => activeXhr.current?.abort(), []);

  const start = async (file: File) => {
    const error = uploadError(file.type, file.size, kind);
    if (error) return onError(error);
    onError(null);
    const { xhr, done } = send(file, (percent) => setUpload((u) => (u ? { ...u, percent } : u)));
    activeXhr.current = xhr;
    setUpload({ name: file.name, percent: 0, xhr });
    onUploadingChange?.(true);
    const res = await done;
    activeXhr.current = null;
    setUpload(null);
    onUploadingChange?.(false);
    if (!res) return; // đã huỷ
    if (!res.ok) return onError(res.error);
    setLastUploaded(res.url);
    if (props.mode === "append") props.onUploaded(res.url);
    else props.onChange(res.url);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // chọn lại cùng file vẫn kích hoạt
    if (file) void start(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && !upload) void start(file);
  };

  const preview = props.mode === "append" ? lastUploaded : props.value;
  const showPreview = kind === "image" && preview && isAllowedImageUrl(preview);

  return (
    <div
      className={cn(
        "space-y-space-sm rounded-xl border border-dashed border-outline-variant p-space-sm",
        invalid && "border-destructive",
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {props.mode !== "append" && (
        <Input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={props.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
        />
      )}
      <input
        ref={fileInput}
        id={props.mode === "append" ? id : undefined}
        type="file"
        accept={acceptAttribute(kind)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onPick}
      />
      {upload ? (
        <div className="space-y-1" aria-live="polite">
          <div className="flex items-center justify-between gap-space-sm text-body-sm">
            <span className="min-w-0 truncate">
              Đang tải {upload.name}… {upload.percent}%
            </span>
            <Button type="button" variant="ghost" size="lg" onClick={() => upload.xhr.abort()}>
              <X aria-hidden /> Huỷ
            </Button>
          </div>
          <div
            role="progressbar"
            aria-label={`Tiến trình tải ${upload.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={upload.percent}
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
          >
            <div className="h-full bg-primary transition-[width]" style={{ width: `${upload.percent}%` }} />
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-describedby={props.mode === "append" ? describedBy : undefined}
          onClick={() => fileInput.current?.click()}
        >
          <Camera aria-hidden />
          {kind === "image" ? "Chụp hoặc chọn ảnh" : "Chọn ảnh hoặc video"}
        </Button>
      )}
      {showPreview && (
        <div className={cn("relative w-32 overflow-hidden rounded-lg bg-surface-container", previewClassName)}>
          <ImageFallback src={preview} alt="Xem trước ảnh" fill sizes="128px" className="object-cover" />
        </div>
      )}
    </div>
  );
}
