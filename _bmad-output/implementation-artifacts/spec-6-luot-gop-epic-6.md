---
title: 'Lượt gộp Epic 6: Trang bio — Story 6.1–6.3'
type: 'feature'
created: '2026-11-06'
status: 'done'
review_loop_iteration: 1
baseline_revision: 'e8132e80227e3b443de2c3426ba50e4e17d6285c'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-luot-gop-epic-3.md'
  - '{project-root}/docs/cong-thuc/them-trang-public.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
warnings: ['multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Chưa có Trang bio: link trên hồ sơ Threads/Facebook (`/bio`, tab "Đồ hay", nút "Đồ hay" trên SiteHeader) trả 404; Vinh không có chỗ chọn món hiện, ghim, sắp thứ tự; Trang chủ thiếu khu "Gom link đồ xinh". Epic 6 gồm Story 6.1–6.3 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai theo thứ tự 6.1 → 6.2 → 6.3, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). Dựng module `bio` (T3) theo spine: bảng `BioSettings`, `BioItem` tạo lười; một hàm thứ tự thuần dùng chung cho query public, query CMS và ghi; query public gắn tag mọi module nó đọc.

## Boundaries & Constraints

**Always:** Mọi quy tắc spine và mẫu đã có ở Epic 2–5 (module AD-5, đường ghi AD-6 qua `run()`, đọc/cache AD-7 với `visibleProductWhere` + `publicProductSelect` và tag mọi module, route mỏng AD-12, form AD-14 qua `CmsForm`, `AffiliateLink`/`AffiliateDisclosure` AD-11, SEO AD-26); `products` không ghi `BioItem`, Product chỉ thêm quan hệ ngược; Sản phẩm ẩn không bao giờ hiện trên `/bio`, Trang chủ, `/cms/bio`; mọi action/query mới có test DB (khung `actionTest`/`cacheTagsOf`); một migration `add_bio` ở Story 6.1.

**Never:** Không ô tìm, link MXH/@handle, bộ sưu tập ảo, emoji Danh mục, khối "Bài mới nhất" trên `/bio` (UX-DR99); không đổi URL khi lọc; không thêm thư viện npm; không làm Banner, Xem nhiều (epic sau, không chừa chỗ trống); không sửa PRD/spine/`AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sản phẩm mới | tạo Sản phẩm, chưa có `BioItem` | hiện trên `/bio`, không ghim, đứng đầu nhóm không ghim (mới nhất trước) | — |
| Ẩn Sản phẩm | `setProductHidden` | biến mất khỏi `/bio`, dải Trang chủ, `/cms/bio` (tag `products`) | — |
| Tắt "Hiện trên bio" | Switch tắt | không còn trên `/bio`/Trang chủ; vẫn ở `/cms/bio` với Switch tắt | Sản phẩm không tồn tại/đang ẩn → `UserError` |
| Ghim | bấm Ghim 2 món A rồi B | nhóm "Nổi bật": A, B; không lặp ở nhóm Danh mục; bỏ ghim → về chỗ theo thứ tự cũ | — |
| Lên/xuống | đổi chỗ trong nhóm "Đang ghim" hoặc nhóm còn lại | thứ tự mới thấy ngay ở CMS và `/bio`; món đầu/cuối nhóm không đi tiếp | đi quá nhóm → không đổi gì |
| Chip Danh mục | chạm chip "Đồ bếp" | danh sách phẳng, ghim lên đầu giữ dấu Ghim; URL không đổi | — |
| Chip | Danh mục không có món hiện | không có chip đó | — |
| Món không Danh mục | `categoryId` null | nằm ở nhóm "Khác" cuối chip "Tất cả"; không có chip riêng | — |
| `/bio` rỗng | 0 món hiện | giới thiệu + nhãn + "Về trang chủ" + EmptyState "Sắp có đồ hay, ghé lại sau nhé"; không chip | — |
| Giới thiệu/nhãn | chưa lưu lần nào | dùng giá trị khởi tạo ở `bio/constants.ts` | nhãn rỗng → lỗi tại trường "Nhập câu công khai" |
| Trang chủ | có món hiện trên bio | khu "Gom link đồ xinh" sau Bài nổi bật, ≤ 8 món theo thứ tự bio, "Xem tất cả" → `/bio` | 0 món → ẩn khu |
| Chưa đăng nhập | gọi action bio | "Bạn cần đăng nhập CMS", không ghi | — |

</intent-contract>

## Code Map

- **6.1:**
  - `prisma/schema/bio.prisma` + migration `add_bio` (`BioSettings`, `BioItem` `productId @unique` FK Cascade); `products.prisma` thêm `bioItem BioItem?` (quan hệ ngược).
  - `modules/bio/{tags,constants,types,order,queries}.ts`: `BIO_TAG = "bio"`; giá trị khởi tạo giới thiệu/nhãn và giới hạn cứng; `orderBioEntries` (thuần, test đơn vị) tách "Đang ghim"/còn lại; `getBioPage()` (tag `bio`, `products`, `categories`), `getBioHighlights(limit)` (tag `bio`, `products`).
  - `modules/bio/components/bio-browser.client.tsx` (FilterChips + nhóm/lọc phía client, dùng `ProductCard`), `components/shared/filter-chips.client.tsx`, `components/ui/switch.tsx` (shadcn CLI).
  - `modules/products/components/product-card.tsx` thêm `pinned` (dấu Ghim), `affiliate-disclosure.tsx` nhận câu công khai tuỳ chỉnh.
  - `app/(site)/bio/page.tsx` + `_components/{bio-screen,bio-skeleton}.tsx`; `app/sitemap.ts` thêm `/bio`; `site-nav.ts` bỏ ghi chú 404.
  - `vitest.db.helpers.ts`: TRUNCATE thêm `BioItem`, `BioSettings`.
- **6.2:**
  - `modules/bio/{schema,service,actions,cms-queries}.ts`: `saveBioSettings`, `setBioItemVisible`, `setBioItemPinned`, `moveBioItem` (đều `updateTag(BIO_TAG)`); `getBioForCms()`.
  - `modules/bio/components/{bio-settings-form,bio-product-list}.client.tsx`.
  - `app/cms/bio/page.tsx` + `_components/{bio-cms-screen,bio-cms-skeleton}.tsx`; `CmsShell` thêm "Trang bio" (sau Danh mục, trước Hồ sơ phong cách — thứ tự IA).
- **6.3:** `app/(site)/_components/home-screen.tsx` thêm khu "Gom link đồ xinh" (`modules/bio/components/bio-highlights.tsx`), `home-skeleton.tsx` không đổi (khu ẩn khi rỗng nên skeleton không chừa chỗ).
- Docs: `docs/kien-truc-codebase.md`, `docs/nen-tang-ky-thuat/giao-dien.md` (bỏ ghi chú `/bio` 404, thêm FilterChips, BioProductList, Switch).

## Tasks & Acceptance

**Execution:**
- [x] 6.1 bảng + migration `add_bio`, thứ tự bio, query public, trang `/bio`, sitemap
- [x] 6.2 `/cms/bio`: form giới thiệu/nhãn, BioProductList (hiện, ghim, lên/xuống), action + test
- [x] 6.3 dải "Gom link đồ xinh" trên Trang chủ
- [x] Test cho mọi action/query/hàm thuần mới; docs
- [x] Kiểm tay (`next start -p 3300`): `/bio` 200 (nhãn, "Về trang chủ", chip "Tất cả"), `/` có "Gom link đồ xinh", sitemap có `/bio`, `/cms/bio` chưa auth 401, có auth 200 (Switch "Hiện trên bio", form câu công khai). Xem bằng mắt ở 360px/1280px: làm ở lượt review gộp (xem Review Triage Log).

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy.
- Given `npm run build && npm start` (cổng ≥ 3300), when mở `/bio`, `/cms/bio`, `/` ở 360px và 1280px, then đúng AC từng story trong `epics.md`.

## Spec Change Log

- 2026-11-06 (tiếp tục sau khi đổi tài khoản): lint chặn `modules/bio/actions.db.test.ts` import `@/modules/products/actions` (AD-2) → test ẩn Sản phẩm bằng `db.product.update`; `updateTag(products)` của action ẩn đã có test ở `products`. Thêm docs `kien-truc-codebase.md`, `giao-dien.md`.

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Thứ tự bằng một cột `BioItem.sortAt` (`DateTime?`)** thay vì số thứ tự nguyên: món ghim xếp `sortAt` tăng dần (ghim gán `now()` → đứng cuối nhóm "Đang ghim" = "theo thứ tự đặt"); món còn lại xếp theo khoá hiệu lực `sortAt ?? Product.createdAt` giảm dần, nên thiếu bản ghi = "mới nhất trước" đúng spine, Sản phẩm mới luôn lên đầu nhóm. Lên/xuống đổi khoá hiệu lực của hai món kề nhau (tạo `BioItem` lười cho cả hai); khoá bằng nhau thì lệch 1 ms. (Review gộp sửa: nhóm "Đang ghim" dùng cột riêng `pinnedAt`, xem quyết định 11.) Lý do: AC 6.2 cho lên/xuống ở cả nhóm còn lại, trong khi spine định thứ tự mặc định theo `createdAt`; một khoá thời gian giữ cả hai mà không phải đánh số lại toàn bộ Sản phẩm.
2. **`BioSettings` một bản ghi, không khoá duy nhất:** service đọc bản đầu tiên rồi cập nhật hoặc tạo (một người vận hành); thiếu bản ghi đọc giá trị khởi tạo ở `bio/constants.ts`. Giới hạn cứng tự đặt: giới thiệu 500, câu công khai 300 ký tự.
3. **Món không có Danh mục** nằm ở nhóm "Khác" cuối chip "Tất cả", không có chip riêng (AC chỉ nói chip gồm Danh mục có món).
4. **Số món trên chip** đếm cả món ghim của Danh mục đó (khớp danh sách phẳng khi chọn chip); tiêu đề nhóm trong "Tất cả" đếm số món của nhóm (không tính món đã lên "Nổi bật"). Chip "Tất cả" không kèm số.
5. **Lọc phía client render lại thẻ trong client component** (`BioBrowser` nhận dữ liệu đã serialize, ngày ISO — AD-8) thay vì render server rồi ẩn bằng CSS; HTML tĩnh chứa sẵn chế độ "Tất cả".
6. **FilterChips ở `components/shared/`** (không nghiệp vụ; UX-DR30 dùng cho `/bio` và Tìm kiếm Epic 8 — `posts` T2 không import được `bio` T3).
7. **Hàm thứ tự thuần ở `modules/bio/order.ts`** (ngoài danh sách file AD-5; tiền lệ `suggestions/content-source.ts`) để query public, query CMS và service dùng một luật, test đơn vị không cần DB.
8. **Dòng AffiliateDisclosure ở Trang chủ** dùng câu công khai mặc định của site (dạng chữ), không lấy câu của `/bio` — dải Trang chủ không đọc `BioSettings`, tag chỉ `bio` + `products` đúng AC.
9. **Metadata `/bio` tĩnh:** title "Đồ hay", mô tả cố định; không lấy giới thiệu từ CMS (giữ trang tĩnh đơn giản; canonical `/bio`).
10. **Switch "Hiện trên bio" giữ món trong nhóm khi tắt** (vẫn lên/xuống, ghim được); `/bio` bỏ món tắt. Ghim món đang tắt vẫn cho phép.
11. **(Review gộp) Khoá nhóm "Đang ghim" tách thành cột `BioItem.pinnedAt`:** ghim gán `pinnedAt = now()`, bỏ ghim đặt `pinnedAt = null`, `sortAt` không đổi → bỏ ghim về đúng chỗ cũ trong nhóm còn lại (chưa sắp tay thì theo ngày tạo) — khớp dòng Matrix "bỏ ghim → về chỗ theo thứ tự cũ". Giữ cột `pinned` (không gộp vào `pinnedAt != null`) để không phải xoá cột. Migration `20261106120000_bio_pinned_at_untie_product_created_at` chép `sortAt` của món đang ghim sang `pinnedAt`.
12. **(Review gộp) Gỡ `Product.createdAt` trùng nhau bằng migration dữ liệu** (cùng migration trên): Sản phẩm có sẵn từ `add_product_price_and_raw_data` cùng một `createdAt`; lùi mỗi món 1 ms theo `id` tăng dần — giữ nguyên thứ tự hiện tại (đã thử SQL trên DB test trong transaction rollback). Nhờ vậy lên/xuống chỉ ghi 2 món thay vì cả nhóm trùng; `planBioMove` vẫn giữ bước làm khoá phân biệt cho trường hợp hiếm còn trùng. Migration của bảng `products` do `bio` cần — chỉ đổi dữ liệu mili-giây, không đổi schema của `products`. Không chọn cách ghi gộp bằng SQL thô hay tăng timeout transaction (chữa triệu chứng).
13. **(Review gộp) Dải cuộn ngang dùng `scroll-px-margin`:** khi kiểm bằng mắt, chip đầu của FilterChips (`/bio`) và thẻ đầu dải "Gom link đồ xinh" (Trang chủ, 360px) dính sát mép do `snap-start` không tính `px-margin`; thêm `scroll-padding-inline` cho cả hai (sửa ở gốc `FilterChips` dùng chung).

### 2026-11-06 — Review gộp Epic 6: phân loại

| # | Phát hiện | Quyết định | Lý do / việc đã làm |
|---|---|---|---|
| 1 | Lên/xuống lần đầu trên Sản phẩm cũ (cùng `createdAt` do migration) ghi gần cả Kho trong một transaction (trung bình) | Sửa (gốc) | Đúng: `planBioMove` làm khoá phân biệt cả nhóm trùng. Sửa ở dữ liệu: migration lùi `createdAt` trùng 1 ms/món giữ thứ tự (quyết định 12) → đổi chỗ chỉ ghi 2 món. Test đơn vị đổi chỗ khoá phân biệt ghi đúng 2 món; test cùng ngày tạo vẫn xanh. |
| 2 | Ghim rồi bỏ ghim mất vị trí đã sắp tay (thấp) | Sửa | Lệch Matrix "bỏ ghim → về chỗ theo thứ tự cũ". Cột `pinnedAt` riêng cho nhóm ghim (quyết định 11); `planBioMove` trả `at`, service ghi `BIO_KEY_FIELD[kind]`. Test DB: sắp C lên đầu, ghim, bỏ ghim → C về đầu; test đơn vị đổi chỗ nhóm ghim không đụng `sortAt`. |
| 3 | Không có test cho nhóm/chip của `/bio` (trung bình) | Sửa | Tách `bioGroupsOf`, `bioChipsOf`, `bioItemsOfCategory` sang `modules/bio/browse.ts` (thuần), `BioBrowser` chỉ gọi. `browse.test.ts`: Nổi bật trước, ghim không lặp, nhóm Khác cuối, bỏ nhóm rỗng, số chip tính cả món ghim, không có chip Khác, danh sách phẳng giữ dấu Ghim. |
| 4 | Chưa xem bằng mắt ở 360px/1280px (trung bình) | Sửa | Chụp Chrome headless `next start -p 3300` (dữ liệu DB cục bộ, 19 Sản phẩm): `/bio` 360 một cột, chip cuộn trong hàng, không cuộn ngang cả trang; 1280 cột giữa ~528px (≤ 560); `/cms/bio` 360 dòng ảnh 40px, tên trên, Switch + Ghim + lên/xuống xuống hàng gọn; 1280 một hàng; Trang chủ 360 dải snap ngang, 1280 lưới 4 cột 2 hàng (8 món). Thấy lỗi chip/thẻ đầu dính mép → sửa (quyết định 13), chụp lại đúng gutter 16px. |
| 5 | Thiếu assert `updateTag` cho ghim, lên/xuống (thấp) | Sửa | Test ghim: `["bio" ×4]` (ghim lại món đang ghim vẫn thành công); test lên/xuống: 6 × `bio`; đường lỗi (Sản phẩm ẩn/không có) `updatedTags` rỗng. |
| 6 | Thiếu test chặn chưa đăng nhập cho ghim, lên/xuống (thấp) | Sửa | Test chưa đăng nhập gọi cả 4 action trên Sản phẩm có thật, `BioItem`/`BioSettings` = 0, không `updateTag`. |

### Auto Run Result

- Sửa 6, hoãn 0, bác 0.
- `npm test` 296/296 (33 file); `npm run test:db` 171/171 (19 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch; `prisma migrate diff` sau migration rỗng.
- `next start` cổng 3300 (`AI_PROVIDERS=fake`): `/`, `/bio`, `/sitemap.xml` 200; `/cms`, `/cms/bio` không đăng nhập 401, có Basic Auth `/cms/bio` 200; `/bio` có chip "Tất cả", "Về trang chủ"; Trang chủ có "Gom link đồ xinh". Ảnh chụp 360/1280 như #4. Server đã tắt; không đụng cổng 3100/3200.
- Không gọi `claude -p` thật (epic không có tính năng AI).
- Cần Vinh: xem Quyết định tự chọn (nhất là 1, 4, 11, 12 — migration đổi `Product.createdAt` của Sản phẩm cũ vài mili-giây); chạy `npx prisma migrate deploy` khi đưa lên máy thật.

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng 3300+ (không dùng 3100, 3200): `/bio` 200 ở 360px/1280px, chip lọc không đổi URL; `/cms/bio` chưa auth 401; Trang chủ có/không khu Gom link.

**Kết quả sau review gộp (2026-11-06):** `npm test` 296/296; `npm run test:db` 171/171; tsc, lint, build sạch.
