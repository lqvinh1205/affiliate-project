---
title: 'Story 2.3: Kho Sản phẩm — danh sách, tạo và sửa'
type: 'feature'
created: '2026-11-05'
status: 'in-review'
review_loop_iteration: 0
baseline_revision: '86862b7add21faa1c9dd07fd1036d42937dc0cb2'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-2-quan-ly-danh-muc-cms.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Sản phẩm chưa có màn quản lý riêng; chỉ được nhập lồng trong trình soạn bài cũ, mà trình này xoá rồi tạo lại Sản phẩm mỗi lần lưu bài và xoá Sản phẩm khi xoá bài. Theo Vinh (2026-11-05), Kho Sản phẩm là dữ liệu nguồn độc lập: Bài web chỉ **tham chiếu** Sản phẩm có sẵn, trình soạn bài không bao giờ tạo, sửa, xoá Sản phẩm.

**Approach:** Dựng module `products` và màn `/cms/san-pham` (danh sách tìm theo tên + phân trang, tạo, sửa, "nơi đang dùng"); migration thêm giá tham khảo có ngày và Dữ liệu thô; áp ngoại lệ AD-17 có tên (Vinh duyệt 2026-11-05) để trình soạn bài cũ ngừng ghi Sản phẩm, sửa tại chỗ, không chuyển file.

## Boundaries & Constraints

**Always:** Mẫu của Story 2.2 (module AD-5, đường ghi AD-6, form AD-14 qua `CmsForm`, Screen/skeleton AD-12, `components/shared`); `productInputSchema` duy nhất ở `modules/products/schema.ts`; Link affiliate qua `shopeeAffiliateUrl`, ảnh qua `imageUrl` (`platform/validation/fields.ts`); `products` (T1) chỉ import `categories` (`cms-queries`, `types`, `constants`, `tags`); "nơi đang dùng" và mọi query chạm `Post` + `Product` ở `modules/posts/cms-queries.ts`, Screen ghép (AD-2); lưu Sản phẩm `updateTag(PRODUCTS_TAG)`; query public cũ đọc `Product` gắn thêm `cacheTag(PRODUCTS_TAG)` (AD-7); test DB qua `npm run test:db`; chỉ Postgres cục bộ ([QD-07]).

**Ngoại lệ AD-17 (Vinh duyệt 2026-11-05, hết hiệu lực khi Epic 3 chuyển trình soạn bài):** sửa tại chỗ, không chuyển: `app/cms/actions.ts`, `app/cms/posts/[id]/page.tsx`, `lib/post-input.ts`, `lib/posts.ts`, `lib/ai.ts`, `components/cms/{post-editor,new-post-form,fields}.tsx`, `components/site/product-card.tsx`. Ghi ngoại lệ vào `docs/cong-thuc/chuyen-code-cu.md`.

**Never:** Không cho trình soạn bài tạo/sửa/xoá Sản phẩm hay sửa `PostProduct` (gắn/bỏ/sắp Sản phẩm vào bài là Epic 3); không xoá Sản phẩm (ẩn là Story 2.5, không có `hidden` ở đây); không thêm quy tắc đường dẫn cho link Shopee; không "đã đăng nền tảng nào"/Bộ nội dung (chưa có `content-sets`); không UploadField (Story 2.8 — ảnh dán URL).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tạo hợp lệ | tên, link `https://s.shopee.vn/x`, giá "~89.000đ", Danh mục | lưu, ở lại `/cms/san-pham/[id]`, `priceUpdatedAt` = lúc lưu | — |
| Link sai domain | `https://shopee.vn.evil.com/a`, `ftp://shopee.vn` | từ chối tại trường | "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)" |
| Link tìm kiếm | `https://shopee.vn/search?keyword=noi` | nhận (domain hợp lệ); ghi câu hỏi mở A4 vào báo cáo | — |
| Ảnh host lạ | ảnh chính hoặc một dòng ảnh thô `https://evil.com/a.png` | từ chối tại trường | thông báo tiếng Việt |
| Đổi giá | sửa `priceText` | `priceUpdatedAt` cập nhật | — |
| Không đổi giá | sửa tên, giữ giá | `priceUpdatedAt` giữ nguyên | — |
| Xoá giá | `priceText` rỗng | `priceText`, `priceUpdatedAt` = null | — |
| Danh mục | chọn từ danh sách / để trống | lưu `categoryId` / null | id không tồn tại → `UserError` |
| Tìm | `?q=nồi` | Sản phẩm có tên chứa "nồi" (không phân biệt hoa thường), mới nhất trước, `PRODUCT_PAGE_SIZE` mỗi trang `?trang=n` | lọc không ra → "Không có kết quả với bộ lọc này" + "Xoá bộ lọc" |
| Kho trống | 0 Sản phẩm | "Chưa có Sản phẩm nào. Tạo Sản phẩm đầu tiên." | — |
| Nơi đang dùng | Sản phẩm gắn 2 bài | 2 link `/cms/posts/[id]` theo tiêu đề | không bài nào → "Chưa dùng ở Bài web nào." |
| Lưu bài cũ | sửa bài có 3 Sản phẩm rồi lưu | Sản phẩm và `PostProduct` giữ nguyên id, thứ tự, mọi cột | — |
| Xoá bài | bài có Sản phẩm | bài và `PostProduct` của nó bị xoá; Sản phẩm còn nguyên (FR-4) | — |
| Migration | `Product.price` cũ có giá trị | sang `priceText`, `priceUpdatedAt` = lúc áp; giá null giữ null | — |

</intent-contract>

## Code Map

- `prisma/schema/products.prisma` + migration `add_product_price_and_raw_data` (`--create-only` từ chối không tương tác → tạo từ `prisma migrate diff`, sửa tay): `ALTER TABLE "Product" RENAME COLUMN "price" TO "priceText"` (không drop/add), `priceText VarChar(n)`, `priceUpdatedAt DateTime?` (UPDATE = now() nơi `priceText` không null), `rawText Text?`, `rawReviews Text?`, `rawImageUrls String[] @default([])`, `createdAt @default(now())`, `updatedAt @updatedAt` (backfill now()), `name VarChar(n)`; giới hạn ở `modules/products/constants.ts`. Comment trong `.prisma` theo AD-15.
- `modules/products/` (mới): `constants.ts` (giới hạn, `PRODUCT_PAGE_SIZE = 20`), `tags.ts` (`PRODUCTS_TAG = "products"`), `schema.ts` (`productInputSchema`: `id?`, `name` `requiredText`, `affiliateUrl` `shopeeAffiliateUrl`, `image` `imageUrl`, `priceText` `optionalText`, `categoryId` uuid hoặc "" → null, `rawText`, `rawReviews`, `rawImageUrls` một dòng một URL, mỗi dòng qua `imageUrl`; kiểu `z.input`/`z.infer`) + `schema.test.ts`, `types.ts` (kiểu suy từ select), `cms-queries.ts` (`listProductsForCms({ q, page })` trả `{ items, total }`, `getProductForCms(id)`), `service.ts` (`saveProductRecord(data, tx?)`: đổi `priceUpdatedAt` chỉ khi `priceText` khác giá trị cũ; Danh mục không tồn tại P2003 → `UserError`), `actions.ts` (`saveProduct` — `run()` → safeParse → service → `updateTag(PRODUCTS_TAG)`), `components/product-form.client.tsx` (thứ tự UX-DR74: tên, Link affiliate, giá tham khảo, ảnh, Danh mục, Dữ liệu thô), `components/product-status-badge.tsx` (chỉ "Hiện" — Story 2.5 thêm "Ẩn").
- `modules/categories/cms-queries.ts` -- thêm `listCategoryOptionsForCms()` (`id`, `name` theo `sortOrder`).
- `modules/posts/cms-queries.ts` -- thêm `listPostsUsingProductForCms(productId)` (`id`, `title`, `status` theo `PostProduct`).
- `app/cms/san-pham/{page.tsx, moi/page.tsx, [id]/page.tsx}` + `_components/*-screen.tsx`, `*-skeleton.tsx`: danh sách mobile Card (tên `headline-sm` + badge, meta `body-sm`: giá · Danh mục), desktop Table; ô tìm đưa lên `?q`, phân trang `?trang` (đọc `searchParams` trong Suspense — AD-12); nút "Tạo Sản phẩm" dính đáy mobile; chi tiết = form + khối "Nơi đang dùng". `app/cms/_components/cms-shell.client.tsx` -- mục "Sản phẩm" `/cms/san-pham` sau "Bài web". shadcn `select`, `table` qua CLI nếu cần (không dependency mới).
- `platform/format.ts` -- `formatShortDate` (dd/mm/yyyy, `Asia/Ho_Chi_Minh`) + test, dùng cho "cập nhật dd/mm/yyyy".
- Ngoại lệ AD-17 (sửa tại chỗ): `app/cms/actions.ts` -- bỏ `replacePostProducts`; `savePost` không chạm `PostProduct`/`Product`; `deletePost` chỉ xoá bài; `createPost` không nhận Sản phẩm, AI viết theo chủ đề (chủ đề rỗng + AI → `UserError` "Nhập chủ đề để AI viết bài"). `lib/post-input.ts` -- bỏ `productInputSchema` và trường `products` khỏi `postInputSchema`/`newPostSchema`. `lib/ai.ts` -- `generatePost` không bắt buộc Sản phẩm. `components/cms/post-editor.tsx` + `fields.tsx` -- khối Sản phẩm thành danh sách chỉ đọc (tên, link "Sửa trong Kho" → `/cms/san-pham/[id]`) + một câu "Gắn Sản phẩm từ kho sẽ có ở bản sau"; bỏ `ProductFields`/`emptyProduct` nếu không còn dùng. `components/cms/new-post-form.tsx` -- bỏ ô Sản phẩm. `app/cms/posts/[id]/page.tsx` -- truyền Sản phẩm chỉ đọc (id, tên). `lib/posts.ts` -- query đọc `Product` thêm `cacheTag(PRODUCTS_TAG)`, `price` → `priceText` + `priceUpdatedAt`. `components/site/product-card.tsx` -- đọc `priceText` (không đổi giao diện; Story 2.4 làm ProductCard mới).
- `prisma/seed.ts` -- Sản phẩm mẫu có `priceText` "~…đ" và `priceUpdatedAt`, Danh mục theo bài; chạy lại không lỗi.
- `docs/cong-thuc/chuyen-code-cu.md` (ghi ngoại lệ), `docs/no-ky-thuat.md` ([NO-09] đóng; [NO-17] cập nhật), `docs/kien-truc-codebase.md` (Sản phẩm độc lập).

## Tasks & Acceptance

**Execution:**
- [ ] Migration + `products.prisma` -- AD-15
- [ ] `modules/products/*`, `modules/categories/cms-queries.ts`, `modules/posts/cms-queries.ts`, `platform/format.ts` + test
- [ ] `app/cms/san-pham/**`, CmsShell
- [ ] Ngoại lệ AD-17: các file cũ ở Code Map
- [ ] `prisma/seed.ts`, docs
- [ ] Test: `modules/products/schema.test.ts`; `modules/products/service.db.test.ts` (tạo, đổi/không đổi/xoá giá, Danh mục lạ, tìm + phân trang); `modules/posts/cms-queries.db.test.ts` (nơi đang dùng); một test DB chứng minh xoá `Post` giữ `Product`

**Acceptance Criteria:**
- Given `npm run build && npm start`, when Vinh tạo, tìm, sửa Sản phẩm ở 360px và 1280px, then đúng Matrix; trang bài public vẫn hiện Sản phẩm và giá như trước.
- Given một bài có Sản phẩm, when sửa và lưu bài trong CMS, then id và dữ liệu Sản phẩm không đổi; khối Sản phẩm trong editor chỉ đọc, link sang Kho.

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review pass (lớp Quy ước dự án không chạy được: giới hạn tài khoản; chạy bù trong review gộp 2.3–2.7)
- verdicts: 38 findings — high 0, medium 4, low 22, false 12, maybe-false 0
- Route `patch` — làm trong lượt gộp (Vinh 2026-11-05: phát triển theo lượt, sửa tận gốc vấn đề lặp):
  - `[medium]` Không test nào chạy `savePost`/`deletePost`/`createPost`/`saveProduct` (lặp từ 2.2) → dựng khung test Server Action (mock `next/headers`, `next/cache`) và test: lưu bài giữ nguyên `PostProduct`/`Product`, xoá bài giữ Sản phẩm, AI không chủ đề → `UserError`, `saveProduct` lỗi domain
  - `[medium]` Migration thu hẹp VarChar không kiểm dữ liệu cũ (lặp từ 2.2) → thêm bước kiểm độ dài vào checklist deploy (`docs/kiem-chung.md`, `docs/cong-thuc/doi-schema.md`) một lần cho mọi migration
  - `[low]` `?trang` không chặn số lớn/vượt trang; kho trống + trang>1 hiện sai trạng thái lọc → chặn số nguyên an toàn, kẹp về trang cuối
  - `[low]` Seed xoá Sản phẩm theo tên có thể trúng Sản phẩm Vinh tạo → nhận diện bằng `affiliateUrl` placeholder
  - `[low]` Câu hỏi mở A4 chưa ghi vào PRD addendum → ghi
  - `[low]` `docs/kien-truc-codebase.md` số dòng `app/cms/actions.ts` lệch, `CATEGORIES_TAG` sai file, "Danh mục chưa có giao diện" lỗi thời, [NO-20] → sửa; bỏ số dòng dễ lệch ở mục đã sửa
  - `[low]` `app/cms/new/page.tsx` mô tả "Nhập sản phẩm kèm link" lỗi thời → sửa chữ (thêm file vào ngoại lệ)
  - `[low]` Form: ảnh `type="url"` chặn đường dẫn tương đối, `name` thiếu `maxLength` → `type="text" inputMode="url"`, thêm `maxLength`
  - `[low]` `ProductForCms` không dùng → xoá
- Route `defer`:
  - `[low]` Không test vô hiệu cache (`updateTag`/`cacheTag`) — cần server Next chạy thật
  - `[low]` Không test migration trên dữ liệu kiểu cũ — chưa có khung test migration; thay bằng bước kiểm độ dài trước deploy
- Route `reject`:
  - `[low]` `priceUpdatedAt` = lúc áp migration cho giá cũ — đúng spec; seed không có giá cũ
  - `[low]` AI viết bài "Gom link" không có Sản phẩm — Vinh duyệt AI theo chủ đề tới khi có "Tạo bài viết" từ Sản phẩm
  - `[low]` Badge luôn "Hiện" — Story 2.5 thêm `hidden` ngay sau
  - `[low]` `tx?` không ai truyền — AD-5/[QU-27] quy định service nhận `tx?`
  - `[low]` `priceUpdatedAt` lấy ra nhưng site chưa hiện — Story 2.4 hiện
  - `[low]` P2003 không kiểm `meta` — Product hiện có một FK
  - `[low]` `updateTag` khi tạo mới không cần — rẻ, đúng AD-7
  - `[low]` Form không reset theo giá trị đã trim — hiếm
  - `[false]` × 12 — đúng spec/quyết định của Vinh (updateTag qua tag đọc ở query, AI cần chủ đề, A4 ghi ở báo cáo/test, đọc R2 đúng ý Vinh…)

## Verification

**Commands:**
- `npm test` -- expected: xanh
- `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng trống: các dòng UI của Matrix; lưu một bài cũ rồi kiểm id Sản phẩm không đổi.
</content>
</invoke>
