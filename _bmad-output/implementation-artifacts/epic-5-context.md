# Epic 5 Context: Xưởng Bộ nội dung

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Từ hồ sơ nghiên cứu đã Duyệt, Vinh bấm một nút để AI tạo Bộ nội dung: Bài web, Bài Threads, Bài Facebook và Bình luận kèm link cho từng nền tảng mạng xã hội — mỗi phần một Gợi ý AI riêng, chạy song song, Duyệt riêng. Vinh xem Cảnh báo rủi ro, sửa, Duyệt, copy một chạm, đánh dấu đã đăng; chuyển Bài web có sẵn thành bài mạng xã hội; sửa Hồ sơ phong cách từng nền tảng. Cao trào UJ-1; mọi màn làm được trên điện thoại 360px (NFR-4). Cần Epic 3 (trình soạn Bài web) và Epic 4 (lớp AI, `Suggestion`, hồ sơ nghiên cứu).

## Stories

- Story 5.1: Hồ sơ phong cách cho từng nền tảng
- Story 5.2: Tạo Bộ nội dung và Bài web từ hồ sơ đã Duyệt
- Story 5.3: Bài Threads và Bình luận kèm link
- Story 5.4: Bài Facebook và Bình luận kèm link
- Story 5.5: Copy một chạm và đánh dấu đã đăng
- Story 5.6: Cảnh báo rủi ro trong nội dung AI
- Story 5.7: Tạo lại phần đã Duyệt và khoá Xuất bản
- Story 5.8: Bộ nội dung nhiều Sản phẩm (bài Gom link)
- Story 5.9: Chuyển Bài web có sẵn thành bài mạng xã hội

## Requirements & Constraints

- **FR-11** Danh mục và Loại bài gợi ý cho Bài web, chỉ Danh mục có sẵn, tự điền, Vinh đổi được. **FR-12** một nút tạo cả bộ; bỏ chọn nền tảng được; phần lỗi không làm mất phần khác, tạo lại riêng; ghi mốc tạo Sản phẩm, tạo bộ, copy đầu tiên (SM-3). **FR-13** Bài web theo Hồ sơ phong cách Website (600–900 từ, 3–5 h2…), thân bài không link/ảnh/giá, qua sanitize. **FR-14** Threads 4–7 bài, mỗi bài ≤ 250 ký tự mục tiêu, ≤ 500 cứng, bài đầu là hook, không link trong thân. **FR-15** Facebook một bài ~80–250 từ, xuống dòng dễ đọc, không link. **FR-16** từ Bài web có sẵn tạo Threads/Facebook, cùng Bộ nội dung. **FR-17** Bình luận kèm link chứa nguyên Link affiliate, dẫn thẳng Shopee. **FR-18** Hồ sơ phong cách (giọng văn, độ dài, emoji, điều cấm, nội quy; câu công khai tuỳ chọn cho Threads/Facebook); sửa chỉ áp cho lần tạo sau. **FR-19** copy một chạm. **FR-20** đánh dấu đã đăng + link tuỳ chọn; Sản phẩm hiện đã lên nền tảng nào. **FR-21** Tạo lại kèm chỉ dẫn. **FR-22** mỗi phần Duyệt riêng; không xuất bản Bài web khi phần AI chưa Duyệt; bài mạng xã hội chưa Duyệt vẫn copy được nhưng cảnh báo. **FR-23** Cảnh báo rủi ro 5 loại, mỗi mục có câu + lý do, không chặn Duyệt; bộ ≥ 20 câu mẫu, bắt ≥ 90%, báo nhầm ≤ 20%.
- **NFR-1** mọi AI qua `platform/ai` (không OpenAI). **NFR-3** ≤ 90 giây mỗi phần, rời màn quay lại vẫn thấy. **NFR-4** 360px.
- Test không gọi AI thật (AD-16); tối đa một lần gọi `claude -p` thật trong epic. Không cào dữ liệu Shopee. Không thêm thư viện npm.

## Technical Decisions

- **Module (AD-3, AD-4):** `style-profiles` (T0, `StyleProfile`), `content-sets` (T3, `ContentSet`, `ContentSetProduct`, `SocialPost`, enum `Platform` khai báo một lần ở `content-sets.prisma`), `suggestions` (T4) điều phối tạo/Duyệt. `posts` không import `suggestions`/`content-sets` (tầng).
- **Đích Duyệt (AD-19):** `WEB_POST` → `Post` nháp (khoá `ContentSet.postId`, chỉ ghi vào bài `DRAFT`); `THREADS_POST`/`FACEBOOK_POST` → `SocialPost` (`@@unique([contentSetId, platform])`); `LINK_COMMENT` → `SocialPost.linkComment` (cần bài cùng nền tảng đã Duyệt). Partial unique index một gợi ý đang chờ mỗi khoá đích. Tạo lại: bản cũ `SUPERSEDED`, bản mới mang `parentSuggestionId`.
- **Vòng đời (AD-18):** action ghi `GENERATING`, trả ngay; `after()` chạy mỗi phần một lần `ask()` song song, độc lập; `GENERATING` quá 120 giây coi là `FAILED`; một `GeneratingPoller` mỗi màn.
- **Prompt (AD-10, AD-25):** `posts/prompts/web-post.prompt.ts`, `content-sets/prompts/{threads-post,facebook-post,link-comment}.prompt.ts`; `system(style)` nhận Hồ sơ phong cách; giá trị khởi tạo chỉ ở `style-profiles/constants.ts`; giới hạn cứng ở `constants.ts` của `posts`/`content-sets`, hồ sơ ≤ giới hạn (kiểm ở `style-profiles/schema.ts`).
- **Mốc đo (AD-21):** copy chưa Duyệt → `Suggestion.firstCopiedAt` (`suggestions.recordSuggestionCopy`); Duyệt chép sang `SocialPost.firstCopiedAt` nếu chưa có; copy sau Duyệt → `content-sets.recordCopy`; `markPosted` ghi `postedAt` + `postUrl`. SM-3 đo bằng query ghi ở `docs/kiem-chung.md`.
- **HTML (AD-22):** thân Bài web từ AI qua `sanitizePostHtml` khi nhận và khi ghi `Post`.
- **Màn soạn bài (AD-19, UX-DR72):** Screen lấy trạng thái khoá Xuất bản + Cảnh báo rủi ro từ `suggestions/cms-queries`, truyền props với kiểu do `posts` định nghĩa; khoá chỉ ở giao diện.
- **Gỡ chức năng cũ (bo-chuc-nang.md):** nhánh AI của `createPost` (`/cms/bai-viet/moi`) và `runThreads` + tab Threads; soạn tay giữ.
- **Migration:** mỗi story tối đa một: 5.1 `add_style_profile`, 5.2 `add_content_set`, 5.3 `add_social_post`; chỉ Postgres cục bộ 54329.

## UX & Interaction Patterns

- **Bộ nội dung `/cms/bo-noi-dung/[id]` (UX-DR75):** một cột (≤ 768px desktop): đầu màn (Sản phẩm, Góc viết + hook, Người đọc, "x/y đã duyệt", "Mở bài web"), thanh nhảy dính theo nền tảng (chấm màu trạng thái), khối Bài web → Threads (bài → Bình luận → Đánh dấu đã đăng) → Facebook; nền tảng chưa có: "Thêm Bài {nền tảng}". Không "Duyệt tất cả".
- **SuggestionCard (UX-DR41):** Bài web = tiêu đề + tóm tắt + PostEditor thu gọn 8 dòng + SEO; Threads = mỗi bài một khối "2/6", bộ đếm "182/500" (> 500 đỏ, Duyệt tắt "Bài 3 vượt 500 ký tự"), CopyButton; Facebook = Textarea + đếm từ + CopyButton; Bình luận = Textarea + CopyButton ("Duyệt bài Threads trước"). Đã Duyệt → sửa đích; Bài web chỉ đọc + "Mở bài web".
- **CopyButton (UX-DR44):** "Đã sao chép" 2 giây; chưa Duyệt hỏi AlertDialog "Nội dung này chưa duyệt. Vẫn sao chép?".
- **RiskWarning (UX-DR43):** Alert `tertiary-fixed`, mục là nút ≥ 44px (câu + lý do); chạm → cuộn và bôi câu; không chặn Duyệt.
- **CreateContentSetPanel (UX-DR47), AudiencePicker/AnglePicker (UX-DR46), PlatformToggle (UX-DR51):** nút "Tạo bộ nội dung" `aria-disabled` + dòng lý do điều kiện đầu tiên chưa đạt; Người đọc mặc định nhóm đầu, Góc viết không chọn sẵn, ô "Sửa lại (tuỳ chọn)"; bộ nhiều Sản phẩm nhóm lựa chọn theo Sản phẩm.
- **MarkPostedDialog (UX-DR56), SocialFromPostDialog (UX-DR55), Hồ sơ phong cách (UX-DR81):** Toast "Đã lưu — áp dụng cho nội dung tạo từ giờ".
- **Microcopy (UX-DR96):** "Chưa tạo được bài Threads. Phần khác vẫn giữ nguyên. Bấm Tạo lại."

## Cross-Story Dependencies

- 5.1 cung cấp Hồ sơ phong cách cho mọi prompt 5.2–5.4, 5.9. 5.2 tạo `ContentSet` + màn Bộ nội dung; 5.3/5.4 thêm `SocialPost` + Bình luận; 5.5 dựa trên `SocialPost`; 5.6 thêm `riskWarnings` vào mọi prompt; 5.7 dùng `regenerateSuggestion` + trạng thái gợi ý cho màn soạn; 5.8 mở rộng panel; 5.9 dùng lại luồng thêm phần vào bộ.
- Dựa trên Epic 4: `platform/ai`, `Suggestion`, SuggestionCard, poller, RegenerateDialog, `ResearchProfile` (Người đọc, Góc viết có `id`). Dựa trên Epic 3: trình soạn Bài web, ProductPicker.
- Epic 10 (Cảm hứng) thêm `ContentSet.inspirationId` và dải "Từ Cảm hứng" trong panel.
