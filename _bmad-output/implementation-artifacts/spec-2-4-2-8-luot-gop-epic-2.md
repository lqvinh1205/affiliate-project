---
title: 'Lượt gộp Epic 2: Story 2.4–2.8 + sửa sau review 2.3'
type: 'feature'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '2d7b97678dc106e5c5e2e31ccfa0d26c951b5c0a'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-3-kho-san-pham.md'
  - '{project-root}/docs/cong-thuc/chuyen-code-cu.md'
  - '{project-root}/docs/cong-thuc/them-trang-public.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
warnings: ['oversized', 'multiple-goals']
deferred:
  - summary: >-
      Spine chưa ghi app/uploads/[...path] (phục vụ file) và put(file, maxBytes) lệch hợp đồng AD-24.
    evidence: |-
      Vinh chọn route handler (2026-11-05); spine cần cập nhật qua bmad-architecture hoặc bmad-correct-course.
    location: >-
      ARCHITECTURE-SPINE.md AD-24, Structural Seed
    severity: medium
  - summary: >-
      Video upload chưa hỗ trợ Range/206 (Safari iOS), file upload mồ côi không bao giờ bị xoá.
    evidence: |-
      Chưa màn nào dùng video; làm khi có FR-1/FR-32; ghi trong docs/kiem-chung.md.
    location: >-
      app/uploads/[...path]/route.ts
    severity: low
  - summary: >-
      app/cms/page.tsx chưa làm mỏng (AD-12), app/cms/actions.db.test.ts nằm cạnh file cũ.
    evidence: |-
      Chuyển khi Epic 3 chuyển màn bài viết.
    location: >-
      app/cms/
    severity: low
---

<intent-contract>

## Intent

**Problem:** Epic 2 còn Story 2.4 (AffiliateLink, nhãn công khai, ProductCard), 2.5 (Ẩn Sản phẩm), 2.6 (điều hướng site theo Danh mục), 2.7 (trang Danh mục/Loại bài có phân trang, 308 khi đổi đường dẫn), 2.8 (tải ảnh từ điện thoại), cùng các bản sửa sau review 2.3. Vinh (2026-11-05) yêu cầu làm theo lượt: code nhiều story rồi review/test gộp một lần, và sửa tận gốc phát hiện lặp lại giữa các story.

**Approach:** Một lượt triển khai theo thứ tự 2.3-sửa → 2.5 → 2.4 → 2.6 → 2.7 → 2.8 (2.5 trước 2.4 vì `visibleProductWhere`/`publicProductSelect` dùng ở 2.4), mỗi story đúng AC trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story). Kèm ba việc tận gốc: khung test Server Action, bước kiểm dữ liệu trước migration thu hẹp cột, tài liệu không trích số dòng dễ lệch.

## Boundaries & Constraints

**Always:** Mọi quy tắc spine và mẫu đã có ở Story 2.2/2.3 (module AD-5, đường ghi AD-6, đọc/cache AD-7, route mỏng AD-12, form AD-14, slug AD-20, `AffiliateLink` AD-11, upload AD-24); quyết định Vinh 2026-11-05: Bài web chỉ tham chiếu Sản phẩm trong kho, trình soạn bài không ghi Sản phẩm (ngoại lệ AD-17 của 2.3 vẫn hiệu lực cho các file đã liệt kê, thêm `app/cms/new/page.tsx` cho đổi chữ); 2.8: phục vụ file qua route handler Next, backup ghi thành quy trình trong docs (làm khi deploy); mỗi story có migration thì một migration riêng (2.5 `add_product_hidden`, 2.7 `add_category_slug_redirect`), tạo từ `prisma migrate diff` khi `--create-only` từ chối, đọc SQL, chỉ áp Postgres cục bộ; chạm file cũ ngoài danh sách ngoại lệ thì chuyển theo bảng `chuyen-code-cu.md` (dự kiến: `lib/posts.ts` → `modules/posts/{queries,tags,types}.ts`, `lib/categories.ts` → `modules/posts/constants.ts`, `components/site/*` → `modules/products/components`, `modules/posts/components`, `app/(site)/_components` theo bảng), sửa mọi import, cập nhật `LEGACY_APP_FILES`.

**Never:** Không cào Shopee, không `/go/...`, không đếm click; không e2e; không đổi PRD/spine (câu hỏi mở chỉ ghi vào addendum); không làm Epic 3 (gắn/bỏ Sản phẩm vào bài, đổi slug bài); không sửa `AGENTS.md` (Vinh chạy `bmad-project-context`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Link Shopee trên site | thẻ Sản phẩm bất kỳ | `<a>` duy nhất, nguyên link, `target="_blank"`, `rel="sponsored nofollow noopener"` | — |
| Nhãn công khai | bài có ≥1 Sản phẩm đang hiện / không có | hiện dưới dòng meta trước ảnh đầu bài / không render | — |
| Giá | `priceText` "~89.000đ", `priceUpdatedAt` 2026-11-04 | "Giá tham khảo ~89.000đ · cập nhật 04/11/2026"; không giá → không dòng giá | — |
| Ảnh Sản phẩm lỗi tải | URL hỏng | ImageFallback | — |
| Ẩn Sản phẩm | chạm "Ẩn" | badge "Ẩn" + Toast "Hoàn tác"; liệt kê bài đang dùng (link) | hoàn tác → hiện lại |
| Sản phẩm ẩn trên site | mọi query public (thẻ, ảnh đại diện fallback) | không còn Sản phẩm và link của nó, sau `updateTag` | — |
| CategorySheet | Danh mục có ≥1 bài đã xuất bản | liệt kê theo thứ tự; Danh mục rỗng không hiện | — |
| Trang Danh mục | `/nha-bep` | Breadcrumb, mô tả, lưới PostCard, Pagination | slug lạ → 404 |
| Phân trang | `/nha-bep/trang/1` / `/trang/99` | 308 về `/nha-bep` / 404 | — |
| Đổi đường dẫn Danh mục | `nha-bep` → `bep` | `/nha-bep` trả 308 sang `/bep` | — |
| Danh mục rỗng | 0 bài | "Danh mục này chưa có bài nào" + link Trang chủ | — |
| Loại bài | `/meo-vat`, `/gom-link`, `/…/trang/n` | như trang Danh mục, lọc `PostType` | — |
| Upload không auth | POST `/cms/upload` không header | 401 + `WWW-Authenticate` cùng realm `proxy.ts` | — |
| Upload sai loại/quá lớn | `.exe`; video > 100 MB | từ chối, lỗi tại trường | thông báo tiếng Việt |
| Upload ảnh > 10 MB | ảnh 12 MB | nhận nguyên vẹn (kiểm byte) | — |
| Phục vụ file | GET `/uploads/<tên>` | trả file, `Cache-Control` dài; đường dẫn `..` → 404 | — |
| Lưu bài cũ (2.3) | gọi `savePost` | `PostProduct`/`Product` không đổi (test Server Action) | — |

</intent-contract>

## Code Map

**2.3 — sửa sau review (Triage Log của spec 2.3):**
- Khung test Server Action dùng chung (`vitest.db.helpers.ts` hoặc file helper test cạnh nó): mock `next/headers` (header Basic Auth hợp lệ như `platform/auth/run.test.ts`), mock `next/cache` (`updateTag`, `cacheTag`, `cacheLife` no-op ghi lại lời gọi); test DB: `savePost` giữ `PostProduct`/`Product`, `deletePost` giữ Sản phẩm, `createPost` AI không chủ đề → `UserError`, `saveProduct` sai domain → `ok:false`, `saveProduct` gọi `updateTag("products")`; dùng tiếp cho mọi action mới trong lượt.
- `app/cms/san-pham/_components/product-list-screen.tsx` -- `?trang` số nguyên an toàn ≥1, vượt trang cuối → kẹp; kho trống (không `q`) luôn hiện trạng thái kho trống.
- `prisma/seed.ts` -- nhận diện Sản phẩm mẫu bằng `affiliateUrl` placeholder, không theo tên.
- `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/addendum.md` §A4 -- ghi câu hỏi mở: link tìm kiếm `shopee.vn/search?keyword=…` qua được domain check.
- `modules/products/components/product-form.client.tsx` -- ô ảnh `type="text" inputMode="url"`, `name` có `maxLength`; xoá `ProductForCms` không dùng; `app/cms/new/page.tsx` sửa câu mô tả.
- `docs/kiem-chung.md` + `docs/cong-thuc/doi-schema.md` -- bước bắt buộc trước khi áp migration thu hẹp cột lên DB có dữ liệu: chạy `SELECT … WHERE length(col) > n` cho từng cột bị thu hẹp (một lần, áp cho mọi migration sau). `docs/kien-truc-codebase.md` -- sửa `CATEGORIES_TAG` đúng file, Danh mục đã có giao diện, [NO-20]; bỏ số dòng ở các đoạn trỏ tới file hay đổi (chỉ ghi file + tên hàm).

**2.5 Ẩn Sản phẩm:** `products.prisma` + migration `add_product_hidden` (`hidden Boolean @default(false)`); `modules/products/queries.ts` (`import "server-only"`, `visibleProductWhere`, `publicProductSelect` — mọi query public trả Sản phẩm dùng hai hằng này, kể cả ảnh đại diện fallback và query chuyển từ `lib/posts.ts`); `setProductHiddenRecord` + action `setProductHidden` (`updateTag(PRODUCTS_TAG)`); nút Ẩn/Hiện ở chi tiết và danh sách, Toast "Hoàn tác", không ConfirmDialog; `ProductStatusBadge` theo `hidden`; danh sách bài đang dùng (đã có `listPostsUsingProductForCms`); test DB "ẩn Sản phẩm biến mất khỏi mọi query public" (AD-16).

**2.4 AffiliateLink/ProductCard:** `modules/products/components/{affiliate-link.tsx, affiliate-disclosure.tsx, product-card.tsx (biến thể row, tile)}`; chuyển `components/site/product-card.tsx`, `affiliate-disclosure.tsx`; `components/shared/image-fallback.client.tsx`; microcopy giá qua `platform/format.ts` (`formatShortDate`); câu công khai theo `EXPERIENCE.md`; trang bài `app/(site)/bai-viet/[slug]/page.tsx`: nhãn dưới meta trước ảnh đầu, khối Sản phẩm là danh sách row; dùng token DESIGN.md (`affiliate-link-button`, `product-card`, `affiliate-disclosure`) — khai báo token component tương ứng nếu chưa có; cập nhật `/cms/styleguide`.

**2.6 Điều hướng site:** `app/(site)/_components/{site-header, bottom-tab-bar.client, category-sheet.client, site-footer, …}` (chuyển `components/site/{site-header đã chuyển, mobile-nav, nav-links, site-footer, section-heading}`, `components/json-ld.tsx` theo bảng); query `listNavCategories()` ở `modules/posts/queries.ts` (Danh mục có ≥1 bài đã xuất bản, theo thứ tự, `cacheTag` posts + categories); 5 tab mobile, nav ngang desktop gom "Thêm", footer; vùng bấm ≥ 44px; `/bio`, `/tim-kiem` giữ 404 tới epic sau.

**2.7 Trang Danh mục/Loại bài:** đổi `app/(site)/[category]` → `app/(site)/[danh-muc]` (+ `trang/[n]`), thêm `app/(site)/meo-vat/{page, trang/[n]/page}`, `gom-link/…`; `PAGE_SIZE` ở `modules/posts/constants.ts`; `generateStaticParams` không rỗng (giữ chỗ `n="2"` → `notFound()`), `n=1` → `permanentRedirect`; tra slug và lịch sử ở `page.tsx` trước `<Suspense>` (AD-12); migration `add_category_slug_redirect` (`CategorySlugRedirect`, chủ `categories`); `saveCategoryRecord` ghi lịch sử khi đổi slug đã có; Breadcrumb, Pagination (trang đầu/cuối/±1, một trang thì ẩn); metadata/canonical/JSON-LD `BreadcrumbList` theo AD-26; `app/sitemap.ts` thêm Danh mục + Loại bài, không trang `/trang/n`; cập nhật `RESERVED_ROOT_SLUGS` + test thư mục.

**2.8 Upload:** `platform/storage/` (`import "server-only"`, `put(file) → { url }`, thư mục từ `UPLOAD_DIR`, tên file = hash nội dung + đuôi, ngoài `public/`; fail closed khi thiếu biến); `app/cms/upload/route.ts` (`requireAdmin()` trước khi đọc body, 401 + `WWW-Authenticate` cùng realm, kiểm loại ảnh/video và dung lượng: video ≤ 100 MB); `app/uploads/[...path]/route.ts` (GET, chặn `..`, `Content-Type` theo đuôi, `Cache-Control: public, max-age=31536000, immutable`); `uploads` vào `RESERVED_ROOT_SLUGS`; `next.config.ts` `images.localPatterns` cho `/uploads/**` nếu `next/image` cần; `components/shared/upload-field.client.tsx` (chọn file hoặc dán URL, thanh tiến trình, huỷ, xem trước đúng tỉ lệ, lỗi tại trường); dùng ở form Sản phẩm (ảnh chính + Dữ liệu thô ảnh); `.env.example` `UPLOAD_DIR` ([QD-06]); `docs/kiem-chung.md`: bước kiểm tay Chrome + Safari iOS (Basic Auth, file > 10 MB) và quy trình backup thư mục upload cùng Postgres.

## Tasks & Acceptance

**Execution:**
- [x] 2.3-sửa (Code Map) + khung test Server Action
- [x] 2.5 Ẩn Sản phẩm + migration + test tích hợp
- [x] 2.4 AffiliateLink, AffiliateDisclosure, ProductCard, ImageFallback
- [x] 2.6 điều hướng site
- [x] 2.7 trang Danh mục/Loại bài + migration + 308 + sitemap
- [x] 2.8 upload + phục vụ file + UploadField
- [x] Docs: `kien-truc-codebase.md`, `chuyen-code-cu.md` (dòng đã chuyển), `no-ky-thuat.md`, `kiem-chung.md`, `giao-dien.md` (component mới)

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy (ghi trong báo cáo).
- Given `npm run build && npm start`, when duyệt site ở 360px và 1280px (sáng/tối) và CMS, then đúng AC từng story trong `epics.md`.

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review gộp (diff từ 86862b7: Story 2.3 + 2.4–2.8; gồm lớp Quy ước bù cho 2.3)
- verdicts: 71 findings — high 1, medium 9, low 44, false 17, maybe-false 0
- Route `patch` (một lượt sửa):
  - `[high]` Không gán được Danh mục cho bài trong CMS → bài mới không bao giờ lên trang/nav Danh mục (Blind) — thêm chọn Danh mục ở editor/form tạo bài (ngoại lệ AD-17), lưu `categoryId`, test
  - `[medium]` Cache tag không được test (Sản phẩm ẩn có thể còn trên trang đã cache) — mock `cacheTag` ghi lại, assert mọi query public (Verification, lặp từ 2.2/2.3: xử lý tận gốc)
  - `[medium]` Route upload (auth, mã trạng thái) không có test — `route.db.test.ts` (Verification)
  - `[medium]` `loadCategory` 308 giữ `/trang/n`, `loadPostTypePage` 308/404 chưa test — thêm test (Verification)
  - `[medium]` UploadField: không huỷ khi unmount, ghi đè giá trị khi đang gõ, cho lưu khi đang tải (Blind, Edge) — sửa
  - `[medium]` Breadcrumb/BreadcrumbList trang bài theo Loại bài thay vì Danh mục (AD-26) — sửa
  - `[medium]` Trang `(site)` không mỏng (AD-12): trang bài, trang chủ, `/meo-vat`, `/gom-link` — tách Screen
  - `[medium]` Danh mục rỗng vẫn vào sitemap/index (Blind, Edge) — lọc sitemap, noindex khi rỗng
  - `[medium]` FR-5: ẩn từ danh sách không dẫn tới bài đang dùng (Intent) — Toast có link "Xem bài đang dùng"
  - `[low]` Trang Loại bài rỗng gọi là "Danh mục" (Blind, Edge, Quy ước) — props
  - `[low]` "Dòng N" lệch khi có dòng trống — giữ số dòng gốc + test
  - `[low]` Ảnh tương đối có query làm next/image ném lỗi — chặn `?`/`#`
  - `[low]` Upload rỗng trả 413 / lưu file 0 byte — 400 "File rỗng"
  - `[low]` "Thêm" không đóng sau điều hướng/Esc — client component
  - `[low]` CategorySheet vuốt khi đang cuộn bị đóng — chỉ đóng khi ở đầu danh sách
  - `[low]` `/cu/trang/abc` trả 308 thay vì 404 — kiểm tham số trước
  - `[low]` Tab Danh mục thiếu `aria-haspopup`/`aria-expanded`, `aria-current` trên button — sửa
  - `[low]` Editor liệt kê Sản phẩm ẩn không có trạng thái (CONTRACT-GAP) — badge
  - `[low]` × 11 Quy ước: kiểu gõ tay (`PostListPage`, `CardRow`, `CategoryOption`), `PublicPost` thừa, thứ tự import ×3, `POST_STATUS_LABEL` sai chỗ, `console.error` trong route, aria-label tiếng Anh/sai thuật ngữ, thiếu `motion-reduce`, nút ẩn chờ chưa `disabled`, UploadField chưa có mẫu styleguide, `PostTypeScreen` chung file — sửa
  - `[low]` Upload không bao giờ xoá file mồ côi; video chưa có Range — ghi vào `docs/kiem-chung.md`
- Route `defer`:
  - `[medium]` Spine chưa có `app/uploads/[...path]`, hợp đồng `put(file, maxBytes)` lệch AD-24 — sửa spine qua `bmad-architecture`/`bmad-correct-course` (Vinh)
  - `[low]` Video Range/206 — chưa màn nào dùng video (FR-1/FR-32 sau)
  - `[low]` `activeTab` chưa test; seed filter chưa test; migration trên dữ liệu kiểu cũ (đã có bước kiểm độ dài trước deploy)
  - `[low]` `app/cms/page.tsx` chưa mỏng, import `platform/db` — từ 2.1, chuyển ở Epic 3
  - `[low]` `app/cms/actions.db.test.ts` nằm cạnh file cũ và trong `LEGACY_APP_FILES` — ghi vào ngoại lệ; Vinh xác nhận
  - `[low]` `product-list-screen.tsx` gần 200 dòng — tách khi sửa tiếp
- Route `reject`:
  - `[false]` Link `/tim-kiem`, `/bio` trả 404 — AC 2.6 cho phép giữ 404 tới epic sau
  - `[false]` Ẩn BottomTabBar ở trang bài — đúng UX-DR11 ("trừ trang bài")
  - `[false]` Suspense không bao giờ hiện fallback ở trang có tham số — AD-12 bắt tra dữ liệu trước Suspense
  - `[false]` Chỉ `updateTag("products")` khi lưu/ẩn — mọi query đọc Sản phẩm gắn tag `products` (AD-7)
  - `[false]` Chưa chọn Sản phẩm từ kho (R2) — Vinh duyệt R2′, gắn Sản phẩm là Epic 3
  - `[false]` × 12 khác (quy trình `--create-only`, A4 trong addendum đã ghi, kiểm tay đã chạy bằng curl/Chrome headless…)

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng trống: các dòng UI của Matrix; `curl -I` cho 308/404/401; upload ảnh > 10 MB bằng curl có Basic Auth và so `sha256` file lưu.
</content>
</invoke>

## Auto Run Result

Status: done

**Thay đổi:**
- **2.3 (bản sửa):**
  - Khung test Server Action dùng chung (`actionTest`); test cho `savePost`, `deletePost`, `createPost`, `saveProduct`, `setProductHidden` và action của Danh mục.
  - Chặn `?trang` không hợp lệ.
  - Seed nhận diện Sản phẩm mẫu theo link placeholder.
  - Ghi câu hỏi mở A4 vào addendum.
  - Thêm bước kiểm độ dài dữ liệu trước mọi migration thu hẹp cột.
- **2.5:** cột `hidden`; `visibleProductWhere`/`publicProductSelect` dùng cho mọi query public; nút Ẩn/Hiện kèm "Hoàn tác" và "Xem bài đang dùng"; test tích hợp "ẩn Sản phẩm biến mất khỏi mọi query public".
- **2.4:** `AffiliateLink`, `AffiliateDisclosure`, `ProductCard` (row, tile), `ImageFallback`; nhãn công khai dưới dòng meta của bài.
- **2.6:** SiteHeader có menu "Thêm", BottomTabBar 5 tab, CategorySheet, SiteFooter.
- **2.7:**
  - Route `[danh-muc]` và `/meo-vat`, `/gom-link`, có phân trang tĩnh; `trang/1` chuyển hướng 308, vượt trang trả 404.
  - Bảng `CategorySlugRedirect`: đổi đường dẫn Danh mục thì đường cũ trả 308.
  - Sitemap chỉ gồm Danh mục có bài; Danh mục rỗng được đánh dấu noindex.
  - Breadcrumb trang bài theo Danh mục.
- **2.8:**
  - `platform/storage` lưu đĩa cục bộ, tên file là sha256 của nội dung.
  - Route `/cms/upload` kiểm quyền và trả 401/415/413/400; route `/uploads/[...path]` phục vụ file với cache dài.
  - Component `UploadField` (tiến trình, huỷ, khoá nút Lưu khi đang tải).
- **Chuyển code cũ:** `lib/posts.ts`, `lib/categories.ts` và `components/site/*` đã chuyển vào `modules/` và `app/(site)/_components/`.
- **Trình soạn bài cũ (ngoại lệ AD-17):** thêm ô chọn Danh mục cho bài viết.
- **Test:** cache tag của mọi query public đều được kiểm; có test cho route upload, `loadCategory`, `loadPostTypePage` và metadata.

**Review gộp:** 71 phát hiện (high 1, medium 9, low 44, false 17).
- Đã sửa mọi mục được xếp vào nhóm sửa, gồm mục high: chưa gán được Danh mục cho bài.
- Để lại 3 mục, ghi trong `deferred`:
  - spine chưa có route phục vụ file upload;
  - video chưa hỗ trợ Range, file upload mồ côi không bao giờ bị xoá;
  - `app/cms/page.tsx` chưa làm mỏng.

**Có cần review lần nữa không:** có (`true`). Lượt này sửa một mục high. Sau lượt sửa, các thay đổi giao diện chưa được xem trên trình duyệt: ô chọn Danh mục trong editor, UploadField khoá nút Lưu, menu "Thêm", CategorySheet.

**Kiểm chứng:**
- `npm test`: 18 file, 195 test xanh.
- `npm run test:db`: 70 test xanh.
- `tsc`, `lint`, `build`: sạch.
- Trước lượt sửa, subagent đã chạy kiểm tay bằng curl và Chrome headless trên `next start`: 308/404/401, ảnh 12 MB lưu nguyên vẹn, ẩn Sản phẩm biến khỏi trang bài ngay.

**Rủi ro còn lại, cần Vinh làm:**
- Kiểm tay upload trên Chrome và Safari iOS (Basic Auth, file > 10 MB), các bước ở `docs/kiem-chung.md` §5.
- Thêm `UPLOAD_DIR` và `TEST_DATABASE_URL` vào `.env`.
- Cập nhật spine cho 2.8.
- `app/cms/new` giờ là trang động.
- `eslint.config.mjs` có thêm một khối cho `app/**/*.db.test.ts`.
