# Kiến trúc codebase

> Phiên bản: Next.js 16.4.3, React 19.3.0, Prisma 7.10 (`@prisma/adapter-pg`), Zod 4.6, OpenAI SDK 7.47, Tailwind 4, Vitest 5.1 (`package.json`) · Nguồn: mã nguồn repo, spine `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md`, `node_modules/next/dist/docs/` · Kiểm lần cuối: 2026-11-05 @ 8771851

Tài liệu này là bản đồ của code **đang có**. Cấu trúc đích (spine AD-2, AD-17, Structural Seed) nằm ở mục [Dự kiến](#dự-kiến); spine thắng tài liệu này khi mâu thuẫn. Quy ước viết code xem `docs/quy-uoc-code.md`.

## Tóm tắt cho agent

- Ứng dụng là một Next.js App Router duy nhất, hai mặt: **site public** (`app/(site)/`) và **CMS** (`app/cms/`). Không có `app/api/`.
- Repo đang chuyển dần sang `app → modules → platform` (spine AD-2, AD-17). Epic nền đã xong: hạ tầng chung ở `platform/` (có unit test), ESLint chặn import sai tầng (`eslint.config.mjs`), schema tách ở `prisma/schema/`. **Chưa có `modules/`**: nghiệp vụ còn ở code cũ `lib/` (`ai`, `categories`, `post-input`, `posts`), `components/site|cms/`, `app/cms/actions.ts` — chờ chuyển theo `docs/cong-thuc/chuyen-code-cu.md`, không tạo file mới ở đó.
- Bật `cacheComponents` và `partialPrefetching` (`next.config.ts:9-10`). Đọc dữ liệu public bằng hàm `"use cache"` trong `lib/posts.ts` (code cũ, đích `modules/posts/queries.ts`), không truy vấn `db` trực tiếp trong trang public.
- Mọi ghi dữ liệu đi qua Server Action trong `app/cms/actions.ts`, bọc bởi `run()` (`platform/auth/run.ts:5-14`, gọi `requireAdmin()`), rồi `updateTag(POSTS_TAG)` (`app/cms/actions.ts:112`, `:132`, `:143`).
- Auth là HTTP Basic: `proxy.ts` chặn `/cms` + `/api` ở tầng request; Server Action tự kiểm lại vì có thể bị POST thẳng (`platform/auth/require-admin.ts:5-10`).
- Prisma client sinh ra ở `generated/prisma` (`prisma/schema/_base.prisma:1-4`); import `db` từ `@/platform/db`, kiểu từ `@/generated/prisma/client`.
- HTML bài viết luôn đi qua `sanitizePostHtml` (`platform/html/sanitize.ts`) khi ghi (`app/cms/actions.ts:79`, `:106`) và lại lần nữa khi render (`app/(site)/bai-viet/[slug]/page.tsx:47`) — AD-22.
- Host ảnh cho phép khai báo một chỗ: `IMAGE_HOSTS` (`platform/images.ts:2`), dùng cho cả `next.config.ts:7` và validate form (`platform/validation/fields.ts:6-10`).
- Lớp AI duy nhất là `lib/ai.ts` (code cũ, đích `platform/ai` — chưa có); chỉ `app/cms/actions.ts` gọi nó.

## Tổng quan tầng

```mermaid
flowchart TD
  subgraph Request
    U["Trình duyệt"] --> P["proxy.ts<br/>matcher /cms, /api"]
  end
  subgraph Routes["app/"]
    S["app/(site)/*<br/>trang public tĩnh"]
    C["app/cms/*<br/>trang CMS động"]
    A["app/cms/actions.ts<br/>Server Actions (code cũ)"]
    M["app/sitemap.ts, app/robots.ts"]
  end
  subgraph Components["components/"]
    CS["components/site/* (code cũ)"]
    CC["components/cms/*<br/>client forms (code cũ)"]
    UI["components/ui/*<br/>shadcn base-ui"]
    JL["components/json-ld.tsx"]
  end
  subgraph Lib["lib/ (code cũ chờ chuyển)"]
    LP["lib/posts.ts<br/>truy vấn use cache"]
    LI["lib/post-input.ts<br/>zod schema"]
    LAI["lib/ai.ts"]
    LC["lib/categories.ts"]
  end
  subgraph Platform["platform/"]
    PD["db.ts"]
    PA["auth/ (basic-auth, require-admin, run)"]
    PH["html/ (sanitize, content)"]
    PV["validation/ (fields, errors), errors.ts"]
    PO["images, slug, format, site"]
  end
  DB[("PostgreSQL<br/>Prisma 7")]
  OAI["OpenAI Responses API"]

  U --> S
  P --> C
  P --> A
  S --> CS
  S --> JL
  S --> LP
  S --> PH
  M --> LP
  C --> CC
  C --> PD
  CC --> A
  CC --> UI
  CS --> UI
  A --> PA
  A --> LI
  A --> PH
  A --> LAI
  A --> PD
  LI --> PV
  LP --> PD
  PD --> DB
  LAI --> OAI
  S --> PO
  CC --> LC
  S --> LC
  M --> LC
  CS --> LC
  LP --> LC
  LAI --> LC
```

Ghi chú: trang CMS server (`app/cms/page.tsx:24`, `app/cms/posts/[id]/page.tsx:17`) gọi `db` trực tiếp, không qua `lib/posts.ts`, vì CMS cần cả bài nháp và không được cache. Đây là code cũ được miễn luật ESLint qua `LEGACY_APP_FILES` (`eslint.config.mjs:22-34`); route mới trong `app/` không được import `@/platform/db`.

## Bảng trách nhiệm module

### platform/

Hạ tầng chung, không chứa nghiệp vụ, không import `modules/` hay `app/` (`eslint.config.mjs:96-111`). Test `*.test.ts` đặt cạnh file nguồn.

| File | Sở hữu | Ai gọi |
|---|---|---|
| `platform/db.ts` | `import "server-only"`; singleton `PrismaClient` với adapter `PrismaPg`, giữ trên `globalThis` ngoài production (`:5-13`) | `lib/posts.ts`, `app/cms/actions.ts`, `app/cms/page.tsx`, `app/cms/posts/[id]/page.tsx` |
| `platform/auth/basic-auth.ts` | `isAuthorized()` so Basic Auth bằng `timingSafeEqual` trên SHA-256, fail closed khi thiếu env (`:7-13`) | `proxy.ts:2`, `platform/auth/require-admin.ts:2` |
| `platform/auth/require-admin.ts` | `requireAdmin()` đọc header `authorization` qua `headers()`, ném `UserError("Bạn cần đăng nhập CMS")` | `run()` |
| `platform/auth/run.ts` | `run(fn)`: `requireAdmin()` → chạy → trả `Result<T>`; `UserError` trả nguyên văn, lỗi khác `console.error` + `UNEXPECTED_ERROR` (`:5-14`) | mọi action trong `app/cms/actions.ts` |
| `platform/errors.ts` | `UserError`, kiểu `Result<T>`, hằng `UNEXPECTED_ERROR` = "Có lỗi xảy ra, thử lại sau" | `run()`, `lib/ai.ts`, `app/cms/actions.ts` |
| `platform/validation/fields.ts` | Trường Zod dùng chung: `optionalText`, `imageUrl` (theo `isAllowedImageUrl`), `shopeeAffiliateUrl` (chỉ `https` + `shopee.vn`, `s.shopee.vn`, `shope.ee`) | `lib/post-input.ts:2` |
| `platform/validation/errors.ts` | `firstError()` lấy thông báo lỗi Zod đầu tiên | `app/cms/actions.ts` |
| `platform/html/sanitize.ts` | `sanitizePostHtml()` — allowlist thẻ định dạng, **không** `a`, `img`, không thuộc tính (AD-22) | `app/cms/actions.ts:79`, `:106`; `app/(site)/bai-viet/[slug]/page.tsx:47` |
| `platform/html/content.ts` | `readingMinutes()` (200 từ/phút, `:5-8`), `withHeadingIds()` gắn id cho `<h2>` làm mục lục (`:11-21`); dùng trên HTML đã sanitize | `lib/posts.ts:4`, `app/(site)/bai-viet/[slug]/page.tsx:47` |
| `platform/slug.ts` | `slugify()` bỏ dấu tiếng Việt, `đ→d` | `platform/html/content.ts:1`, `uniqueSlug()` trong `app/cms/actions.ts:23-30` |
| `platform/images.ts` | `IMAGE_HOSTS` và `isAllowedImageUrl()` (chỉ `https` + host trong danh sách, hoặc đường dẫn `/` cùng origin; từ chối `//host`) | `next.config.ts:2`, `platform/validation/fields.ts:2` |
| `platform/format.ts` | `formatDate()` theo `vi-VN`, múi giờ `Asia/Ho_Chi_Minh`, trả `""` khi `null` | trang chủ, trang bài, danh sách CMS |
| `platform/site.ts` | `SITE_NAME`, `SITE_URL` (từ `NEXT_PUBLIC_SITE_URL`, bỏ `/` cuối) | root layout, sitemap, robots, trang bài, `runThreads` |

`platform/ai` và `platform/storage` là **đích, chưa có** (dựng ở story AI đầu tiên và story upload đầu tiên).

### lib/ (code cũ chờ chuyển)

Không tạo file mới ở đây (Policy trong `AGENTS.md`, spine AD-17). Vị trí đích theo `docs/cong-thuc/chuyen-code-cu.md`.

| File | Sở hữu | Ai gọi |
|---|---|---|
| `lib/ai.ts` | Client OpenAI lười khởi tạo (`:13`), hàm `ask()` structured output (`:19-30`), `generatePost`, `toThreads`, `analyzeSeo` và prompt hệ thống (`:47-56`) | `app/cms/actions.ts:6`; kiểu `SeoReport` dùng ở `components/cms/post-editor.tsx:13` |
| `lib/categories.ts` | Kiểu `CategoryKey` (giá trị enum `PostType`), map `CATEGORIES` (label, slug URL, mô tả), `categoryFromSlug()` — mang nghĩa **Loại bài** (`[NO-20]`) | route `[category]`, sitemap, nav, badge, form CMS, `lib/ai.ts` |
| `lib/post-input.ts` | Schema zod `productInputSchema`, `postInputSchema`, `newPostSchema` ghép từ `platform/validation/fields.ts`; kiểu `PostInput`/`ProductInput`/`NewPostInput` (dạng `z.input`) | `app/cms/actions.ts:8-14`, `components/cms/*` (kiểu) |
| `lib/posts.ts` | Mọi truy vấn bài **public**: `getLatestPosts`, `getPostsByCategory`, `getRelatedPosts`, `getPostBySlug`, `getPublishedSlugs`; hằng `POSTS_TAG`; ánh xạ thẻ bài `toCard` (đổi `postType` thành khoá `category`) | trang `app/(site)/*`, `app/sitemap.ts`; `POSTS_TAG` ở `app/cms/actions.ts:7` |

### app/

| File | Sở hữu | Ai gọi / phụ thuộc |
|---|---|---|
| `app/layout.tsx` | Root layout: font Be Vietnam Pro, `metadata` gốc (`metadataBase`, title template, OpenGraph `vi_VN`), `Toaster` (sáng/tối theo hệ điều hành, không provider) | Next.js; dùng `platform/site.ts` |
| `app/globals.css` | Tailwind 4, token DESIGN.md (màu sáng/tối, bo góc, spacing, typography, elevation), alias shadcn và alias cũ `meo-vat*`/`gom-link*`, plugin typography, biến thể `dark` theo `prefers-color-scheme` | `app/layout.tsx`; `platform/design-tokens.ts` đọc màu |
| `app/robots.ts` | `robots.txt`: chặn `/cms`, `/api/` | Next.js |
| `app/sitemap.ts` | `sitemap.xml`: trang chủ, 2 trang Loại bài, mọi bài đã xuất bản | `getPublishedSlugs()` |
| `app/(site)/layout.tsx` | Header/footer site; `ensureStatic = "navigation"` bắt toàn bộ route public phải tĩnh (`:4-6`) | mọi trang trong `(site)` |
| `app/(site)/page.tsx` | Trang chủ: bài nổi bật, mới cập nhật, khối Gom link, khối Mẹo vặt | `getLatestPosts`, `getPostsByCategory` |
| `app/(site)/[category]/page.tsx` | Trang Loại bài `/meo-vat`, `/gom-link`; `generateStaticParams` từ `CATEGORIES` | `getPostsByCategory`, `categoryFromSlug` |
| `app/(site)/bai-viet/[slug]/page.tsx` | Trang Bài web: metadata, JSON-LD, mục lục, Sản phẩm, bài liên quan | `getPostBySlug`, `getRelatedPosts`, `getPublishedSlugs` |
| `app/(site)/not-found.tsx` | Trang 404 cho site | `notFound()` ở các trang site |
| `app/cms/layout.tsx` | Khung CMS, `robots: noindex` (`:7`), `maxDuration = 120` cho lời gọi AI (`:11`, AD-18) | trang CMS |
| `app/cms/page.tsx` | Danh sách mọi bài (kể cả nháp), động qua `connection()` trong `Suspense` | `db` trực tiếp |
| `app/cms/new/page.tsx` | Trang tạo bài, render `NewPostForm` | — |
| `app/cms/posts/[id]/page.tsx` | Nạp bài + Sản phẩm (qua `postProducts`), đổi `null` thành `""` cho form, render `PostEditor` với `key=updatedAt` | `db` trực tiếp |
| `app/cms/actions.ts` | Server Action: `createPost`, `savePost`, `setPostStatus`, `deletePost`, `runSeoCheck`, `runThreads`; helper `uniqueSlug()`, `replacePostProducts()` | `components/cms/new-post-form.tsx`, `components/cms/post-editor.tsx:8` |
| `app/cms/styleguide/page.tsx` | Trang duyệt design system `/cms/styleguide`, sau Basic Auth, `noindex` (`:14`) | không ai link tới |

### Khác

- `proxy.ts` — kiểm Basic Auth cho `matcher: ["/cms", "/cms/((?!upload$).*)", "/api/:path*"]` (`proxy.ts:14`; riêng `/cms/upload` nằm ngoài proxy, route đó tự `requireAdmin()` — AD-24). Next.js 16 dùng file `proxy.ts` (xem `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
- `next.config.ts` — `remotePatterns` từ `IMAGE_HOSTS`, `cacheComponents`, `partialPrefetching`, loader Tailwind cho Turbopack.
- `prisma/schema/` — schema tách theo module chủ (spine AD-4): `_base.prisma` (generator, datasource), `categories.prisma` (`Category`), `posts.prisma` (`Post`, `PostProduct`, enum `PostType`, `Status`), `products.prisma` (`Product`). `prisma.config.ts` trỏ `schema: "prisma/schema"` (`:5`) và dùng `DIRECT_URL` cho CLI (`:11-13`). `prisma/seed.ts` upsert một Danh mục mẫu, xoá sạch bài rồi tạo lại bài mẫu đã xuất bản (`[NO-08]`).
- `eslint.config.mjs` — luật ranh giới module: bảng tầng `TIERS` (`:7-13`), `no-restricted-imports` cho `modules/**`, `platform/**`, `components/shared|ui/**`, `app/**` (chặn trái tầng, chặn `@/lib/*`, `@/components/site|cms/*`, chặn `app/` import `@/platform/db` và `service.ts`), `import/no-cycle` (`:129-132`); file cũ miễn qua `LEGACY_APP_FILES` (`:22-34`), chuyển file nào thì bỏ khỏi danh sách.
- `vitest.config.ts` — Vitest: alias `@/` theo `tsconfig`, `server-only` sang file rỗng; test `**/*.test.ts`.
- `components/json-ld.tsx` — render `<script type="application/ld+json">`, escape `<` (`:1-8`).
- `components/ui/lib/utils.ts` — `cn` cho shadcn (alias `utils` trong `components.json`).

## Read path — trang public

Ví dụ `/bai-viet/<slug>`:

1. Request không khớp `matcher` của `proxy.ts:14` → không qua auth.
2. Route `(site)` có `ensureStatic = "navigation"` (`app/(site)/layout.tsx:6`): trang được prerender lúc build từ `generateStaticParams()` (`app/(site)/bai-viet/[slug]/page.tsx:18-21`); slug chưa prerender chờ bản tĩnh để `notFound()` trả đúng 404 (`app/(site)/layout.tsx:4-5`).
3. `generateMetadata` và `PostPage` cùng gọi `getPostBySlug()` (`app/(site)/bai-viet/[slug]/page.tsx:24`, `:44`). Hàm này là `"use cache"` + `cacheLife("days")` + `cacheTag(POSTS_TAG)` và chỉ lấy `status: "PUBLISHED"` (`lib/posts.ts:84-102`).
4. Ảnh đại diện fallback: `featuredImage ?? products[0].image ?? null` (`lib/posts.ts:99`); Sản phẩm lấy qua `postProducts` theo `sortOrder` (`lib/posts.ts:90`), rồi `/placeholder.svg` ở component.
5. Render: `sanitizePostHtml` (`platform/html/sanitize.ts`) → `withHeadingIds` (`platform/html/content.ts`) (`page.tsx:47`) → `dangerouslySetInnerHTML` (`page.tsx:111`); `getRelatedPosts` cùng Loại bài (`page.tsx:48`); `AffiliateDisclosure` chỉ khi có Sản phẩm (`page.tsx:108`); `ProductCard` mở Link affiliate với `rel="sponsored nofollow noopener"` (`components/site/product-card.tsx:37`; đích là `AffiliateLink` của `modules/products/components` — AD-11, chưa có).

Trang chủ và trang Loại bài theo cùng mẫu, dùng `getLatestPosts`/`getPostsByCategory` trả `PostCard` đã bỏ `content` (`lib/posts.ts:31-38`).

## Write path — CMS

1. **Form client** — `components/cms/post-editor.tsx` (code cũ) giữ state `PostInput`; tag/từ khoá nhập dạng chuỗi phẩy, đổi bằng `toList` khi gửi (`:21`, `:41`). Gọi action trong `startTransition`, báo lỗi bằng `toast.error(res.error)` (`:55-63`).
2. **Server Action** — `savePost(id, input)` (`app/cms/actions.ts:96`) bọc trong `run()`.
3. **`run()` / `requireAdmin()`** — `run` gọi `requireAdmin()` trước mọi thứ; `UserError` trả nguyên văn, lỗi khác `console.error` rồi trả "Có lỗi xảy ra, thử lại sau" (`platform/auth/run.ts:5-14`).
4. **zod** — `postInputSchema.safeParse(input)`; lỗi đầu tiên ném ra bằng `UserError(firstError(...))` (`app/cms/actions.ts:98-99`, `platform/validation/errors.ts:3-5`). Trường dùng chung ở `platform/validation/fields.ts`: chuỗi rỗng thành `null` (`:4`), kiểm host ảnh (`:6-10`), link affiliate chỉ domain Shopee (`:15-25`).
5. **sanitize** — `content: sanitizePostHtml(content)` (`app/cms/actions.ts:106`).
6. **Slug** — `uniqueSlug(slug || title, id)` thêm hậu tố `-2`, `-3`... khi trùng (`app/cms/actions.ts:23-30`).
7. **Prisma** — trong `db.$transaction`: `tx.post.update`, rồi `replacePostProducts` xoá các dòng `PostProduct` cũ, xoá Sản phẩm không còn bài nào dùng, tạo Sản phẩm mới và `PostProduct` theo thứ tự form (`app/cms/actions.ts:35-46`, `:103-111`; `[NO-09]`).
8. **Cache** — `updateTag(POSTS_TAG)` (`app/cms/actions.ts:112`), làm mọi truy vấn `lib/posts.ts` hết hạn ngay (read-your-own-writes).

`setPostStatus` chặn xuất bản bài rỗng và giữ `publishedAt` gốc khi đăng lại (`app/cms/actions.ts:117-135`). `createPost` không gọi `updateTag` vì bài mới luôn là nháp (`Status @default(DRAFT)`, `prisma/schema/posts.prisma:15`).

## AI path

1. Client gọi `createPost({ useAi: true })`, `runSeoCheck` hoặc `runThreads` (`components/cms/new-post-form.tsx`, `components/cms/post-editor.tsx:89`).
2. Action qua `run()` → gọi `generatePost` / `analyzeSeo` / `toThreads` trong `lib/ai.ts`.
3. `ask(schema, name, system, user)` gọi `client.responses.parse` với `text.format = zodTextFormat(schema, name)` — structured output phía OpenAI (`lib/ai.ts:19-29`). Không có `output_parsed` → ném `UserError` tiếng Việt (`:28`). Model lấy từ `OPENAI_MODEL`, mặc định `gpt-4o-mini` (`:17`).
4. Hậu xử lý: `analyzeSeo` kẹp điểm 0–100 (`lib/ai.ts:129`); `createPost` cắt `excerpt` 500 ký tự, cho bản nháp AI qua cùng `postInputSchema` với bài viết tay, `sanitizePostHtml(content)`, tạo slug duy nhất từ title (`app/cms/actions.ts:55-81`).
5. Kết quả AI lưu thẳng thành bài **nháp**; người vận hành duyệt trong editor rồi mới xuất bản. Kết quả SEO và Threads không lưu DB, chỉ nằm trong state client (`components/cms/post-editor.tsx:35-36`).
6. Thời gian chạy: `maxDuration = 120` cho route CMS (`app/cms/layout.tsx:10-11`, AD-18).

## Ranh giới auth

- **Tầng request**: `proxy.ts` trả 401 + `WWW-Authenticate: Basic` khi `isAuthorized` sai (`proxy.ts:4-10`).
- **Tầng action**: `requireAdmin()` trong `run()` (`platform/auth/require-admin.ts:6-10`, `platform/auth/run.ts:7`). Server Action được gọi qua POST tới chính URL trang; không được coi proxy là đủ.
- **Tầng hiển thị**: `app/cms/layout.tsx:7` đặt `noindex`; `app/robots.ts:6` chặn `/cms`.
- `/cms/styleguide` (`app/cms/styleguide/page.tsx`) nằm sau Basic Auth và `noindex` (`:14`).

## Ranh giới cache

- **Cache**: chỉ 5 hàm trong `lib/posts.ts`, đều `"use cache"` + `cacheLife("days")` + `cacheTag("posts")` (`lib/posts.ts:45-114`). Chỉ có **một** tag cho toàn bộ bài public.
- **Huỷ cache**: `updateTag(POSTS_TAG)` trong `savePost`, `setPostStatus`, `deletePost` (`app/cms/actions.ts:112`, `:132`, `:143`). `updateTag` chỉ gọi được trong Server Action (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/updateTag.md:12`).
- **Không cache**: trang CMS dùng `await connection()` trong `Suspense` (`app/cms/page.tsx:15-23`) hoặc `params` động trong `Suspense` (`app/cms/posts/[id]/page.tsx:9-16`).
- `sitemap.ts` dùng `getPublishedSlugs()` nên cũng theo tag `posts`.

## Bề mặt SEO

| Bề mặt | Vị trí |
|---|---|
| Metadata gốc, title template `%s \| Mẹo Vặt Cuộc Sống`, `metadataBase` | `app/layout.tsx:14-23` |
| Metadata trang Loại bài + canonical | `app/(site)/[category]/page.tsx:11-20` |
| Metadata trang bài: `seoTitle ?? title`, `seoDescription ?? excerpt`, keywords, canonical, OpenGraph article | `app/(site)/bai-viet/[slug]/page.tsx:23-41` |
| JSON-LD `Article` + `BreadcrumbList` | `app/(site)/bai-viet/[slug]/page.tsx:54-79`, component `components/json-ld.tsx` |
| Sitemap | `app/sitemap.ts:6-22` |
| Robots | `app/robots.ts:4-9` |
| `noindex` cho CMS, styleguide | `app/cms/layout.tsx:7`, `app/cms/styleguide/page.tsx:14` |
| Link affiliate `rel="sponsored nofollow noopener"` | `components/site/product-card.tsx:37` (code cũ; đích `AffiliateLink` của `modules/products/components`) |
| Mục lục neo `#id` từ h2 | `platform/html/content.ts:11-21` |

## Bảng thuật ngữ code ↔ PRD

| Code | Thuật ngữ PRD (§3) | Ghi chú |
|---|---|---|
| `Post` (`prisma/schema/posts.prisma:1`) | Bài web | |
| `Post.status` `DRAFT` / `PUBLISHED` | Bài web *nháp* / *đã xuất bản* | UI ghi "Nháp" / "Đã đăng" (`components/cms/status-badge.tsx:11`) |
| enum `PostType` `MEO_VAT` / `GOM_LINK` (`Post.postType`), `CategoryKey` | Loại bài (*Mẹo vặt* / *Gom link*) | Route, menu, breadcrumb hiện theo Loại bài; UI gọi là "Chuyên mục"; code cũ gọi khoá này là `category` (`[NO-20]`) |
| model `Category` (`prisma/schema/categories.prisma:2`), `Post.categoryId`, `Product.categoryId` | Danh mục | Có bảng, chưa có giao diện; seed tạo một Danh mục mẫu |
| `Product` (`prisma/schema/products.prisma:1`) | Sản phẩm | Bản ghi dùng chung, nối với Bài web qua bảng `PostProduct` (`prisma/schema/posts.prisma:26-36`, có `sortOrder`); CMS chưa chọn được Sản phẩm có sẵn (`[NO-09]`) |
| `Product.affiliateUrl` | Link affiliate | |
| `Product.price` (chuỗi) | giá tham khảo | |
| `AffiliateDisclosure` | Nhãn công khai affiliate | `components/site/affiliate-disclosure.tsx` (code cũ; đích `modules/products/components`) |
| `generatePost` / `PostDraft` | Gợi ý AI (cho Bài web) | Lưu thẳng thành bài nháp, chưa có trạng thái *chờ duyệt* |
| `toThreads` / tab Threads | Bài Threads (dạng chuỗi) | Không lưu DB |
| `WRITER_SYSTEM` (`lib/ai.ts:47`) | Hồ sơ phong cách (Website) | Đang cứng trong code |
| Basic Auth `ADMIN_USERNAME` | Người vận hành | |

## Bất biến liên module

- **[KT-01] Ghi phải huỷ cache.** Mọi action thay đổi dữ liệu public phải gọi `updateTag` với tag của **mọi** module có dữ liệu thay đổi, sau khi ghi; mọi query có cache gắn tag của mọi module có bảng nó đọc (spine AD-7). Hiện chỉ có `POSTS_TAG` (`app/cms/actions.ts:112`, `:132`, `:143`); khi module `products` có, query đọc Sản phẩm gắn thêm tag `products` và action sửa Sản phẩm gọi `updateTag` tag đó. Không dùng `revalidatePath`.
- **[KT-02] Mọi Server Action phải qua `run()`.** `run()` (`platform/auth/run.ts:5-14`) gọi `requireAdmin()`. Không export action nào mà không bọc `run()`, trừ ba ngoại lệ có tên của `[QD-20]`.
- **[KT-03] Nguồn duy nhất của host ảnh là `IMAGE_HOSTS`.** Thêm host chỉ sửa `platform/images.ts:2`; `next.config.ts:7` và `platform/validation/fields.ts:6-10` tự theo.
- **[KT-04] HTML bài luôn sanitize.** Khi ghi (`app/cms/actions.ts:79`, `:106`) và khi render (`app/(site)/bai-viet/[slug]/page.tsx:47`). Không render `post.content` mà không qua `sanitizePostHtml`.
- **[KT-05] Trang public chỉ đọc qua hàm `"use cache"` có `cacheTag`.** Hiện là `lib/posts.ts` (code cũ, đích `modules/posts/queries.ts`); các hàm ở đó lọc `status: "PUBLISHED"` (`lib/posts.ts:42`) và gắn tag. Không gọi `db` trong `app/(site)/*` (ESLint chặn `@/platform/db` trong `app/**`, trừ file cũ trong `LEGACY_APP_FILES`).
- **[KT-06] Route public phải tĩnh.** `ensureStatic = "navigation"` (`app/(site)/layout.tsx:6`): không dùng `cookies()`, `headers()`, `connection()` hay dữ liệu chưa cache trong `app/(site)/*`.
- **[KT-07] Slug bài duy nhất qua `uniqueSlug()`.** Mọi đường tạo/sửa slug đi qua `uniqueSlug` (`app/cms/actions.ts:23-30`) dùng `slugify` (`platform/slug.ts`); cột `slug` là `@unique` (`prisma/schema/posts.prisma:4`).
- **[KT-08] Loại bài khai báo một chỗ.** Nhãn, slug URL, mô tả lấy từ `CATEGORIES` (`lib/categories.ts:3-17`); route, menu, sitemap, form đều duyệt map này. Enum Prisma `PostType` (`prisma/schema/posts.prisma:38-41`) và `z.enum` trong `lib/post-input.ts:16`, `:29` phải khớp.
- **[KT-09] Lớp AI chỉ gọi từ Server Action.** `lib/ai.ts` đọc `OPENAI_API_KEY` và chỉ được import ở phía server (`app/cms/actions.ts:6`); component client chỉ import kiểu (`import type`).
- **[KT-10] Mỗi trang có Sản phẩm phải hiện Nhãn công khai affiliate** (`app/(site)/bai-viet/[slug]/page.tsx:108`) và link Sản phẩm mang `rel="sponsored nofollow noopener"`.

## Dự kiến

Theo spine (AD-2, AD-17, Structural Seed), PRD (`_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md` §4, §8) và `addendum.md` A1, A4. Chỉ liệt kê vị trí đích và vùng bị ảnh hưởng, không thiết kế.

- **Cấu trúc đích** (chưa có): `modules/<miền>/` (`posts`, `products`, `categories`, `content-sets`, `suggestions`, `research`, `style-profiles`, `inspirations`, `banners`, `bio`, `engagement`) với `schema`, `types`, `tags`, `queries`, `cms-queries`, `service`, `actions`, `prompts/`, `components/`; `components/shared/`; `app/cms/_components/`, `app/(site)/_components/`. Code cũ `lib/*`, `components/site|cms/*`, `app/cms/actions.ts` chuyển dần theo `docs/cong-thuc/chuyen-code-cu.md` khi có thay đổi chạm vào.
- **Lớp AI** (A1, A3; NFR-1, NFR-2): `lib/ai.ts` chuyển sang `platform/ai` (đích, chưa có) và `modules/<miền>/prompts/`; bỏ `openai` + `responses.parse` + `zodTextFormat`; validate zod sau khi parse JSON và thử lại. Ảnh hưởng `app/cms/actions.ts`, `.env.example`, `package.json`.
- **Kho sản phẩm dùng chung** (A4; FR-3 → FR-5): bảng đã dùng chung qua `PostProduct`; còn thiếu trạng thái hiện/ẩn (`hidden`), `priceText`, chọn Sản phẩm có sẵn trong CMS (`[NO-09]`). Ảnh hưởng `prisma/schema/products.prisma`, `app/cms/actions.ts` (`replacePostProducts`), `lib/post-input.ts`, `components/cms/fields.tsx`, `lib/posts.ts`.
- **Tách Loại bài / Danh mục** (A4; FR-28, FR-29): model `Category` đã có, chưa có giao diện và route `[danh-muc]`. Ảnh hưởng `lib/categories.ts`, `app/(site)/[category]/page.tsx`, `components/site/nav-links.tsx`, `components/site/category-badge.tsx` (màu gắn Loại bài), breadcrumb và `getRelatedPosts` trong trang bài, `app/sitemap.ts`, `lib/post-input.ts` (`[NO-20]`). Cần chặn slug Danh mục trùng đường dẫn hệ thống.
- **Upload và host ảnh** (A4; AD-24): `app/cms/upload/route.ts` và `platform/storage` (đích, chưa có); host nơi lưu thêm vào `IMAGE_HOSTS` của `platform/images.ts`.
- **Tab Threads** (A4; FR-14, FR-16): `components/cms/post-editor.tsx` tab Threads, `toThreads` trong `lib/ai.ts`, `runThreads` trong `app/cms/actions.ts`.
- **Hồ sơ phong cách** (A4; FR-18): prompt `WRITER_SYSTEM` (`lib/ai.ts:47-56`) chuyển thành dữ liệu của module `style-profiles`.
- **Seed** (A4): `prisma/seed.ts` tạo link `https://shopee.vn/search?...` — qua được `shopeeAffiliateUrl` vì đúng domain, nhưng không phải Link affiliate thật.
- **Bộ nội dung, Gợi ý AI, Cảnh báo rủi ro** (FR-12 → FR-23): bảng mới trong `prisma/schema/<module>.prisma`, action và màn hình CMS mới.
- **Chuyển hướng 301 khi đổi slug** (`permanentRedirect`, HTTP 308 — AD-20) (FR-27, FR-28): `savePost`/`uniqueSlug` hiện đổi slug không lưu lịch sử (`[NO-07]`).
- **Trang bio, Lượt xem, thống kê** (FR-30, FR-31, FR-33, FR-38): route public mới trong `app/(site)/`, action công khai của `modules/engagement/actions.ts` (`[QD-20]`), `app/sitemap.ts`, ranh giới cache [KT-06].

## Checklist khi review thay đổi kiến trúc

- [ ] Action mới bọc `run()` và gọi `updateTag` tag của mọi module có dữ liệu public thay đổi; query có cache gắn tag của mọi module có bảng nó đọc ([KT-01], [KT-02], AD-7).
- [ ] Trang public mới đọc qua hàm `"use cache"` có `cacheTag`, không gọi `db`, không dùng API request-time ([KT-05], [KT-06]).
- [ ] Mọi HTML từ người dùng hoặc AI qua `sanitizePostHtml` ([KT-04]).
- [ ] Host ảnh mới chỉ thêm ở `platform/images.ts` ([KT-03]).
- [ ] Loại bài mới đồng bộ `CATEGORIES`, enum Prisma và `z.enum` ([KT-08]).
- [ ] `lib/ai.ts` không bị import vào component client ngoài `import type` ([KT-09]).
- [ ] Route mới cần auth nằm dưới `/cms` hoặc `/api` để khớp `proxy.ts` matcher; ngoại lệ `/cms/upload` không qua proxy, phải tự `requireAdmin()` (AD-24).
- [ ] File mới nằm ở `modules/<miền>/`, `platform/`, `components/ui|shared/` hoặc `app/` theo spine, không ở `lib/`, `components/site|cms/`; `npm run lint` sạch (luật ranh giới).
- [ ] Bảng module trong tài liệu này được cập nhật khi thêm/xoá/chuyển file trong `platform/`, `lib/` hoặc `app/`.

## Tham khảo

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/updateTag.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md`, `addendum.md`
