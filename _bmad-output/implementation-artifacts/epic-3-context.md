# Epic 3 Context: Bài web hoàn chỉnh — đọc và quản lý

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Hoàn thiện Bài web ở cả hai mặt. Trong CMS, Vinh quản lý danh sách bài theo trạng thái, soạn bài bằng trình soạn rich text tối giản, gắn và sắp thứ tự nhiều Sản phẩm có sẵn từ Kho, xem trước đúng như người đọc thấy, xuất bản / chuyển về nháp / xoá, và đổi slug mà link đã chia sẻ không chết. Người đọc có trang bài đầy đủ (mục lục, phút đọc, breadcrumb, Sản phẩm, thẻ, bài liên quan), Trang chủ bố cục mới, 404, trang lỗi và nền SEO toàn site. Epic này cũng chuyển hẳn trình soạn bài cũ (`app/cms/actions.ts`, `lib/post-input.ts`, `components/cms/*`, `app/cms/{page,new,posts}`) sang `modules/posts/` và `app/cms/bai-viet/`, chấm dứt ngoại lệ AD-17 đang áp cho các file đó.

## Stories

- Story 3.1: Danh sách và trạng thái Bài web trong CMS
- Story 3.2: Soạn Bài web và gắn nhiều Sản phẩm
- Story 3.3: Xem trước bài trước khi xuất bản
- Story 3.4: Đổi slug giữ link cũ
- Story 3.5: Trang bài viết hoàn chỉnh
- Story 3.6: Trang chủ theo bố cục mới
- Story 3.7: Trang 404, trang lỗi và nền SEO toàn site

## Requirements & Constraints

- **Kho Sản phẩm là nguồn dữ liệu độc lập** (quyết định 2026-11-05): Bài web chỉ *tham chiếu* Sản phẩm có sẵn trong Kho; trình soạn bài không bao giờ tạo, sửa hay xoá Sản phẩm. Gắn nhiều Sản phẩm vào một bài, một Sản phẩm dùng ở nhiều bài; tìm theo tên khi gắn, chỉ Sản phẩm đang hiện; chỉnh thứ tự trong bài. Gỡ khỏi bài hay xoá bài không xoá Sản phẩm.
- **Quản lý bài:** trạng thái Nháp / Đã xuất bản; xuất bản, chuyển về nháp, xoá (có xác nhận); xem trước trước khi xuất bản (kể cả thay đổi chưa lưu).
- **Đổi slug bài đã xuất bản:** slug cũ chuyển hướng vĩnh viễn (308) sang slug mới; đổi nhiều lần thì mọi slug cũ tới slug cuối; slug mới không trùng bài khác. Kiểm bằng `curl -I` trên `npm run build && npm start`: slug cũ 308, slug không tồn tại 404.
- **Trang bài:** mục lục từ h2, phút đọc, breadcrumb theo Danh mục, thẻ, khối Sản phẩm, nhãn công khai affiliate (chỉ khi có Sản phẩm), tối đa 3 bài liên quan cùng Danh mục.
- **Độ tươi và hiệu năng:** xuất bản/sửa/gỡ bài thấy trên site trong ~1 phút, không deploy lại. Trang bài và Trang chủ đạt Core Web Vitals "Tốt" trên di động (đo Lighthouse mobile).
- **SEO:** sitemap (Trang chủ, Bài web, Danh mục, Loại bài; không `/trang/n`), robots chặn `/cms`, title template, `lang="vi"`, canonical, OpenGraph kèm ảnh, JSON-LD `Article` + `BreadcrumbList` cho Bài web; Trang chủ không JSON-LD.
- **Giao diện:** sáng/tối theo hệ thống, thành phần mới đúng ở cả hai chế độ; CMS làm trọn trên điện thoại 360px.
- **Ngoài phạm vi:** Like/Share, Xem nhiều, SearchBox (Epic 8), Banner (Epic 9), Gom link đồ xinh (Epic 6), Lượt xem (Epic 7) — chưa render và không chừa chỗ trống. Không sửa phần AI (chấm SEO, Threads) — giữ nguyên chỗ cũ cho tới khi có `platform/ai` (Epic 4). Không làm cào dữ liệu Shopee.

## Technical Decisions

- **Chuyển code cũ (AD-17):** ngoại lệ có tên cho trình soạn bài cũ (sửa tại chỗ, không chuyển) **hết hiệu lực khi Epic 3 chuyển nó**. Chạm file cũ thì chuyển theo bảng `docs/cong-thuc/chuyen-code-cu.md` trong cùng thay đổi, sửa mọi import, bỏ khỏi danh sách miễn ESLint (kể cả `app/cms/actions.db.test.ts` đi cùng `app/cms/actions.ts`). Route mới: `/cms/bai-viet`, `/cms/bai-viet/moi`, `/cms/bai-viet/[id]`; `/cms` chuyển tới `/cms/bai-viet`; route cũ trả 404.
- **Trình soạn rich text dùng Tiptap** (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`), đã được duyệt theo QD-04 — chưa có trong `package.json`, story soạn bài thêm vào. Chỉ bật H2, H3, đoạn, danh sách, trích dẫn, đậm, nghiêng; không link, ảnh, bảng.
- **Đường ghi:** `modules/posts/actions.ts` qua `run()` → `postInputSchema.safeParse` → `posts/service.ts` → `updateTag` tag của mọi module có dữ liệu đổi. `savePost`, `setPostStatus`, `deletePost` chuyển khỏi `app/cms/actions.ts`. Lỗi người dùng là `UserError` tiếng Việt qua Toast; validate tại trường phía client bằng cùng schema (RHF + `zodResolver` + `Controller`). Giới hạn cứng ở `posts/constants.ts` = `@db.VarChar(n)`.
- **HTML thân bài:** luôn qua `platform/html.sanitizePostHtml` khi ghi **và** khi render (cả bản xem trước); allowlist không có `a`, `img`; không link/ảnh/giá trong thân. Mục lục và phút đọc tính trên HTML đã sanitize.
- **Dữ liệu:** `PostProduct` (đã có, có `sortOrder`) lưu thứ tự Sản phẩm trong bài; story 3.4 thêm migration `PostSlugRedirect` (chủ `posts`). Migration: `--create-only`, đọc SQL trước khi áp, tên `verb_object`, mỗi story tối đa một, chỉ chạy trên Postgres cục bộ.
- **Đọc CMS:** Screen đọc `searchParams` trong `<Suspense>` và gọi `posts/cms-queries.ts`; lọc qua URL, không action đọc; `notFound()` trong Screen; fallback `<x>-skeleton.tsx`, không `loading.tsx`. Form RHF chỉ đọc `defaultValues` lúc mount.
- **Đọc public:** trang `(site)` tĩnh, không đọc `searchParams`/`headers()`/`cookies()`; query `"use cache"` + `cacheTag` mọi module có bảng nó đọc (trang bài: `posts` + `products` + `categories`). Mọi Sản phẩm public (kể cả ảnh OpenGraph fallback) lấy qua `visibleProductWhere` + `publicProductSelect` của `products/queries.ts`.
- **Route mỏng:** `page.tsx` = metadata + `<Suspense>` + một `<…Screen>`; trang bài tra slug và lịch sử slug qua `posts/queries.ts` có cache rồi `notFound()`/`permanentRedirect()` **trước** `<Suspense>`. Không dùng `next.config` redirects hay `proxy.ts` cho chuyển hướng.
- **SEO theo loại trang:** Bài web canonical chính nó + `Article` + `BreadcrumbList`; OpenGraph lấy ảnh đại diện, fallback ảnh Sản phẩm đầu tiên, không có thì ảnh mặc định `platform/site`.
- **Lỗi và 404:** `error.tsx` ở `(site)`, `cms` và `global-error.tsx`, không lộ chi tiết nội bộ; ba `not-found.tsx` (`(site)`, `cms`, gốc), hai file site dùng chung `NotFoundScreen`.
- **Component:** thực thể bài ở `modules/posts/components/` (form `*-form.client.tsx`); dùng lại `CmsForm`, `ConfirmDialog`, `UnsavedChangesGuard`, `UploadField`, `ImageFallback` ở `components/shared/`; `ProductCard`, `AffiliateLink`, `AffiliateDisclosure` từ `products/components`. Xem trước dùng đúng component trang public. `components/ui` chỉ thêm qua shadcn CLI; thiếu component → `[COMPONENT-UNKNOWN]` và hỏi.
- **Test:** Vitest, `*.test.ts` cạnh nguồn, tên test tiếng Việt; unit test cho `schema.ts`, test tích hợp `service.ts` trên Postgres test. Không e2e.

## UX & Interaction Patterns

- **Danh sách CMS:** DataList (mobile Card, desktop Table), lọc Nháp/Đã xuất bản trên URL, StatusBadge luôn có chữ; rỗng = một câu + nút tạo; lọc không ra = "Không có kết quả với bộ lọc này" + Xoá bộ lọc. Xoá qua ConfirmDialog (focus mặc định "Huỷ").
- **PostEditor:** thanh công cụ dính trên ô soạn; vùng soạn `body-lead` như trang public; dán từ nơi khác được lọc khi lưu. Form có tiêu đề, tóm tắt, slug, thẻ, SEO title/description/keywords, Danh mục, Loại bài, ảnh đại diện (dán URL hoặc UploadField). CmsForm: nút Lưu dính đáy mobile, tắt + spinner khi gửi, dữ liệu không mất khi lỗi; UnsavedChangesGuard "Bạn có thay đổi chưa lưu. Rời trang?".
- **ProductPicker:** Combobox tìm theo tên; mỗi dòng đã chọn: ảnh 40px, tên, nút lên/xuống/gỡ, vùng bấm 44px; không kéo-thả.
- **PreviewSheet:** Sheet toàn màn, nhãn "Bản xem trước" dính đỉnh nền `inverse-surface`.
- **Trang bài:** thứ tự Breadcrumb "Trang chủ › {Danh mục}" → PostTypeBadge + H1 + ngày · phút đọc → AffiliateDisclosure → ảnh 16:9 → TableOfContents → ArticleBody (h2 đánh số, `blockquote` hiện như Callout "Mẹo nhỏ") → khối Sản phẩm (ProductCard *row*, hiện hết) → PostTags (`#tag`, không link) → RelatedPosts (mobile *row*, desktop *grid* 3 cột). TOC < 2 h2 thì ẩn; mobile mặc định mở, desktop dính cột phải, mục đang đọc màu `primary`. Mobile: ArticleActionBar thay BottomTabBar, nút "Sản phẩm" cuộn tới khối Sản phẩm (ẩn khi không có). Desktop: thân 8 cột + cột phải dính.
- **Trang chủ:** Bài nổi bật (PostCard *featured*) → Mới cập nhật (bỏ bài nổi bật; cuối khu link "Mẹo vặt" → `/meo-vat`, "Gom link" → `/gom-link`) → Mẹo vặt hay; PostCard đủ *featured*/*grid*/*row*; desktop Bài nổi bật 7 cột, Mới cập nhật 3 cột; khu rỗng thì ẩn. Đang tải là Skeleton cùng bố cục, không nhảy layout.
- **404/lỗi:** site "Trang này không còn ở đây" + link Trang chủ (EmptyState); CMS "Không tìm thấy. Có thể đã bị xoá." + link về danh sách; lỗi "Trang đang trục trặc một chút" + "Thử lại" + link Trang chủ.
- **Truy cập:** mỗi trang một `h1`, link "Bỏ qua tới nội dung", không chặn zoom; focus `:focus-visible` rõ, Sheet/Dialog bẫy và trả focus; `aria-live="polite"` cho Toast; tôn trọng reduced-motion (cuộn mượt TOC, hover ảnh, Skeleton); vùng bấm ≥ 44px; kiểm ở 360px và 390px.
- **Microcopy:** xưng "mình"/"bạn"; không dùng từ cấm ("Mua ngay", "Lưu thành công ✓", "No results"…).

## Cross-Story Dependencies

- 3.1 dựng route `/cms/bai-viet` và `modules/posts/actions.ts` + `service.ts`; 3.2 đặt form soạn vào route đó và chuyển `savePost`; 3.3 cần form của 3.2 và component trang bài; 3.4 cần đường lưu bài của 3.2.
- 3.5 tạo component trang bài mà PreviewSheet (3.3) render lại — làm 3.5 trước hoặc cùng 3.3 để tránh dựng hai lần. 3.7 dựng `NotFoundScreen`/`error.tsx` dùng chung; 3.6 cần đủ biến thể PostCard.
- Dựa trên Epic 2: `products/queries.ts` (`visibleProductWhere`, `publicProductSelect`), `ProductCard`, `AffiliateLink`, `AffiliateDisclosure`, Danh mục, `CmsForm`/`ConfirmDialog`/`UnsavedChangesGuard`/`UploadField`, `platform/slug`. Chi tiết Sản phẩm (2.3) liệt kê bài đang dùng sau khi 3.2 ghi `PostProduct`.
- Epic sau dựa vào đây: Epic 5 (tạo Bài web từ Bộ nội dung), Epic 6, Epic 7 (Lượt xem trong danh sách bài), Epic 8 (Like/Share, Xem nhiều, SearchBox ở 404). Chấm SEO/Threads trong trình soạn chờ `platform/ai` của Epic 4.
