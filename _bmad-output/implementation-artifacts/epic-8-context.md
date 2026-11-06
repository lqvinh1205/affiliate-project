# Epic 8 Context: Người đọc tương tác (giai đoạn 1.5)

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Người đọc thả tim bài không cần đăng nhập, chia sẻ bài lên Facebook/Threads hoặc sao chép link, tìm bài bằng từ khoá gõ không dấu ở `/tim-kiem`; Trang chủ và trang 404 có khu "Xem nhiều" (bài nhiều Lượt xem nhất 30 ngày). Vinh thấy và sắp xếp cột Lượt tim ở `/cms/bai-viet`. Cần Epic 7 (`PostStat`, `PostViewDaily`, `platform/rate-limit`) và Epic 3 (trang bài tĩnh, PostCard, 404).

## Stories

- Story 8.1: Thả tim bài viết
- Story 8.2: Chia sẻ bài viết
- Story 8.3: Tìm kiếm không dấu
- Story 8.4: Khu "Xem nhiều" trên Trang chủ và 404

## Requirements & Constraints

- **FR-35** thả tim / bỏ tim không đăng nhập; mỗi trình duyệt một tim mỗi bài; ≤ 30 lần thả tim/phút từ cùng một nguồn.
- **FR-37** chia sẻ Facebook, Threads, sao chép link; điện thoại dùng chia sẻ gốc (`navigator.share`).
- **FR-36** tìm Bài web đã xuất bản theo từ khoá, khớp cả khi gõ không dấu ("noi chien" → "nồi chiên").
- **FR-34** "Xem nhiều": bài nhiều Lượt xem nhất trong 30 ngày gần nhất; giữ các khối Trang chủ hiện có.
- **FR-38** CMS hiện Lượt tim mỗi bài, sắp xếp được.
- **NFR-7 / [QD-18]** không thu thập dữ liệu cá nhân: không lưu/log IP, định danh, từ khoá tìm kiếm.
- **NFR-5 / AD-7** trang public giữ tĩnh (`ensureStatic = "navigation"`); số tim, kết quả tìm kiếm lấy phía client qua action công khai.
- **UX Q5** không hiện Lượt xem ở site; Lượt tim chỉ hiện trong LikeButton ở trang bài, không trên PostCard.
- Không thêm thư viện npm.

## Technical Decisions

- **Action công khai (AD-6, ba ngoại lệ có tên):** `modules/engagement/actions.ts` ghi Lượt tim và **đọc** số Lượt tim một bài (ngoại lệ 1); `posts.searchPosts` trong `modules/posts/actions.ts` là action chỉ đọc công khai (ngoại lệ 2). Cả hai: không `run()`/`requireAdmin()`, validate Zod, giới hạn tần suất trong bộ nhớ theo băm IP (`platform/rate-limit.ts` của Epic 7), không `updateTag`, không `console.error`, không lưu/log định danh. Đọc không cache cho action công khai nằm ở `service.ts` (AD-5).
- **Lượt tim (AD-23):** cột `PostStat.likes` đã có từ Epic 7 (upsert lười, thiếu = 0); trạng thái "đã thả" nhớ ở `localStorage`. Mức giới hạn: ≤ 30 lần/phút (FR-35).
- **Tìm kiếm không dấu:** cột `Post.searchText` (bỏ dấu, chữ thường) do `posts/service.ts` ghi ở mọi lần ghi bài; migration thêm cột và backfill bài cũ (Story 8.3, AD-15). `/tim-kiem` là trang tĩnh `noindex` (AD-26), không đọc `searchParams` ở server (AD-7). Mức giới hạn tần suất chốt trong story (Deferred của spine).
- **Xem nhiều (AD-23, AD-2):** query ở `modules/engagement/queries.ts` (chạm `PostViewDaily` + `Post` → module tầng cao nhất), `"use cache"` + `cacheLife` cố định + `cacheTag` của mọi module được đọc (`engagement`, `posts`, `products` cho ảnh fallback); không `updateTag` mỗi lượt xem; thời điểm hiện tại lấy bên trong hàm cache. Select/biến đổi thẻ bài lấy từ `posts/queries.ts` (không viết lại).
- **CMS (AD-2, AD-12):** cột Lượt tim + sắp xếp trên URL, query ở `engagement/cms-queries.ts` như Lượt xem (Epic 7).
- **ShareButtons:** `components/shared` (AD-11, bảng FR của spine).

## UX & Interaction Patterns

- **UX-DR25 LikeButton:** pill `surface-container-low`, tim + số; đã thả tim đặc `primary`; optimistic ±1; "—" giữ chỗ cố định khi chưa có số / lỗi, vẫn bấm được; lỗi/giới hạn → hoàn trạng thái + Toast "Chưa thả tim được, thử lại sau nhé"; nảy ≤ 200 ms, tắt khi reduced-motion; `aria-pressed` + nhãn có số. Vị trí: cuối bài, ArticleActionBar (mobile), cột phải desktop.
- **UX-DR26 ShareButtons:** nút tròn 44px Facebook, Threads, Sao chép link (nút cuối nền `primary`); mobile có `navigator.share` → nút chính mở chia sẻ gốc, huỷ thì không làm gì; Toast "Đã sao chép liên kết" / "Chưa sao chép được, bạn giữ ngón tay lên thanh địa chỉ để chép nhé"; `aria-label` tiếng Việt.
- **UX-DR27 ArticleActionBar:** trái LikeButton + "Sản phẩm", phải ShareButtons; thay BottomTabBar trên trang bài mobile.
- **UX-DR36 Toast site:** đáy màn, trên ArticleActionBar/BottomTabBar, 3 giây, `aria-live="polite"`.
- **UX-DR30/31/32/67 Tìm kiếm:** SearchBox (tự focus, kính lúp trái, nút xoá phải, 300 ms, ≥ 2 ký tự, Enter tìm ngay); chưa gõ → FilterChips Danh mục có bài (link `/[danh-muc]`); đang tìm → 3 Skeleton dòng, kết quả cũ mờ; có kết quả → "Tìm thấy N bài viết cho "…"" (`aria-live`) + SearchResultItem (PostCard *row*, highlight `primary-fixed`); không kết quả → EmptyState "Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..." + gợi ý gõ ngắn hơn + Xem nhiều; lỗi → "Chưa tìm được lúc này, thử lại nhé" + Thử lại.
- **UX-DR16/62 Xem nhiều:** PostCard *rank* `01`–`05` (`headline-lg`, `outline-variant`, `aria-hidden`) trong `<ol>`; mobile sau Gom link đồ xinh; desktop Bài nổi bật 7 cột + Xem nhiều 5 cột cạnh nhau; < 5 hiện số có, 0 ẩn khu.
- **UX-DR68 404:** EmptyState + SearchBox + 3 bài Xem nhiều.

## Cross-Story Dependencies

- 8.1 dùng `PostStat.likes`, `platform/rate-limit`; cột Lượt tim CMS mở rộng màn `/cms/bai-viet` của Story 7.2.
- 8.2 và 8.1 cùng đặt trong ArticleActionBar, cuối bài và cột phải desktop; cùng dùng Toast site.
- 8.3 SearchBox dùng lại ở 404 (8.4); khu "Không kết quả" dùng Xem nhiều của 8.4.
- 8.4 đọc `PostViewDaily` (Epic 7).
