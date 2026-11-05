"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { PostType } from "@/generated/prisma/enums";
import type { Result } from "@/platform/errors";
import type { CategoryOption } from "@/modules/categories/types";
import { CategorySelect } from "@/modules/categories/components/category-select";
import type { NewPostInput } from "@/modules/posts/schema";
import { PostTypePicker } from "@/modules/posts/components/post-type-picker.client";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

// Tạo Bài web mới (`/cms/bai-viet/moi`): AI viết bản nháp theo chủ đề, hoặc bản nháp trống; xong chuyển sang
// trình soạn. `createPost` (action AI cũ ở `app/cms/actions.ts` tới Epic 4) do Screen truyền vào.
export function NewPostForm({
  categories,
  createPost,
}: {
  categories: CategoryOption[];
  createPost: (input: NewPostInput) => Promise<Result<{ id: string }>>;
}) {
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("GOM_LINK");
  const [categoryId, setCategoryId] = useState("");
  const [topic, setTopic] = useState("");
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"ai" | "blank">("ai");

  const submit = (useAi: boolean) => {
    setMode(useAi ? "ai" : "blank");
    startTransition(async () => {
      const res = await callAction(() => createPost({ postType, categoryId, topic, useAi }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(useAi ? "AI đã viết xong bản nháp" : "Đã tạo bản nháp");
      router.push(`/cms/bai-viet/${res.id}`);
    });
  };

  return (
    <div className="space-y-space-lg">
      <Field>
        <FieldLabel id="new-post-type-label">Loại bài</FieldLabel>
        <PostTypePicker value={postType} onChange={setPostType} labelledBy="new-post-type-label" />
      </Field>
      <Field>
        <FieldLabel htmlFor="new-post-category">Danh mục</FieldLabel>
        <CategorySelect
          id="new-post-category"
          options={categories}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="new-post-topic">Chủ đề / ý tưởng</FieldLabel>
        <Textarea
          id="new-post-topic"
          rows={3}
          placeholder="VD: Đồ decor phòng trọ dưới 100k cho sinh viên"
          aria-describedby="new-post-topic-hint"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <FieldDescription id="new-post-topic-hint">Bắt buộc khi AI viết. Bản nháp trống lấy chủ đề làm tiêu đề.</FieldDescription>
      </Field>

      <div className="space-y-space-sm">
        <Button size="lg" className="w-full" disabled={pending} onClick={() => submit(true)}>
          {pending && mode === "ai" ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {pending && mode === "ai" ? "AI đang viết… (20–40 giây)" : "AI viết bài"}
        </Button>
        <Button variant="ghost" size="lg" className="w-full" disabled={pending} onClick={() => submit(false)}>
          {pending && mode === "blank" && <Loader2 className="animate-spin" aria-hidden />}
          Tạo bản nháp trống, tự viết
        </Button>
      </div>
    </div>
  );
}
