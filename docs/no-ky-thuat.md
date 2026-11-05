# Nợ kỹ thuật và điểm lệch đã biết

> Nguồn: rà soát code khi viết bộ tài liệu `docs/` · Kiểm lần cuối: 2026-11-03 @ dfd7e8f

Danh sách những chỗ code đang lệch với quy định, PRD hoặc chính nó. **Chưa sửa.** Workflow chạm vào vùng nào thì kiểm mục tương ứng ở đây; sửa xong thì xoá mục và cập nhật tài liệu liên quan. ID dạng `[NO-xx]`, không đánh số lại.

## Cao — bảo mật và tuân thủ

Không còn mục mở. [NO-01]–[NO-05] đã sửa ở Story 1.2, có unit test trong `platform/`; [NO-06] đã sửa ở Story 1.2, test thêm khi action chuyển sang `modules/`.

## Vừa — hành vi sai hoặc dễ gây lỗi

- **[NO-07]** `savePost` tính lại slug mỗi lần lưu; đổi slug bài đã xuất bản làm hỏng URL cũ, không có chuyển hướng 301 (PRD FR-27).
- **[NO-08]** `prisma/seed.ts` chạy `deleteMany()` toàn bộ bài trước khi seed — phá huỷ dữ liệu. Xem `[PR-14]`.
- **[NO-09]** Sản phẩm bị xoá và tạo lại (đổi id) mỗi lần lưu bài. Xem `[PR-26]`.
- **[NO-10]** `toThreads` (`lib/ai.ts`) đặt link website ở bài cuối chuỗi, trái PRD FR-14 (link affiliate nằm ở Bình luận kèm link).
- **[NO-12]** Giới hạn tóm tắt không khớp: editor và prompt AI dùng 200, Zod và DB cho 500 (`components/cms/post-editor.tsx`, `lib/post-input.ts`, `prisma/schema.prisma`).
- **[NO-13]** `next/image` còn dùng `priority` (đã deprecate ở Next 16) — `app/(site)/page.tsx`, `app/(site)/bai-viet/[slug]/page.tsx`. Xem `[GD-30]`.
- **[NO-14]** `proxy.ts` matcher chặn `/api/:path*` nhưng không có `app/api`; endpoint công khai tương lai không đặt được ở `/api`. Xem `[NX-57]`.

## Thấp — nhất quán và dọn dẹp

- **[NO-16]** Comment `lib/posts.ts:6` ghi `revalidateTag`, code dùng `updateTag`. Xem `[NX-50]`.
- **[NO-17]** Kiểu `ProductInput` khai báo hai lần, hai hình dạng khác nhau (`lib/ai.ts`, `lib/post-input.ts`).
- **[NO-18]** Kiểu `PostCard` trong `lib/posts.ts` không được dùng, trùng tên component; hình dạng bị chép tay thành `PostCardData`.
- **[NO-19]** Literal `"DRAFT" | "PUBLISHED"` và `["MEO_VAT","GOM_LINK"]` gõ lại ở nhiều file thay vì suy ra từ enum Prisma hoặc `CategoryKey` (`[KT-08]`, `[PR-27]`).
- **[NO-20]** UI gọi enum Category là "Chuyên mục", trong khi PRD gọi là **Loại bài**; **Danh mục** là khái niệm khác, chưa có trong code.
- **[NO-21]** `README.md` ở gốc repo vẫn là mẫu create-next-app.
- **[NO-22]** Kiểu import `cn` lẫn lộn: `components/ui/*` import từ gói `cn`, phần còn lại từ `@/components/ui/lib/utils` (cả hai cùng một hàm). Xem `[GD-05]`.

## Đã xác minh — kết quả chạy thử

- **[NO-23]** **Đạt** (2026-11-05, Story 1.1, Next.js 16.4.3). `updateTag(POSTS_TAG)` trong Server Action làm mới cả trang đã prerender lẫn `sitemap.xml`, không cần build lại. Cách tái hiện: `npm run build && PORT=3100 npm start`; gọi action `setPostStatus(id, "DRAFT")` (POST tới `/cms` kèm Basic Auth, header `Next-Action: <id trong .next/server/server-reference-manifest.json>`, body JSON `["<id>","DRAFT"]`) → sau ≤ 1 giây `/bai-viet/<slug>` (vốn prerender `○`) trả 404 và slug biến khỏi `sitemap.xml`; gọi lại với `"PUBLISHED"` → 200 và có lại trong sitemap. Sửa nội dung: gọi `savePost` đổi tiêu đề → tiêu đề mới hiện trên `/bai-viet/<slug>` sau ≤ 1 giây, khôi phục lại cũng vậy. Lưu ý: cách thử này sửa dữ liệu thật trong DB cục bộ (`savePost` tạo lại Sản phẩm của bài nên id Sản phẩm đổi); dùng bài thử hoặc chạy lại seed.
- **[NO-24]** **Đạt** (2026-11-05, Story 1.1). Server Action công khai (không `requireAdmin`) import từ Client Component trên trang `(site)` có `ensureStatic = "navigation"`: build không lỗi, trang vẫn prerender tĩnh (`○`, `x-nextjs-cache: HIT`), POST tới action trả kết quả đúng (`{"ok":true,"n":42}`). Cách tái hiện: dựng tạm `app/(site)/thu-no-24/` (page + client button + `actions.ts` `"use server"`), `npm run build`, gọi action như [NO-23] nhưng không kèm auth; đã xoá thư mục tạm sau khi kiểm.
