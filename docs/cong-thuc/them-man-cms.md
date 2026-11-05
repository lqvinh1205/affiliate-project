# Công thức: thêm màn hình CMS

> Ghép từ các tài liệu nền tảng · Kiểm lần cuối: 2026-11-03 @ dfd7e8f

> **Vị trí file theo code cũ.** Màn hình mới làm theo `docs/cong-thuc/them-man-hinh.md` (theo spine kiến trúc); công thức này được viết lại ở epic nền (AD-17 bước 4).

Dùng khi thêm một màn quản lý trong `app/cms/` (ví dụ Kho sản phẩm, Danh mục, Banner, Trang bio, Hồ sơ phong cách).

## Đọc trước

`[NX-23]`, `[NX-33]` (dữ liệu CMS), `[GD-11]`, `[GD-17]` (màn form mobile-first), `[BM-17]`, `[BM-18]`, `[QU-13]`.

## Các bước

1. **Route.** Trang trong `app/cms/...`; `proxy.ts` đã chặn bằng Basic Auth (`[NX-25]`, `[BM-10]`). Dữ liệu CMS không cache, đọc trong `<Suspense>` (`[NX-23]`).
2. **Schema.** Nếu cần bảng mới: `docs/cong-thuc/doi-schema.md`.
3. **Validate.** Schema Zod 4 trong `lib/` (`[BM-02]`, `[BM-05]`); chuỗi rỗng → `null` (`[QU-12]`); thông báo lỗi tiếng Việt (`[QU-14]`).
4. **Server Action.** Theo `docs/cong-thuc/them-server-action.md`.
5. **Giao diện.** Form mobile-first: component trong `components/cms/` (`[QU-01]`), trường dùng `components/cms/fields.tsx`, `useTransition` + `Result` + toast (`[GD-12]`), touch target đủ lớn (`[GD-14]`), thêm mục vào `components/cms/bottom-nav.tsx` nếu là màn chính.
6. **Nội dung AI** (nếu màn có AI): `docs/cong-thuc/them-tinh-nang-ai.md`; kết quả ở trạng thái *chờ duyệt* (`[QD-08]`).

## Kiểm chứng

`docs/kiem-chung.md`; gọi action khi chưa đăng nhập phải bị từ chối; dữ liệu sai trả lỗi tiếng Việt; dùng được ở 360px (`[GD-40]`).
