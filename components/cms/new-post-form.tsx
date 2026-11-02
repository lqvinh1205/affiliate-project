"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createPost } from "@/app/cms/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryKey } from "@/lib/categories";
import type { ProductInput } from "@/lib/post-input";
import { CategoryPicker, Field, ProductFields, emptyProduct } from "./fields";

export function NewPostForm() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryKey>("GOM_LINK");
  const [topic, setTopic] = useState("");
  const [products, setProducts] = useState<ProductInput[]>([emptyProduct()]);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"ai" | "blank">("ai");

  const submit = (useAi: boolean) => {
    setMode(useAi ? "ai" : "blank");
    startTransition(async () => {
      // Bỏ các ô sản phẩm để trống hoàn toàn.
      const filled = products.filter((p) => p.name || p.affiliateUrl);
      const res = await createPost({ category, topic, products: filled, useAi });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(useAi ? "AI đã viết xong bản nháp" : "Đã tạo bản nháp");
      router.push(`/cms/posts/${res.id}`);
    });
  };

  return (
    <div className="space-y-6">
      <Field label="Chuyên mục">
        <CategoryPicker value={category} onChange={setCategory} />
      </Field>
      <Field label="Chủ đề / ý tưởng" hint="không bắt buộc">
        <Textarea
          rows={3}
          placeholder="VD: Đồ decor phòng trọ dưới 100k cho sinh viên"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-background"
        />
      </Field>
      <Field label="Sản phẩm">
        <ProductFields products={products} onChange={setProducts} />
      </Field>

      <div className="space-y-2">
        <Button size="lg" className="h-12 w-full text-base" disabled={pending} onClick={() => submit(true)}>
          {pending && mode === "ai" ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {pending && mode === "ai" ? "AI đang viết… (20–40 giây)" : "AI viết bài"}
        </Button>
        <Button variant="ghost" className="h-10 w-full" disabled={pending} onClick={() => submit(false)}>
          {pending && mode === "blank" && <Loader2 className="animate-spin" />}
          Tạo bản nháp trống, tự viết
        </Button>
      </div>
    </div>
  );
}
