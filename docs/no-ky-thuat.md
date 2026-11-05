# Nợ kỹ thuật và điểm lệch đã biết

> Nguồn: rà soát code khi viết bộ tài liệu `docs/` · Kiểm lần cuối: 2026-11-05 @ 8771851

Danh sách những chỗ code đang lệch với quy định, PRD hoặc chính nó. **Chưa sửa.** Workflow chạm vào vùng nào thì kiểm mục tương ứng ở đây; sửa xong thì xoá mục và cập nhật tài liệu liên quan. ID dạng `[NO-xx]`, không đánh số lại.

## Cao — bảo mật và tuân thủ

Không còn mục mở. [NO-01]–[NO-05] đã sửa ở Story 1.2, có unit test trong `platform/`; [NO-06] đã sửa ở Story 1.2, test thêm khi action chuyển sang `modules/`.

## Vừa — hành vi sai hoặc dễ gây lỗi

[NO-09] (Sản phẩm bị xoá và tạo lại mỗi lần lưu bài) đã sửa ở Story 2.3: Kho Sản phẩm độc lập, trình soạn bài không ghi `Product`/`PostProduct`.

- **[NO-08]** `prisma/seed.ts` chạy `deleteMany()` toàn bộ bài trước khi seed — phá huỷ dữ liệu. Xem `[PR-14]`.
- **[NO-10]** `toThreads` (`lib/ai.ts`) đặt link website ở bài cuối chuỗi, trái PRD FR-14 (link affiliate nằm ở Bình luận kèm link).
- **[NO-14]** (đã bỏ) Không còn là nợ: spine AD-6 quy định không có endpoint công khai dưới `/api`, nên matcher chặn `/api/:path*` là đúng. Xem `[NX-57]`.

## Thấp — nhất quán và dọn dẹp

Đã sửa ở lượt gộp Epic 3: [NO-07] (slug bài, chuyển hướng) — `PostSlugRedirect` + `loadPost`; [NO-12] (tóm tắt 200 vs 500) — `POST_EXCERPT_MAX` = 500 = `@db.VarChar(500)`; prompt AI 200 là mục tiêu mềm; [NO-13] (`priority`) — dùng `preload`; [NO-20] (khoá `category` mang nghĩa Loại bài) — trình soạn mới dùng `postType`; chỉ `generatePost({ category })` trong `lib/ai.ts` còn tên cũ, hết ở Epic 4.

[NO-16] (comment `lib/posts.ts` ghi `revalidateTag`) đã sửa ở Story 2.3. [NO-18] (kiểu `PostCard` chép tay) đã sửa ở lượt gộp 2.4–2.8: `PostCardData` suy từ query trong `modules/posts/types.ts`.

- **[NO-25]** `cn` (package `cn` = clsx + tailwind-merge) coi lớp cỡ chữ token (`text-label-meta`, `text-label-sm`, `text-headline-*`…) và lớp màu `text-<màu>` là cùng nhóm, nên bỏ mất cỡ chữ khi ghép chung. Component mới của lượt gộp ghép chuỗi thường ở các chỗ này (`bottom-tab-bar.client.tsx`, `pagination.tsx`, `product-card.tsx`, `post-type-badge.tsx`); sửa tận gốc cần `extendTailwindMerge` khai báo nhóm `font-size` cho token — chưa làm (`[GD-05]`, `[GD-29]`).
- **[NO-17]** Hai kiểu cùng tên `ProductInput`, khác hình dạng: `lib/ai.ts` (`{ name, priceText? }`, Sản phẩm đưa cho AI) và `modules/products/schema.ts` (dữ liệu Kho đã parse). Bản ở `lib/post-input.ts` đã bỏ ở Story 2.3; bản ở `lib/ai.ts` hết khi prompt chuyển sang `modules/posts/prompts/` (AD-10).
- **[NO-19]** (thu hẹp ở Epic 3) `modules/posts` dùng `z.enum(PostType)`/`z.enum(Status)` và kiểu từ `@/generated/prisma/enums`; còn literal ở `lib/ai.ts` (Epic 4) và vài test.
- **[NO-21]** `README.md` ở gốc repo vẫn là mẫu create-next-app.
- **[NO-22]** Kiểu import `cn` lẫn lộn: `components/ui/*` import từ gói `cn`, phần còn lại từ `@/components/ui/lib/utils` (cả hai cùng một hàm). Xem `[GD-05]`.

## Đã xác minh — kết quả chạy thử

- **[NO-23]** **Đạt** (2026-11-05, Story 1.1, Next.js 16.4.3). `updateTag(POSTS_TAG)` trong Server Action làm mới cả trang đã prerender lẫn `sitemap.xml`, không cần build lại. Cách tái hiện: `npm run build && PORT=3100 npm start`; gọi action `setPostStatus(id, "DRAFT")` (POST tới `/cms` kèm Basic Auth, header `Next-Action: <id trong .next/server/server-reference-manifest.json>`, body JSON `["<id>","DRAFT"]`) → sau ≤ 1 giây `/bai-viet/<slug>` (vốn prerender `○`) trả 404 và slug biến khỏi `sitemap.xml`; gọi lại với `"PUBLISHED"` → 200 và có lại trong sitemap. Sửa nội dung: gọi `savePost` đổi tiêu đề → tiêu đề mới hiện trên `/bai-viet/<slug>` sau ≤ 1 giây, khôi phục lại cũng vậy. Lưu ý: cách thử này sửa dữ liệu thật trong DB cục bộ (`savePost` tạo lại Sản phẩm của bài nên id Sản phẩm đổi); dùng bài thử hoặc chạy lại seed.
- **[NO-24]** **Đạt** (2026-11-05, Story 1.1). Server Action công khai (không `requireAdmin`) import từ Client Component trên trang `(site)` có `ensureStatic = "navigation"`: build không lỗi, trang vẫn prerender tĩnh (`○`, `x-nextjs-cache: HIT`), POST tới action trả kết quả đúng (`{"ok":true,"n":42}`). Cách tái hiện: dựng tạm `app/(site)/thu-no-24/` (page + client button + `actions.ts` `"use server"`), `npm run build`, gọi action như [NO-23] nhưng không kèm auth; đã xoá thư mục tạm sau khi kiểm.
