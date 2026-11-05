# Công thức: thêm màn hình CMS

> Ghép từ các tài liệu nền tảng và spine kiến trúc (AD-5, AD-6, AD-11, AD-12) · Kiểm lần cuối: 2026-11-05 @ 8771851

> Các bước chi tiết (kiểm UI, tái sử dụng, vị trí file, checklist review) ở `docs/cong-thuc/them-man-hinh.md`; công thức này là bản tóm tắt cho màn CMS.

Dùng khi thêm một màn quản lý trong `app/cms/` (ví dụ Kho sản phẩm, Danh mục, Banner, Trang bio, Hồ sơ phong cách).

## Đọc trước

`[NX-23]`, `[NX-33]` (dữ liệu CMS), `[GD-11]`, `[GD-17]` (màn form mobile-first), `[BM-17]`, `[BM-18]`, `[QU-13]`.

## Các bước

1. **Route.** Trang mỏng trong `app/cms/<đường dẫn tiếng Việt>/` theo cây Structural Seed của spine (`san-pham`, `danh-muc`, `banner`…); `proxy.ts` đã chặn bằng Basic Auth (`[NX-25]`, `[BM-10]`). Dữ liệu CMS không cache, đọc qua `modules/<miền>/cms-queries.ts` trong `<Suspense>` (`[NX-23]`, `[NX-33]`); `app/` không import `@/platform/db`.
2. **Schema.** Nếu cần bảng mới: `docs/cong-thuc/doi-schema.md`.
3. **Validate.** Schema Zod 4 trong `modules/<miền>/schema.ts`, ghép từ `platform/validation/fields.ts` (`[BM-02]`, `[BM-05]`); chuỗi rỗng → `null` (`[QU-12]`); thông báo lỗi tiếng Việt (`[QU-14]`).
4. **Server Action.** Theo `docs/cong-thuc/them-server-action.md`.
5. **Giao diện.** Form mobile-first: `modules/<miền>/components/<x>-form.client.tsx`; phần chỉ CMS dùng ở `app/cms/_components/` (`[QU-01]`, spine AD-11). form dùng React Hook Form + `zodResolver` với **cùng** `schema.ts` của module, ghép bằng shadcn `field` + `Controller`; lỗi validate hiện tại trường, `UserError` từ server hiện bằng toast; `useTransition` + `Result` chỉ cho form một trường (spine AD-14, `[GD-12]`), touch target đủ lớn (`[GD-14]`). Dùng lại component dựng ở Story 2.2 thay vì tự viết: `CmsForm` (`components/shared/cms-form.client.tsx`: bọc RHF, gửi giá trị form cho action, `Result` lỗi và lỗi mạng → toast, nút Lưu dính đáy mobile + spinner, có sẵn `UnsavedChangesGuard`), `ConfirmDialog` (`components/shared/confirm-dialog.client.tsx`: mọi thao tác xoá, focus mặc định "Huỷ"), `UnsavedChangesGuard` (`components/shared/unsaved-changes-guard.client.tsx`, cho màn có form không dùng `CmsForm`); mẫu đầy đủ: `modules/categories/components/category-form.client.tsx` và `app/cms/danh-muc/`. `components/cms/*` (gồm `fields.tsx`) là code cũ: dùng hay sửa thì chuyển theo `docs/cong-thuc/chuyen-code-cu.md` trong cùng thay đổi; màn danh sách mới thì thêm mục vào `NAV_ITEMS` của `CmsShell` (`app/cms/_components/cms-shell.client.tsx`) đúng thứ tự IA (`[GD-11]`).
6. **Nội dung AI** (nếu màn có AI): `docs/cong-thuc/them-tinh-nang-ai.md`; kết quả ở trạng thái *chờ duyệt* (`[QD-08]`).

## Kiểm chứng

`docs/kiem-chung.md`; gọi action khi chưa đăng nhập phải bị từ chối; dữ liệu sai trả lỗi tiếng Việt; dùng được ở 360px (`[GD-40]`).
