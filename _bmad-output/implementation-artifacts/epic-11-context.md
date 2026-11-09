# Epic 11 Context: Nhập Bài web từ URL (giai đoạn 1.5)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Ở màn Tạo Bài web, Vinh dán URL một bài viết bên ngoài; AI đọc trang và điền sẵn tiêu đề, tóm tắt, thân bài vào form bài (chưa lưu). Vinh sửa tay hoặc bấm "AI chỉnh sửa" để AI viết lại theo giọng của trang, rồi lưu như bài tự viết. Mục đích là bỏ việc copy tay từng đoạn mà vẫn biến nội dung nhập về thành bài của Vinh. Không đổi schema, không migration. Cần Epic 3 (trình soạn bài), Epic 4 (`platform/ai`) và Epic 5 (Hồ sơ phong cách Website, RiskWarningList), tất cả đã có code.

## Stories

- Story 11.1: Nhập nội dung từ URL vào trình soạn
- Story 11.2: AI chỉnh sửa nội dung trong trình soạn

## Requirements & Constraints

- **Nhập từ URL (FR-39):** chỉ nhận URL `http(s)`. Kết quả điền form, **không ghi DB** cho tới khi Vinh bấm "Lưu nháp"; không tạo bản nháp trống trước. Thân bài không chứa link, ảnh của bài gốc; link ảnh liệt kê riêng để Vinh tự lưu và tải lên. Hệ thống không tự tải ảnh, không tự gán ảnh đại diện.
- Nhập lại URL khác khi form đã có nội dung thì phải hỏi xác nhận trước khi ghi đè.
- Không đọc được trang (cần đăng nhập, bị chặn, render bằng JS, hoặc nhà AI không đọc web) thì báo bằng tiếng Việt, gợi ý copy nội dung dán vào trình soạn; URL vẫn giữ trong ô.
- **AI chỉnh sửa (FR-40):** viết lại tiêu đề, tóm tắt, thân bài đang có trong form (chưa cần lưu) kèm chỉ dẫn ngắn tuỳ chọn, theo Hồ sơ phong cách Website, kèm Cảnh báo rủi ro. Có ở cả form nhập (trước khi lưu) lẫn trình soạn bài đã có, cho cả nội dung nhập về và nội dung tự viết. Thân bài rỗng thì không chạy. Hoàn tác được về đúng nội dung trước lần viết lại gần nhất.
- Kết quả của cả hai tính năng được coi là nội dung Vinh tự viết khi lưu: không tạo Gợi ý AI, không qua Duyệt.
- **Bản quyền và nội dung trùng lặp (R-9):** dialog nhập luôn có dòng nhắc viết lại trước khi xuất bản; "AI chỉnh sửa" luôn có sẵn.
- **Chịu lỗi và thời gian (NFR-2, NFR-3):** mỗi thao tác AI xong hoặc báo lỗi trong 90 giây; trong lúc chờ nút hiện trạng thái đang xử lý; AI lỗi thì báo tiếng Việt và nội dung form không đổi.
- Test prompt và action với `AI_PROVIDERS=fake`, không gọi AI thật. Không thêm thư viện npm.

## Technical Decisions

- **Ngoại lệ có tên của AD-9:** `posts.importPostFromUrl` và `posts.rewritePostDraft` là action CMS của module `posts`, bọc `run()`, gọi `ask()` **đồng bộ** (giống `posts.checkPostSeo`), trả kết quả cho màn hình. Không lưu, không tạo `Suggestion`, không `updateTag`, không dùng `after()`/poller.
- **Không SSRF ở máy chủ (AD-9, AD-10):** máy chủ không tự fetch URL; URL chỉ chuyển cho AI dưới dạng chữ trong prompt, gọi `ask()` với `webSearch: true` để nhà `claude-cli` tự đọc trang. Action chỉ validate dạng URL.
- **Xử lý `skipped`:** nhà AI không hỗ trợ đọc web (như `fake`) thì `ask()` không ném lỗi mà trả `skipped` chứa `webSearch`; action phải ném `UserError` tiếng Việt (vd. "Nhà AI hiện tại không đọc được trang web"). AI báo không đọc được trang cũng thành `UserError`.
- **Prompt (AD-10):** `modules/posts/prompts/import-post.prompt.ts` (yêu cầu giữ nguyên văn, vì công cụ đọc web có thể tóm tắt thay vì trả nguyên văn) và `modules/posts/prompts/rewrite-post.prompt.ts` (lấy Hồ sơ phong cách Website và quy tắc chung ở `platform/ai/rules.ts`), theo khuôn `PromptDef`.
- **Hợp đồng đầu ra:** nhập → `{ title, summary, contentHtml, imageUrls[] }`; viết lại → `{ title, summary, contentHtml, riskWarnings }`. Tiêu đề/tóm tắt cắt theo giới hạn trong `posts/constants.ts`.
- **HTML (AD-22):** `contentHtml` qua `sanitizePostHtml` **trước khi trả về client**. Allowlist không có `a`, `img` nên link và ảnh tự bị lọc khỏi thân bài; link ảnh trả riêng trong `imageUrls`.
- **Validate:** Zod cho URL (và đầu vào viết lại) ở `posts/schema.ts`, giới hạn độ dài ở `posts/constants.ts`.
- **Lưu không cần đường mới:** form nhập gọi `posts.createPostDraft` (đã có, nhận đủ trường `postDraftInputSchema`) rồi chuyển sang `/cms/bai-viet/[id]`.

## UX & Interaction Patterns

- **ImportFromUrl (`/cms/bai-viet/moi`):** khối "Nhập từ URL" ở đầu màn, bên cạnh form "Tạo bản nháp" thường (form thường vẫn dùng được khi nhập lỗi). Ô URL + dòng nhắc "Nội dung lấy từ trang khác — hãy viết lại trước khi xuất bản". Nút "Lấy nội dung" → "Đang đọc trang…" (có thể tới 90 giây).
- Thành công: màn chuyển sang form bài (Loại bài, Danh mục, tiêu đề, tóm tắt, PostEditor, ảnh đại diện; thẻ, SEO, Sản phẩm thêm ở trình soạn sau khi lưu) qua CmsForm, đã điền sẵn; UnsavedChangesGuard bật ngay khi form được điền. Có nút "AI chỉnh sửa", khối "Ảnh trong bài gốc" (mỗi link một nút copy) cạnh ô ảnh đại diện, nút dính đáy "Lưu nháp".
- Lấy lại từ URL khác khi form đã có nội dung → ConfirmDialog "Ghi đè nội dung đang soạn?". Lỗi: thông báo dưới ô URL, giữ URL.
- **AiRewriteDialog (form nhập và `/cms/bai-viet/[id]`):** ô chỉ dẫn tuỳ chọn, nút "Viết lại" → "AI đang viết…". Thành công: điền form, chưa lưu; Toast "Đã viết lại — chưa lưu" kèm "Hoàn tác"; Cảnh báo rủi ro qua RiskWarningList. Lỗi: Toast tiếng Việt, form không đổi. Kết quả điền form được UnsavedChangesGuard bắt như sửa tay.

## Cross-Story Dependencies

- 11.2 gắn nút "AI chỉnh sửa" vào form nhập của 11.1 và vào trình soạn `/cms/bai-viet/[id]` (Epic 3); dùng Hồ sơ phong cách Website và RiskWarningList (Epic 5), `ask()` (Epic 4).
- 11.1 dựa vào `posts.createPostDraft`, `postDraftInputSchema`, PostEditor, CmsForm, UnsavedChangesGuard đã có từ Epic 3.
- Theo kế hoạch, hai story được code theo một lượt gộp rồi review/test một lần.
