---
title: 'Story 1.1: Kiểm chứng hành vi Next.js và khoá /cms đúng matcher (AD-17 bước 1)'
type: 'chore'
created: '2026-11-05'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/docs/no-ky-thuat.md'
  - '{project-root}/docs/kiem-chung.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spine dựa trên hai giả định chưa kiểm về Next.js 16: `updateTag` làm mới trang đã prerender (`[NO-23]`) và Server Action công khai gọi được từ trang `ensureStatic = "navigation"` (`[NO-24]`). Matcher `proxy.ts` hiện là `["/cms/:path*", "/api/:path*"]`, chưa đúng AD-24.

**Approach:** Trên `npm run build && npm start` (Postgres cục bộ 54329), kiểm `[NO-23]` bằng cách sửa một bài đã xuất bản và xem `/bai-viet/[slug]`, `sitemap.xml`; kiểm `[NO-24]` bằng một action công khai dựng tạm (không đọc/ghi dữ liệu thật), xoá sau khi ghi kết quả. Đổi matcher thành `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]`, `curl -I` kiểm `/cms`, `/cms/bai-viet`, `/cms.rsc` trả 401 kèm `WWW-Authenticate` khi không có header, `/cms` trả 200 khi có đúng thông tin; `/bai-viet/khong-ton-tai` trả 404. Ghi kết quả (đạt/không đạt + cách tái hiện) vào `docs/no-ky-thuat.md` mục `[NO-23]`, `[NO-24]`. Nếu `[NO-23]` hoặc `[NO-24]` không đạt: dừng, báo Vinh, đề xuất cập nhật spine trước Story 1.2. Kiểm 308 cho slug cũ thuộc Story 3.4, không làm ở đây.

</frozen-after-approval>

## Implementation Notes

- `proxy.ts`: matcher đổi thành `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]`. Không đụng `isAuthorized`/realm.
- Kết quả trên `npm run build && PORT=3100 npm start` (Next 16.4.3):
  - Không kèm auth: `/cms`, `/cms/new`, `/cms.rsc`, `/cms/bai-viet`, `/cms/posts/x`, `/api/x`, `/cms/uploads`, `/cms/upload/x` → 401 + `WWW-Authenticate: Basic realm="CMS"`. `/cms/upload` → 404 (lọt proxy đúng ý, route chưa có).
  - Kèm đúng auth: `/cms` → 200.
  - `/bai-viet/khong-ton-tai` → 404.
  - `[NO-23]` đạt: `setPostStatus` DRAFT → bài prerender 404 + rời sitemap sau ≤ 1 giây; PUBLISHED → 200 + có lại.
  - `[NO-24]` đạt: action công khai từ trang `ensureStatic` trả kết quả, trang vẫn `○` (`x-nextjs-cache: HIT`).
- Probe tạm `app/(site)/thu-no-24/` đã xoá; build lại để `.next/types` hết trỏ tới file đã xoá (nếu không `tsc` báo lỗi TS2307).
- Ghi kết quả vào `docs/no-ky-thuat.md` (mục đổi tên "Đã xác minh — kết quả chạy thử"). Không cần dừng epic.
- Bỏ bước commit của workflow: AGENTS.md cấm `git commit`.
- Kiểm chứng: `npx tsc --noEmit` sạch, `npm run lint` sạch, `npm run build` sạch.

- Sau review: chạy thêm `savePost` đổi tiêu đề → trang prerender hiện tiêu đề mới sau ≤ 1 giây ([NO-23] đạt trọn với sửa nội dung). Biên: `/cms/upload/` → 308 về `/cms/upload`, `/cms/upload.rsc` → 401, `/api` → 401. Sửa docs còn ghi matcher cũ (`kien-truc-codebase.md`, `kiem-tra-va-bao-mat.md`, `nextjs-16.md`, `giao-dien.md`) và thêm comment AD-24 cạnh matcher trong `proxy.ts`.

## Review Triage Log

- Docs còn ghi matcher cũ (cả hai reviewer) — medium, patch: docs mô tả bảo vệ CMS sai ngay khi thay đổi vào; đã sửa 4 file.
- `/cms/upload` ngoài proxy không được ghi ở đâu — medium, patch: thêm comment AD-24 trong `proxy.ts` và ngoại lệ trong checklist `kien-truc-codebase.md`.
- [NO-23] chỉ thử đổi trạng thái, chưa thử sửa nội dung — medium, patch: đã thử `savePost`, đạt.
- Thiếu thử `/cms/upload/`, `/cms/upload.rsc`, `/api` — low, patch: đã thử, kết quả ở Implementation Notes.
- Cách tái hiện [NO-23] sửa dữ liệu thật mà không cảnh báo — low, patch: thêm lưu ý trong `docs/no-ky-thuat.md`.
- [NO-24] thiếu mã probe để tái hiện — low, reject: mô tả 3 file trong [NO-24] đủ để dựng lại; lưu mã tạm vào docs là thừa.
- Chưa kiểm trang tĩnh còn `HIT` sau khi action chạy — maybe-false, reject: action không gọi `updateTag`/`refresh` nên không có đường làm mất cache; nếu cần thì đo lại khi làm [NX-35] ở Story 7.1.
- Thiếu transcript `curl` — low, reject: kết quả đã ghi theo từng đường dẫn; dán log thô không thêm giá trị.
- Trạng thái spec/sprint còn `in-progress` — false: workflow cập nhật ở bước hoàn tất (đã làm).
- `nextjs-16.md` chưa ghi đã xác minh — low, reject: kết quả nằm ở [NO-23]/[NO-24]; Story 1.5 cập nhật docs toàn bộ.
- Đổi tên mục trong `no-ky-thuat.md` làm file thành nhật ký — low, reject: AC story yêu cầu ghi kết quả vào chính mục [NO-23]/[NO-24].
- [NO-14] (`/api` trong matcher không có `app/api`) không nhắc tới — false với thay đổi này: nợ cũ, không do story gây ra; matcher giữ `/api` theo AD-24.
