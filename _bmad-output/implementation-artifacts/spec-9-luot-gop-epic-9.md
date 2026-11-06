---
title: 'Lượt gộp Epic 9: Banner khuyến mãi — Story 9.1–9.2'
type: 'feature'
created: '2026-11-06'
status: 'review'
review_loop_iteration: 0
baseline_revision: 'df39aabb459b2d6e5160d84047f53ca63a46a6ec'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-9-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-8-luot-gop-epic-8.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/nen-tang-ky-thuat/nextjs-16.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Vinh chưa đặt được Banner khuyến mãi theo dịp (11.11); Trang chủ chưa có khu Banner. Epic 9 gồm Story 9.1–9.2 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai 9.1 → 9.2, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). Module mới `banners` (T2) chủ bảng `Banner` (AD-4); trạng thái lịch tính bằng một hàm thuần duy nhất `bannerStatus` cho site và CMS; query public lấy "now" bên trong hàm `"use cache"` với `cacheLife("minutes")` (revalidate 60 giây — AD-7); link Shopee qua `AffiliateLink` của `products` (AD-11, FR-25); ảnh qua `UploadField` (AD-24).

## Boundaries & Constraints

**Always:** Spine AD-2 (tầng: `banners` T2 chỉ import `products/components`), AD-4, AD-5, AD-6 (`run()` → `safeParse` → `service` → `updateTag(banners)`), AD-7 (một hàm trạng thái lịch; "now" trong hàm cache; revalidate ≤ 60 giây; không lọc lịch phía client; trang `/` giữ tĩnh), AD-8 (client chỉ nhận chuỗi/kiểu serialize được), AD-11, AD-14 (`@db.VarChar` = hằng số `constants.ts`), AD-15 (một migration, CHECK viết tay có comment), AD-24, AD-27 (giờ Việt Nam qua `platform/format.ts`); mọi action/query mới có test DB, mọi hàm thuần có test đơn vị.

**Never:** Không tự chạy Banner (không autoplay); không chừa chỗ khi 0 Banner; không link ngoài khác Shopee; không đếm click; không thêm thư viện npm (không thư viện carousel, không thư viện ngày giờ); không sửa PRD/spine/`AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tạo Banner | `/cms/banner/moi`: ảnh, tiêu đề, mô tả, link, bật, lịch | lưu, đứng cuối danh sách, chuyển sang màn sửa, `updateTag(banners)` | lỗi validate tại trường; lỗi server → Toast |
| Ảnh | UploadField | xem trước khung 2:1; dưới trường "Tỉ lệ khuyến nghị 2:1 (vd 1200 × 600 px)" | sai loại/quá cỡ/host không cho phép → lỗi tại trường |
| Link đích | `https://s.shopee.vn/…` / `/bio` | Shopee → `AffiliateLink` tab mới; đường dẫn trong site → link thường cùng tab | `https://lazada.vn/…`, `shopee.vn.evil.com`, `http://shopee.vn`, `//evil.com`, `/\evil.com` → lỗi tại trường |
| Lịch | ô datetime-local giờ Việt Nam | `2026-11-11T00:00` lưu `2026-11-10T17:00Z`; để trống = không giới hạn phía đó | kết thúc ≤ bắt đầu → "Giờ kết thúc phải sau giờ bắt đầu" (Zod + CHECK DB); ngày không có → "Ngày giờ không hợp lệ" |
| Trạng thái | `enabled`, lịch, thời điểm | Tắt (tắt thắng lịch) / Chờ lịch (trước `startsAt`) / Hết hạn (từ `endsAt`) / Đang hiện; cùng hàm ở CMS và site | — |
| Thứ tự | lên/xuống ở `/cms/banner` | đổi chỗ ngay (optimistic), đánh số lại 0..n-1, Toast "Đã lưu thứ tự", vùng live báo vị trí | đầu/cuối: nút tắt |
| Xoá | "Xoá" → ConfirmDialog | xoá cứng, Toast "Đã xoá Banner" | đã bị xoá → coi như xong |
| Chưa đăng nhập | gọi action thẳng | bị từ chối, không ghi | — |
| Trang chủ 0 Banner | không Banner "Đang hiện" | không render khu, không chừa chỗ; Bài nổi bật đầu trang (ảnh `preload`) | — |
| Trang chủ 1 Banner | một Banner đang hiện | một thẻ: ảnh 2:1 trên (mobile) / trái (từ md), nhãn "Khuyến mãi", tiêu đề, mô tả, CTA pill "Xem trên Shopee" / "Xem ngay" | ảnh lỗi → ImageFallback, thẻ vẫn bấm được |
| Trang chủ ≥ 2 Banner | nhiều Banner đang hiện | dải cuộn ngang snap, mép thẻ sau lộ ra trên mobile, chấm vị trí (nút 44px, chạm → cuộn tới), không tự chạy; cuộn mượt tắt khi reduced-motion | — |
| Hết lịch | qua `endsAt` | Banner biến khỏi Trang chủ ≤ ~1 phút, không deploy lại (revalidate 60 giây, `/` revalidate 1m) | — |
| Sửa trong CMS | lưu/xoá/đổi thứ tự | Trang chủ đổi ngay nhờ `updateTag(banners)` | — |

</intent-contract>

## Code Map

- **9.1 Quản lý Banner:**
  - `prisma/schema/banners.prisma` `Banner` + migration `20261106160000_add_banner` (bảng + CHECK `Banner_schedule_check`).
  - `platform/format.ts` (+ test): `formatDateTime`, `toVietnamDateTimeInput`, `parseVietnamDateTime` (ô datetime-local luôn là giờ Việt Nam UTC+7, không phụ thuộc múi giờ máy).
  - `modules/banners/{constants,tags,status,link,schema,service,actions,queries,cms-queries,types}.ts`; test `status.test.ts`, `link.test.ts`, `schema.test.ts`, `actions.db.test.ts`, `queries.db.test.ts`.
  - `modules/banners/components/{banner-form.client.tsx, banner-status-badge.tsx}`.
  - `app/cms/banner/{page.tsx, moi/page.tsx, [id]/page.tsx}`, `_components/{banner-list-screen, banner-list.client, banner-list-skeleton, banner-create-screen, banner-edit-screen, banner-form-skeleton, banner-screen-header}.tsx`.
  - `app/cms/_components/cms-shell.client.tsx`: mục "Banner" giữa "Danh mục" và "Trang bio".
  - `vitest.db.helpers.ts`: `resetTestDb` xoá cả bảng `Banner`.
- **9.2 Banner trên Trang chủ:** `modules/banners/components/{banner-card.tsx, banner-strip.client.tsx, banner-section.tsx}`; `app/(site)/_components/home-screen.tsx` (khu Banner đầu trang; ảnh Bài nổi bật chỉ `preload` khi không có Banner).
- Docs: `docs/kien-truc-codebase.md`.

```text
Action: saveBanner / moveBanner / deleteBanner
- Module chủ: banners               - File: modules/banners/actions.ts
- Loại: CMS
- Input: bannerInputSchema { id?, title: requiredText(80), description: optionalText ≤ 160, image: URL ảnh cho phép,
         linkUrl: Shopee chính chủ | "/…" ≤ 500, enabled: boolean, startsAt/endsAt: "" | "YYYY-MM-DDTHH:mm" giờ VN }
         / moveBannerInputSchema { id, direction: up|down } / deleteBannerInputSchema { id }
- Output: Result<{ id }> / Result / Result
- Quyền: run() → requireAdmin()
- Service: saveBannerRecord / moveBannerRecord / deleteBannerRecord   - Bảng ghi: Banner — chủ là banners
- updateTag: BANNERS_TAG
- UserError: lỗi validate (tiếng Việt), "Không tìm thấy Banner. Có thể đã bị xoá."
- Gọi từ: modules/banners/components/banner-form.client.tsx, app/cms/banner/_components/banner-list.client.tsx
```

```text
Query: getLiveBanners() (queries.ts, public)
- Module: banners                    - Trả về: LiveBanner[] { id, title, description, image, linkUrl } (rỗng khi không có)
- Cache: "use cache" + cacheLife("minutes") (stale 5', revalidate 60", expire 1h) + cacheTag(banners); now = new Date() trong hàm
- Lọc: enabled + bannerStatus(b, now) === "LIVE"; thứ tự bannerOrderBy (sortOrder, createdAt, id)
- Gọi từ: app/(site)/_components/home-screen.tsx

Query: listBannersForCms(), getBannerForCms(id) (cms-queries.ts)
- Module: banners                    - Trả về: kèm status (bannerStatus lúc request); getBannerForCms null khi không có
- Gọi từ: banner-list-screen.tsx, banner-edit-screen.tsx (sau connection())
```

**Bảng phân tích ảnh hưởng schema (doi-schema.md Bước 2):**

| Hạng mục | File / ký hiệu bị ảnh hưởng | Việc phải làm |
|---|---|---|
| Query public | `banners/queries.ts` `getLiveBanners` (mới) | đã thêm, tag `banners` |
| Query CMS | `banners/cms-queries.ts` (mới) | đã thêm |
| Kiểu | `banners/types.ts` `LiveBanner`, `CmsBannerListItem` | suy từ query |
| Validate + form | `banners/schema.ts`, `constants.ts` (= `@db.VarChar`), `BannerForm` dùng cùng schema | đã thêm |
| Ghi | `banners/service.ts`, `actions.ts` | đã thêm |
| Cache tag | `banners/tags.ts` `BANNERS_TAG` | mọi action `updateTag` |
| Module khác đọc qua AD-2 | không có (Trang chủ đọc qua `queries.ts`) | — |
| Seed | không có (0 Banner là trạng thái hợp lệ) | — |
| Test | `modules/banners/*.test.ts`, `*.db.test.ts`; `vitest.db.helpers.ts` TRUNCATE `Banner` | đã thêm |
| Code cũ | không có | — |

Phân loại: **an toàn** (thêm bảng). Production: Vinh chạy `npx prisma migrate deploy`.

## Tasks & Acceptance

**Execution:**
- [x] 9.1 bảng `Banner` + migration (CHECK lịch), `bannerStatus`, `bannerLinkKind`, schema/service/actions, `/cms/banner` (danh sách, tạo, sửa, lên/xuống, xoá), StatusBadge, UploadField tỉ lệ 2:1, mục CmsShell "Banner"
- [x] 9.2 `getLiveBanners` (now trong hàm cache, revalidate 60 giây), `BannerCard` / `BannerStrip` / `BannerSection`, khu Banner đầu Trang chủ
- [x] Test cho mọi action/query/hàm thuần mới; docs
- [x] Kiểm tay (`next start -p 3300`): xem mục Auto Run Result

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy.
- Given `npm run build`, when xem bảng route, then `/` tĩnh (`○`) với revalidate 1m; `/cms/banner` có trong bảng.
- Given Trang chủ và `/cms/banner` ở 360px và 1280px, then đúng AC Story 9.1–9.2 trong `epics.md`.

## Spec Change Log

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Ảnh Banner bắt buộc; tỉ lệ khuyến nghị 2:1 (1200 × 600 px).** Lý do: UX-DR15 "ảnh trái/trên" và CMS phải hiện tỉ lệ khuyến nghị nhưng spec không nêu số; 2:1 vừa thẻ ngang trên điện thoại 360px (ảnh ~328 × 164) và cột trái 40% trên desktop. Ảnh khác tỉ lệ bị cắt giữa (`object-cover`).
2. **Link đích chỉ nhận link Shopee chính chủ (https `shopee.vn`, `s.shopee.vn`, `shope.ee` — cùng luật `shopeeAffiliateUrl`) hoặc đường dẫn trong site bắt đầu bằng `/`.** Không nhận link ngoài khác. Lý do: UX-DR15 chỉ định hai loại đích; FR-25 cấm đi vòng.
3. **Lịch nhập bằng ô `datetime-local`, luôn hiểu là giờ Việt Nam** (không theo múi giờ máy mở CMS), khung `[bắt đầu, kết thúc)`: đúng giờ kết thúc là Hết hạn. Hai mốc đều tuỳ chọn. Tắt thắng lịch. Kết thúc phải sau bắt đầu (Zod + CHECK DB).
4. **Thứ tự bằng lên/xuống trong danh sách** (UX-DR85, như Danh mục), không có ô số "thứ tự" trong form; Banner mới đứng cuối.
5. **Xoá cứng Banner** (ConfirmDialog, gợi ý tắt nếu chỉ muốn ẩn) — Banner không được bảng nào tham chiếu. Bật/tắt nằm trong form (Switch "Bật Banner"), không có nút bật/tắt một chạm ở danh sách.
6. **`getLiveBanners` dùng `cacheLife("minutes")`** (stale 5 phút, revalidate 60 giây, expire 1 giờ) → `/` revalidate 1m. Do cơ chế stale-while-revalidate, request đầu sau mốc 60 giây vẫn nhận bản cũ và kích tạo lại; Banner hết lịch biến khỏi site trong khoảng 1–2 phút tuỳ lượt truy cập; trình duyệt đang mở trang có thể giữ bản cũ tới 5 phút (stale của router client). Không dùng hồ sơ ngắn hơn vì `expire` < 5 phút hoặc `stale` < 30 giây làm `/` không còn tĩnh. Sửa trong CMS thì `updateTag(banners)` đổi ngay.
7. **Lọc lịch ở JavaScript bằng `bannerStatus`** sau khi đọc các Banner đang bật (bảng rất ít dòng), để site và CMS chắc chắn dùng cùng một hàm (AD-7), thay vì viết lại điều kiện lịch trong `where`.
8. **Thẻ Banner:** nhãn nhỏ cố định "Khuyến mãi" (`tertiary-fixed`), CTA pill "Xem trên Shopee" (+ icon tab mới, chữ ẩn ", mở Shopee trong tab mới") cho đích Shopee, "Xem ngay" (+ mũi tên) cho đích trong site. Không thêm trường "nhãn" vào form (FR-32 không có). Không đặt thêm AffiliateDisclosure riêng cho Banner: footer mọi trang đã có câu công khai, và Bài nổi bật/Gom link có nhãn riêng.
9. **Dải ≥ 2 Banner:** thẻ rộng 88% trên mobile (lộ mép thẻ sau), 100% từ desktop; chấm vị trí là nút 44px (`aria-label` "Banner i/n: tiêu đề", `aria-current`), chạm thì cuộn tới (mượt, tắt khi reduced-motion); chấm theo thẻ đang thấy ≥ 60% (IntersectionObserver). Không tự chạy.
10. **Ảnh Banner đầu tiên `preload`** (là ảnh lớn đầu Trang chủ); khi có Banner, ảnh Bài nổi bật không `preload` nữa.
11. **Migration tên `20261106160000_add_banner`** (đổi tên thư mục do Prisma sinh `…065000` để xếp sau các migration đặt tay trước đó).

### Auto Run Result (mốc trước review gộp)

- `npm test` 367/367 (43 file); `npm run test:db` 220/220 (26 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch (`/` `○` revalidate 1m expire 1h; `/cms/banner`, `/cms/banner/moi`, `/cms/banner/[id]` có trong bảng route).
- `npx prisma migrate dev` áp `20261106160000_add_banner` vào DB cục bộ (cổng 54329); DB test tự áp khi chạy `test:db`.
- `next start` cổng 3300: chèn thẳng vào DB cục bộ 2 Banner thử (một trỏ `https://s.shopee.vn/…` hết lịch sau 100 giây, một trỏ `/bio` không lịch; ảnh không tồn tại) — **không** gọi `updateTag`. Trang chủ hiện cả hai sau ~63 giây (revalidate 60 giây), dải có 2 chấm, thẻ Shopee là `<a target="_blank" rel="sponsored nofollow noopener">` với CTA "Xem trên Shopee", thẻ `/bio` là link thường "Xem ngay"; ảnh lỗi → ImageFallback. Banner Shopee biến khỏi Trang chủ 38 giây sau giờ kết thúc, không deploy lại. Ảnh chụp Chrome headless 360px và 1280px: không cuộn ngang trang, mép thẻ thứ hai lộ ra ở 360px, ảnh trái 40% ở 1280px. `/cms/banner` không đăng nhập 401, có Basic Auth 200 (2 "Đang hiện", "Đến 14:00 06/11/2026", "Không giới hạn thời gian"); `/cms/banner/moi`, `/cms/banner/[id]` 200; id không có → màn "Không tìm thấy" của CMS. Dữ liệu thử đã xoá (trước đó bảng rỗng); server 3300 đã tắt; không đụng cổng 3100/3200.
- Không gọi `claude -p` thật (epic không có tính năng AI).
- Cần Vinh: xem Quyết định tự chọn (nhất là 1, 2, 5, 6, 8); thử trên điện thoại thật: tải ảnh Banner từ máy, vuốt dải, chạm Banner Shopee; chạy `npx prisma migrate deploy` khi triển khai.

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Kết quả (mốc trước review gộp, 2026-11-06):** `npm test` 367/367; `npm run test:db` 220/220; tsc, lint, build sạch.

**Manual checks (if no CLI):**
- `npm start` cổng 3300+ (không dùng 3100, 3200), điện thoại thật: tạo Banner với ảnh chụp từ máy, đặt lịch vài phút tới, xem Trang chủ hiện/ẩn đúng giờ; vuốt dải 2 Banner, chạm chấm; bấm Banner Shopee mở app/tab Shopee.
