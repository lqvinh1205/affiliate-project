"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

export type ThreadsInput = { title: string; content: string; slug: string };
export type ThreadsAction = (input: ThreadsInput) => Promise<Result<{ posts: string[] }>>;

// Chuỗi Threads bằng AI (action cũ `runThreads`, giữ nguyên tới Epic 4): đọc giá trị form lúc bấm.
export function PostThreads({
  getInput,
  threads,
  published,
}: {
  getInput: () => ThreadsInput;
  threads: ThreadsAction;
  published: boolean;
}) {
  const [posts, setPosts] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const res = await callAction(() => threads(getInput()));
      if (!res.ok) return void toast.error(res.error);
      setPosts(res.posts);
    });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép");
    } catch {
      toast.error("Chưa sao chép được, thử chọn và sao chép tay");
    }
  };

  return (
    <div className="space-y-space-md">
      <p className="text-body-sm text-on-surface-variant">
        AI chia bài thành chuỗi bài ngắn cho Threads/Facebook, bài cuối chứa link về website.
        {!published && " Bài chưa xuất bản nên link sẽ chưa mở được."}
      </p>
      <Button type="button" variant="outline" size="lg" className="w-full" disabled={pending} onClick={run}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquareText aria-hidden />}
        {pending ? "AI đang viết chuỗi…" : posts.length ? "Tạo lại chuỗi Threads" : "Tạo chuỗi Threads"}
      </Button>
      {posts.length > 0 && (
        <>
          <ol className="space-y-2" aria-live="polite">
            {posts.map((t, i) => (
              <li key={i} className="flex gap-3 rounded-xl border p-3">
                <span className="text-label-md text-primary">{i + 1}</span>
                <p className="flex-1 whitespace-pre-wrap text-body-sm">{t}</p>
                <Button type="button" variant="ghost" size="icon-lg" aria-label={`Sao chép bài ${i + 1}`} onClick={() => copy(t)}>
                  <Copy aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => copy(posts.join("\n\n"))}>
            <Copy aria-hidden /> Sao chép toàn bộ chuỗi
          </Button>
        </>
      )}
    </div>
  );
}
