"use client";

import { useId } from "react";
import { CONTENT_CHOICE_EDIT_MAX } from "@/modules/research/constants";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/lib/utils";

export type ChoiceOption = { key: string; name: string; text: string };
export type ChoiceGroup = { title: string | null; options: ChoiceOption[] };

// AudiencePicker / AnglePicker (UX-DR46, FR-9, FR-10): nhóm radio dạng thẻ có nhãn nhóm; mỗi lựa chọn là thẻ viền
// `outline-variant` gồm tên + lý do/hook; đang chọn: viền 2px `primary`, nền `primary-fixed`, chấm `primary`. Dưới lựa
// chọn đang chọn có ô "Sửa lại (tuỳ chọn)" — bản sửa chỉ vào Bộ nội dung sắp tạo, không sửa hồ sơ. Bộ nhiều Sản phẩm:
// nhóm theo Sản phẩm (`title`). Chọn theo `key` ổn định (`id` của hồ sơ — AD-19), không theo vị trí.
export function ChoicePicker({
  label,
  groups,
  value,
  onChange,
  edit,
  onEditChange,
}: {
  label: string;
  groups: ChoiceGroup[];
  value: string | null;
  onChange: (key: string) => void;
  edit: string;
  onEditChange: (text: string) => void;
}) {
  const labelId = useId();
  const editId = useId();
  return (
    <div className="space-y-space-sm">
      <p id={labelId} className="text-label-md">
        {label}
      </p>
      {groups.map((g) => (
        <div key={g.title ?? "_"} role="radiogroup" aria-labelledby={labelId} className="space-y-space-sm">
          {g.title && <p className="text-body-sm text-on-surface-variant">{g.title}</p>}
          {g.options.map((o) => {
            const checked = value === o.key;
            return (
              <div key={o.key} className="space-y-space-sm">
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onChange(o.key)}
                  className={cn(
                    "flex min-h-touch-target w-full items-start gap-space-sm rounded-lg border p-space-md text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary",
                    checked ? "border-2 border-primary bg-primary-fixed text-on-primary-fixed" : "border-outline-variant hover:border-outline",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 grid size-4 shrink-0 place-items-center rounded-full border-2",
                      checked ? "border-primary" : "border-outline",
                    )}
                  >
                    {checked && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-label-md">{o.name}</span>
                    {o.text && <span className="block text-body-sm opacity-80">{o.text}</span>}
                  </span>
                </button>
                {checked && (
                  <div className="space-y-1 pl-space-md">
                    <label htmlFor={editId} className="block text-body-sm text-on-surface-variant">
                      Sửa lại (tuỳ chọn)
                    </label>
                    <Textarea
                      id={editId}
                      rows={2}
                      maxLength={CONTENT_CHOICE_EDIT_MAX}
                      placeholder={o.text}
                      value={edit}
                      onChange={(e) => onEditChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
