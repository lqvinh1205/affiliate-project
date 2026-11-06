"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { regenerateSuggestion, researchInspiration, researchProduct } from "@/modules/suggestions/actions";
import { REGENERATE_CHIPS, SUGGESTION_INSTRUCTION_MAX } from "@/modules/suggestions/constants";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

// RegenerateDialog (UX-DR57, FR-21): chỉ dẫn ngắn tuỳ chọn + chip mẫu. Xác nhận → gợi ý hiện hành thành SUPERSEDED,
// thẻ chuyển Đang tạo. Hai đích:
// - `productId`: Tạo lại Hồ sơ nghiên cứu — chạy lại lần nghiên cứu chung, thay cả Danh mục gợi ý đang chờ (AD-19);
// - `inspirationId`: Tạo lại Hồ sơ nghiên cứu của Cảm hứng (FR-2) — thay bản đang chờ duyệt;
// - `part`: Tạo lại một phần của Bộ nội dung (Story 5.7, kể cả phần đã Duyệt) — các phần khác giữ nguyên.
export function RegenerateDialog({
  productId,
  inspirationId,
  part,
  variant = "ghost",
}: {
  productId?: string;
  inspirationId?: string;
  part?: { suggestionId: string; title: string; approved: boolean };
  variant?: "ghost" | "outline" | "default";
}) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [pending, startTransition] = useTransition();

  const addChip = (chip: string) =>
    setInstruction((s) => (s.trim() ? `${s.trim()}, ${chip}` : chip).slice(0, SUGGESTION_INSTRUCTION_MAX));

  const confirm = () =>
    startTransition(async () => {
      const res = await callAction(() =>
        part
          ? regenerateSuggestion({ id: part.suggestionId, instruction })
          : inspirationId
            ? researchInspiration({ inspirationId, instruction })
            : researchProduct({ productId: productId ?? "", instruction }),
      );
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      setInstruction("");
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button type="button" variant={variant} size="lg" className="w-full lg:w-auto" />}>
        <RefreshCw aria-hidden />
        Tạo lại
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Tạo lại {part ? part.title : "Hồ sơ nghiên cứu"}</DialogTitle>
          <DialogDescription>
            {inspirationId
              ? "AI nghiên cứu lại Cảm hứng từ đầu. Bản đang chờ duyệt sẽ được thay bằng bản mới."
              : !part
              ? "AI nghiên cứu lại từ đầu. Hồ sơ và Danh mục gợi ý đang chờ duyệt sẽ được thay bằng bản mới."
              : part.approved
                ? "AI viết bản mới để bạn duyệt lại. Bản đã duyệt vẫn giữ cho tới khi bạn Duyệt bản mới; các phần khác không đổi."
                : "AI viết bản mới thay bản này. Các phần khác của Bộ nội dung giữ nguyên."}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={id}>Chỉ dẫn cho AI (không bắt buộc)</FieldLabel>
          <Textarea
            id={id}
            rows={2}
            maxLength={SUGGESTION_INSTRUCTION_MAX}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-space-sm" aria-label="Chỉ dẫn mẫu">
          {REGENERATE_CHIPS.map((chip) => (
            <Button key={chip} type="button" variant="outline" size="lg" className="rounded-full" onClick={() => addChip(chip)}>
              {chip}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="lg" disabled={pending} />}>Huỷ</DialogClose>
          <Button type="button" size="lg" disabled={pending} onClick={confirm}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? "Đang gửi…" : "Tạo lại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
