import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { CategoryBadge } from "@/components/site/category-badge";
import { PostCard } from "@/components/site/post-card";
import { ProductCard } from "@/components/site/product-card";
import { AffiliateDisclosure } from "@/components/site/affiliate-disclosure";
import { SeoScore } from "@/components/cms/seo-score";

// Trang nội bộ duyệt design system dưới /cms (noindex, sau Basic Auth).
export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

const SWATCHES = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["primary", "bg-primary"],
  ["secondary", "bg-secondary"],
  ["accent", "bg-accent"],
  ["muted", "bg-muted"],
  ["meo-vat", "bg-meo-vat"],
  ["meo-vat-soft", "bg-meo-vat-soft"],
  ["gom-link", "bg-gom-link"],
  ["gom-link-soft", "bg-gom-link-soft"],
] as const;

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">Styleguide</h1>
          <p className="text-muted-foreground">Mẹo Vặt Cuộc Sống · design tokens & components</p>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Màu sắc</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="space-y-1.5">
              <div className={`h-16 rounded-sm ring-1 ring-border ${cls}`} />
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Typography</h2>
        <p className="font-heading text-4xl font-bold leading-tight">Mẹo tẩy vết ố vàng nồi chiên</p>
        <p className="font-heading text-2xl font-bold">Tổng hợp đồ decor phòng ngủ dưới 100k</p>
        <p className="max-w-prose leading-relaxed">
          Tiêu đề và thân bài đều dùng Be Vietnam Pro. Dấu chồng hiển thị rõ: ẩm,
          ễnh, ộp, ướt, quẩy, nghiêng. Đoạn văn giữ độ dài dòng thoải mái để đọc trên
          điện thoại.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Nút, badge & input</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">
            <Sparkles /> Sinh bài viết
          </Button>
          <Button size="lg" variant="secondary">Lưu nháp</Button>
          <Button size="lg" variant="outline">Xem trước</Button>
          <Button size="lg" variant="ghost">Hủy</Button>
          <CategoryBadge category="MEO_VAT" />
          <CategoryBadge category="GOM_LINK" />
        </div>
        <Input placeholder="Dán link affiliate Shopee..." className="h-11 max-w-md" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Thẻ bài viết</h2>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          <PostCard
            post={{
              slug: "meo-tay-vet-o-vang-noi-chien-khong-dau",
              title: "Mẹo tẩy vết ố vàng nồi chiên không dầu chỉ với baking soda",
              excerpt: "Hai nguyên liệu có sẵn trong bếp giúp nồi chiên sạch bong sau 15 phút.",
              category: "MEO_VAT",
              readingMinutes: 4,
            }}
          />
          <PostCard
            post={{
              slug: "tong-hop-do-decor-phong-ngu-han-quoc-gia-re",
              title: "Tổng hợp đồ decor phòng ngủ phong cách Hàn Quốc dưới 100k",
              excerpt: "Đèn ngủ vintage, thảm nỉ be và tranh canvas biến căn phòng thành góc chill.",
              category: "GOM_LINK",
              readingMinutes: 6,
            }}
          />
          <div className="space-y-3">
            <Skeleton className="aspect-[4/3] rounded-sm" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      </section>

      <section className="max-w-xl space-y-4">
        <h2 className="text-xl font-bold">Sản phẩm & công bố affiliate</h2>
        <ProductCard
          product={{
            name: "Đèn ngủ vintage để bàn ánh vàng ấm, nhiều mẫu",
            price: "89.000₫",
            affiliateUrl: "https://shopee.vn",
          }}
        />
        <AffiliateDisclosure />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">CMS · Điểm SEO</h2>
        <div className="flex gap-6">
          <SeoScore score={92} />
          <SeoScore score={64} />
          <SeoScore score={35} />
        </div>
      </section>
    </main>
  );
}
