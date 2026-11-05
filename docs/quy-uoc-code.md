# Quy ước code

> Phiên bản: Next.js 16.4.3, TypeScript 5 `strict`, Zod 4.6, Prisma 7.10, ESLint 9 + `eslint-config-next` 16.4.3 (`package.json`, `tsconfig.json:7`) · Nguồn: mã nguồn repo · Kiểm lần cuối: 2026-11-05 @ 8771851

Chỉ ghi quy ước **đang thấy trong code** mà agent dễ làm sai. Bản đồ module và bất biến `[KT-xx]` xem `docs/kien-truc-codebase.md`. **Vị trí file mới theo spine** (AD-1, AD-2, AD-5, AD-11, Structural Seed), không theo vị trí của code cũ: `lib/`, `components/site|cms/`, `app/cms/actions.ts` là code cũ chờ chuyển (`docs/cong-thuc/chuyen-code-cu.md`), không tạo file mới ở đó.

## Tóm tắt cho agent

- Import nội bộ bằng `@/`; Prisma client từ `@/generated/prisma/client`, `db` từ `@/platform/db`. ESLint chặn import sai tầng và import code cũ `@/lib/*`, `@/components/site|cms/*` trong `modules/`, `platform/`, `components/shared|ui/` và `app/` (trừ `LEGACY_APP_FILES`); `lib/`, `components/site|cms/`, `components/*.tsx` gốc không có luật ranh giới — chỉ review giữ.
- File mới vào `modules/<miền>/`, `platform/`, `components/ui|shared/` hoặc route trong `app/` theo spine; không tạo file mới ở `lib/`, `components/site|cms/`.
- Server Action bọc `run()` (`@/platform/auth/run`), trả `Result<T>`, ném `UserError` (`@/platform/errors`) với thông điệp tiếng Việt. Action cũ hiện ở `app/cms/actions.ts`; action mới ở `modules/<miền>/actions.ts`.
- Kiểu suy ra từ code (`ReturnType`, `z.infer`, `z.input`), không khai báo lại bằng tay.
- Mọi chuỗi UI, thông báo lỗi, comment viết tiếng Việt có dấu; slug URL tiếng Việt không dấu.
- Không có Prettier; giữ nguyên style file đang sửa.

## Vị trí file

### [QU-01] Chia component theo gốc chung gần nhất

Vị trí component mới theo spine AD-11: thực thể → `modules/<miền>/components/`; nền shadcn → `components/ui/` (style `base-nova`, primitive `@base-ui/react`, `components.json:3`; thêm bằng CLI shadcn, không sửa tay trừ khi cần); dùng chung không nghiệp vụ → `components/shared/`; chỉ CMS → `app/cms/_components/`; chỉ site → `app/(site)/_components/`; một màn → `_components/` cạnh route.

Code cũ chờ chuyển (bảng ở `docs/cong-thuc/chuyen-code-cu.md`), không thêm file vào đây:

- `components/site/` — component của site public, đa số là Server Component (`components/site/post-card.tsx`, `components/site/product-card.tsx`).
- `components/cms/` — form và widget CMS, đa số `"use client"` (`components/cms/post-editor.tsx:1`, `components/cms/fields.tsx:1`).
- `components/` gốc — `components/json-ld.tsx`.
- Component CMS cũ dùng component site cũ (`app/cms/page.tsx:5` dùng `CategoryBadge`).

### [QU-02] Route group và nơi đặt route

- Trang public đặt trong `app/(site)/` để nhận header/footer và `ensureStatic` (`app/(site)/layout.tsx:6-15`).
- Trang quản trị đặt dưới `app/cms/` (không phải route group) để khớp `proxy.ts:14`.
- Server Action đặt trong `actions.ts` có `"use server"` ở dòng 1: action mới ở `modules/<miền>/actions.ts` (spine AD-5, AD-6); action cũ ở `app/cms/actions.ts`, không thêm action mới vào đó. Không rải `"use server"` inline trong component.
- Truy vấn dữ liệu có cache đặt trong `modules/<miền>/queries.ts` (code cũ: `lib/posts.ts`), không viết trong file `page.tsx` của site (`app/(site)/page.tsx:8`).

### [QU-03] `platform/` mỗi file một trách nhiệm, không nghiệp vụ

Hạ tầng chung ở `platform/` theo cây Structural Seed của spine: mỗi file export hàm/hằng nhỏ, không class (trừ `UserError`): `platform/slug.ts` (một hàm), `platform/format.ts` (một hàm), `platform/site.ts` (hai hằng). Nhóm liên quan nằm trong thư mục con (`platform/auth/`, `platform/html/`, `platform/validation/`). Test `*.test.ts` đặt cạnh file nguồn. Schema zod của form nằm ở `schema.ts` của module chủ (code cũ: `lib/post-input.ts`), không trong file action. `lib/` là code cũ, không tạo file mới ở đó.

## Đặt tên

### [QU-04] Slug URL tiếng Việt không dấu, gạch ngang

Đường dẫn dùng tiếng Việt: `/bai-viet/[slug]` (`app/(site)/bai-viet/[slug]/page.tsx`), `/meo-vat`, `/gom-link` (`lib/categories.ts:9`, `:14`). Tạo slug bằng `slugify()` (`platform/slug.ts:2-11`), không viết regex riêng. Slug bài tạo qua `uniqueSlug()` (`app/cms/actions.ts:23-30`). Id neo mục lục fallback cũng tiếng Việt: `muc-1` (`platform/html/content.ts:15`).

### [QU-05] Tên file, export, hằng

- File kebab-case: `components/site/category-badge.tsx`, `platform/auth/require-admin.ts`.
- Component dùng named export PascalCase (`export function CategoryBadge`, `components/site/category-badge.tsx:10`); chỉ `page.tsx`/`layout.tsx`/`sitemap.ts`/`robots.ts` dùng `export default`.
- Hằng cấu hình UPPER_SNAKE_CASE: `CATEGORIES`, `IMAGE_HOSTS`, `POSTS_TAG`, `SITE_NAME`, `NAV_LINKS`, `WRITER_SYSTEM` (`lib/ai.ts:47`).
- Key nghiệp vụ dạng enum Prisma UPPER_SNAKE: `MEO_VAT`, `GOM_LINK`, `DRAFT`, `PUBLISHED` (`prisma/schema/posts.prisma:38-46`).

## Import

### [QU-06] Dùng alias `@/`

Import chéo thư mục bằng `@/` (`tsconfig.json:21-23`), ví dụ `app/cms/actions.ts:5-21`. Không import `../`: ESLint chặn trong `modules/**`, `platform/**`, `components/shared|ui/**` và `app/**` trừ file trong `LEGACY_APP_FILES`, để luật tầng kiểm được (`eslint.config.mjs:49`). `lib/**`, `components/site|cms/**`, `components/*.tsx` gốc không có luật ranh giới; "không file mới ở `lib/`" chỉ được giữ bằng review. Ngoại lệ đang có:

- Import file cùng thư mục bằng `./`: `components/cms/post-editor.tsx:15-17`, `components/site/mobile-nav.tsx:8` (code cũ).
- File chạy ngoài Next dùng đường dẫn tương đối: `next.config.ts:2`, `prisma/seed.ts:3`.
- `components/ui/*` import `cn` thẳng từ package `cn` (`components/ui/button.tsx:3`); code tự viết import `cn` từ `@/components/ui/lib/utils` (`components/site/category-badge.tsx:1`) — `[NO-22]`.

### [QU-07] Prisma import từ client sinh ra

Không import `@prisma/client`. Kiểu và client lấy từ `@/generated/prisma/client` (`platform/db.ts:3`; output ở `prisma/schema/_base.prisma:3`). Ứng dụng dùng singleton `db` từ `@/platform/db`, không `new PrismaClient()` (ngoại lệ duy nhất: `prisma/seed.ts:5`). `app/` không import `@/platform/db` (ESLint; file cũ miễn qua `LEGACY_APP_FILES`).

## TypeScript

### [QU-08] Object truy vấn Prisma khai báo `as const`

Đối tượng `select`, `where`, `orderBy` dùng lại thì khai báo hằng `as const` để Prisma suy đúng kiểu kết quả: `cardSelect` (`lib/posts.ts:9-18`), `published`, `newestFirst` (`lib/posts.ts:42-43`). Mảng dữ liệu tĩnh cũng vậy (`app/cms/styleguide/page.tsx:27`).

### [QU-09] Suy kiểu từ nguồn, không khai báo lại

- Kiểu trả của hàm map: `export type PostCard = ReturnType<typeof toCard>` (`lib/posts.ts:40`).
- Kiểu output AI: `z.infer<typeof postDraftSchema>` (`lib/ai.ts:45`, `:107`).
- Kiểu dữ liệu form: `z.input<typeof postInputSchema>` (`lib/post-input.ts:25-26`, `:34`) — dùng `z.input` vì state form giữ chuỗi `""` trước khi schema `transform` thành `null`.
- Kiểu `PostType` từ Prisma khi cần ngoài app: `prisma/seed.ts:3`.

### [QU-10] `Result<T>` cho Server Action

Action trả `Result<T>` = `({ ok: true } & T) | { ok: false; error: string }` (`platform/errors.ts:9`). Client luôn kiểm `res.ok` trước khi đọc dữ liệu, rồi `toast.error(res.error)` khi lỗi (`components/cms/new-post-form.tsx:28-31`, `components/cms/post-editor.tsx:57-60`). Không ném lỗi qua ranh giới action.

### [QU-11] Props typed inline, dùng kiểu route toàn cục của Next 16

- Props component khai báo inline trong tham số (`components/cms/seo-score.tsx:3`), tách `type XxxData` chỉ khi cần export (`components/site/post-card.tsx:6-13`).
- Page/layout dùng kiểu toàn cục `PageProps<"/route">` và `LayoutProps<"/route">`, `params` là Promise phải `await` (`app/(site)/[category]/page.tsx:11-12`, `app/layout.tsx:24`, `app/cms/posts/[id]/page.tsx:15-16`).

### [QU-12] Optional: DB là `null`, form là `""`

Cột tuỳ chọn lưu `null` (`prisma/schema/posts.prisma:6-7`, `:12-13`). Khi nạp vào form, đổi `null → ""` (`app/cms/posts/[id]/page.tsx:31-43`); khi lưu, zod `optionalText`/`imageUrl` đổi `"" → null` (`platform/validation/fields.ts:4-10`). Thêm trường tuỳ chọn thì làm đủ hai chiều.

## Server Action

### [QU-13] Khuôn một Server Action

```ts
export async function doSomething(id: string, input: SomeInput) {
  return run(async () => {
    const parsed = someSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    // ... sanitize, db, AI
    updateTag(POSTS_TAG); // nếu đụng bài public
    return { slug: post.slug };
  });
}
```

Theo `app/cms/actions.ts:96-115`. Spine AD-6 tách phần ghi DB sang `service.ts` của module; khuôn đầy đủ ở `docs/cong-thuc/them-server-action.md`. Quy tắc:

- Luôn bọc `run()` (`platform/auth/run.ts:5-14`) — nó gọi `requireAdmin()`, bắt lỗi, log, đổi thành `Result`.
- Validate bằng `safeParse` + `firstError` (`platform/validation/errors.ts:3-5`), không dùng `parse` để lỗi zod không lộ nguyên văn.
- Báo lỗi nghiệp vụ bằng `throw new UserError("<tiếng Việt>")` (`app/cms/actions.ts:51`, `:120`); `run()` chỉ trả nguyên văn `message` của `UserError`, lỗi khác thành "Có lỗi xảy ra, thử lại sau" (`platform/errors.ts:11`). Vì vậy thông điệp phải đọc được với Người vận hành.
- Trả object phẳng (`{ id }`, `{ slug }`, `{}`) để trộn với `ok: true`.
- Gọi từ client trong `startTransition` (`components/cms/new-post-form.tsx:24`, `components/cms/post-editor.tsx:44-53`).

### [QU-14] Thông điệp lỗi tiếng Việt

Lỗi người dùng có thể thấy viết tiếng Việt có dấu, ngắn, nói cách sửa: `"Thiếu tên sản phẩm"` (`lib/post-input.ts:5`), `"Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)"` (`platform/validation/fields.ts:13`), `"Chưa cấu hình OPENAI_API_KEY trong .env"` (`lib/ai.ts:10`), `"Bài chưa có nội dung, chưa thể xuất bản"` (`app/cms/actions.ts:122`). Fallback chung: `"Có lỗi xảy ra, thử lại sau"` (`platform/errors.ts:11`), `"Dữ liệu không hợp lệ"` (`platform/validation/errors.ts:4`).

## Comment và chuỗi giao diện

### [QU-15] Comment tiếng Việt, giải thích vì sao

Comment ngắn, tiếng Việt có dấu, nói lý do hoặc ràng buộc không thấy được từ code:

- `platform/auth/require-admin.ts:5` — vì sao action phải tự kiểm auth.
- `app/(site)/layout.tsx:4-5` — vì sao cần `ensureStatic`.
- `app/cms/actions.ts:128` — vì sao giữ `publishedAt` gốc.
- `prisma.config.ts:10` — vì sao CLI dùng `DIRECT_URL`.
- `components/cms/post-editor.tsx:171` — vì sao iframe `sandbox` an toàn.

Không comment diễn giải lại dòng code. Chia khối lớn trong một file bằng `// ---------- Tên khối ----------` (`lib/ai.ts:32`, `:80`, `:101`). Comment trong schema Prisma dùng `//` cuối dòng hoặc dòng riêng trên model (`prisma/schema/posts.prisma:5`, `:8`, `:25`).

### [QU-16] Chuỗi UI tiếng Việt có dấu

Mọi chữ hiển thị, `aria-label`, `toast`, `confirm`, metadata viết tiếng Việt có dấu: `aria-label="Xóa sản phẩm"` (`components/cms/fields.tsx:76`), `aria-label="Mở menu"` (`app/cms/_components/cms-shell.client.tsx`), `toast.success("Đã lưu")` (`components/cms/post-editor.tsx:66`), `confirm("Xóa vĩnh viễn bài viết này?")` (`:79`). `<html lang="vi">` (`app/layout.tsx:26`). Chuỗi viết thẳng trong JSX, không có lớp i18n.

## Định dạng và lint

### [QU-17] Không có Prettier; ESLint flat config của Next

- Không có Prettier (không có trong `package.json`, không có file cấu hình). Không chạy format toàn file; giữ style file đang sửa.
- Lint: `npm run lint` → `eslint` với `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` và luật ranh giới module (`no-restricted-imports`, `import/no-cycle`) của `eslint.config.mjs` (spine AD-2, AD-17).
- Style code tự viết: nháy kép, có dấu chấm phẩy, dấu phẩy cuối, thụt 2 dấu cách (`lib/posts.ts`). `components/ui/*` theo style shadcn, không chấm phẩy (`components/ui/button.tsx:1-3`) — giữ nguyên.
- Dòng dài được chấp nhận khi là className hoặc `select` một dòng (`app/cms/page.tsx:26`).

## Môi trường

### [QU-18] Đọc `process.env` tại chỗ dùng, trong `platform/`

- Không có module env tập trung. Mỗi biến đọc trong đúng một file hạ tầng: `ADMIN_*` ở `platform/auth/basic-auth.ts:8-9`, `DATABASE_URL` ở `platform/db.ts:10`, `NEXT_PUBLIC_SITE_URL` ở `platform/site.ts:2`, `OPENAI_*` ở `lib/ai.ts:9-17` (code cũ, đích `platform/ai`).
- Bí mật thiếu → từ chối hoặc ném lỗi tiếng Việt, không chạy tiếp: fail closed (`platform/auth/basic-auth.ts:10`), throw (`lib/ai.ts:9-11`).
- Khởi tạo client phụ thuộc bí mật một cách lười để build không cần khoá (`lib/ai.ts:6-15`).
- Giá trị không bí mật có mặc định: `?? "http://localhost:3000"` (`platform/site.ts:2`), `|| "gpt-4o-mini"` (`lib/ai.ts:17`).
- Chỉ biến dùng ở client mới có tiền tố `NEXT_PUBLIC_`. Thêm biến mới thì thêm vào `.env.example` kèm comment tiếng Việt (`.env.example:1-14`).

## Lỗi và log

### [QU-19] Chỉ log tại `run()`

Điểm log duy nhất của app là `console.error(e)` trong `run()` (`platform/auth/run.ts:11`); spine cho phép thêm log trong `platform/ai` khi có. Không thêm `try/catch` + log trong `modules/`, `platform/` hay code cũ; để lỗi nổi lên tới `run()`. Trang dùng `notFound()` khi không có dữ liệu (`app/(site)/bai-viet/[slug]/page.tsx:45`, `app/cms/posts/[id]/page.tsx:21`), không tự render thông báo lỗi.

## Helper dùng chung

### [QU-20] Ngày tháng qua `platform/format.ts`

Hiển thị ngày bằng `formatDate()` (`@/platform/format`, `platform/format.ts:8`; định dạng `vi-VN` "3 tháng 11, 2026", múi giờ `Asia/Ho_Chi_Minh`), chấp nhận `null`. Không gọi `toLocaleDateString` rải rác. Ngày cho metadata/JSON-LD dùng `.toISOString()` (`app/(site)/bai-viet/[slug]/page.tsx:36-37`).

### [QU-21] Thời gian đọc và mục lục qua `platform/html/content.ts`

- Thời gian đọc: `readingMinutes(html)` (`@/platform/html/content`; 200 từ/phút, tối thiểu 1, `platform/html/content.ts:5-8`), tính sẵn trong `lib/posts.ts:36`, `:100`.
- Mục lục: `withHeadingIds(html)` chỉ bắt `<h2>` **không thuộc tính**, nên phải gọi **sau** `sanitizePostHtml` (`@/platform/html/sanitize`) (`platform/html/content.ts:10`, `app/(site)/bai-viet/[slug]/page.tsx:47`).

### [QU-22] Ảnh dùng `next/image` + fallback placeholder

`<Image fill sizes=... src={x || "/placeholder.svg"}>` trong khung `relative` có tỉ lệ (`components/site/post-card.tsx:18-25`, `components/site/product-card.tsx:16-23`). Ảnh hero thêm `priority` (`app/(site)/page.tsx:31`). Host ảnh ngoài phải nằm trong `IMAGE_HOSTS` ([KT-03]).

### [QU-23] Màu theo Loại bài qua token Tailwind

Màu Loại bài dùng token DESIGN.md: badge Mẹo vặt `bg-secondary-container text-on-secondary-container`, badge Gom link `bg-tertiary-fixed text-on-tertiary-fixed` (khai báo `app/globals.css`, `[GD-07]`), map bằng `Record<CategoryKey, string>` (`components/site/category-badge.tsx:4-7`). `meo-vat*`/`gom-link*` chỉ là alias cũ cho component chưa chuyển; không dùng mới. Ghép class bằng `cn()` (`components/cms/status-badge.tsx:6-9`). Không dùng mã màu cứng trong JSX (ngoại lệ: CSS nội tuyến của iframe xem trước, `components/cms/post-editor.tsx:176`).

### [QU-24] Component client tối thiểu

`"use client"` chỉ đặt ở component cần state/hook (`components/cms/*` form, `components/site/mobile-nav.tsx:1`, `app/cms/_components/cms-shell.client.tsx:1`). Page luôn là Server Component, truyền dữ liệu qua props. Hook đọc dữ liệu runtime như `usePathname()` phải nằm trong `Suspense` vì `cacheComponents` (`WithPathname` trong `app/cms/_components/cms-shell.client.tsx`).

### [QU-25] Thứ tự Sản phẩm theo vị trí mảng

`PostProduct.sortOrder` lấy từ chỉ số mảng khi ghi (`app/cms/actions.ts:43-45`) và mọi truy vấn Sản phẩm của bài `orderBy: { sortOrder: "asc" }` (`lib/posts.ts:17`, `:90`, `app/cms/posts/[id]/page.tsx:19`).

## Tổ chức bên trong file và hàm

> **Vinh duyệt 2026-11-05.** Rút từ code hiện có (`lib/posts.ts`, `app/cms/actions.ts`, `components/site/product-card.tsx`) và spine kiến trúc (AD-5, AD-8, Consistency Conventions). Vị trí file theo spine, không theo mục **Vị trí file** ở trên.

### [QU-26] Thứ tự trong một file

1. Chỉ thị: `"use server"`, `"use client"` hoặc `import "server-only"` (AD-8).
2. Import, mỗi nhóm một khối: thư viện ngoài → `@/platform/*` → `@/modules/*` → `@/components/*` → đường dẫn tương đối. `import type` viết inline trong cùng câu import (`app/cms/actions.ts:8-14`).
3. Hằng và object Prisma `as const` dùng nội bộ (`lib/posts.ts:9-18`).
4. Kiểu xuất ra, suy từ nguồn ([QU-09]).
5. Hàm phụ không export, khai báo trước chỗ dùng (`lib/posts.ts:31-38`).
6. Hàm hoặc component export.

File component: một component export chính mỗi file. Biến thể của cùng thực thể được ở chung file (`PostCard` + `PostListItem`, `components/site/post-card.tsx`).

### [QU-27] Chữ ký hàm theo vai trò

| Vai trò (AD-5) | Chữ ký |
|---|---|
| action | `saveX(input: z.input<typeof xInputSchema>)` một tham số; id nằm trong `input`; trả `Result<T>` qua `run()` |
| service | `xRecord(data: z.infer<typeof xInputSchema>, tx?: Prisma.TransactionClient)`; nhận dữ liệu đã parse |
| query | `getX(slug)` / `listXForCms(filter?)`; trả `null` khi không có, không ném lỗi (AD-13) |
| component | props khai báo inline ([QU-11]); props client serialize được (AD-8) |

Kiểu trả về để TypeScript suy ra, trừ `Result<T>` của action.

### [QU-28] Khi nào tách hàm hoặc file

- Hàm làm hai việc, hoặc dài hơn khoảng 40 dòng → tách hàm phụ trong cùng file.
- Dùng lại ở file khác trong cùng module → chuyển vào file đúng vai trò của AD-5, không tạo `utils.ts` trong module.
- Dùng ở hai module trở lên → `platform/` (không nghiệp vụ) hoặc `types.ts`/`constants.ts` của module chủ (AD-2).
- Component dài hơn khoảng 200 dòng hoặc có khối tự đứng được → tách component con vào `_components/` cạnh nó (AD-11).
- Kiểm tra điều kiện sai thì `return`/`throw` sớm, tránh lồng `if` sâu.

## Checklist review code

- [ ] Thứ tự trong file, chữ ký hàm, cách tách theo [QU-26]–[QU-28].

- [ ] Import nội bộ dùng `@/`; Prisma từ `@/generated/prisma/client`; dùng `db` từ `@/platform/db`; `cn` từ `@/components/ui/lib/utils` ([QU-06], [QU-07]).
- [ ] File mới đặt đúng chỗ theo spine: `modules/<miền>/`, `platform/`, `components/ui|shared/`, `_components/`, `app/(site)`, `app/cms`; không có file mới ở `lib/`, `components/site|cms/` ([QU-01], [QU-02], [QU-03]).
- [ ] Slug URL mới tiếng Việt không dấu, tạo bằng `slugify` ([QU-04]).
- [ ] Object Prisma dùng lại có `as const`; kiểu suy từ `ReturnType`/`z.infer`/`z.input` ([QU-08], [QU-09]).
- [ ] Server Action bọc `run()`, `safeParse` + `firstError`, ném `UserError` tiếng Việt, trả `Result` ([QU-10], [QU-13], [QU-14]).
- [ ] Client kiểm `res.ok` và báo lỗi bằng `toast.error` ([QU-10]).
- [ ] Trường tuỳ chọn mới xử lý `null ↔ ""` cả hai chiều ([QU-12]).
- [ ] Chuỗi UI, `aria-label`, lỗi, comment tiếng Việt có dấu; comment nói vì sao ([QU-14], [QU-15], [QU-16]).
- [ ] `npm run lint` sạch (kể cả luật ranh giới module); không format lại file ngoài phạm vi thay đổi ([QU-17]).
- [ ] Biến env mới đọc trong đúng một file `platform/`, có trong `.env.example`, bí mật fail closed ([QU-18]).
- [ ] Không thêm log ngoài `run()` ([QU-19]).
- [ ] Ngày qua `formatDate` (`@/platform/format`), thời gian đọc/mục lục qua `@/platform/html/content` sau `@/platform/html/sanitize` ([QU-20], [QU-21]).
- [ ] Ảnh dùng `next/image` + `sizes` + placeholder; màu qua token ([QU-22], [QU-23]).
- [ ] `"use client"` chỉ khi cần; hook runtime trong `Suspense` ([QU-24]).
- [ ] Các bất biến `[KT-01]`–`[KT-10]` trong `docs/kien-truc-codebase.md` vẫn đúng.
