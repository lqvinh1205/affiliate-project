"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Search, X } from "lucide-react";
import { PRODUCT_PICKER_PARAM } from "@/modules/products/constants";
import type { PickerProduct } from "@/modules/products/types";
import { ProductStatusBadge } from "@/modules/products/components/product-status-badge";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Thumb({ product }: { product: PickerProduct }) {
  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-surface-container">
      <ImageFallback src={product.image} alt="" fill sizes="40px" className="object-cover" />
    </span>
  );
}

const ICON_BUTTON = "size-touch-target! shrink-0";

// ProductPicker (UX-DR48): chọn Sản phẩm **có sẵn** trong Kho cho Bài web hoặc Bộ nội dung — không tạo/sửa/xoá Sản
// phẩm (FR-4). Ô tìm theo tên đưa từ khoá lên URL `?sp=` (giữ các tham số khác của màn); Screen trả `results` (chỉ Sản
// phẩm đang hiện). Mỗi dòng đã chọn: ảnh 40px, tên, nút lên/xuống/gỡ (vùng bấm 44px); không kéo-thả. Gỡ chỉ bỏ khỏi
// bài/bộ. `showValue={false}`: nơi dùng tự hiện danh sách đã chọn (CreateContentSetPanel) — `value` chỉ để loại khỏi
// kết quả tìm.
export function ProductPicker({
  id,
  value,
  onChange,
  results,
  query,
  invalid,
  showValue = true,
  noun = "bài",
  addLabel = "Thêm Sản phẩm từ Kho",
}: {
  id: string;
  value: PickerProduct[];
  onChange: (next: PickerProduct[]) => void;
  results: PickerProduct[];
  query: string;
  invalid?: boolean;
  showValue?: boolean;
  noun?: "bài" | "bộ";
  addLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState(query);
  const [pending, startTransition] = useTransition();

  const search = () => {
    const params = new URLSearchParams(searchParams.toString());
    const q = text.trim();
    if (q) params.set(PRODUCT_PICKER_PARAM, q);
    else params.delete(PRODUCT_PICKER_PARAM);
    const url = params.size > 0 ? `${pathname}?${params}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  };
  // Ô tìm nằm trong form bài: Enter tìm, không gửi form.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    search();
  };

  const move = (from: number, to: number) => {
    const next = [...value];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };
  const chosen = new Set(value.map((p) => p.id));
  const available = results.filter((p) => !chosen.has(p.id));

  return (
    <div className="space-y-space-md">
      {!showValue ? null : value.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">Bài chưa gắn Sản phẩm nào.</p>
      ) : (
        <ol aria-label="Sản phẩm trong bài, theo thứ tự hiện" className="divide-y rounded-xl border">
          {value.map((p, i) => (
            <li key={p.id} className="flex items-center gap-space-sm py-1 pr-1 pl-space-sm">
              <Thumb product={p} />
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-space-sm">
                <span className="min-w-0 truncate text-label-md">{p.name}</span>
                {p.hidden && <ProductStatusBadge hidden />}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={ICON_BUTTON}
                aria-label={`Đưa "${p.name}" lên`}
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
              >
                <ArrowUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={ICON_BUTTON}
                aria-label={`Đưa "${p.name}" xuống`}
                disabled={i === value.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={ICON_BUTTON}
                aria-label={`Gỡ "${p.name}" khỏi bài`}
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-space-sm rounded-xl bg-surface-container-low p-space-sm">
        <label htmlFor={id} className="text-label-md">
          {addLabel}
        </label>
        <div className="flex gap-2">
          <Input
            id={id}
            type="search"
            autoComplete="off"
            placeholder="Tìm theo tên"
            aria-invalid={invalid}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button type="button" variant="outline" size="lg" disabled={pending} onClick={search}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />} Tìm
          </Button>
        </div>
        <p aria-live="polite" className="text-body-sm text-on-surface-variant">
          {available.length === 0
            ? query
              ? `Không có Sản phẩm đang hiện nào khớp "${query}".`
              : "Không còn Sản phẩm đang hiện nào để thêm."
            : query
              ? `Tìm thấy ${available.length} Sản phẩm khớp "${query}".`
              : "Sản phẩm mới nhất trong Kho:"}
        </p>
        {available.length > 0 && (
          <ul className="divide-y">
            {available.map((p) => (
              <li key={p.id} className="flex items-center gap-space-sm py-1">
                <Thumb product={p} />
                <span className="min-w-0 flex-1 truncate text-label-md">{p.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  aria-label={`Thêm "${p.name}" vào ${noun}`}
                  onClick={() => onChange([...value, p])}
                >
                  <Plus aria-hidden /> Thêm
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
