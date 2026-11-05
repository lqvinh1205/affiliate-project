import { readFileSync } from "node:fs";
import path from "node:path";
import { Sparkles } from "lucide-react";
import { parseColorTokens } from "@/platform/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/modules/posts/components/post-card";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { AffiliateLink } from "@/modules/products/components/affiliate-link";
import { ProductCard } from "@/modules/products/components/product-card";
import { ProductStatusBadge } from "@/modules/products/components/product-status-badge";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { SeoScore } from "@/modules/posts/components/seo-score";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Pagination } from "@/app/(site)/_components/pagination";
import { ConfirmDialogDemo, FormDemo } from "@/app/cms/styleguide/_components/form-demo.client";
import { ToastDemo } from "@/app/cms/styleguide/_components/toast-demo.client";
import { UploadDemo } from "@/app/cms/styleguide/_components/upload-demo.client";

// Màu đọc thẳng từ `app/globals.css` (một nguồn): hiện giá trị light và dark cạnh nhau
// dù trình duyệt đang ở chế độ nào. Component bên dưới render theo chế độ hệ thống.
const COLORS = parseColorTokens(readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8"));

const SHADCN_MAP = [
  ["background", "surface"],
  ["foreground", "on-surface"],
  ["card / popover", "surface-container-lowest"],
  ["primary", "primary"],
  ["primary-foreground", "on-primary"],
  ["secondary", "surface-container-low"],
  ["muted", "surface-container"],
  ["muted-foreground", "on-surface-variant"],
  ["accent", "surface-container-high"],
  ["border / input", "outline-variant"],
  ["ring", "primary"],
  ["destructive", "error"],
] as const;

// Tên lớp viết nguyên văn để Tailwind quét được ([GD-29]).
const TYPE_SCALE = [
  ["headline-display", "text-headline-display", "36/46 · 600"],
  ["headline-display-mobile", "text-headline-display-mobile", "28/36 · 600"],
  ["headline-lg", "text-headline-lg", "26/34 · 600"],
  ["headline-lg-mobile", "text-headline-lg-mobile", "22/30 · 600"],
  ["headline-md", "text-headline-md", "19/26 · 600"],
  ["headline-sm", "text-headline-sm", "16/22 · 600"],
  ["body-lead", "text-body-lead", "17/28 · 400"],
  ["body-regular", "text-body-regular", "15/25 · 400"],
  ["body-sm", "text-body-sm", "13/20 · 400"],
  ["label-md", "text-label-md", "14/18 · 500"],
  ["label-sm", "text-label-sm", "12/16 · 500"],
  ["label-meta", "text-label-meta", "11/14 · 600"],
] as const;

const ROUNDED = [
  ["sm", "rounded-sm", "0.125rem"],
  ["DEFAULT", "rounded", "0.25rem"],
  ["md", "rounded-md", "0.375rem"],
  ["lg", "rounded-lg", "0.5rem"],
  ["xl", "rounded-xl", "0.75rem"],
  ["full", "rounded-full", "9999px"],
] as const;

const SPACING = [
  ["space-xs", "w-space-xs", "0.25rem"],
  ["space-sm", "w-space-sm", "0.5rem"],
  ["space-md", "w-space-md", "1rem"],
  ["space-lg", "w-space-lg", "1.5rem"],
  ["space-xl", "w-space-xl", "2.5rem"],
  ["gutter", "w-gutter", "1rem"],
  ["gutter-desktop", "w-gutter-desktop", "1.5rem"],
  ["margin", "w-margin", "1rem"],
  ["margin-tablet", "w-margin-tablet", "2rem"],
  ["margin-desktop", "w-margin-desktop", "3rem"],
  ["touch-target", "w-touch-target", "44px"],
] as const;

const ELEVATION = [
  ["Mức 0 · shadow-level-0", "bg-surface-container-lowest shadow-level-0"],
  ["Mức 1 · shadow-level-1", "bg-surface-container-lowest shadow-level-1"],
  ["Thanh dính trên · sticky-bar shadow-sticky-top", "sticky-bar shadow-sticky-top"],
  ["Thanh dính đáy · sticky-bar shadow-sticky-bottom", "sticky-bar shadow-sticky-bottom"],
] as const;

const SAMPLE_PRODUCT = {
  id: "p1",
  name: "Đèn ngủ vintage để bàn ánh vàng ấm, nhiều mẫu",
  image: null,
  priceText: "~89.000đ",
  priceUpdatedAt: new Date("2026-11-04T03:00:00Z"),
  affiliateUrl: "https://shopee.vn",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-space-md">
      <h2 className="text-headline-md">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ hex }: { hex: string | undefined }) {
  return <span className="block size-8 rounded-md ring-1 ring-border" style={{ backgroundColor: hex }} title={hex} />;
}

export function StyleguideScreen() {
  return (
    <div className="space-y-space-xl">
      <header>
        <h1 className="text-headline-lg-mobile lg:text-headline-display">Styleguide</h1>
        <p className="text-body-regular text-on-surface-variant">
          Mẹo Vặt Cuộc Sống · token và component. Sáng/tối theo hệ điều hành.
        </p>
      </header>

      <Section title="Màu">
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-space-md bg-surface-container-low px-space-md py-space-sm text-label-sm text-on-surface-variant">
            <span>Token</span>
            <span className="w-8 text-center">Sáng</span>
            <span className="w-8 text-center">Tối</span>
          </div>
          <ul className="divide-y">
            {COLORS.map((c) => (
              <li key={c.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-space-md px-space-md py-space-sm">
                <div className="min-w-0">
                  <code className="block text-label-md">{c.name}</code>
                  <code className="block text-label-sm text-on-surface-variant">
                    {c.light} · {c.dark ?? "—"}
                  </code>
                </div>
                <Swatch hex={c.light} />
                <Swatch hex={c.dark} />
              </li>
            ))}
          </ul>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Biến shadcn là alias tới token:
        </p>
        <ul className="grid gap-x-space-lg gap-y-1 text-body-sm sm:grid-cols-2">
          {SHADCN_MAP.map(([from, to]) => (
            <li key={from}>
              <code>{from}</code> → <code className="text-primary">{to}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography · Be Vietnam Pro">
        <ul className="space-y-space-md">
          {TYPE_SCALE.map(([name, cls, spec]) => (
            <li key={name} className="space-y-1">
              <p className="text-label-sm text-on-surface-variant">
                {name} · {spec}
              </p>
              <p className={cls}>Mẹo tẩy vết ố vàng nồi chiên: ẩm, ễnh, ộp, ướt, quẩy</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Bo góc">
        <div className="flex flex-wrap gap-space-md">
          {ROUNDED.map(([name, cls, value]) => (
            <div key={name} className="space-y-1 text-center">
              <div className={`size-16 border-2 border-primary bg-primary-fixed ${cls}`} />
              <p className="text-label-sm">{name}</p>
              <p className="text-label-meta text-on-surface-variant">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Khoảng cách">
        <ul className="space-y-space-sm">
          {SPACING.map(([name, cls, value]) => (
            <li key={name} className="flex items-center gap-space-md">
              <span className={`h-4 shrink-0 rounded-sm bg-primary ${cls}`} />
              <span className="text-label-md">{name}</span>
              <span className="text-label-sm text-on-surface-variant">{value}</span>
            </li>
          ))}
          <li className="text-body-sm text-on-surface-variant">
            container-max: 1120px (<code>max-w-container-max</code>)
          </li>
        </ul>
      </Section>

      <Section title="Độ nổi">
        <div className="grid gap-space-lg rounded-xl bg-surface p-space-md sm:grid-cols-2">
          {ELEVATION.map(([name, cls]) => (
            <div key={name} className={`flex h-20 items-center justify-center rounded-xl p-space-sm text-center text-label-sm ${cls}`}>
              {name}
            </div>
          ))}
        </div>
        <p className="text-body-sm text-on-surface-variant">Chế độ tối bỏ bóng; phân lớp bằng nền surface-container-*.</p>
      </Section>

      <Section title="Nút, badge, input, Toast">
        <div className="flex flex-wrap items-center gap-space-sm">
          <Button size="lg">
            <Sparkles /> Sinh bài viết
          </Button>
          <Button size="lg" variant="secondary">Lưu nháp</Button>
          <Button size="lg" variant="outline">Xem trước</Button>
          <Button size="lg" variant="ghost">Huỷ</Button>
          <Button size="lg" variant="destructive">Xoá</Button>
          <ToastDemo />
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <PostTypeBadge postType="MEO_VAT" />
          <PostTypeBadge postType="GOM_LINK" />
          <ProductStatusBadge hidden={false} />
          <ProductStatusBadge hidden />
        </div>
        <Input placeholder="Dán link affiliate Shopee..." className="h-11 max-w-md" />
      </Section>

      <Section title="Form CMS: Field, CmsForm, ConfirmDialog">
        <FormDemo />
        <ConfirmDialogDemo />
      </Section>

      <Section title="UploadField (single, append)">
        <UploadDemo />
      </Section>

      <Section title="Thẻ bài viết">
        <div className="grid gap-x-space-lg gap-y-space-xl sm:grid-cols-2">
          <PostCard
            post={{
              slug: "meo-tay-vet-o-vang-noi-chien-khong-dau",
              title: "Mẹo tẩy vết ố vàng nồi chiên không dầu chỉ với baking soda",
              excerpt: "Hai nguyên liệu có sẵn trong bếp giúp nồi chiên sạch bong sau 15 phút.",
              featuredImage: null,
              postType: "MEO_VAT",
              readingMinutes: 4,
              publishedAt: new Date("2026-11-01T03:00:00Z"),
            }}
          />
          <PostCard
            post={{
              slug: "tong-hop-do-decor-phong-ngu-han-quoc-gia-re",
              title: "Tổng hợp đồ decor phòng ngủ phong cách Hàn Quốc dưới 100k",
              excerpt: "Đèn ngủ vintage, thảm nỉ be và tranh canvas biến căn phòng thành góc chill.",
              featuredImage: "https://down-vn.img.susercontent.com/file/anh-loi-de-thu-fallback",
              postType: "GOM_LINK",
              readingMinutes: 6,
              publishedAt: null,
            }}
          />
          <div className="sm:col-span-2">
            <PostCard
              variant="featured"
              post={{
                slug: "meo-tay-vet-o-vang-noi-chien-khong-dau",
                title: "PostCard featured: Mẹo tẩy vết ố vàng nồi chiên không dầu",
                excerpt: "Bài nổi bật Trang chủ: badge trên ảnh, tiêu đề lớn.",
                featuredImage: null,
                postType: "MEO_VAT",
                readingMinutes: 4,
                publishedAt: new Date("2026-11-01T03:00:00Z"),
              }}
            />
          </div>
          <PostCard
            variant="row"
            post={{
              slug: "tong-hop-do-decor-phong-ngu-han-quoc-gia-re",
              title: "PostCard row: thumbnail trái 80px",
              excerpt: null,
              featuredImage: null,
              postType: "GOM_LINK",
              readingMinutes: 6,
              publishedAt: new Date("2026-11-01T03:00:00Z"),
            }}
          />
          <div className="space-y-3">
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      </Section>

      <Section title="Sản phẩm và công bố affiliate">
        <p className="text-body-sm text-on-surface-variant">
          ProductCard *row* (bài viết) — cả thẻ là một AffiliateLink; ảnh lỗi tải dùng ImageFallback.
        </p>
        <div className="max-w-xl space-y-space-sm">
          <ProductCard product={SAMPLE_PRODUCT} />
          <ProductCard
            product={{ ...SAMPLE_PRODUCT, id: "p2", name: "Thảm nỉ trải sàn màu be (không có giá, ảnh lỗi)", priceText: null, image: "https://down-vn.img.susercontent.com/file/anh-loi" }}
          />
        </div>
        <p className="text-body-sm text-on-surface-variant">ProductCard *tile* (dải Trang chủ).</p>
        <div className="flex gap-space-md overflow-x-auto">
          <ProductCard variant="tile" product={SAMPLE_PRODUCT} />
          <ProductCard variant="tile" product={{ ...SAMPLE_PRODUCT, id: "p3", image: null }} />
        </div>
        <p className="text-body-sm">
          AffiliateLink chữ thường:{" "}
          <AffiliateLink href="https://shopee.vn" className="text-primary underline">
            Xem trên Shopee
          </AffiliateLink>
        </p>
        <AffiliateDisclosure />
        <AffiliateDisclosure variant="text" />
        <div className="relative size-20 overflow-hidden rounded-lg">
          <ImageFallback src={null} alt="Ảnh không tải được" fill sizes="80px" />
        </div>
      </Section>

      <Section title="Site · Breadcrumb, Pagination">
        <Breadcrumb label="Nhà bếp" />
        <Pagination base="/nha-bep" page={5} pages={10} />
        <Pagination base="/nha-bep" page={1} pages={3} />
      </Section>

      <Section title="CMS · Điểm SEO">
        <div className="flex flex-wrap gap-space-lg">
          <SeoScore score={92} />
          <SeoScore score={64} />
          <SeoScore score={35} />
        </div>
      </Section>
    </div>
  );
}
