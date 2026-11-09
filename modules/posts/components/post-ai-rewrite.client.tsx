"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { visibleText } from "@/platform/html/content";
import { POST_REWRITE_INSTRUCTION_MAX, REWRITE_EMPTY } from "@/modules/posts/constants";
import type { RewritePostInput } from "@/modules/posts/schema";
import type { RewrittenPost, RiskWarning } from "@/modules/posts/types";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export type RewriteDraft = Omit<RewrittenPost, "riskWarnings">;
export type RewriteAction = (input: RewritePostInput) => Promise<Result<RewrittenPost>>;

// Phần form mà AI chỉnh sửa đọc và điền (`UseFormReturn` của PostForm / ImportPostForm khớp kiểu này).
type RewriteForm = {
  getValues: () => RewriteDraft;
  setValue: (name: keyof RewriteDraft, value: string, options: { shouldDirty: boolean }) => void;
};

// Trạng thái "AI chỉnh sửa" của một form bài: điền kết quả như sửa tay (`shouldDirty` — UnsavedChangesGuard bắt),
// hoàn tác về đúng giá trị và cảnh báo trước lần viết lại gần nhất. PostEditor chỉ đọc `value` lúc mount nên mỗi lần
// điền từ ngoài đổi `editorKey` và bỏ câu đang bôi (`highlight`) để editor mount lại không tìm câu cũ.
// `warnings` là null khi chưa viết lại lần nào (nơi dùng hiện cảnh báo của chính nó).
export function usePostRewrite(form: RewriteForm) {
  const [warnings, setWarnings] = useState<RiskWarning[] | null>(null);
  const previousWarnings = useRef<RiskWarning[] | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [highlight, setHighlight] = useState<{ sentence: string; key: number } | null>(null);

  const fill = (draft: RewriteDraft) => {
    for (const name of ["title", "excerpt", "content"] as const) form.setValue(name, draft[name], { shouldDirty: true });
    setHighlight(null);
    setEditorKey((k) => k + 1);
  };

  return {
    editorKey,
    warnings,
    highlight,
    highlightWarning: (w: RiskWarning) => setHighlight({ sentence: w.sentence, key: Date.now() }),
    getDraft: (): RewriteDraft => {
      const { title, excerpt, content } = form.getValues();
      return { title, excerpt, content };
    },
    onApply: ({ riskWarnings, ...draft }: RewrittenPost) => {
      previousWarnings.current = warnings;
      setWarnings(riskWarnings);
      fill(draft);
    },
    onUndo: (previous: RewriteDraft) => {
      setWarnings(previousWarnings.current);
      fill(previous);
    },
  };
}

// AiRewriteDialog (FR-40): chỉ dẫn tuỳ chọn → `posts.rewritePostDraft` viết lại tiêu đề, tóm tắt, thân bài đang có
// trong form (chưa cần lưu). Thành công: `onApply` điền form, Toast "Đã viết lại — chưa lưu" + "Hoàn tác" (`onUndo`
// nhận lại đúng giá trị trước lần viết lại này). Lỗi: Toast, form không đổi. Không lưu, không qua Duyệt (ngoại lệ AD-9).
export function PostAiRewrite({
  rewrite,
  getDraft,
  onApply,
  onUndo,
}: {
  rewrite: RewriteAction;
  getDraft: () => RewriteDraft;
  onApply: (result: RewrittenPost) => void;
  onUndo: (previous: RewriteDraft) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    const previous = getDraft();
    if (!visibleText(previous.content)) return void toast.error(REWRITE_EMPTY);
    startTransition(async () => {
      const res = await callAction(() => rewrite({ ...previous, instruction }));
      if (!res.ok) return void toast.error(res.error);
      const { title, excerpt, content, riskWarnings } = res;
      onApply({ title, excerpt, content, riskWarnings });
      setOpen(false);
      setInstruction("");
      toast.success("Đã viết lại — chưa lưu", {
        duration: 10_000,
        action: { label: "Hoàn tác", onClick: () => onUndo(previous) },
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button type="button" variant="outline" size="lg" className="w-full lg:w-auto" />}>
        <Sparkles aria-hidden />
        AI chỉnh sửa
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>AI chỉnh sửa bài</DialogTitle>
          <DialogDescription>
            AI viết lại tiêu đề, tóm tắt và thân bài theo Hồ sơ phong cách Website. Kết quả chỉ điền vào form, chưa lưu;
            hoàn tác được ngay sau đó.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={id}>Chỉ dẫn cho AI (không bắt buộc)</FieldLabel>
          <Textarea
            id={id}
            rows={2}
            maxLength={POST_REWRITE_INSTRUCTION_MAX}
            placeholder="VD: ngắn gọn hơn, thêm mẹo cho phòng trọ"
            aria-describedby={`${id}-hint`}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <FieldDescription id={`${id}-hint`}>
            {instruction.length}/{POST_REWRITE_INSTRUCTION_MAX} ký tự. Có thể mất tới 90 giây.
          </FieldDescription>
        </Field>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" size="lg" disabled={pending} />}>Huỷ</DialogClose>
          <Button type="button" size="lg" disabled={pending} onClick={confirm}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? "AI đang viết…" : "Viết lại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
