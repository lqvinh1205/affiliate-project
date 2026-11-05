"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, Gauge, Loader2, MessageSquareText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost, runSeoCheck, runThreads, savePost, setPostStatus } from "@/app/cms/actions";
import type { CategoryOption } from "@/modules/categories/types";
import { ProductStatusBadge } from "@/modules/products/components/product-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SeoReport } from "@/lib/ai";
import type { PostInput } from "@/lib/post-input";
import { CategoryPicker, CategorySelect, Field } from "./fields";
import { SeoScore } from "./seo-score";
import { StatusBadge } from "./status-badge";

type Status = "DRAFT" | "PUBLISHED";

const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function Counter({ value, max, min }: { value: string; max: number; min?: number }) {
  const n = value.length;
  const bad = n > max || (min !== undefined && n > 0 && n < min);
  return <span className={bad ? "text-destructive" : undefined}>{n}/{max}</span>;
}

type LinkedProduct = { id: string; name: string; hidden: boolean };

export function PostEditor({
  id,
  initial,
  initialStatus,
  products,
  categories,
}: {
  id: string;
  initial: PostInput;
  initialStatus: Status;
  products: LinkedProduct[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [keywords, setKeywords] = useState(initial.seoKeywords.join(", "));
  const [seo, setSeo] = useState<SeoReport | null>(null);
  const [threads, setThreads] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const set = (patch: Partial<PostInput>) => setPost((p) => ({ ...p, ...patch }));
  const current = (): PostInput => ({ ...post, tags: toList(tags), seoKeywords: toList(keywords) });

  // Chạy một action, khóa các nút trong lúc chờ, báo lỗi bằng toast.
  const act = (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    startTransition(async () => {
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    });
  };

  const save = async () => {
    const res = await savePost(id, current());
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    set({ slug: res.slug });
    return true;
  };

  const onSave = () => act("save", async () => {
    if (await save()) toast.success("Đã lưu");
  });

  const onToggleStatus = () => act("status", async () => {
    const next: Status = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    if (next === "PUBLISHED" && !(await save())) return;
    const res = await setPostStatus(id, next);
    if (!res.ok) return void toast.error(res.error);
    setStatus(next);
    toast.success(next === "PUBLISHED" ? "Đã xuất bản 🎉" : "Đã gỡ bài về nháp");
  });

  const onDelete = () => {
    if (!confirm("Xóa vĩnh viễn bài viết này?")) return;
    act("delete", async () => {
      const res = await deletePost(id);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã xóa bài");
      router.push("/cms");
    });
  };

  const onSeo = () => act("seo", async () => {
    const res = await runSeoCheck({
      title: post.title,
      seoTitle: post.seoTitle ?? "",
      seoDescription: post.seoDescription ?? "",
      content: post.content,
      keywords: toList(keywords),
    });
    if (!res.ok) return void toast.error(res.error);
    setSeo(res.report);
  });

  const onThreads = () => act("threads", async () => {
    const res = await runThreads({ title: post.title, content: post.content, slug: post.slug });
    if (!res.ok) return void toast.error(res.error);
    setThreads(res.posts);
  });

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Đã sao chép");
  };

  return (
    <div className="space-y-4">
      {/* Thanh thao tác */}
      <div className="sticky top-14 z-20 -mx-4 flex items-center gap-2 border-b bg-muted/90 px-4 py-2 backdrop-blur">
        <StatusBadge status={status} />
        {status === "PUBLISHED" && (
          <Link
            href={`/bai-viet/${post.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Xem <ExternalLink className="size-3" />
          </Link>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="lg" disabled={!!busy} onClick={onSave}>
            {busy === "save" && <Loader2 className="animate-spin" />}
            Lưu
          </Button>
          <Button size="lg" variant={status === "PUBLISHED" ? "secondary" : "default"} disabled={!!busy} onClick={onToggleStatus}>
            {busy === "status" && <Loader2 className="animate-spin" />}
            {status === "PUBLISHED" ? "Gỡ bài" : "Xuất bản"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="grid h-10! w-full grid-cols-4">
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-5 pt-4">
          <Field label="Tiêu đề" hint={<Counter value={post.title} max={70} />}>
            <Textarea rows={2} value={post.title} onChange={(e) => set({ title: e.target.value })} className="bg-background text-base font-semibold" />
          </Field>
          <Field label="Chuyên mục">
            <CategoryPicker value={post.category} onChange={(category) => set({ category })} />
          </Field>
          <Field label="Danh mục" hint="bài hiện ở trang Danh mục khi đã xuất bản">
            <CategorySelect value={post.categoryId} onChange={(categoryId) => set({ categoryId })} options={categories} />
          </Field>
          <Field label="Đường dẫn (slug)" hint="để trống = tạo từ tiêu đề">
            <Input value={post.slug} onChange={(e) => set({ slug: e.target.value })} className="h-10 bg-background font-mono text-sm" />
          </Field>
          <Field label="Tóm tắt" hint={<Counter value={post.excerpt ?? ""} max={200} />}>
            <Textarea rows={2} value={post.excerpt ?? ""} onChange={(e) => set({ excerpt: e.target.value })} className="bg-background" />
          </Field>
          <Field label="Ảnh đại diện" hint="trống = dùng ảnh sản phẩm đầu tiên">
            <Input inputMode="url" placeholder="https://down-vn.img.susercontent.com/..." value={post.featuredImage ?? ""} onChange={(e) => set({ featuredImage: e.target.value })} className="h-10 bg-background" />
          </Field>
          <Field label="Nội dung">
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Soạn HTML</TabsTrigger>
                <TabsTrigger value="preview">Xem trước</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="pt-2">
                <Textarea rows={18} value={post.content} onChange={(e) => set({ content: e.target.value })} className="bg-background font-mono text-xs leading-relaxed" />
              </TabsContent>
              <TabsContent value="preview" className="pt-2">
                {/* sandbox không cho chạy script: an toàn kể cả khi HTML chưa được lọc */}
                <iframe
                  title="Xem trước"
                  sandbox=""
                  className="h-[28rem] w-full rounded-md border bg-white"
                  srcDoc={`<style>body{font:16px/1.65 system-ui,sans-serif;color:#2b2522;padding:12px 16px;margin:0}h2{font-size:1.3em;margin:1.4em 0 .4em}h3{font-size:1.1em}</style>${post.content}`}
                />
              </TabsContent>
            </Tabs>
          </Field>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" disabled={!!busy} onClick={onDelete}>
            <Trash2 /> Xóa bài viết
          </Button>
        </TabsContent>

        <TabsContent value="seo" className="space-y-5 pt-4">
          <Field label="Meta title" hint={<Counter value={post.seoTitle ?? ""} max={60} />}>
            <Input value={post.seoTitle ?? ""} onChange={(e) => set({ seoTitle: e.target.value })} className="h-10 bg-background" />
          </Field>
          <Field label="Meta description" hint={<Counter value={post.seoDescription ?? ""} min={140} max={160} />}>
            <Textarea rows={3} value={post.seoDescription ?? ""} onChange={(e) => set({ seoDescription: e.target.value })} className="bg-background" />
          </Field>
          <Field label="Từ khóa SEO" hint="cách nhau bằng dấu phẩy">
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-10 bg-background" />
          </Field>
          <Field label="Tag" hint="cách nhau bằng dấu phẩy">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-10 bg-background" />
          </Field>
          <Button variant="outline" size="lg" className="h-11 w-full" disabled={!!busy} onClick={onSeo}>
            {busy === "seo" ? <Loader2 className="animate-spin" /> : <Gauge />}
            {busy === "seo" ? "AI đang chấm điểm…" : "Chấm điểm SEO bằng AI"}
          </Button>
          {seo && (
            <div className="flex flex-col items-center gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-start">
              <SeoScore score={seo.score} className="shrink-0" />
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {seo.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="pt-4">
          {/* Chỉ đọc: Sản phẩm sửa trong Kho; gắn/bỏ/sắp Sản phẩm vào bài là Epic 3. */}
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bài chưa gắn Sản phẩm nào.</p>
          ) : (
            <ul className="divide-y rounded-md border bg-background">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-medium">{p.name}</span>
                    <ProductStatusBadge hidden={p.hidden} />
                  </span>
                  <Link
                    href={`/cms/san-pham/${p.id}`}
                    className="inline-flex min-h-11 shrink-0 items-center text-sm text-primary hover:underline"
                  >
                    Sửa trong Kho
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Gắn Sản phẩm từ kho sẽ có ở bản sau.</p>
        </TabsContent>

        <TabsContent value="threads" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            AI chia bài thành chuỗi bài ngắn cho Threads/Facebook, bài cuối chứa link về website.
            {status !== "PUBLISHED" && " Lưu ý: bài chưa xuất bản nên link sẽ chưa mở được."}
          </p>
          <Button variant="outline" size="lg" className="h-11 w-full" disabled={!!busy} onClick={onThreads}>
            {busy === "threads" ? <Loader2 className="animate-spin" /> : <MessageSquareText />}
            {busy === "threads" ? "AI đang viết chuỗi…" : threads.length ? "Tạo lại chuỗi Threads" : "Tạo chuỗi Threads"}
          </Button>
          {threads.length > 0 && (
            <>
              <ol className="space-y-2">
                {threads.map((t, i) => (
                  <li key={i} className="flex gap-3 rounded-md border bg-background p-3">
                    <span className="font-heading text-sm font-bold text-primary">{i + 1}</span>
                    <p className="flex-1 whitespace-pre-wrap text-sm">{t}</p>
                    <Button variant="ghost" size="icon-sm" aria-label="Sao chép" onClick={() => copy(t)}>
                      <Copy />
                    </Button>
                  </li>
                ))}
              </ol>
              <Button variant="secondary" className="h-10 w-full" onClick={() => copy(threads.join("\n\n"))}>
                <Copy /> Sao chép toàn bộ chuỗi
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
