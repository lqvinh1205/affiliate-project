# Epic 9 Context: Banner khuyến mãi (giai đoạn 1.5)

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Vinh tạo Banner (ảnh, tiêu đề, mô tả ngắn, link đích, thứ tự, bật/tắt, lịch hiển thị tuỳ chọn — vd dịp 11.11) ở `/cms/banner`; Trang chủ chỉ hiện Banner đang bật và đang trong lịch, ở đầu trang, tự biến mất khi hết lịch mà không phải tắt tay hay deploy lại. Cần Epic 2 (`AffiliateLink`, `UploadField`, backend lưu file — Story 2.8 đã xong) và Epic 3 (Trang chủ tĩnh).

## Stories

- Story 9.1: Quản lý Banner có lịch trong CMS
- Story 9.2: Banner trên Trang chủ

## Requirements & Constraints

- **FR-32** Banner: ảnh, tiêu đề, mô tả ngắn, link đích, thứ tự; bật/tắt; thời gian hiển thị tuỳ chọn; website chỉ hiện Banner đang bật và trong thời gian hiển thị; không vỡ ở 360px; CMS hiện tỉ lệ ảnh khuyến nghị; link đích sang Shopee tuân FR-25.
- **FR-25** link Shopee: nguyên link Shopee chính chủ (không qua `/go`), `rel="sponsored nofollow"`, tab mới — đi qua `AffiliateLink` của `products`.
- **NFR-5** Banner không làm chậm nội dung chính; thay đổi lên site trong khoảng 1 phút, không deploy lại.
- **NFR-11** theo design system, đúng cả sáng/tối.
- Không thêm thư viện npm.

## Technical Decisions

- **Module `banners` (T2, AD-2):** chủ bảng `Banner` (AD-4, đứng riêng trong ERD); được import `products/components/affiliate-link` (T1). Bảng mới ở `prisma/schema/banners.prisma`, một migration `add_banner` (AD-15).
- **Đường ghi (AD-6):** `saveBanner`, `moveBanner`, `deleteBanner` trong `modules/banners/actions.ts`: `run()` → `safeParse` → `service` → `updateTag(BANNERS_TAG)`.
- **Trạng thái lịch (AD-7):** một hàm thuần `bannerStatus(banner, now)` trong `modules/banners/status.ts` trả `OFF | SCHEDULED | EXPIRED | LIVE`, dùng cho cả query public và CMS. Mốc lịch lưu `DateTime` (thời điểm tuyệt đối); ô nhập trong CMS là giờ Việt Nam (`Asia/Ho_Chi_Minh`, AD-27) — đổi qua `platform/format.ts`.
- **Query public (AD-7):** `getLiveBanners()` trong `modules/banners/queries.ts`: `"use cache"` + `cacheLife("minutes")` (revalidate 60 giây) + `cacheTag(banners)`; lấy "now" **bên trong** hàm, không nhận làm tham số; không lọc lịch phía client.
- **Upload (AD-24):** ảnh qua `UploadField` (route `/cms/upload`), xem trước đúng tỉ lệ khuyến nghị.
- **Component (AD-11):** form, StatusBadge, khu Banner công khai ở `modules/banners/components/`; màn CMS ở `app/cms/banner/_components/`.

## UX & Interaction Patterns

- **UX-DR15 Banner:** token `banner` (`surface-container-low`, `rounded-xl`), ảnh trên (mobile) / trái (desktop), tiêu đề `body-sm` đậm 500, mô tả, CTA pill `primary` chỉ là hình, nhãn nhỏ `tertiary-fixed`. 0 banner không render, không chừa chỗ; ≥ 2 là dải cuộn ngang snap có chấm vị trí, **không tự chạy**; cả Banner là một link (Shopee = AffiliateLink, nội bộ = link thường cùng tab); không vỡ ở 360px; ảnh lỗi → ImageFallback.
- **UX-DR62 Trang chủ:** Banner là khu đầu tiên; 0 Banner → Bài nổi bật lên đầu.
- **UX-DR79 `/cms/banner`:** CRUD, bật/tắt, lịch, UploadField có tỉ lệ ảnh khuyến nghị; StatusBadge Tắt / Chờ lịch / Hết hạn / Đang hiện; chỉ "Đang hiện" lên site.
- **UX-DR40 StatusBadge:** Tắt, Hết hạn trung tính; Chờ lịch `tertiary-fixed`; Đang hiện `secondary-container`.
- **UX-DR38 CmsShell:** thêm mục "Banner" giữa "Danh mục" và "Trang bio".
- **UX-DR85:** CMS sắp thứ tự bằng lên/xuống, không kéo-thả; cuộn ngang có chủ đích được phép ở dải Banner.
- **UX-DR90/91/92:** Banner trỏ Shopee là một `<a>` duy nhất, ảnh `alt=""`, nhãn ẩn "mở Shopee trong tab mới"; tôn trọng reduced-motion; vùng bấm ≥ 44px.

## Cross-Story Dependencies

- 9.2 đọc bảng và hàm `bannerStatus` của 9.1.
- 9.2 chạm `app/(site)/_components/home-screen.tsx` (Epic 3, 6, 8).
