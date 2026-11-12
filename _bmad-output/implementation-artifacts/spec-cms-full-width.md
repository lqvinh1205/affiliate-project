---
title: 'CMS dùng hết chiều ngang: danh sách full, form giữ cột đọc được'
type: 'feature'
created: '2026-11-12'
status: 'done'
route: 'oneshot'
baseline_commit: '7087c9c46beb1c62e8c542d67a092b7a99d6ebc2'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `CmsShell` đặt `main.mx-auto.max-w-2xl` (672px) nên mọi màn CMS bị bó hẹp giữa màn hình desktop, kể cả danh sách/bảng.

**Approach:** Quyết định của Vinh (2026-11-12, chốt lại trong walkthrough): CMS dùng hết màn hình để tận dụng khoảng trống — khung bỏ giới hạn độ rộng (lề desktop `margin-desktop`); mọi màn (danh sách, form, Bộ nội dung) rộng hết vùng nội dung, không `max-w-*` ở gốc Screen/Skeleton. Mobile không đổi. Cập nhật `docs/nen-tang-ky-thuat/giao-dien.md` và EXPERIENCE.md (bỏ giả định Bộ nội dung ≤ 768px căn giữa).

</frozen-after-approval>

## Implementation Notes

- Baseline: working tree đã có thay đổi SEO chưa commit (spec-sua-loi-technical-seo-doi-ten-thuong-hieu); diff review của spec này chỉ gồm các file liệt kê dưới đây (`cms-shell.client.tsx` dòng `BRAND` thuộc thay đổi SEO).
- `CmsShell` `<main>`: bỏ `mx-auto w-full max-w-2xl`, thêm `lg:px-margin-desktop`. Thanh dính đáy có `-mx-margin` đều `lg:static lg:mx-0` nên không lệch.
- `max-w-4xl` đặt ở phần tử gốc của 8 Screen tạo/sửa (Fragment → `div`), Screen chi tiết Cảm hứng, Trang bio, Hồ sơ phong cách và 7 Skeleton tương ứng; `page.tsx` không đổi (AD-12). Bản đầu bọc `CmsFormColumn` ở `page.tsx` đã bỏ sau review.
- **Lệch Intent:** Bộ nội dung giữ `mx-auto max-w-3xl` (căn giữa) thay vì canh trái, vì EXPERIENCE.md:98 ghi "768px căn giữa" — tài liệu UX thắng; Vinh muốn canh trái thì cần cập nhật EXPERIENCE.md trước.
- Tablet 768–1023px: form trước ở cột 672px căn giữa, nay canh trái tới 896px.
- `docs/nen-tang-ky-thuat/giao-dien.md`: sơ đồ, mục Nội dung CMS, sửa mục thanh editor cũ (`components/cms/post-editor.tsx` → `post-body-editor.client.tsx`).
- Kiểm: `npx tsc --noEmit`, `npm run lint` sạch; `npm test` 433/433. Chưa xem bằng trình duyệt (cần Vinh: danh sách và form ở 360px, 1024px, 1920px).

- **Làm lại sau walkthrough (Vinh 2026-11-12):** bỏ cột form `max-w-4xl` và `mx-auto max-w-3xl` của Bộ nội dung; thanh nhảy mục Bộ nội dung thêm `lg:-mx-margin-desktop lg:px-margin-desktop` để tràn sát mép như mobile. EXPERIENCE.md dòng 98, 326, 458 ghi quyết định. Các dòng triage về cột form/Bộ nội dung dưới đây thuộc bản trước.

## Review Triage Log

| Nguồn | Phát hiện | Verdict | Xử lý |
|---|---|---|---|
| conventions | `CmsFormColumn` trong 11 `page.tsx` vi phạm AD-12 (route mỏng) | medium | patch: chuyển `max-w-4xl` vào gốc Screen/Skeleton, xoá component |
| conventions | Tên `CmsFormColumn` thiếu hậu tố vai trò | low | hết khi xoá component |
| conventions, blind | Bộ nội dung canh trái trái EXPERIENCE.md:98 "căn giữa" | medium | patch: giữ `mx-auto` |
| conventions, blind | Doc ghi sai nguồn / mô tả wrapper ở page.tsx | low | patch: viết lại mục Nội dung |
| blind | Thiếu lề desktop `margin-desktop` theo Intent | medium | patch: `lg:px-margin-desktop`; thanh đáy đã `lg:mx-0` |
| blind | Công thức them-man-hinh không nhắc wrapper | false | Hết wrapper, page.tsx vẫn mỏng như công thức |
| blind | Độ rộng đặt ở hai nơi | low | Hết: mọi màn đặt ở gốc Screen như Bộ nội dung |
| blind | Tablet đổi hành vi chưa ghi | low | Ghi vào Implementation Notes |
| blind | Mục thanh editor trong doc lỗi thời (`-mx-4`, file cũ) | low | patch: sửa theo `post-body-editor.client.tsx` |
| blind | Danh sách không giới hạn trên màn siêu rộng | false | Vinh chọn danh sách full width; reject |
| blind | not-found/error/styleguide giờ rộng hết | low | Màn ngắn, text-center; không ảnh hưởng dùng hằng ngày; reject |
| blind | Sơ đồ Mermaid thiếu cột form | low | patch |
| blind | `w-full` thừa trên `<main>` | low | patch: bỏ |
