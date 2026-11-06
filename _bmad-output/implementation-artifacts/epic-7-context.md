# Epic 7 Context: Đo Lượt xem

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Mỗi Bài web đã xuất bản đếm Lượt xem ẩn danh: người đọc mở bài thì trình duyệt gửi một lần mỗi bài, không đếm trình duyệt của Vinh (đã vào `/cms`), không đếm bot. Vinh thấy cột Lượt xem trong `/cms/bai-viet` và sắp xếp bài theo Lượt xem để biết loại bài nào kéo người đọc (SM-4). Cần Epic 3 (trang bài tĩnh, danh sách bài CMS). Epic 8 dùng `PostStat`/`PostViewDaily` cho "Xem nhiều" và Lượt tim.

## Stories

- Story 7.1: Đếm Lượt xem ẩn danh
- Story 7.2: Lượt xem trong danh sách bài CMS

## Requirements & Constraints

- **FR-33** đếm Lượt xem mỗi Bài web, ẩn danh; không đếm Vinh, không đếm bot.
- **FR-38** CMS hiện Lượt xem mỗi bài, sắp xếp được (Lượt tim thêm ở Epic 8 — Story 8.1).
- **NFR-7 / [QD-18]** không thu thập dữ liệu cá nhân: không lưu IP/định danh vào DB hay log; chống trùng bằng `localStorage` phía client.
- **NFR-5** đếm lượt xem không làm chậm nội dung chính; trang bài vẫn tĩnh (`ensureStatic`, AD-7).
- **UX Q5** không hiện số Lượt xem ở đâu trên site public.
- Không thêm thư viện npm.

## Technical Decisions

- **Module `engagement` (T3, AD-3, AD-4):** sở hữu `PostStat { postId, views, likes }` (tạo lười bằng upsert, thiếu = 0) và `PostViewDaily { postId, day, views }` (cửa sổ 30 ngày cho Epic 8) ở `prisma/schema/engagement.prisma`; `Post` chỉ thêm quan hệ ngược. Bảng riêng để mỗi lượt xem không đổi `Post.updatedAt` (sitemap, JSON-LD).
- **Ghi (AD-6 ngoại lệ số 1, AD-23):** `modules/engagement/actions.ts` công khai: không `run()`/`requireAdmin()`, validate Zod, giới hạn tần suất trong bộ nhớ tiến trình theo băm IP ngắn hạn, bỏ qua user-agent bot, không `updateTag`, không log định danh. Mức giới hạn cụ thể chốt ở Story 7.1 (Deferred của spine).
- **Client:** Client Component gọi action trong `useEffect` (mẫu "useEffect" của Next docs `07-mutating-data.md`, [NX-35]); `localStorage` chống trùng; trình duyệt tự đánh dấu khi vào `/cms`.
- **Đọc CMS (AD-2):** query xếp theo Lượt xem chạm `Post` + `PostStat` → đặt ở `engagement/cms-queries.ts`; bộ lọc/cột của danh sách lấy từ `posts/cms-queries.ts`; Screen ghép với danh sách bài của `posts`. Sắp xếp qua tham số URL (AD-12).
- **Migration:** một migration `add_post_stats` ở Story 7.1 (Postgres cục bộ 54329).

## UX & Interaction Patterns

- **UX-DR71** `/cms/bai-viet`: DataList (mobile thẻ, desktop bảng), lọc trạng thái, cột Lượt xem/Lượt tim, sắp xếp; tham số trên URL. Số theo `formatCount` (vi-VN, AD-27); bài chưa có lượt xem hiện 0.
- Trang bài public: không có phần tử hiển thị mới (Q5).

## Cross-Story Dependencies

- 7.1 tạo bảng và ghi `PostStat`; 7.2 đọc `PostStat.views`.
- Dựa trên Epic 3: `PostScreen` của trang bài, `listPostsForCms` + `PostListScreen` của `/cms/bai-viet`. Epic 8 dùng lại `platform/rate-limit.ts`, `PostViewDaily`, `PostStat.likes`.
