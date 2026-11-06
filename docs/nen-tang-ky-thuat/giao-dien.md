# Giao diện: React 19.3 · Tailwind CSS 4 · shadcn (base-nova / Base UI)

> Phiên bản: react / react-dom 19.3.0 · next 16.4.3 · tailwindcss 4.3.3 · @tailwindcss/turbopack 4.3.3 · @tailwindcss/typography 0.5.20 · shadcn 4.23.0 (style `base-nova`) · @base-ui/react 1.9.0 · cn 0.5.2 · class-variance-authority 0.7.1 · tw-animate-css 1.4.0 · lucide-react 1.66.0 · sonner 2.0.8
> Nguồn: `node_modules/next/dist/docs/01-app/` · `node_modules/@base-ui/react/docs/react/` · `node_modules/cn/README.md` · `node_modules/shadcn/dist/tailwind.css` · `npx shadcn --help` · `node_modules/@tailwindcss/turbopack/README.md`
> Kiểm lần cuối: 2026-11-05 @ 8a44768 (story 2.1: token DESIGN.md, dark theo hệ thống, CmsShell)

Liên quan: Next.js (`docs/nen-tang-ky-thuat/nextjs-16.md`: caching `[NX-01]`–`[NX-06]`, `ensureStatic` `[NX-03]`, proxy `[NX-09]`), kiểm tra & bảo mật (`docs/nen-tang-ky-thuat/kiem-tra-va-bao-mat.md`: Server Action `[BM-11]`, `[BM-18]`). Tài liệu này chỉ nói phần giao diện; khi cần quyết định về cache hay quyền truy cập, trỏ sang tài liệu kia.

## Tóm tắt cho agent

### [GD-01] Những điều PHẢI biết trước khi đụng vào giao diện

- **shadcn ở đây dựng trên Base UI, không phải Radix.** Không dùng `asChild`; dùng prop `render` (`app/(site)/_components/bottom-tab-bar.client.tsx`, `CategorySheet trigger`). Không chép mẫu shadcn/Radix từ trí nhớ; xem `[GD-04]`.
- **Không có `tailwind.config.*`, không có `postcss.config.*`.** Mọi token, biến thể, plugin khai báo trong `app/globals.css`. Tailwind chạy qua loader `@tailwindcss/turbopack` trong `next.config.ts:11-18`. Xem `[GD-03]`.
- **`cn` là package `cn`, không phải clsx + tailwind-merge.** `components/ui/lib/utils.ts:1` chỉ re-export `cn` từ `"cn"`; import bằng `@/components/ui/lib/utils`. Không cài `clsx`/`tailwind-merge`. Xem `[GD-05]`.
- **Toàn bộ site public phải tĩnh hoàn toàn:** `app/(site)/layout.tsx:6` đặt `ensureStatic = "navigation"`. Trong `app/(site)/**` không đọc `cookies()`, `headers()`, `searchParams` phía server, không truy vấn DB ngoài hàm `"use cache"`. Dữ liệu theo từng người đọc (tim, đã xem…) chỉ tải trong Client Component. Xem `[GD-18]`, `[GD-24]`.
- **Đặt `"use client"` ở lá, không đặt ở page/layout.** Page/layout là Server Component; chỉ nút, form, widget tương tác mới là Client Component. Xem `[GD-02]`.
- **Gọi Server Action từ client theo mẫu của dự án:** `useTransition` + action trả `{ ok: true, ... } | { ok: false, error }` + `toast` từ `sonner`. Xem `[GD-12]`, `[GD-17]`.
- **Chuỗi giao diện bằng tiếng Việt có dấu**, kể cả `aria-label`, toast, placeholder. Font Be Vietnam Pro (subset `vietnamese`). Xem `[GD-08]`, `[GD-14]`.
- **Mobile-first, kiểm ở bề rộng 360px.** Nút mặc định của shadcn chỉ cao 32px (`h-8`); vùng chạm tối thiểu là token `touch-target` (44px, UX-DR37): CMS dưới 1024px tự nâng `Button`/`Input` qua `[data-cms-shell]`, chỗ khác dùng `min-h-touch-target`/`size-touch-target`. Xem `[GD-07]`, `[GD-14]`, `[GD-35]`.
- **Ảnh dùng `next/image`, host phải nằm trong `IMAGE_HOSTS`** (`platform/images.ts:2`). Không dùng prop `priority` (đã deprecated ở Next 16). Xem `[GD-13]`, `[GD-30]`.
- **Token lấy từ `DESIGN.md`, khai báo một lần ở `app/globals.css`; sáng/tối theo `prefers-color-scheme`, không có nút đổi tay.** Không viết mã hex trong component. Xem `[GD-07]`, `[GD-09]`.
- **`/cms/styleguide` là bản tham chiếu sống** của token và component (`app/cms/styleguide/_components/styleguide-screen.tsx`, sau Basic Auth). Thêm token/component dùng chung thì thêm mẫu vào đó. Xem `[GD-15]`.
- **Component mới đặt theo spine AD-11** (`modules/<miền>/components/`, `components/ui|shared/`, `_components/`); `components/cms/` là code cũ chờ chuyển (`components/site/` đã xoá), không thêm file vào đó. Xem `[GD-10]`.

## Khái niệm cốt lõi

### [GD-02] Server Component, Client Component và ranh giới `"use client"`

- Mọi file trong `app/` và `components/` mặc định là **Server Component**: chạy trên server, được prerender, không có state, không có event handler, không dùng hook trình duyệt.
- `"use client"` ở dòng đầu file đánh dấu **ranh giới**: file đó và mọi thứ nó import trở thành code client. Ví dụ ranh giới hiện có: `app/cms/_components/cms-shell.client.tsx:1`, `app/(site)/_components/{bottom-tab-bar,category-sheet}.client.tsx`, `components/cms/*` (trừ `seo-score.tsx`, `status-badge.tsx`), `components/ui/{dialog,sheet,tabs,label,sonner}.tsx`.
- Server Component được import và render Client Component; ngược lại thì không (Client Component chỉ nhận Server Component qua `children`/props JSX).
- Props từ server sang client phải tuần tự hóa được (chuỗi, số, mảng, object thuần, `Date`, Promise, JSX). Không truyền hàm, trừ Server Action. Ví dụ: `PostEditor` nhận `initial` là object thuần (`app/cms/posts/[id]/page.tsx:24-46`).
- Server Action (`"use server"`, `app/cms/actions.ts:1`) được import thẳng vào Client Component và gọi như hàm async (`components/cms/new-post-form.tsx:7,27`).
- Component không có tương tác (badge, card, heading) giữ là Server Component, không thêm `"use client"` "cho chắc": `components/cms/status-badge.tsx`, `components/cms/seo-score.tsx` không có directive và vẫn được dùng trong Client Component `post-editor.tsx` (khi đó chúng chạy ở client vì được import từ file client).
- React 19.3 có `useActionState`, `useOptimistic`, `useTransition`, và API `browser()` từ `react-dom` (đã kiểm `node_modules/react-dom/cjs/react-dom.production.js:74`, `node_modules/@types/react-dom/index.d.ts:189`). Repo hiện chỉ dùng `useTransition`; `useActionState` và `useOptimistic` chưa dùng ở đâu.

### [GD-03] Tailwind CSS 4: cấu hình bằng CSS

- Điểm vào duy nhất là `app/globals.css`, import một lần trong `app/layout.tsx:5`.
- `@import "tailwindcss"` (`app/globals.css:1`), `@import "tw-animate-css"` (dòng 2, lớp `animate-in`/`fade-in-0`… dùng trong dialog/sheet), `@import "shadcn/tailwind.css"` (dòng 3, biến thể `data-open`, `data-closed`, `data-checked`, `data-active`, `data-horizontal`… và utility `no-scrollbar`, `scroll-fade-*`, `shimmer`; xem `node_modules/shadcn/dist/tailwind.css:28-90`), `@plugin "@tailwindcss/typography"` (dòng 4, lớp `prose`).
- `@custom-variant dark (@media (prefers-color-scheme: dark));` (`app/globals.css`): `dark:` theo chế độ của hệ điều hành. Không có class `.dark`, không có next-themes.
- Giá trị màu thật nằm ở `:root` (sáng) và khối `@media (prefers-color-scheme: dark) { :root { … } }` (tối), dạng hex đúng như `DESIGN.md`.
- `@theme inline { ... }` ánh xạ biến CSS sang token Tailwind: `--color-surface: var(--surface)` sinh ra `bg-surface`, `text-surface`… Từ khóa `inline` làm utility tham chiếu thẳng `var(--surface)`, nên đổi giá trị trong khối dark là đủ để đổi màu.
- `@theme static { ... }` khai báo bo góc, spacing, typography (giá trị cố định, luôn xuất biến vì component shadcn đọc thẳng `var(--radius)`, `var(--radius-md)`).
- Tailwind quét mã nguồn để tìm tên lớp **nguyên văn**. Tên lớp ghép chuỗi (`` `text-${x}` ``) không được sinh CSS.
- Cú pháp v4 đang dùng trong repo: dấu `!` ở cuối để `!important` (`h-10!`, `components/cms/post-editor.tsx:138`), biến CSS trong ngoặc tròn (`gap-(--card-spacing)`, `components/ui/card.tsx:14`), `--spacing(4)` (cùng dòng), `has-data-[slot=...]`, `in-data-[slot=...]`, `field-sizing-content` (`components/ui/textarea.tsx:9`).

### [GD-04] shadcn style `base-nova` trên `@base-ui/react`

- `components.json`: `"style": "base-nova"`, `"rsc": true`, `"tailwind.config": ""` (không có file config), `"css": "app/globals.css"`, `"baseColor": "neutral"`, `"iconLibrary": "lucide"`, alias `ui` → `@/components/ui`, `utils` → `@/components/ui/lib/utils`, `lib` → `@/components/ui/lib`, `hooks` → `@/components/ui/hooks`.
- Primitive đến từ `@base-ui/react/<tên>` (ví dụ `components/ui/button.tsx:1`, `components/ui/dialog.tsx:4`, `components/ui/tabs.tsx:3`). Không có `@radix-ui/*` trong `package.json`.
- Khác biệt với shadcn/Radix mà agent hay nhớ nhầm:

| Việc | Radix (KHÔNG dùng ở đây) | Base UI (đang dùng) |
|---|---|---|
| Đổi phần tử được render | `asChild` + con duy nhất | `render={<Button ... />}` hoặc `render={(props, state) => <el {...props} />}` (`components/ui/dialog.tsx:65-71`) |
| Overlay | `Dialog.Overlay` | `Dialog.Backdrop` (`components/ui/dialog.tsx:31`) |
| Nội dung popup | `Dialog.Content` | `Dialog.Popup` (`components/ui/dialog.tsx:53`) |
| Tab | `Tabs.Trigger` / `Tabs.Content` | `Tabs.Tab` / `Tabs.Panel` (`components/ui/tabs.tsx:57,73`); wrapper shadcn vẫn tên `TabsTrigger`/`TabsContent` |
| Thuộc tính trạng thái | `data-state="open"` | `data-open`, `data-closed`, `data-active`, `data-checked`; transition dùng `data-starting-style` / `data-ending-style` (`components/ui/sheet.tsx:31`) |
| `onOpenChange` | `(open) => void` | `(open, eventDetails) => void` (`node_modules/@base-ui/react/dialog/root/DialogRoot.d.ts:40`) |
| Component tự viết có `render` | `Slot` | `useRender` + `mergeProps` (`components/ui/badge.tsx:1-2,35-48`) |
| Button render thành thẻ khác | — | phải đặt `nativeButton={false}`; Base UI cấm render `<a>` thành button (`node_modules/@base-ui/react/docs/react/components/button.md:137-150`) |

- Biến thể `data-open`/`data-closed` trong `shadcn/tailwind.css` khớp cả `[data-state="open"]` lẫn `[data-open]`, nên lớp `data-open:animate-in` chạy được với Base UI.
- Mỗi wrapper gắn `data-slot="..."` (ví dụ `data-slot="button"`, `components/ui/button.tsx:50`); style cha có thể chọn con qua `has-data-[slot=...]` / `in-data-[slot=...]`.

### [GD-05] `cn` và `class-variance-authority`

- `cn` (package `cn` 0.5.2, do shadcn phát hành) = clsx + tailwind-merge, cùng API (`node_modules/cn/README.md`). Ghép có điều kiện và giải xung đột: lớp sau thắng lớp trước cùng nhóm.
- Đã chạy thử: `cn("h-8 px-2","h-10")` → `"px-2 h-10"`; `cn("text-xs text-muted-foreground","text-meo-vat")` → `"text-xs text-meo-vat"` (token màu tùy biến được nhận là màu, không đè cỡ chữ).
- File trong `components/ui/*` import `cn` từ `"cn"` (CLI sinh như vậy, kể cả component mới; đã kiểm bằng `npx shadcn add switch --view`). Code của dự án import từ `"@/components/ui/lib/utils"` (`app/cms/_components/cms-shell.client.tsx`). Hai đường cùng một hàm (`[NO-22]`).
- `cva` định nghĩa biến thể: `buttonVariants` (`components/ui/button.tsx:5-40`) có `variant` (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) và `size` (`default`=h-8, `xs`, `sm`, `lg`=h-9, `icon`=size-8, `icon-xs`, `icon-sm`, `icon-lg`=size-9). `badgeVariants` (`components/ui/badge.tsx:6-27`), `tabsListVariants` (`components/ui/tabs.tsx:25-38`).
- Dùng `buttonVariants(...)` để tạo kiểu nút cho `<a>`/`<Link>` (`app/cms/san-pham/_components/product-list-screen.tsx`).

## Dự án dùng như thế nào

### [GD-06] Cấu hình build CSS và trang

- `next.config.ts:11-18`: rule Turbopack cho `*.css` chạy loader `@tailwindcss/turbopack`. Turbopack là bundler mặc định cho cả `next dev` và `next build` ở Next 16 (`node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md:39`), nên rule này áp dụng cả hai.
- `next.config.ts:9-10`: `cacheComponents: true`, `partialPrefetching: true`.
- `next.config.ts:5-8`: `images.remotePatterns` sinh từ `IMAGE_HOSTS` (`platform/images.ts:2`: `down-vn.img.susercontent.com`, `cf.shopee.vn`). Host của nơi lưu upload thêm vào đây ở story upload đầu tiên (spine AD-24).
- `app/(site)/layout.tsx:6`: `ensureStatic = "navigation"` cho mọi trang public.
- `app/cms/layout.tsx:11`: `maxDuration = 120` (gọi AI mất 20–40 giây; trần theo spine AD-18); `metadata.robots` noindex (dòng 5-8).
- `proxy.ts`: Basic auth chặn `/cms`, `/cms/*` (trừ `/cms/upload`, tự `requireAdmin()` — AD-24) **và** `/api/:path*`.

### [GD-07] Design token

Nguồn: frontmatter `DESIGN.md` (`_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/DESIGN.md`). Khai báo một lần trong `app/globals.css`; component chỉ dùng tên token, không dùng mã hex, màu Tailwind thô (`bg-orange-500`) hay giá trị cứng.

**Màu** (UX-DR1–UX-DR4). Mỗi màu có giá trị sáng ở `:root` và giá trị `-dark` ở khối `@media (prefers-color-scheme: dark)`. Chỉ token có cặp `-dark` mới thành biến; 15 token chỉ-light của DESIGN.md không khai báo, không dùng. Utility trùng tên token: `bg-surface-container-low`, `text-on-surface-variant`, `bg-primary-container`, `text-on-tertiary-fixed`, `border-outline-variant`…

- Hai token đổi tên vì trùng biến shadcn: `secondary` của DESIGN.md (xô thơm) → `brand-secondary` (`text-brand-secondary`); `background`/`on-background` trùng giá trị `surface`/`on-surface` ở cả hai chế độ nên không khai báo, dùng `surface`/`on-surface`.
- Vai trò màu và cột "Không dùng cho" theo bảng Colors của DESIGN.md: CTA Shopee `primary-container` chỉ cho AffiliateLink; `secondary-container` chỉ cho badge Mẹo vặt; `tertiary-fixed` chỉ cho badge Gom link; `outline` chỉ cho icon/viền, không cho chữ.
- `app/globals-contrast.test.ts` đọc `app/globals.css` (qua `parseColorTokens`, `platform/design-tokens.ts`; parser ném lỗi khi thiếu khối sáng/tối, màu không phải hex 6 chữ số hoặc tập token sáng ≠ tối) và kiểm mọi cặp chữ/nền ≥ 4.5:1 ở cả hai chế độ; thêm cặp mới vào `TEXT_PAIRS` khi thêm vai trò màu. Giữ khai báo dạng `--tên: #rrggbb;` để test đọc được.

Biến shadcn là alias tới token (UX-DR3), khai báo một lần trong `:root` nên tự đổi theo chế độ:

| Biến shadcn (utility) | Token | Ví dụ dùng |
|---|---|---|
| `background` / `foreground` | `surface` / `on-surface` | `app/globals.css` (`body`) |
| `card`, `popover` (+ `-foreground`) | `surface-container-lowest` (+ `on-surface`) | `components/ui/card.tsx:14`, `components/ui/sheet.tsx` |
| `primary` / `primary-foreground` | `primary` / `on-primary` | nút chính, link |
| `secondary` (+ `-foreground`) | `surface-container-low` (+ `on-surface`) | `Button variant="secondary"` |
| `muted` / `muted-foreground` | `surface-container` / `on-surface-variant` | `Skeleton`, chữ phụ |
| `accent` (+ `-foreground`) | `surface-container-high` (+ `on-surface`) | hover menu |
| `border`, `input` / `ring` | `outline-variant` / `primary` | viền, ô nhập, focus ring |
| `destructive` | `error` | lỗi, xoá |

Alias tạm cho component cũ (không sửa màu trong component cũ; story chuyển component đổi sang tên token rồi bỏ alias): `meo-vat` → `on-secondary-container`, `meo-vat-soft` → `secondary-container`, (`components/cms/status-badge.tsx`; `gom-link*` đã bỏ ở lượt gộp 2.4–2.8 khi badge và ProductCard chuyển sang tên token), `chart-3` → `on-surface-variant` (`components/cms/seo-score.tsx`). `chart-1..5` khác và `sidebar-*` đã bỏ.

Khác:

- **Bo góc** (UX-DR6, một thang cho cả site và CMS): `rounded-sm` 0.125rem · `rounded` 0.25rem · `rounded-md` 0.375rem · `rounded-lg` 0.5rem · `rounded-xl` 0.75rem · `rounded-full`. Thẻ/khối `rounded-xl`; ảnh trong thẻ, nút, input `rounded-lg`; badge Loại bài `rounded`; chip, nút tròn `rounded-full`.
- **Spacing** (UX-DR7): `space-xs|sm|md|lg|xl` (0.25/0.5/1/1.5/2.5rem), `gutter`, `gutter-desktop`, `margin`, `margin-tablet`, `margin-desktop`, `container-max` (1120px), `touch-target` (44px); dùng với mọi utility spacing: `p-space-md`, `gap-gutter`, `px-margin`, `max-w-container-max`, `min-h-touch-target`.
- **Typography** (UX-DR5): `text-headline-display`, `text-headline-display-mobile`, `text-headline-lg`, `text-headline-lg-mobile`, `text-headline-md`, `text-headline-sm`, `text-body-lead`, `text-body-regular`, `text-body-sm`, `text-label-md`, `text-label-sm`, `text-label-meta`; mỗi lớp gồm cỡ, dòng, giãn chữ và độ đậm.
- **Elevation** (UX-DR8): `shadow-level-0` (khối nằm), `shadow-level-1` (hover/dropdown/Sheet), `shadow-sticky-top`, `shadow-sticky-bottom` (thanh dính); dark bỏ bóng. Utility `sticky-bar` = nền `surface` 90% + blur 12px cho SiteHeader, BottomTabBar, ArticleActionBar, thanh trên CmsShell.
- **Font**: `--font-sans` và `--font-heading` đều trỏ `var(--font-body)`. Base layer: `body` có `leading-relaxed`; `h1–h4` tự có `font-heading font-semibold leading-snug tracking-tight` (tiêu đề 600 theo DESIGN.md).
- **CMS mobile 44px** (UX-DR37): dưới 1024px, khi trang có `[data-cms-shell]`, mọi `[data-slot=button]` và `[data-slot=input]` có `min-height` (nút thêm `min-width`) bằng `touch-target`, kể cả trong Sheet/Dialog (portal). Link dạng nút (`buttonVariants`) không có `data-slot` nên tự thêm `min-h-touch-target lg:min-h-0` (`app/cms/page.tsx`).
- **Bẫy `cn`**: package `cn` coi `text-<token tự đặt>` (`text-label-md`, `text-headline-sm`) là màu chữ, nên `cn("text-label-md", "text-primary")` bỏ mất `text-label-md`; `h-9` với `h-touch-target` được giữ cả hai (thứ tự CSS quyết định). Đặt lớp cỡ chữ token lên phần tử cha/con thay vì ghép cùng lớp màu trong `cn`, hoặc dùng `!` (`size-touch-target!`, `app/cms/_components/cms-shell.client.tsx`).

### [GD-08] Font và typography

- `app/layout.tsx:2,8-12`: `Be_Vietnam_Pro` từ `next/font/google`, `subsets: ["latin", "vietnamese"]`, `weight: ["400","500","600","700"]`, biến `--font-body`, gắn class lên `<html>` (dòng 26). Chỉ có 4 độ đậm này; `font-light`/`font-extrabold` sẽ bị trình duyệt giả lập.
- `<html lang="vi">` (`app/layout.tsx:26`).
- Thân Bài web render HTML đã lọc bằng lớp `prose` (`app/(site)/bai-viet/[slug]/page.tsx:109-112`): `prose max-w-none sm:prose-lg text-foreground prose-headings:font-heading prose-headings:text-foreground prose-h2:scroll-mt-24 prose-a:text-primary prose-strong:text-foreground prose-li:marker:text-primary`. Dự án **không** dùng `dark:prose-invert`; màu được ghi đè từng phần tử bằng token. Thẻ được phép trong thân bài: `platform/html/sanitize.ts:6-10` (có `blockquote`, `table`, `hr`, `figure`, `figcaption`; **không** có `a`, `img` — spine AD-22), nên `prose-a:text-primary` hiện không có tác dụng (không còn thẻ `a` trong thân bài). Xem bẫy `[GD-32]`.
- `prose-h2:scroll-mt-24` để mục lục (`withHeadingIds`, `platform/html/content.ts:11-21`) nhảy tới h2 không bị header sticky (h-16) che.
- Ngày tháng định dạng tiếng Việt bằng `formatDate` (`platform/format.ts:1-8`, `Intl.DateTimeFormat("vi-VN")`, múi giờ `Asia/Ho_Chi_Minh`). Không tự định dạng ngày.

### [GD-09] Dark mode

- Theo hệ điều hành (`prefers-color-scheme`, UX-DR2, NFR-11); **không có nút đổi sáng/tối ở bất cứ đâu** và không dùng next-themes (đã gỡ). Đổi chế độ hệ điều hành thì trang đổi ngay, không cần reload.
- `:root` có `color-scheme: light dark` để thanh cuộn, ô nhập gốc của trình duyệt cũng theo chế độ.
- Biến thể `dark:` là media query, nên không có lệch hydrate do theme: server và client render cùng HTML.
- `Toaster` (`components/ui/sonner.tsx`) đặt `theme="system"` và màu theo token `toast`: nền `inverse-surface`, chữ `inverse-on-surface`, bo `--radius-lg`; gắn ở root layout với `position="top-center"`, không `richColors` (để toast lỗi cũng theo token).
- Kiểm chế độ tối: DevTools › Rendering › Emulate CSS media feature `prefers-color-scheme: dark`.

### [GD-10] Kiểm kê component

`components/ui/` (sinh bởi shadcn CLI, style base-nova; sửa ít, ghi lý do khi sửa):

- `components/ui/button.tsx`: `Button`, `buttonVariants` (Base UI Button + cva).
- `components/ui/badge.tsx`: `Badge`, `badgeVariants` (dùng `useRender`, nhận `render`).
- `components/ui/card.tsx`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` (div thuần, `size` `default|sm`).
- `components/ui/dialog.tsx`: `Dialog*` (client; `showCloseButton`).
- `components/ui/sheet.tsx`: `Sheet*` (client; dựng từ Base UI Dialog, `side` `top|right|bottom|left`).
- `components/ui/tabs.tsx`: `Tabs`, `TabsList` (`variant` `default|line`), `TabsTrigger`, `TabsContent` (client).
- `components/ui/input.tsx`: `Input` (Base UI Input; `text-base md:text-sm`, cao `h-8`).
- `components/ui/textarea.tsx`: `Textarea` (`field-sizing-content`, tự giãn).
- `components/ui/label.tsx`: `Label` (`<label>` thuần, client).
- `components/ui/skeleton.tsx`: `Skeleton` (`animate-pulse bg-muted`).
- `components/ui/switch.tsx`: `Switch` (client; Base UI Switch, thêm bằng shadcn CLI ở Epic 6; vùng bấm nới bằng `after:`).
- `components/ui/sonner.tsx`: `Toaster` (client; icon lucide, màu token `toast`; đã bỏ `useTheme` của next-themes).

Đã chuyển / dựng ở vị trí mới (lượt gộp Story 2.4–2.8 chuyển hết `components/site/` và `components/json-ld.tsx`):

- `app/cms/_components/cms-shell.client.tsx`: `CmsShell` (client) — khung CMS, xem `[GD-11]`.
- `app/(site)/_components/site-header.tsx`: SiteHeader (server) — logo chữ + dòng phụ "Tạp chí tổ ấm nhỏ", nút tìm (`/tim-kiem`, 404 tới Epic 8); ≥ 1024px nav ngang Mẹo vặt, Gom link, `DESKTOP_NAV_CATEGORIES` Danh mục đầu, phần dư trong menu "Thêm" (`more-menu.client.tsx`: đóng khi đổi trang, Esc, chạm ngoài; bọc `<Suspense>` vì dùng `usePathname`), nút "Đồ hay" (`/bio`).
- `app/(site)/_components/bottom-tab-bar.client.tsx`: BottomTabBar (client, `< lg`) 5 tab Tạp chí / Mẹo vặt / Gom link / Danh mục / Đồ hay; `activeTab()` khớp đoạn đầu đường dẫn (kể cả `/trang/n`), `aria-current="page"`; ẩn trên `/bai-viet/*`. Dùng `usePathname` nên layout bọc `<Suspense>` với `BottomTabBarView active={null}` làm fallback (`use-pathname.md` › Cache Components).
- `app/(site)/_components/category-sheet.client.tsx`: CategorySheet — `Sheet side="bottom"`, dòng cao `touch-target`, đóng bằng vuốt xuống (> 80px), Esc, chạm nền; base-ui bẫy và trả focus.
- `app/(site)/_components/site-footer.tsx`: SiteFooter — giới thiệu, link Danh mục, Mẹo vặt/Gom link/Đồ hay, `AffiliateDisclosure variant="text"`, ©; mobile chừa đáy cho BottomTabBar.
- `app/(site)/_components/site-nav.ts`: đích điều hướng cố định (`BIO_PATH`, `SEARCH_PATH`, `POST_TYPE_LINKS`, `DESKTOP_NAV_CATEGORIES`).
- `app/(site)/_components/{breadcrumb,pagination,post-list-screen,post-list-skeleton}.tsx`, `pagination-items.ts` (+ test), `post-type-route.ts` + `post-type-screen.tsx`, `list-page-metadata.ts` (+ test), `home-screen.tsx`: trang Danh mục / Loại bài (Breadcrumb một cấp `aria-label="Vị trí trang"`, Pagination đầu/cuối/±1, EmptyState với `emptyTitle`: "Danh mục này chưa có bài nào" / "Chưa có bài Mẹo vặt nào").
- `app/(site)/_components/section-heading.tsx`, `json-ld.tsx`: chuyển nguyên từ `components/site/`, `components/`.
- `modules/posts/components/post-card.tsx`: `PostCard` (ảnh 4:3) và `PostListItem`; ảnh qua `ImageFallback`; props `Pick<PostCardData, …>`.
- `modules/posts/components/post-type-badge.tsx`: `PostTypeBadge postType=` — token `post-type-badge-meo-vat|gom-link` (nền + chữ, `rounded`, `label-meta`, chữ hoa).
- `modules/products/components/affiliate-link.tsx`: `AffiliateLink` — mọi link Shopee: `target="_blank"`, `rel="sponsored nofollow noopener"` đặt sau props (không ghi đè được).
- `modules/products/components/product-card.tsx`: `ProductCard variant="row" | "tile"` — cả thẻ là một `AffiliateLink`; ảnh `alt=""` trong `ImageFallback`; dòng "Giá tham khảo ~89.000đ · cập nhật dd/mm/yyyy" (`formatShortDate`); "nút Shopee" chỉ là hình (token `affiliate-link-button`: `bg-primary-container`, `h-9`, `rounded-lg`, `text-label-sm`) + chữ ẩn ", mở Shopee trong tab mới"; `pinned` hiện dấu Ghim (icon pin nền `primary-fixed`, chữ ẩn "Nổi bật") trên `/bio`.
- Trang bio (Epic 6, bố cục Stitch từ 2026-11-06): `modules/bio/components/`: `BioBrowser` (dòng Danh mục + "Xem thêm N danh mục", màn mặc định nhóm "Nổi bật" — không có món ghim thì nhóm theo Danh mục; dòng đang xem trên URL `?danh-muc=<slug>` qua `history.pushState` + `useSearchParams` trong `<Suspense>`), `BioHighlights` (dải *tile* Trang chủ, snap mobile, lưới 4 cột desktop), `BioSettingsForm` (CmsForm), `BioProductList` (`useOptimistic`, mỗi thao tác lưu ngay + Toast "Đã lưu").
- `modules/products/components/affiliate-disclosure.tsx`: `AffiliateDisclosure variant="box" | "text"` — token `affiliate-disclosure` (`bg-surface-container-low`, icon tròn `primary-fixed`, `rounded-xl`, `body-sm`), câu công khai theo EXPERIENCE.md; prop `sentence` thay câu mặc định (câu `/bio` từ CMS, dòng ngắn dải Trang chủ).
- `modules/products/components/product-status-badge.tsx` (`hidden` → "Ẩn" trung tính / "Hiện"), `product-visibility-button.client.tsx` (Ẩn/Hiện lại một chạm, Toast "Hoàn tác", không ConfirmDialog).
- `components/shared/image-fallback.client.tsx`: `ImageFallback` — `next/image` + khung `surface-container` với icon `image-off` khi lỗi tải hoặc không có `src` (dùng với `fill` trong khung tỉ lệ cố định).
- Bài web (Epic 3): `modules/posts/components/post-form.client.tsx` (`PostForm`, trình soạn `/cms/bai-viet/[id]`; thanh thao tác `post-action-bar.client.tsx` — Xuất bản / Chuyển về nháp / Xoá qua `ConfirmDialog`; `post-seo-check.client.tsx`, `post-threads.client.tsx` gọi action AI cũ do Screen truyền làm prop); **PostEditor** = `post-body-editor.client.tsx` (Tiptap: StarterKit chỉ bật H2, H3, đoạn, danh sách, trích dẫn, đậm, nghiêng; thanh công cụ dính; dán qua `sanitizePostHtml`; `immediatelyRender: false`); **PreviewSheet** = `preview-sheet.client.tsx` (Sheet toàn màn, nhãn "Bản xem trước" nền `inverse-surface`, render `PostArticle` với HTML sanitize ở client); `PostArticle` (`post-article.tsx`, thân trang bài dùng chung site + xem trước), `ArticleBody` (utility CSS `article-body` trong `app/globals.css`), `TableOfContents` (`table-of-contents.client.tsx`, IntersectionObserver trên khung cuộn gần nhất), `PostTags`, `RelatedPosts`, `PostCard` *featured*/*grid*/*row*, `PostStatusBadge`, `PostTypePicker`, `NewPostForm` (RHF + CmsForm). **ProductPicker** = `modules/products/components/product-picker.client.tsx` (từ khoá lên URL `?sp=`, Screen đọc `listPickerProductsForCms`; dòng ảnh 40px + lên/xuống/gỡ 44px; không tạo/sửa Sản phẩm). `components/shared/`: `breadcrumb.tsx`, `empty-state.tsx`, `error-screen.client.tsx`; `CmsForm` có thêm `pendingLabel`, `ConfirmDialog` có `pendingLabel`.
- `components/shared/upload-field.client.tsx` (mẫu ở styleguide): `UploadField` — huỷ XHR khi gỡ khỏi màn; `onUploadingChange` để form chặn Lưu ("Đang tải ảnh…", prop `busyLabel` của `CmsForm`); — `mode="single"` (ô dán URL + nút "Chụp hoặc chọn ảnh" + xem trước đúng tỉ lệ) hoặc `mode="append"` (chỉ nút, trả `onUploaded(url)`); XHR tới `/cms/upload` có thanh tiến trình và "Huỷ"; luật loại/dung lượng từ `platform/upload-rules.ts`; lỗi qua `onError` → `form.setError` tại trường.

Vị trí component **mới** theo spine AD-11: hiển thị/form của một thực thể → `modules/<miền>/components/` (form client `<x>-form.client.tsx`); nền shadcn → `components/ui/`; dùng chung không nghiệp vụ → `components/shared/` (hook ở `components/shared/hooks/`); chỉ CMS → `app/cms/_components/`; chỉ site → `app/(site)/_components/`. Link tới Shopee qua `AffiliateLink` của `modules/products/components`. Không có component phù hợp → `[COMPONENT-UNKNOWN]` và hỏi.

**Bẫy `cn` với token chữ:** `cn("text-label-meta", "text-primary")` trả `"text-primary"` — tailwind-merge coi cỡ chữ token và màu chữ cùng nhóm (`[NO-25]`). Ghép chuỗi thường khi một phần tử có cả `text-<token cỡ chữ>` và `text-<màu>`.

`components/cms/` (**code cũ chờ chuyển**; CMS):

- `components/cms/fields.tsx`: `Field` (label + hint + control), `CategoryPicker` (lưới 2 cột nút chọn), `ProductFields` (danh sách Sản phẩm thêm/xóa), `emptyProduct` (client).
- `components/cms/new-post-form.tsx`: form tạo bài (AI viết hoặc nháp trống) gọi `createPost` (client).
- `components/cms/post-editor.tsx`: trình sửa bài: thanh thao tác sticky, tab Nội dung/SEO/Sản phẩm/Threads, xem trước trong `iframe sandbox` (client).
- `components/cms/seo-score.tsx`: vòng tròn điểm SEO (SVG), màu theo ngưỡng 80/50.
- `components/cms/status-badge.tsx`: nhãn "Đã đăng" / "Nháp".

### [GD-11] Bố cục site và CMS

```mermaid
flowchart TD
  Root["app/layout.tsx<br/>html lang=vi · font · Toaster"]
  Root --> Site["app/(site)/layout.tsx<br/>ensureStatic=navigation<br/>SiteHeader · main.flex-1 · SiteFooter"]
  Root --> Cms["app/cms/layout.tsx<br/>CmsShell: thanh trên h-14 + Sheet (< 1024px)<br/>sidebar w-64 (≥ 1024px) · main max-w-2xl"]
  Cms --> Sg["/cms/styleguide"]
  Site --> Home["/ (page.tsx)"]
  Site --> Cat["/[category]"]
  Site --> Post["/bai-viet/[slug]"]
  Cms --> List["/cms"]
  Cms --> New["/cms/new"]
  Cms --> Edit["/cms/posts/[id]"]
```

Site public (`app/(site)`):

- Khung: `body` là `min-h-full flex flex-col` (`app/layout.tsx:27`), `main.flex-1` đẩy footer xuống đáy (`app/(site)/layout.tsx:12`).
- Vùng nội dung: `mx-auto max-w-6xl px-4` (header, footer, trang chủ, trang loại bài, trang bài). Khối chữ hẹp hơn: `max-w-5xl` (đầu bài, ảnh lớn), `max-w-3xl` (h1), cột thân bài + mục lục `lg:grid-cols-[1fr_14rem]` (`app/(site)/bai-viet/[slug]/page.tsx:106`).
- Lưới thẻ: `grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3` (`app/(site)/page.tsx:50`, `app/(site)/[category]/page.tsx:38`). Dải cuộn ngang trên mobile: `-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4` (`app/(site)/page.tsx:60`).
- Header sticky `z-40` (`app/(site)/_components/site-header.tsx`); nav ngang hiện từ `lg`; dưới `lg` là BottomTabBar `fixed` đáy (`z-40`), footer chừa đáy tương ứng.
- Khoảng dọc: `py-8 sm:py-12`, giữa các khối `space-y-16`.

CMS (`app/cms`): khung là `CmsShell` (`app/cms/_components/cms-shell.client.tsx`, UX-DR38), `app/cms/layout.tsx` chỉ giữ metadata, `maxDuration` và bọc `<CmsShell>`.

- **< 1024px:** thanh trên dính `sticky-bar h-14 z-30` gồm nút menu (`Menu` Lucide, 44px, `aria-label="Mở menu"`) và tên mục hiện tại `text-headline-sm`; nút mở `Sheet` trái liệt kê mục theo thứ tự IA và "Xem site". Bấm mục thì đóng Sheet.
- **≥ 1024px:** sidebar cố định `w-64` (`sticky top-0 h-dvh`, nền `surface-container-low`), không có nút menu.
- Mục menu khai báo ở `NAV_ITEMS` (`{ label, href, match }`) theo thứ tự IA trong `EXPERIENCE.md` (Bài web, Sản phẩm, Cảm hứng, Danh mục, Banner, Trang bio, Hồ sơ phong cách, Styleguide); **chỉ khai báo mục đã có màn**. Hiện có: "Bài web" → `/cms` (khớp `/cms`, `/cms/new`, `/cms/posts/*`; đổi sang `/cms/bai-viet` khi chuyển màn bài viết) và "Styleguide". Mục đang mở: nền `surface-container-high`, chữ `on-surface` đậm 600, vạch trái `primary` (inset shadow), `aria-current="page"`. Không dùng chữ `primary` trên `surface-container-high`/`surface-container` (dark 4.02:1 / 4.42:1, dưới AA); hover là `on-surface` trên `surface-container`. Cặp đã có trong `TEXT_PAIRS`.
- `<aside aria-label="Thanh bên CMS">`; "Xem site" có `sr-only` "(mở tab mới)".
- "Xem site" là `<a href="/" target="_blank">`, ở cuối Sheet và sidebar.
- `usePathname` nằm trong `Suspense` (`WithPathname`), fallback là bản chưa đánh dấu mục đang mở.
- Nội dung: `main.mx-auto.max-w-2xl.px-margin`, nền trang `surface`; không còn bottom nav nên không cần `pb-28`. Nút tạo mới đặt trong màn (ví dụ "Tạo bài web" đầu danh sách, `app/cms/page.tsx`).
- Thanh thao tác của editor sticky `top-14 z-20 -mx-4` (`components/cms/post-editor.tsx:114`) khớp chiều cao thanh trên mobile; ở ≥ 1024px không có thanh trên nên nó chừa khoảng trống 56px — sửa (`top-14 lg:top-0`) khi chuyển file đó.
- Trang CMS đọc DB **không cache**: bọc phần đọc trong `<Suspense fallback={<Skeleton…/>}>` và gọi `await connection()` hoặc `await params` bên trong (`app/cms/page.tsx`, `app/cms/posts/[id]/page.tsx:9-17`).

### [GD-12] Mẫu gọi Server Action từ client (đang dùng)

- Mọi action CMS bọc trong `run()` (`platform/auth/run.ts:5-14`): gọi `requireAdmin()`, bắt lỗi, trả `Result<T> = ({ ok: true } & T) | { ok: false; error: string }` (`platform/errors.ts:9`). Lỗi hiện cho người dùng là câu tiếng Việt lấy từ Zod (`firstError`, `platform/validation/errors.ts:3-5`) hoặc `throw new UserError("…")`; lỗi khác thành "Có lỗi xảy ra, thử lại sau".
- Client gọi trong `startTransition(async () => { ... })`, đọc `res.ok`, báo bằng `toast.error(res.error)` / `toast.success("…")`, rồi `router.push(...)` (`components/cms/new-post-form.tsx:19-35`).
- Khi một màn có nhiều action, dùng một state `busy: string | null` để khóa mọi nút và hiện spinner ở đúng nút (`components/cms/post-editor.tsx:37-53,126-133`).
- Trạng thái chờ: `disabled={pending}` + `<Loader2 className="animate-spin" />` thay icon + đổi nhãn ("AI đang viết… (20–40 giây)", `components/cms/new-post-form.tsx:56-59`).
- Sau khi action thay đổi Bài web công khai, action gọi `updateTag(POSTS_TAG)` (`app/cms/actions.ts:112,132,143`). Client không tự làm mới cache.
- Trang sửa truyền `key={post.updatedAt.toISOString()}` cho `PostEditor` (`app/cms/posts/[id]/page.tsx:25`) để state client khởi tạo lại khi dữ liệu server mới về.

### [GD-13] Ảnh với `next/image`

- Ảnh trong khung tỉ lệ: cha `relative aspect-[4/3] overflow-hidden rounded-sm bg-muted`, ảnh `fill` + `sizes` + `object-cover` (`modules/posts/components/post-card.tsx`). `bg-muted` làm nền chờ.
- Luôn có `sizes` đúng bố cục: lưới 3 cột `"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`; thumbnail cố định `"112px"` (`modules/products/components/product-card.tsx`: `"80px"`).
- `alt` = tên Sản phẩm hoặc tiêu đề bài (tiếng Việt). Ảnh trang trí thuần thì `alt=""`.
- Ảnh thiếu thì dùng `"/placeholder.svg"` (`public/placeholder.svg`); Next tự `unoptimized` khi `src` kết thúc bằng `.svg` (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:940`).
- Ảnh LCP (hero trang chủ, ảnh đầu Bài web) hiện dùng `priority` (`app/(site)/page.tsx:31`, `app/(site)/bai-viet/[slug]/page.tsx:100`). Prop này deprecated từ Next 16 (`image.md:292-294`); code mới dùng `preload` cho đúng một ảnh LCP, hoặc `fetchPriority="high"`/`loading="eager"`.
- Thân bài không chứa ảnh: `sanitizePostHtml` bỏ `img` (`platform/html/sanitize.ts:6-11`, spine AD-22). Ảnh chỉ hiện qua ảnh đại diện và Sản phẩm, dùng `next/image`.

### [GD-14] Quy ước giao diện

Ngôn ngữ và thuật ngữ:

- Mọi chuỗi người dùng thấy hoặc nghe (nhãn, placeholder, toast, `aria-label`, `sr-only`, `title`, thông báo lỗi) viết tiếng Việt có dấu, giọng thân thiện ngắn gọn ("Đã lưu", "Xóa sản phẩm", "Mở menu").
- Dùng thuật ngữ PRD §3 cho đối tượng nghiệp vụ: Sản phẩm, Bài web, Loại bài, Danh mục, Gợi ý AI, Lượt tim, Banner, Nhãn công khai affiliate. Lưu ý lệch còn lại: `POST_TYPES` (`modules/posts/constants.ts`, `MEO_VAT`/`GOM_LINK`) là **Loại bài** theo PRD, nhưng trình soạn bài cũ còn ghi "Chuyên mục" (`components/cms/new-post-form.tsx`) — `[NO-20]`. **Danh mục** theo PRD là model `Category` (CMS `/cms/danh-muc`, site `/[danh-muc]`). Màn mới không gọi Loại bài là "Danh mục".
- Số tiền, ngày dùng định dạng vi-VN (`formatDate`, giá hiển thị nguyên chuỗi người nhập, ví dụ "89.000₫").

Truy cập (a11y):

- Nút chỉ có icon phải có `aria-label` tiếng Việt (`app/cms/_components/cms-shell.client.tsx` nút "Mở menu", `components/cms/fields.tsx:76`); icon trang trí cạnh chữ thêm `aria-hidden` (`modules/products/components/product-card.tsx`).
- Ký tự trang trí (`·`, `/`) bọc `aria-hidden` (`modules/posts/components/post-card.tsx`). Điều hướng phụ có `aria-label` ("Breadcrumb", "Mục lục", `app/(site)/bai-viet/[slug]/page.tsx:82,138`).
- Mỗi trang đúng một `h1`; thẻ/khối con dùng `h2`/`h3` theo thứ tự.
- Nút bấm là `<button type="button">` hoặc `Button`; điều hướng là `<Link>`/`<a>`. Không gắn `onClick` lên `div`.
- Focus: dùng sẵn `focus-visible:ring-*` của component shadcn; outline mặc định đã là `outline-ring/50` (`app/globals.css:134`). Không xóa `outline` mà không thay bằng ring.
- Link affiliate ra ngoài luôn `target="_blank" rel="sponsored nofollow noopener"`.

Vùng chạm và mobile-first:

- Viết lớp cho mobile trước, mở rộng bằng `sm:`/`md:`/`lg:`.
- Vùng chạm tối thiểu 44px = token `touch-target` (`min-h-touch-target`, `size-touch-target`; UX-DR37, `[GD-07]`). Trong CMS dưới 1024px, `Button`/`Input` tự cao tối thiểu 44px nhờ `[data-cms-shell]`; link dạng nút tự thêm `min-h-touch-target lg:min-h-0` (`app/cms/page.tsx`). Code cũ còn `h-10` (`components/cms/fields.tsx:86`) — không chép.
- Ô nhập giữ cỡ chữ 16px trên mobile (`Input`/`Textarea` có sẵn `text-base md:text-sm`) để iOS không tự phóng to khi focus.
- Dùng `inputMode="url"` cho ô link (`components/cms/fields.tsx:90`).
- Dùng `min-h-dvh` thay `min-h-screen` cho khung toàn màn hình (`app/cms/_components/cms-shell.client.tsx`).

Chuyển động:

- Mọi chuyển động trang trí thêm biến thể giảm chuyển động: `motion-reduce:transform-none` cho hiệu ứng phóng ảnh (`modules/posts/components/post-card.tsx`); `scroll-behavior` tắt khi `prefers-reduced-motion` (`app/globals.css:147-151`).
- Spinner `animate-spin` chỉ hiện trong lúc chờ, đi kèm chữ mô tả.

### [GD-15] `/cms/styleguide`: tham chiếu sống

- `app/cms/styleguide/page.tsx` chỉ có metadata + `StyleguideScreen` (AD-12); nội dung ở `app/cms/styleguide/_components/styleguide-screen.tsx` (UX-DR82), hiển thị: mọi token màu với giá trị sáng và tối cạnh nhau (đọc thẳng `app/globals.css` qua `parseColorTokens` của `platform/design-tokens.ts` lúc build, không khai báo màu lần hai) và bảng alias shadcn; 12 kiểu chữ; bo góc; spacing; elevation; component hiện có (Button các biến thể, Toast qua `ToastDemo`, PostTypeBadge, ProductStatusBadge, Input, PostCard + Skeleton, ProductCard *row*/*tile* + AffiliateLink + AffiliateDisclosure `box`/`text` + ImageFallback, Breadcrumb + Pagination, SeoScore). Component render theo chế độ của hệ điều hành.
- Trang nằm dưới `app/cms/` nên sau Basic Auth của `proxy.ts`, nhận `CmsShell`, không chịu `ensureStatic`; `robots: { index: false }`; có trong menu CmsShell.
- Các mảng mẫu (`TYPE_SCALE`, `ROUNDED`, `SPACING`, `ELEVATION`) ghi tên lớp đầy đủ để Tailwind quét được.

## Công thức

### [GD-16] Thêm một component shadcn

1. Xem trước, không ghi file:

   ```bash
   npx shadcn add switch --dry-run
   npx shadcn add switch --view
   ```

   CLI đọc `components.json` và lấy bản `base-nova` (Base UI). Kết quả dry-run cho `switch`: tạo `components/ui/switch.tsx`, phụ thuộc `cn`.
2. Thêm thật: `npx shadcn add <tên>` (nhiều tên cách nhau dấu cách; `-y` bỏ hỏi; **không** dùng `-o` trên file đã có trừ khi muốn mất sửa đổi cục bộ).
3. Mở file mới, kiểm:
   - import primitive từ `@base-ui/react/...`, không có `@radix-ui`;
   - chuỗi người dùng thấy (`sr-only` "Close", nút "Close"…) đổi sang tiếng Việt;
   - kích thước mặc định có đủ vùng chạm cho chỗ dùng (nếu không, nâng ở chỗ dùng bằng `className`, không sửa biến thể chung).
4. Xem tài liệu API Base UI của primitive đó trong `node_modules/@base-ui/react/docs/react/components/<tên>.md` (hoặc `npx shadcn docs <tên>`) trước khi viết code dùng.
5. Thêm một mẫu dùng vào `app/cms/styleguide/_components/styleguide-screen.tsx`.
6. Chạy `npm run lint` và `npx tsc --noEmit`.

Dùng component có trigger với nút của dự án:

```tsx
// Đúng (Base UI): render prop
<SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Mở menu" />}>
  <Menu />
</SheetTrigger>

// Sai (Radix): asChild không tồn tại ở đây
<SheetTrigger asChild><Button>…</Button></SheetTrigger>
```

### [GD-17] Dựng màn hình CMS mobile-first gọi Server Action

Ví dụ: màn "Sửa Banner" ở `/cms/banner/[id]`. Vị trí file theo spine (AD-5, AD-6, AD-11, AD-12, AD-14); khuôn đầy đủ của action ở `docs/cong-thuc/them-server-action.md`. `react-hook-form`, `@hookform/resolvers` và component shadcn `field` chưa có trong repo: thêm ở story form đầu tiên theo bảng Stack của spine (`npx shadcn add field`).

1. **Action** trong `modules/banners/actions.ts` (`"use server"`), một tham số `input` (id nằm trong `input`), bọc `run()` (`@/platform/auth/run`). Validate bằng **cùng** `bannerInputSchema` của `modules/banners/schema.ts` mà form dùng; giới hạn độ dài lấy từ `modules/banners/constants.ts` (khớp `@db.VarChar`). Ghi qua `modules/banners/service.ts`, rồi `updateTag` tag của mọi module có dữ liệu thay đổi (`[NX-06]`, `[NX-54]`).

   ```ts
   // modules/banners/actions.ts
   export async function saveBanner(input: BannerInput) {
     return run(async () => {
       const parsed = bannerInputSchema.safeParse(input);
       if (!parsed.success) throw new UserError(firstError(parsed.error));
       await saveBannerRecord(parsed.data); // modules/banners/service.ts
       updateTag(BANNERS_TAG);
       return {};
     });
   }
   ```

2. **Page** mỏng (AD-12): chỉ `<Suspense>` + Screen. `BannerEditScreen` ở `_components/` cạnh route `await params`, đọc qua `modules/banners/cms-queries.ts`, gọi `notFound()` khi không có (trong `<Suspense>`, chấp nhận HTTP 200 vì CMS không index), rồi render form với `defaultValues` là object thuần.

   ```tsx
   // app/cms/banner/[id]/page.tsx
   export default function EditBannerPage({ params }: PageProps<"/cms/banner/[id]">) {
     return (
       <Suspense fallback={<BannerEditSkeleton />}>
         <BannerEditScreen params={params} />
       </Suspense>
     );
   }
   ```

3. **Form** là Client Component `modules/banners/components/banner-form.client.tsx` (AD-11): React Hook Form + `zodResolver` với **cùng** `bannerInputSchema`, ghép bằng shadcn `field` + `Controller` (AD-14). Lỗi validate hiện tại trường; `UserError` từ server hiện bằng toast. Form chỉ đọc `defaultValues` lúc mount (AD-12).

   ```tsx
   "use client";

   import { Controller, useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import { Loader2 } from "lucide-react";
   import { toast } from "sonner";
   import { saveBanner } from "@/modules/banners/actions";
   import { BANNER_TITLE_MAX } from "@/modules/banners/constants";
   import { bannerInputSchema, type BannerInput } from "@/modules/banners/schema";
   import { Button } from "@/components/ui/button";
   import { Field, FieldError, FieldLabel } from "@/components/ui/field";
   import { Input } from "@/components/ui/input";

   export function BannerForm({ defaultValues }: { defaultValues: BannerInput }) {
     const form = useForm<BannerInput>({ resolver: zodResolver(bannerInputSchema), defaultValues });

     const onSubmit = form.handleSubmit(async (values) => {
       const res = await saveBanner(values);
       if (!res.ok) return void toast.error(res.error);
       toast.success("Đã lưu Banner");
     });

     return (
       <form onSubmit={onSubmit} className="space-y-5">
         <Controller
           name="title"
           control={form.control}
           render={({ field, fieldState }) => (
             <Field data-invalid={fieldState.invalid}>
               <FieldLabel htmlFor="banner-title">Tiêu đề ({field.value.length}/{BANNER_TITLE_MAX})</FieldLabel>
               <Input id="banner-title" {...field} className="h-10 bg-background" />
               <FieldError errors={[fieldState.error]} />
             </Field>
           )}
         />
         <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={form.formState.isSubmitting}>
           {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
           {form.formState.isSubmitting ? "Đang lưu…" : "Lưu"}
         </Button>
       </form>
     );
   }
   ```

4. **Điều hướng**: nếu màn là mục danh sách trong IA CMS, thêm một mục vào `NAV_ITEMS` của `app/cms/_components/cms-shell.client.tsx` đúng thứ tự IA (`[GD-11]`), với `match` khớp cả các màn con (chi tiết, tạo mới).
5. **Kiểm** theo `[GD-40]`.

Form một trường (ví dụ nút đổi trạng thái) được dùng `useTransition` + `Result` thay cho React Hook Form (AD-14). Không dùng `useActionState` + `FormData` cho form CMS.

### [GD-18] Thêm widget client tương tác vào trang public tĩnh (nút tim, chia sẻ)

Bối cảnh: `app/(site)/**` có `ensureStatic = "navigation"`; với cấu hình này, build và `next dev` sẽ báo lỗi nếu server đọc dữ liệu chưa cache, `connection()`, `cookies()`, `headers()`, `searchParams` phía server, `use cache` có `revalidate: 0`/`expire` dưới 5 phút, hoặc truyền Promise dữ liệu phụ thuộc request cho Client Component, **kể cả khi bọc `Suspense`** (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`, mục *Validation*). Client Component vẫn được tải dữ liệu riêng của người đọc **trong trình duyệt** (cùng file, mục *Client Components*).

Các bước:

1. Tạo widget trong `components/` của module chủ, tên `*.client.tsx` có `"use client"` (spine AD-8, AD-11; ví dụ nút tim → `modules/engagement/components/like-button.client.tsx`; nút chia sẻ không nghiệp vụ → `components/shared/`). Chỉ nhận props tĩnh từ server (`slug`, `postId`, `title`). Số đếm (Lượt tim) **không** truyền từ server: widget đọc phía client qua action đọc công khai của `modules/engagement/actions.ts` sau khi mount (AD-6, AD-7).
2. Đặt widget vào Screen (`_components/`) của trang như mọi component khác (AD-12). Không chuyển page thành client, không đọc request trong page.
3. Trạng thái riêng của người đọc (đã tim chưa, lấy từ `localStorage`): đọc sau khi mount, hoặc dùng `use(browser())` bên trong `<Suspense>` (React 19.3; `node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md:219-261`). Không đọc `localStorage`/`window` trong lúc render đầu → lệch hydrate.
4. Ghi dữ liệu (thả tim): gọi Server Action công khai trong `modules/engagement/actions.ts` — một trong ba ngoại lệ có tên của `[QD-20]` (spine AD-6). Action này không gọi `requireAdmin()` nhưng phải validate đầu vào và giới hạn tần suất (xem `[BM-16]`, `[PR-32]`, công thức đếm view `[NX-35]`, `[NX-36]`). **Không** gọi `updateTag` trong action này (xem `[GD-25]`).
5. Phản hồi tức thì bằng `useOptimistic` trong transition:

   ```tsx
   "use client";

   import { useEffect, useOptimistic, useState, useTransition } from "react";
   import { Heart } from "lucide-react";
   import { getLikeCount, likePost } from "@/modules/engagement/actions";
   import { Button } from "@/components/ui/button";
   import { cn } from "@/components/ui/lib/utils";
   import { formatCount } from "@/platform/format"; // AD-27

   export function LikeButton({ postId }: { postId: string }) {
     const [count, setCount] = useState<number | null>(null);
     const [optimistic, addOptimistic] = useOptimistic(count ?? 0, (c, d: number) => c + d);
     const [liked, setLiked] = useState(false);
     const [, startTransition] = useTransition();

     // Số tim đọc phía client sau khi mount (AD-6, AD-7); trang vẫn tĩnh.
     useEffect(() => {
       startTransition(async () => {
         const res = await getLikeCount({ postId });
         if (res.ok) setCount(res.count);
       });
     }, [postId]);

     const onLike = () =>
       startTransition(async () => {
         addOptimistic(1);
         setLiked(true);
         const res = await likePost({ postId });
         if (res.ok) setCount(res.count);
       });

     return (
       <Button variant="outline" className="h-11 px-4" disabled={liked} onClick={onLike}
         aria-label={liked ? "Đã thả tim" : "Thả tim bài viết"} aria-pressed={liked}>
         <Heart className={cn(liked && "fill-primary text-primary")} />
         {count === null ? "—" : formatCount(optimistic)}
       </Button>
     );
   }
   ```

6. Số đếm "sống" theo từng lần tải: phải đọc trong trình duyệt. Lấy qua action công khai của `[QD-20]` gọi từ client (spine AD-6, AD-7). Không đặt route handler công khai dưới `/api/*` vì `proxy.ts:14` bắt Basic auth cho mọi `/api/:path*`, và spine không cho endpoint công khai dưới `/api`.
7. Nút chia sẻ: dùng `navigator.share` nếu có, nếu không thì `navigator.clipboard.writeText(url)` + `toast.success("Đã sao chép link")` (giống `components/cms/post-editor.tsx:106-109`). Chỉ gọi trong handler, không gọi lúc render. Icon dùng `Share2`, `Link2`; lucide-react 1.x **không có** icon thương hiệu (Facebook…), xem `[GD-31]`.
8. Kiểm `npm run build` không báo lỗi `ensureStatic`; mở trang khi tắt JavaScript vẫn thấy nội dung bài (widget chỉ thêm, không chặn nội dung cần index).

### [GD-19] Thêm component public thuần server (Banner, khối nội dung)

1. Tạo component **không** có `"use client"` trong `modules/<miền>/components/` của module chủ (ví dụ Banner → `modules/banners/components/`; spine AD-11). Không tạo trong `components/site/` (đã xoá).
2. Dữ liệu lấy qua hàm trong `modules/<miền>/queries.ts` có `"use cache"` + `cacheLife(...)` + `cacheTag(...)` của mọi module có bảng nó đọc (spine AD-7; mẫu `modules/posts/queries.ts`); action CMS tương ứng gọi `updateTag` cùng tag.
3. Ảnh theo `[GD-13]`; nếu ảnh nằm trên host mới, thêm host vào `IMAGE_HOSTS` (`platform/images.ts:2`), danh sách này dùng chung cho `next.config.ts` và validate form CMS.
4. Màu theo token `[GD-07]`; nếu cần biến thể theo loại, dùng bảng ánh xạ tên lớp đầy đủ như `STYLES` (`modules/posts/components/post-type-badge.tsx`).
5. Thêm mẫu vào `/cms/styleguide`, kiểm theo `[GD-40]`.

### [GD-20] Thêm hoặc đổi design token

1. Token phải có trong frontmatter `DESIGN.md` (sửa DESIGN.md trước nếu chưa có). Màu chỉ khai báo khi có cặp `-dark`.
2. Màu: thêm `--<tên>: #rrggbb;` vào `:root` **và** khối `@media (prefers-color-scheme: dark)` của `app/globals.css`, rồi `--color-<tên>: var(--<tên>);` trong `@theme inline`. Bo góc, spacing, typography: thêm vào `@theme static`.
3. Dùng bằng utility `bg-<tên>`, `text-<tên>`, `p-<tên>`…
4. Màu dùng làm chữ hoặc nền chữ: thêm cặp vào `TEXT_PAIRS` của `app/globals-contrast.test.ts`, chạy `npm test`.
5. Thêm mẫu vào `/cms/styleguide` nếu không phải màu (màu tự hiện) và cập nhật `[GD-07]`.

### [GD-21] Ghép Base UI với `Link`, `<a>` và component tự viết

- Link trông như nút: áp `buttonVariants` lên `Link`/`<a>`, không bọc `<Button>` quanh link và không render `<a>` qua `Button render` (Base UI cấm, `button.md:150`):

  ```tsx
  <Link href="/cms/new" className={cn(buttonVariants({ size: "lg" }), "h-11 w-full")}>Tạo bài</Link>
  ```

- `Button` render thành phần tử không phải `<button>` (hiếm): thêm `nativeButton={false}`.
- Component tự viết đặt trong `render` phải nhận `ref` và rải mọi props xuống phần tử DOM (`node_modules/@base-ui/react/docs/react/handbook/composition.md`). Component hàm React 19 nhận `ref` như prop thường; chỉ cần `{...props}`.
- Muốn component tự viết có prop `render` giống Badge: dùng `useRender` + `mergeProps` (`components/ui/badge.tsx:29-49`).
- Điều khiển mở/đóng: `open` + `onOpenChange` (`app/(site)/_components/category-sheet.client.tsx`); đóng sheet khi bấm link bằng `onClick={() => setOpen(false)}`.

## Bẫy hay gặp

### [GD-22] Dùng `asChild` hoặc API Radix

- Triệu chứng: lỗi TypeScript "Property 'asChild' does not exist", hoặc trigger render hai nút lồng nhau (`<button><button>`), lỗi hydrate.
- Nguyên nhân: chép mẫu shadcn/Radix; dự án dùng Base UI.
- Cách đúng: `render={<Button … />}` (`[GD-04]`, `[GD-21]`); tra API trong `node_modules/@base-ui/react/docs/react/`.

### [GD-23] Tạo `tailwind.config.js` hoặc `postcss.config.mjs`

- Triệu chứng: token mới không có tác dụng; hoặc CSS bị xử lý hai lần, build lỗi sau khi làm theo hướng dẫn cài Tailwind trong docs Next (`01-getting-started/11-css.md` dùng `@tailwindcss/postcss`).
- Nguyên nhân: dự án cấu hình Tailwind bằng CSS và chạy qua loader Turbopack (`next.config.ts:11-18`), không qua PostCSS.
- Cách đúng: sửa `app/globals.css` (`@theme inline`, `@custom-variant`, `@plugin`, `@utility`); không thêm file config, không cài `@tailwindcss/postcss`.

### [GD-24] Đọc dữ liệu theo request trong trang public

- Triệu chứng: `next build`/`next dev` báo lỗi prerender ở route `(site)` (dữ liệu chưa cache, runtime data), kể cả khi đã bọc `Suspense`.
- Nguyên nhân: `ensureStatic = "navigation"` (`app/(site)/layout.tsx:6`) bắt cả route phải tĩnh.
- Cách đúng: dữ liệu chung đọc qua hàm `"use cache"`; dữ liệu riêng của người đọc tải trong Client Component phía trình duyệt (`[GD-18]`). Không thêm `connection()`, `cookies()`, `headers()` vào `(site)`.

### [GD-25] Làm mới cache toàn site trên mỗi lượt tương tác

- Triệu chứng: mỗi lượt tim/lượt xem làm mọi trang public render lại; tải DB tăng vọt.
- Nguyên nhân: action công khai gọi `updateTag(POSTS_TAG)`; tag `posts` gắn cho mọi truy vấn bài public (`modules/posts/queries.ts`, tag ở `modules/posts/tags.ts`).
- Cách đúng: action công khai chỉ ghi số đếm; con số trên trang tĩnh chấp nhận cũ đến lần làm mới kế tiếp, phần "sống" đọc từ trình duyệt. Chỉ action CMS mới gọi `updateTag(POSTS_TAG)`.

### [GD-26] `"use client"` đặt quá cao

- Triệu chứng: page mất khả năng gọi hàm `"use cache"`/DB; lỗi "ensureStatic … Client Component"; bundle JS phình.
- Nguyên nhân: đặt `"use client"` ở page/layout hoặc ở component bọc ngoài. Next cấm export `ensureStatic` từ Client Component (`ensureStatic.md`, *Good to know*).
- Cách đúng: tách phần tương tác thành component lá có `"use client"`; phần còn lại giữ server.

### [GD-27] `usePathname`/`useSearchParams` không có `Suspense`

- Triệu chứng: build lỗi "encountered URL data in a Client Component outside of Suspense" ở route động.
- Nguyên nhân: `cacheComponents` bật; với tham số động chưa có trong `generateStaticParams`, hook suspend (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md:72-77`).
- Cách đúng: bọc component dùng hook trong `Suspense` với fallback là bản tĩnh của chính nó (`WithPathname` trong `app/cms/_components/cms-shell.client.tsx`).

### [GD-28] Lệch hydrate do theme hoặc API trình duyệt

- Triệu chứng: cảnh báo "Hydration failed", icon/chữ nháy sai khi tải trang.
- Nguyên nhân: render dựa vào `resolvedTheme`, `localStorage`, `window`, `Date.now()` ở lần render đầu; server không biết các giá trị này.
- Cách đúng: theme thì dùng biến thể CSS `dark:` (media query, `[GD-09]`); API trình duyệt thì đọc sau mount hoặc `use(browser())` trong `Suspense` (`[GD-18]`).

### [GD-29] Ghép tên lớp động

- Triệu chứng: màu/kích thước không áp dụng dù tên lớp đúng trong DevTools.
- Nguyên nhân: Tailwind chỉ sinh CSS cho tên lớp xuất hiện nguyên văn trong mã (`` `text-${category}` `` không được quét).
- Cách đúng: bảng ánh xạ tên lớp đầy đủ (`STYLES` trong `modules/posts/components/post-type-badge.tsx`, `TYPE_SCALE`/`SPACING` trong `app/cms/styleguide/_components/styleguide-screen.tsx`).

### [GD-30] Ảnh lỗi hoặc làm chậm trang

- Triệu chứng: lỗi "hostname is not configured under images"; ảnh méo/không hiện; cảnh báo deprecated `priority`; LCP chậm.
- Nguyên nhân: host ngoài `IMAGE_HOSTS`; `fill` mà cha không `relative`/không có kích thước; thiếu `sizes`; dùng `priority` (deprecated Next 16) hoặc `preload` trên nhiều ảnh.
- Cách đúng: thêm host vào `platform/images.ts:2`; khung `relative aspect-* overflow-hidden` + `fill` + `sizes`; chỉ ảnh LCP dùng `preload` hoặc `fetchPriority="high"`. Hai chỗ `priority` hiện có (`app/(site)/page.tsx:31`, `app/(site)/bai-viet/[slug]/page.tsx:100`) không dùng làm mẫu.

### [GD-31] Icon thương hiệu không có trong lucide-react 1.x

- Triệu chứng: `import { Facebook } from "lucide-react"` lỗi không tìm thấy export.
- Nguyên nhân: lucide-react 1.66 không xuất icon thương hiệu (đã kiểm `node_modules/lucide-react/dist/lucide-react.d.ts`: không có `Facebook`).
- Cách đúng: dùng icon chung (`Share2`, `Link2`, `MessageSquareText`) hoặc SVG inline có `aria-hidden` và nhãn chữ bên cạnh. Icon lucide có hai tên (`X` và `XIcon`); trong một file dùng thống nhất một kiểu.

### [GD-32] Thân bài khó đọc ở chế độ tối

- Triệu chứng: `blockquote`, đường kẻ bảng, `hr`, `figcaption` trong Bài web gần như không thấy trên nền tối.
- Nguyên nhân: `prose` mặc định dùng thang xám cố định (ví dụ `--tw-prose-quotes` là gray-900, `node_modules/@tailwindcss/typography/src/styles.js:1109`); dự án chỉ ghi đè body, heading, link, strong, marker (`app/(site)/bai-viet/[slug]/page.tsx:110`) và không dùng `dark:prose-invert`.
- Cách đúng: khi thêm loại nội dung mới vào thân bài, ghi đè màu bằng token (`prose-blockquote:text-foreground prose-blockquote:border-primary/40 prose-th:border-border prose-hr:border-border prose-figcaption:text-muted-foreground`), xem thử bài có đủ các thẻ trong `platform/html/sanitize.ts:6-10` ở cả hai chế độ.

### [GD-33] Chuỗi tiếng Anh lọt vào giao diện

- Triệu chứng: trình đọc màn hình đọc "Close"; toast/nhãn tiếng Anh.
- Nguyên nhân: file shadcn sinh ra có chuỗi tiếng Anh: `sr-only` "Close" (`components/ui/dialog.tsx:75`, `components/ui/sheet.tsx:75`), nút "Close" trong `DialogFooter` (`components/ui/dialog.tsx:113`).
- Cách đúng: khi thêm/sửa component shadcn, đổi các chuỗi này sang tiếng Việt ("Đóng"); grep chuỗi tiếng Anh trước khi xong.

### [GD-34] Ô nhập chữ nhỏ làm iOS phóng to

- Triệu chứng: trên iPhone, chạm vào ô nhập thì trang tự zoom, lệch bố cục.
- Nguyên nhân: cỡ chữ ô nhập dưới 16px trên mobile. `Input`/`Textarea` mặc định `text-base md:text-sm` là đúng; ghi đè `text-sm`/`text-xs` không kèm tiền tố breakpoint sẽ phá điều này (đang có ở ô slug `components/cms/post-editor.tsx:153` và ô HTML `components/cms/post-editor.tsx:168`).
- Cách đúng: chỉ thu nhỏ chữ ô nhập từ `md:` trở lên; màn mới không chép hai chỗ trên.

### [GD-35] Vùng chạm quá nhỏ

- Triệu chứng: bấm nhầm trên điện thoại, đặc biệt nút icon trong danh sách.
- Nguyên nhân: kích thước mặc định của `Button` là `h-8` (32px), `icon-sm` là 28px, `Input` `h-8` (`components/ui/button.tsx:22-32`, `components/ui/input.tsx:11`).
- Cách đúng: vùng chạm ≥ 44px (`touch-target`, `[GD-07]`): trong CMS dưới 1024px đã tự nâng qua `[data-cms-shell]`; chỗ khác dùng `min-h-touch-target`/`size-touch-target` (nút icon: `size-touch-target!`, `app/cms/_components/cms-shell.client.tsx`); phần tử hình nhỏ hơn (chip, nút Shopee 36px) nới vùng bấm bằng `::before` (UX-DR7). Không sửa biến thể chung trong `components/ui/button.tsx`. Đặt khoảng cách `gap-2` trở lên giữa các nút cạnh nhau.

### [GD-36] Cài lại clsx/tailwind-merge hoặc viết lại `cn`

- Triệu chứng: hai bản cài cùng chức năng; khác biệt khi merge lớp giữa file `ui` và file dự án.
- Nguyên nhân: làm theo hướng dẫn shadcn cũ (`twMerge(clsx(...))`).
- Cách đúng: giữ `components/ui/lib/utils.ts` là `export { cn } from "cn"`. Cần cấu hình nhóm lớp riêng thì dùng `createCn` từ `"cn/config"` (`node_modules/cn/README.md`, mục *Custom themes*).

### [GD-37] Hiệu ứng không tôn trọng giảm chuyển động

- Triệu chứng: người bật "Giảm chuyển động" vẫn thấy ảnh phóng, vòng điểm chạy.
- Nguyên nhân: thêm `transition`/`animate-*` trang trí mà không có `motion-reduce:`. Ví dụ hiện có: vòng `SeoScore` có `transition-[stroke-dashoffset] duration-700` không kèm `motion-reduce` (`components/cms/seo-score.tsx:22`).
- Cách đúng: thêm `motion-reduce:transition-none` / `motion-reduce:transform-none` / `motion-reduce:animate-none` cho mọi chuyển động trang trí mới.

## Checklist khi viết workflow / review

### [GD-40] Checklist review giao diện

Kiến trúc component

- [ ] `"use client"` chỉ ở component lá cần state/event/hook trình duyệt; page và layout không có `"use client"`.
- [ ] Props từ server sang client là dữ liệu thuần (không hàm, trừ Server Action).
- [ ] Trang trong `app/(site)` không đọc `cookies()`/`headers()`/`connection()`/`searchParams` phía server, không truy vấn DB ngoài hàm `"use cache"`; `npm run build` qua.
- [ ] `usePathname`/`useSearchParams` nằm trong `Suspense` có fallback.
- [ ] Action công khai của `[QD-20]` không gọi `updateTag` nào; action CMS có `requireAdmin()` (qua `run()`).
- [ ] Link tới Shopee render qua `AffiliateLink` khi đã có (AD-11).
- [ ] Không có `asChild`, không import `@radix-ui/*`; trigger dùng `render`; link dạng nút dùng `buttonVariants`.
- [ ] Không có `tailwind.config.*`, `postcss.config.*`, `clsx`, `tailwind-merge` mới.

Phản hồi và trạng thái

- [ ] Mọi thao tác gọi action: nút bị khóa khi chờ, có spinner `Loader2` + nhãn đang làm, `toast.success`/`toast.error` tiếng Việt.
- [ ] Có trạng thái rỗng (câu hướng dẫn + link hành động) và trạng thái tải (`Skeleton` đúng hình bố cục).
- [ ] Thanh sticky trong màn CMS không chồng thanh trên của CmsShell (`top-14` trên mobile).

Hiển thị và theme

- [ ] Chỉ dùng token (`bg-surface-container-low`, `text-on-surface-variant`, `text-primary`…), không mã màu cứng, không màu Tailwind thô; không thêm dùng mới cho alias `meo-vat*`/`gom-link*`/`chart-3`.
- [ ] Không có nút đổi sáng/tối.
- [ ] Xem ở chế độ sáng **và** tối: chữ đọc rõ, viền thấy được, toast đúng màu, thân bài (`prose`) đọc được kể cả blockquote/bảng.
- [ ] Không có tên lớp ghép chuỗi động.
- [ ] Token/component dùng chung mới đã có mẫu trong `/cms/styleguide`.

Mobile và vùng chạm

- [ ] Kiểm ở bề rộng 360px: không cuộn ngang trang (trừ dải cuộn có chủ đích), chữ không tràn, nút không bị cắt.
- [ ] Mọi phần tử bấm được có vùng bấm ≥ 44px (`touch-target`, UX-DR37); nút chính CMS rộng hết màn trên mobile.
- [ ] Ô nhập giữ cỡ chữ 16px dưới `md` (không `text-sm`/`text-xs` không tiền tố).
- [ ] Ô link có `inputMode="url"`; khung toàn màn dùng `dvh`; phần tử cố định đáy có `env(safe-area-inset-bottom)`.

Tiếng Việt và nội dung

- [ ] Mọi chuỗi hiển thị, `aria-label`, `sr-only`, toast, lỗi là tiếng Việt có dấu; không còn "Close"/"Submit"/"Loading".
- [ ] Thuật ngữ đúng PRD §3 (Sản phẩm, Bài web, Loại bài, Danh mục, Lượt tim, Banner…); không gọi Loại bài là "Danh mục".
- [ ] Dấu chồng hiển thị đúng font Be Vietnam Pro (thử chuỗi "ẩm, ễnh, ộp, ướt, quẩy, nghiêng"); chỉ dùng độ đậm 400/500/600/700.
- [ ] Ngày dùng `formatDate`; link affiliate có `target="_blank" rel="sponsored nofollow noopener"`; bài có Sản phẩm hiện `AffiliateDisclosure`.

Truy cập và chuyển động

- [ ] Nút chỉ có icon có `aria-label`; icon trang trí có `aria-hidden`.
- [ ] Mỗi trang một `h1`, tiêu đề theo thứ tự; điều hướng phụ có `aria-label`.
- [ ] Tab bằng bàn phím tới được mọi điều khiển, thấy rõ focus ring.
- [ ] Chuyển động trang trí có biến thể `motion-reduce:`.

Ảnh

- [ ] Dùng `next/image` với `fill` + `sizes` trong khung `relative` có tỉ lệ, hoặc `width`/`height`.
- [ ] Host ảnh có trong `IMAGE_HOSTS`; có ảnh dự phòng `/placeholder.svg`; `alt` tiếng Việt có nghĩa.
- [ ] Không dùng `priority`; chỉ một ảnh LCP mỗi trang dùng `preload`/`fetchPriority="high"`.

## Tham khảo

- Chuẩn tài liệu: `docs/chuan-tai-lieu.md`
- Next.js (bản cài): `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `.../01-getting-started/12-images.md`, `.../01-getting-started/13-fonts.md`, `.../02-guides/forms.md`, `.../02-guides/keeping-pages-static.md`, `.../02-guides/single-page-applications.md`, `.../03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`, `.../03-api-reference/02-components/image.md`, `.../03-api-reference/04-functions/use-pathname.md`, `.../03-api-reference/08-turbopack.md`, `.../03-api-reference/01-directives/use-client.md`
- Base UI: `node_modules/@base-ui/react/docs/react/handbook/composition.md`, `.../handbook/animation.md`, `.../handbook/forms.md`, `.../components/*.md`
- shadcn: `components.json`, `npx shadcn --help`, `npx shadcn add --help`, `npx shadcn docs <component>`, `node_modules/shadcn/dist/tailwind.css`
- cn: `node_modules/cn/README.md`
- Tailwind: `node_modules/@tailwindcss/turbopack/README.md`, `node_modules/@tailwindcss/typography/src/styles.js`, https://tailwindcss.com/docs
- React 19.3: https://react.dev/reference/react/useOptimistic, https://react.dev/reference/react/useActionState, https://react.dev/reference/react-dom/browser
- PRD thuật ngữ: `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md` §3
