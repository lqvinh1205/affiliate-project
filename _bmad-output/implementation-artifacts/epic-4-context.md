# Epic 4 Context: Nghiên cứu Sản phẩm bằng AI

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Vinh bấm "Nghiên cứu" trên Chi tiết Sản phẩm: AI tìm thông tin công khai trên web (kèm link nguồn), đọc ảnh Sản phẩm, tóm tắt đánh giá đã dán, gợi ý Người đọc mục tiêu, Góc viết và Danh mục. Việc chạy nền: rời màn rồi quay lại vẫn thấy tiến trình hoặc kết quả. Vinh sửa rồi Duyệt, Từ chối, hoặc Tạo lại kèm chỉ dẫn ngắn. Epic này dựng lõi gợi ý AI dùng tiếp ở Epic 5: lớp AI chung `platform/ai` (nhà chính `claude -p`), bảng `Suggestion`, SuggestionCard, poller, luồng Duyệt/Tạo lại. Đồng thời chuyển hết code AI cũ (`lib/ai.ts`, `app/cms/actions.ts`) sang cấu trúc spine và bỏ OpenAI.

## Stories

- Story 4.1: Lớp AI chung và chấm SEO trên nhà cung cấp mới
- Story 4.2: Bấm "Nghiên cứu" và theo dõi tiến trình
- Story 4.3: Duyệt, Từ chối và Tạo lại hồ sơ nghiên cứu
- Story 4.4: AI tìm thông tin trên web và đọc ảnh Sản phẩm
- Story 4.5: Danh mục gợi ý cho Sản phẩm

## Requirements & Constraints

- **FR-6** thông tin công khai (công dụng, cách dùng, nhận xét chung), mỗi ý kèm link nguồn; không tìm được thì báo rõ, không bịa. **FR-7** mô tả ảnh (hình dáng, màu, chất liệu, chữ trên bao bì; ảnh có chữ rõ thì trích tên/dòng chính); nhà cung cấp không đọc được ảnh thì báo rõ và tiếp tục với dữ liệu chữ. **FR-8** Khen / Chê / Phù hợp chỉ từ đánh giá đã dán; không có đánh giá thì bỏ. **FR-9** 1–3 Người đọc mục tiêu kèm lý do. **FR-10** ≥ 3 Góc viết kèm câu mở đầu. **FR-11** Danh mục gợi ý chỉ chọn trong Danh mục có sẵn; Vinh vẫn chọn tay trên form. **FR-21** Tạo lại kèm chỉ dẫn ngắn. **FR-22** mỗi phần AI là một Gợi ý duyệt riêng; sửa sau Duyệt không cần Duyệt lại.
- **NFR-1** mọi tính năng AI qua một lớp chung, không OpenAI. **NFR-2** nhà lỗi / hết hạn mức thì tự chuyển nhà khác nếu có; tất cả lỗi → thông báo tiếng Việt, dữ liệu đã nhập không mất. **NFR-3** mỗi thao tác AI xong hoặc báo lỗi trong ≤ 90 giây; rời màn quay lại vẫn thấy kết quả. **NFR-9** 0đ/tháng: nhà chính là Claude Code CLI `claude -p` theo gói thuê bao Vinh đang trả (chốt tạm 2026-11-05).
- Test không gọi AI thật (AD-16); tối đa một lần gọi `claude -p` thật để kiểm adapter trong epic.
- Không làm cào dữ liệu Shopee. Không làm Bộ nội dung, AudiencePicker/AnglePicker để chọn, CreateContentSetPanel, Cảnh báo rủi ro (Epic 5).

## Technical Decisions

- **`platform/ai` (AD-10):** `import "server-only"`; `ask({ prompt, input, images?, videoUrl?, webSearch? }) → { data, sources?, skipped }`. `data` parse bằng `prompt.output` (Zod); parse lỗi thì thử lại đúng một lần kèm lỗi Zod; vẫn lỗi → `UserError`. Năng lực thiếu ghi vào `skipped`, không ném lỗi. Hạn 90 giây cài trong `platform/ai`. Chuỗi nhà cung cấp đọc từ env, cooldown trong bộ nhớ tiến trình. Quy tắc chung ở `platform/ai/rules.ts`. Log chỉ trong `platform/ai`, không log secrets. Chế độ giả lập cho test.
- **Prompt (AD-10):** `modules/<miền>/prompts/<tên>.prompt.ts` theo `PromptDef { id, version, profile, output, system(style), user(input) }`; không gọi AI. Nghiên cứu: `modules/research/prompts/`; chấm SEO: `modules/posts/prompts/seo-review.prompt.ts`.
- **`Suggestion` (AD-9, AD-18, AD-19):** chủ `suggestions`; `kind`, `status`, `payload` (Json, Zod theo kind), `riskWarnings`, `promptId`, `promptVersion`, `editedBeforeApproval`, `parentSuggestionId`, `sources?`, `skipped?`, `firstCopiedAt?`; CHECK đúng một trong `productId`/`contentSetId`/`inspirationId`; partial unique index một `GENERATING`/`PENDING` mỗi khoá đích (viết tay, comment trong `.prisma`). Vòng đời `GENERATING → PENDING | FAILED`, `PENDING → APPROVED | REJECTED | SUPERSEDED`. `GENERATING` quá 120 giây coi là `FAILED`.
- **Điều phối (AD-9):** `modules/suggestions/actions.ts` là điểm duy nhất tạo và Duyệt; chỉ import `service.ts`, `prompts/` của `posts`, `products`, `content-sets`, `research`. Action tạo ghi `GENERATING`, trả ngay, gọi AI trong `after()`; callback `after()` chỉ ghi `Suggestion`, không `updateTag`. Duyệt chạy một transaction rồi `updateTag`.
- **Đích Duyệt (AD-19):** `RESEARCH` → `ResearchProfile` (chủ `research`, khoá `productId`), upsert; `PRODUCT_CATEGORY` → `Product.categoryId` qua `products/service.ts`. Nghiên cứu là **một** lần gọi AI trả cả hồ sơ và Danh mục gợi ý, ghi thành hai `Suggestion`; Tạo lại hồ sơ thay cả hai gợi ý đang chờ; Danh mục gợi ý không tạo lại riêng. Lựa chọn trong payload (Người đọc, Góc viết) có `id` ổn định. Sau Duyệt `payload` bất biến; sửa đích bằng form của `research`, không đổi trạng thái.
- **Màn hình (AD-12, AD-18):** đúng một `generating-poller.client.tsx` mỗi màn, `router.refresh()` mỗi 3 giây, dừng sau 120 giây; Screen đọc lại `suggestions/cms-queries`; không action đọc. `maxDuration = 120` ở `app/cms/layout.tsx` (đã có).
- **Chuyển code cũ (AD-17):** `lib/ai.ts` → `platform/ai` + prompt theo module chủ; `runSeoCheck` → `posts.checkPostSeo`; `createPost` có AI và `runThreads` chuyển khỏi `app/cms/actions.ts` (file xoá khi rỗng, bỏ khỏi `LEGACY_APP_FILES`).
- **Migration:** 4.2 `add_suggestion`, 4.3 `add_research_profile`; tạo bằng `--create-only`, đọc SQL, chỉ Postgres cục bộ 54329.

## UX & Interaction Patterns

- **StatusBadge Gợi ý AI** (UX-DR40): Đang tạo (icon quay, dừng khi reduced-motion) / Chờ duyệt / Đã duyệt / Đã từ chối / Lỗi; `SUPERSEDED` không hiện.
- **SuggestionCard** (UX-DR41): đầu thẻ tên phần + StatusBadge; chân thẻ mobile "Duyệt" rộng hết thẻ, hàng dưới "Từ chối" + "Tạo lại"; desktop ba nút căn phải; GENERATING → GeneratingIndicator; REJECTED → thu còn đầu thẻ + "Tạo lại"; FAILED → Alert `error-container` + "Tạo lại".
- **GeneratingIndicator** (UX-DR42): "Đang nghiên cứu…" + thanh tiến trình không xác định + thời gian đã chạy "0:42" + 3 dòng Skeleton; `aria-live="polite"`.
- **ResearchProfileCard** (UX-DR45): chưa có hồ sơ chỉ có nút "Nghiên cứu"; khu Thông tin (link nguồn `primary`), Mô tả ảnh, Khen / Chê / Phù hợp, Người đọc mục tiêu, Góc viết; dải `skipped` đầu thân (`surface-container-high`, icon `info`). Thẻ "Danh mục gợi ý" ngay dưới, không có Tạo lại.
- **RegenerateDialog** (UX-DR57): ô chỉ dẫn tuỳ chọn + chip "ngắn hơn", "vui hơn", "bỏ phần giá".
- **SeoCheckPanel** (UX-DR52): Card chỉ đọc, điểm `headline-lg` + gợi ý, không màu đỏ/xanh theo điểm.
- **Microcopy** (UX-DR96): ngắn, trung tính, tiếng Việt; lỗi AI nêu phần lỗi + "Bấm Tạo lại"; không lỗi tiếng Anh/mã lỗi.

## Cross-Story Dependencies

- 4.1 dựng `platform/ai` mà 4.2–4.5 dùng. 4.2 tạo `Suggestion` + poller + thẻ; 4.3 thêm `ResearchProfile` + Duyệt/Từ chối/Tạo lại; 4.4 thêm ảnh và tìm web vào cùng lần gọi; 4.5 tách Danh mục gợi ý từ cùng lần gọi thành `Suggestion` thứ hai.
- Dựa trên Epic 2: Chi tiết Sản phẩm (`/cms/san-pham/[id]`), Dữ liệu thô (`rawText`, `rawReviews`, `rawImageUrls`), Danh mục. Dựa trên Epic 3: trình soạn bài (nút Chấm SEO, Threads).
- Epic 5 dùng lại `Suggestion`, SuggestionCard, poller, RegenerateDialog, `ResearchProfile` (Người đọc, Góc viết có `id`) và thay `createPost` có AI, `runThreads` bằng luồng `Suggestion`.
