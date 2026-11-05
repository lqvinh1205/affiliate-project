# Nợ kỹ thuật và điểm lệch đã biết

> Nguồn: rà soát code khi viết bộ tài liệu `docs/` · Kiểm lần cuối: 2026-11-05 @ 8771851

Danh sách những chỗ code đang lệch với quy định, PRD hoặc chính nó. **Chưa sửa.** Workflow chạm vào vùng nào thì kiểm mục tương ứng ở đây; sửa xong thì xoá mục và cập nhật tài liệu liên quan. ID dạng `[NO-xx]`, không đánh số lại.

## Cao — bảo mật và tuân thủ

Không còn mục mở. [NO-01]–[NO-05] đã sửa ở Story 1.2, có unit test trong `platform/`; [NO-06] đã sửa ở Story 1.2, test thêm khi action chuyển sang `modules/`.

## Vừa — hành vi sai hoặc dễ gây lỗi

[NO-09] (Sản phẩm bị xoá và tạo lại mỗi lần lưu bài) đã sửa ở Story 2.3: Kho Sản phẩm độc lập, trình soạn bài không ghi `Product`/`PostProduct`.

- **[NO-07]** `savePost` tính lại slug mỗi lần lưu; đổi slug bài đã xuất bản làm hỏng URL cũ, không có chuyển hướng 301 (`permanentRedirect`, HTTP 308 — AD-20; PRD FR-27).
- **[NO-08]** `prisma/seed.ts` chạy `deleteMany()` toàn bộ bài trước khi seed — phá huỷ dữ liệu. Xem `[PR-14]`.
- **[NO-10]** `toThreads` (`lib/ai.ts`) đặt link website ở bài cuối chuỗi, trái PRD FR-14 (link affiliate nằm ở Bình luận kèm link).
- **[NO-12]** Giới hạn tóm tắt không khớp: editor và prompt AI dùng 200, Zod và DB cho 500 (`components/cms/post-editor.tsx`, `lib/post-input.ts`, `prisma/schema/posts.prisma`).
- **[NO-13]** `next/image` còn dùng `priority` (đã deprecate ở Next 16) — `app/(site)/page.tsx`, `app/(site)/bai-viet/[slug]/page.tsx`. Xem `[GD-30]`.
- **[NO-14]** (đã bỏ) Không còn là nợ: spine AD-6 quy định không có endpoint công khai dưới `/api`, nên matcher chặn `/api/:path*` là đúng. Xem `[NX-57]`.

## Thấp — nhất quán và dọn dẹp

[NO-16] (comment `lib/posts.ts` ghi `revalidateTag`) đã sửa ở Story 2.3. [NO-18] (kiểu `PostCard` chép tay) đã sửa ở lượt gộp 2.4–2.8: `PostCardData` suy từ query trong `modules/posts/types.ts`.

- **[NO-25]** `cn` (package `cn` = clsx + tailwind-merge) coi lớp cỡ chữ token (`text-label-meta`, `text-label-sm`, `text-headline-*`…) và lớp màu `text-<màu>` là cùng nhóm, nên bỏ mất cỡ chữ khi ghép chung. Component mới của lượt gộp ghép chuỗi thường ở các chỗ này (`bottom-tab-bar.client.tsx`, `pagination.tsx`, `product-card.tsx`, `post-type-badge.tsx`); sửa tận gốc cần `extendTailwindMerge` khai báo nhóm `font-size` cho token — chưa làm (`[GD-05]`, `[GD-29]`).
- **[NO-17]** Hai kiểu cùng tên `ProductInput`, khác hình dạng: `lib/ai.ts` (`{ name, priceText? }`, Sản phẩm đưa cho AI) và `modules/products/schema.ts` (dữ liệu Kho đã parse). Bản ở `lib/post-input.ts` đã bỏ ở Story 2.3; bản ở `lib/ai.ts` hết khi prompt chuyển sang `modules/posts/prompts/` (AD-10).
- **[NO-19]** Literal `"DRAFT" | "PUBLISHED"` và `["MEO_VAT","GOM_LINK"]` gõ lại ở nhiều file thay vì suy ra từ enum Prisma hoặc `CategoryKey` (`[KT-08]`, `[PR-27]`).
- **[NO-20]** (thu hẹp ở lượt gộp 2.4–2.8) Phần site đã dùng đúng tên: `PostTypeBadge postType=`, `POST_TYPES` (`modules/posts/constants.ts`), thẻ bài có `postType`; **Danh mục** (model `Category`) có màn CMS `/cms/danh-muc` và trang `/[danh-muc]`. Còn lệch ở trình soạn bài cũ: khoá `category` trong `lib/post-input.ts`, `components/cms/{fields,new-post-form,post-editor}.tsx`, `createPost`/`savePost` (`app/cms/actions.ts`), `lib/ai.ts` vẫn mang nghĩa Loại bài (`Post.postType`); `CategoryPicker` hiện nhãn "Chuyên mục". Hết khi Epic 3 chuyển trình soạn bài.
- **[NO-21]** `README.md` ở gốc repo vẫn là mẫu create-next-app.
- **[NO-22]** Kiểu import `cn` lẫn lộn: `components/ui/*` import từ gói `cn`, phần còn lại từ `@/components/ui/lib/utils` (cả hai cùng một hàm). Xem `[GD-05]`.

## Đã xác minh — kết quả chạy thử

- **[NO-23]** **Đạt** (2026-11-05, Story 1.1, Next.js 16.4.3). `updateTag(POSTS_TAG)` trong Server Action làm mới cả trang đã prerender lẫn `sitemap.xml`, không cần build lại. Cách tái hiện: `npm run build && PORT=3100 npm start`; gọi action `setPostStatus(id, "DRAFT")` (POST tới `/cms` kèm Basic Auth, header `Next-Action: <id trong .next/server/server-reference-manifest.json>`, body JSON `["<id>","DRAFT"]`) → sau ≤ 1 giây `/bai-viet/<slug>` (vốn prerender `○`) trả 404 và slug biến khỏi `sitemap.xml`; gọi lại với `"PUBLISHED"` → 200 và có lại trong sitemap. Sửa nội dung: gọi `savePost` đổi tiêu đề → tiêu đề mới hiện trên `/bai-viet/<slug>` sau ≤ 1 giây, khôi phục lại cũng vậy. Lưu ý: cách thử này sửa dữ liệu thật trong DB cục bộ (`savePost` tạo lại Sản phẩm của bài nên id Sản phẩm đổi); dùng bài thử hoặc chạy lại seed.
- **[NO-24]** **Đạt** (2026-11-05, Story 1.1). Server Action công khai (không `requireAdmin`) import từ Client Component trên trang `(site)` có `ensureStatic = "navigation"`: build không lỗi, trang vẫn prerender tĩnh (`○`, `x-nextjs-cache: HIT`), POST tới action trả kết quả đúng (`{"ok":true,"n":42}`). Cách tái hiện: dựng tạm `app/(site)/thu-no-24/` (page + client button + `actions.ts` `"use server"`), `npm run build`, gọi action như [NO-23] nhưng không kèm auth; đã xoá thư mục tạm sau khi kiểm.
