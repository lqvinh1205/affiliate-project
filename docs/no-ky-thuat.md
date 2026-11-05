# Nợ kỹ thuật và điểm lệch đã biết

> Nguồn: rà soát code khi viết bộ tài liệu `docs/` · Kiểm lần cuối: 2026-11-03 @ dfd7e8f

Danh sách những chỗ code đang lệch với quy định, PRD hoặc chính nó. **Chưa sửa.** Workflow chạm vào vùng nào thì kiểm mục tương ứng ở đây; sửa xong thì xoá mục và cập nhật tài liệu liên quan. ID dạng `[NO-xx]`, không đánh số lại.

## Cao — bảo mật và tuân thủ

- **[NO-01]** `lib/sanitize.ts` vẫn cho phép thẻ `a` và `img` trong thân bài, trái `[QD-12]`. Chỉ prompt AI cấm chúng. Xem `[BM-31]`.
- **[NO-02]** `sanitizePostHtml` ghi đè `rel` của mọi link thành `noopener`, làm mất `sponsored nofollow` (`[QD-14]`). Link dạng `//host` và ảnh từ host bất kỳ vẫn qua được. Xem `[BM-25]`.
- **[NO-03]** `isAllowedImageUrl` (`lib/images.ts`) chấp nhận `//evil.com/x.png` vì mọi chuỗi bắt đầu bằng `/` đều qua. Xem `[BM-26]`.
- **[NO-04]** `"*.supabase.co"` khớp mọi độ sâu subdomain trong kiểm form nhưng chỉ một cấp trong `next/image` `remotePatterns`. Xem `[NX-60]`, `[BM-27]`.
- **[NO-05]** `affiliateUrl` nhận mọi URL http(s), chưa giới hạn domain Shopee (PRD FR-3, `[QD-13]`). Xem `[BM-30]`, `[BM-32]`.
- **[NO-06]** Bài nháp do AI tạo trong `createPost` (`app/cms/actions.ts`) không đi qua `postInputSchema`.

## Vừa — hành vi sai hoặc dễ gây lỗi

- **[NO-07]** `savePost` tính lại slug mỗi lần lưu; đổi slug bài đã xuất bản làm hỏng URL cũ, không có chuyển hướng 301 (PRD FR-27).
- **[NO-08]** `prisma/seed.ts` chạy `deleteMany()` toàn bộ bài trước khi seed — phá huỷ dữ liệu. Xem `[PR-14]`.
- **[NO-09]** Sản phẩm bị xoá và tạo lại (đổi id) mỗi lần lưu bài. Xem `[PR-26]`.
- **[NO-10]** `toThreads` (`lib/ai.ts`) đặt link website ở bài cuối chuỗi, trái PRD FR-14 (link affiliate nằm ở Bình luận kèm link).
- **[NO-11]** `lib/require-admin.ts` ném lỗi tiếng Anh "Unauthorized"; `setPostStatus` dùng `findUniqueOrThrow` nên lỗi Prisma tiếng Anh lọt ra toast (`[QU-14]`, `[BM-24]`).
- **[NO-12]** Giới hạn tóm tắt không khớp: editor và prompt AI dùng 200, Zod và DB cho 500 (`components/cms/post-editor.tsx`, `lib/post-input.ts`, `prisma/schema.prisma`).
- **[NO-13]** `next/image` còn dùng `priority` (đã deprecate ở Next 16) — `app/(site)/page.tsx`, `app/(site)/bai-viet/[slug]/page.tsx`. Xem `[GD-30]`.
- **[NO-14]** `proxy.ts` matcher chặn `/api/:path*` nhưng không có `app/api`; endpoint công khai tương lai không đặt được ở `/api`. Xem `[NX-57]`.
- **[NO-15]** `app/styleguide/page.tsx` là trang công khai (chỉ `noindex`), ghi chú "xoá trước khi deploy" (PRD NFR-10).

## Thấp — nhất quán và dọn dẹp

- **[NO-16]** Comment `lib/posts.ts:6` ghi `revalidateTag`, code dùng `updateTag`. Xem `[NX-50]`.
- **[NO-17]** Kiểu `ProductInput` khai báo hai lần, hai hình dạng khác nhau (`lib/ai.ts`, `lib/post-input.ts`).
- **[NO-18]** Kiểu `PostCard` trong `lib/posts.ts` không được dùng, trùng tên component; hình dạng bị chép tay thành `PostCardData`.
- **[NO-19]** Literal `"DRAFT" | "PUBLISHED"` và `["MEO_VAT","GOM_LINK"]` gõ lại ở nhiều file thay vì suy ra từ enum Prisma hoặc `CategoryKey` (`[KT-08]`, `[PR-27]`).
- **[NO-20]** UI gọi enum Category là "Chuyên mục", trong khi PRD gọi là **Loại bài**; **Danh mục** là khái niệm khác, chưa có trong code.
- **[NO-21]** `README.md` ở gốc repo vẫn là mẫu create-next-app.
- **[NO-22]** Kiểu import `cn` lẫn lộn: `components/ui/*` import từ gói `cn`, phần còn lại từ `@/lib/utils` (cả hai cùng một hàm). Xem `[GD-05]`.

## Chưa xác minh — cần chạy thử

- **[NO-23]** `updateTag(POSTS_TAG)` có tái tạo các trang đã prerender (`/bai-viet/[slug]`, `sitemap.xml`) hay chỉ dữ liệu cache: kiểm bằng `npm run build && npm start` rồi sửa một bài. Xem `nextjs-16.md` mục chưa xác minh.
- **[NO-24]** Server Action công khai gọi từ trang có `ensureStatic = "navigation"` (công thức `[NX-35]`) có vướng ràng buộc nào không.
