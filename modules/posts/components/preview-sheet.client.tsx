"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { readingMinutes, withHeadingIds } from "@/platform/html/content";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { ARTICLE_RESERVED_IDS } from "@/modules/posts/constants";
import type { ArticlePost } from "@/modules/posts/types";
import { PostArticle } from "@/modules/posts/components/post-article";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";

// PreviewSheet (UX-DR53): Sheet toàn màn render đúng thân trang bài public (`PostArticle`, AD-11) từ giá trị form —
// kể cả thay đổi chưa lưu. Thân bài qua `sanitizePostHtml` ngay ở client với cùng allowlist khi ghi/render (AD-22);
// mục lục và phút đọc tính trên HTML đã lọc như trang thật. Không có bài liên quan (cần dữ liệu đã xuất bản).
// Nhãn "Bản xem trước" dính đỉnh nền `inverse-surface`.
export function PreviewSheet({
  open,
  onOpenChange,
  post,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Omit<ArticlePost, "readingMinutes">;
  content: string;
}) {
  const body = useMemo(() => {
    if (!open) return null;
    const clean = sanitizePostHtml(content);
    return { ...withHeadingIds(clean, ARTICLE_RESERVED_IDS), minutes: readingMinutes(clean) };
  }, [open, content]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-dvh gap-0 overflow-y-auto border-0 bg-surface p-0 text-base text-on-surface data-[side=bottom]:h-dvh"
      >
        <div className="sticky top-0 z-20 flex min-h-touch-target items-center justify-between gap-space-sm bg-inverse-surface py-1 pr-1 pl-margin text-inverse-on-surface">
          <SheetTitle className="text-label-md text-inverse-on-surface">Bản xem trước</SheetTitle>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="lg"
                className="text-inverse-on-surface hover:bg-inverse-on-surface/10 hover:text-inverse-on-surface"
              />
            }
          >
            <X aria-hidden /> Đóng
          </SheetClose>
        </div>
        {body && (
          <PostArticle
            post={{ ...post, readingMinutes: body.minutes }}
            html={body.html}
            headings={body.headings}
            related={[]}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
