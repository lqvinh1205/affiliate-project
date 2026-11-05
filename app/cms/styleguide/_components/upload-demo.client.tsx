"use client";

import { useState } from "react";
import { UploadField } from "@/components/shared/upload-field.client";

// Mẫu UploadField cho styleguide: `single` (dán URL hoặc chọn ảnh, xem trước 1:1) và `append` (thêm dòng URL).
// Tải lên thật qua `/cms/upload` (cần `UPLOAD_DIR`).
export function UploadDemo() {
  const [single, setSingle] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-md space-y-space-md">
      <UploadField
        id="demo-upload-single"
        value={single}
        onChange={setSingle}
        placeholder="https://down-vn.img.susercontent.com/…"
        invalid={!!error}
        onError={setError}
      />
      <UploadField mode="append" id="demo-upload-append" onUploaded={(url) => setLines((l) => [...l, url])} onError={setError} />
      {error && <p className="text-body-sm text-destructive">{error}</p>}
      {lines.length > 0 && (
        <ul className="text-body-sm text-on-surface-variant">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
