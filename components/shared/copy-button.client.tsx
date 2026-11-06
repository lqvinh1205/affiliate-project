"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const COPIED_MS = 2000;

// CopyButton (UX-DR44, FR-19): một chạm sao chép; nút đổi "Đã sao chép" (icon check, màu `secondary`) 2 giây.
// `confirmUnapproved`: nội dung chưa Duyệt — chạm lần đầu hỏi "Nội dung này chưa duyệt. Vẫn sao chép?" (FR-22);
// đã xác nhận thì các lần sau chép ngay. `onCopied` chạy sau mỗi lần chép thành công (nơi dùng ghi mốc `firstCopiedAt`).
export function CopyButton({
  text,
  label = "Sao chép",
  confirmUnapproved = false,
  onCopied,
}: {
  text: string;
  // Nhãn đọc cho trình đọc màn hình (vd "Sao chép bài 2"); chữ hiện luôn là "Sao chép".
  label?: string;
  confirmUnapproved?: boolean;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied?.();
    } catch {
      toast.error("Chưa sao chép được, thử chọn và sao chép tay");
    }
  };

  const onClick = () => {
    if (confirmUnapproved && !confirmed) return setAsking(true);
    void copy();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={copied ? "Đã sao chép" : label}
        className="min-h-touch-target min-w-touch-target"
        onClick={onClick}
      >
        {copied ? <Check className="text-secondary" aria-hidden /> : <Copy aria-hidden />}
        <span className={copied ? "text-secondary" : undefined} aria-live="polite">
          {copied ? "Đã sao chép" : "Sao chép"}
        </span>
      </Button>
      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nội dung này chưa duyệt. Vẫn sao chép?</AlertDialogTitle>
            <AlertDialogDescription>AI viết nội dung này và bạn chưa Duyệt. Đọc lại trước khi đăng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <Button
              onClick={() => {
                setAsking(false);
                setConfirmed(true);
                void copy();
              }}
            >
              Sao chép
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
