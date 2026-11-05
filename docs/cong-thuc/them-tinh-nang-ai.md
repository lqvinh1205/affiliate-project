# Công thức: thêm hoặc sửa tính năng AI

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-xx), `docs/quy-dinh.md`, `docs/nen-tang-ky-thuat/lop-ai.md`, `docs/nen-tang-ky-thuat/nextjs-16.md` · Kiểm lần cuối: 2026-11-04

Công thức theo spine; code hiện tại chưa theo, xem `docs/cong-thuc/chuyen-code-cu.md`.

Dùng khi thêm hoặc sửa một tính năng tạo nội dung bằng AI (nghiên cứu, bài web, Threads, Facebook, bình luận link, gợi ý Danh mục). Làm kèm `docs/cong-thuc/them-server-action.md` cho mọi action và query. Reviewer chấm diff theo mục **Checklist**.

## Tóm tắt cho agent

- **Mọi đầu ra AI là một `Suggestion`** ở module `suggestions`; Vinh Duyệt rồi mới vào đích (AD-9, `[QD-08]`).
- **Chỉ `platform/ai` gọi nhà cung cấp**, qua `ask()`. Không dùng OpenAI, không import SDK nhà cung cấp ở nơi khác (AD-10, `[QD-09]`, `[QD-10]`).
- **Không chờ AI trong request:** action ghi `GENERATING`, trả về ngay, gọi AI trong `after()`, hạn 90 giây (AD-18).
- **Mỗi `kind` có một đích cố định**, Duyệt là upsert; tạo lại thì gợi ý cũ `SUPERSEDED` (AD-19).
- `docs/nen-tang-ky-thuat/lop-ai.md` mô tả lớp AI cũ (`lib/ai.ts`, OpenAI); chỉ dùng cho hành vi nhà cung cấp (`[AI-07]`..`[AI-12]`), không dùng cho cấu trúc.

## Đọc trước

- Spine: AD-2, AD-6, AD-9, AD-10, AD-13, AD-15, AD-16, AD-18, AD-19, AD-22, AD-25; mục **Deferred** (nhà cung cấp AI, tìm web, đọc ảnh).
- Quy định: `[QD-08]`..`[QD-12]`. Thư viện: `[NX-07]` (`after()`), `[PR-28]`, `[BM-29]`.

## Bước 1: Khai báo tính năng AI (bắt buộc trong `## Code Map`)

Mỗi tính năng AI mới hoặc bị sửa có một khối, cộng khối khai báo action của `them-server-action.md` cho action tạo và action Duyệt:

```text
Tính năng AI: <tên ngắn, FR-xx>
- kind: <giá trị ở bảng AD-19>          - Gắn với: productId | contentSetId | inspirationId
- Đích khi Duyệt: <model> (module <chủ>) — khoá đích: <theo AD-19>
- Prompt: modules/<miền>/prompts/<tên>.prompt.ts — id: <id>, version: <n>, profile: <profile>
- Output: PromptDef.output = <Zod>; payload Suggestion theo kind (AD-9, AD-15)
- Hồ sơ phong cách: có (trường dùng) | không (AD-25)
- images: có | không · webSearch: có | không — khi bị skipped thì: <màn hình báo gì>
- HTML trong output: có → sanitizePostHtml (AD-22) | không
- Action tạo: modules/suggestions/actions.ts → <tên>; route kích hoạt: <đường dẫn>, maxDuration ≥ 90
- Màn hình hiển thị trạng thái: <màn> — GENERATING / PENDING / FAILED / APPROVED / REJECTED / SUPERSEDED
```

`kind` không có trong bảng AD-19 → BLOCKER, hỏi (`[QD-23]`); không tự thêm `kind` hay đích.

## Bước 2: Prompt

1. Tạo `modules/<miền>/prompts/<tên>.prompt.ts` theo khuôn `PromptDef { id, version, profile, output, system(style), user(input) }` (AD-10). File prompt không gọi AI (AD-5).
2. Quy tắc chung (chống bịa số liệu, giá, công dụng y khoa/mỹ phẩm tuyệt đối; tiếng Việt có dấu) lấy từ `platform/ai/rules.ts`, không viết lại trong prompt (`[QD-11]`).
3. Giọng văn, độ dài mục tiêu, câu công khai lấy từ Hồ sơ phong cách; mục tiêu mềm ≤ giới hạn cứng trong `constants.ts` của `posts`/`content-sets` (AD-25).
4. Sửa nội dung prompt thì tăng `version`; `Suggestion` lưu `promptId`, `promptVersion` (AD-9).
5. `modules/suggestions/actions.ts` dùng prompt của module khác: import thẳng `prompts/*.prompt.ts` của `posts`, `products`, `content-sets`, `research` (ngoại lệ AD-9). Module khác không import `prompts/` của nhau (AD-2).

## Bước 3: Action tạo (trong `modules/suggestions/actions.ts`)

1. `run()` → `safeParse` → service, theo AD-6. Cần `ContentSet` mà chưa có → gọi `content-sets/service.ts` tạo (AD-9).
2. `suggestions/service.ts`: gợi ý đang `GENERATING`/`PENDING` cùng khoá đích chuyển `SUPERSEDED`; gợi ý mới ở `GENERATING`, mang `parentSuggestionId` khi là tạo lại (AD-18, AD-19). Partial unique index chặn hai gợi ý đang chờ cho một khoá đích.
3. Trả `Result<T>` ngay (T gồm id của `Suggestion`), rồi trong `after()` (`[NX-07]`):
   - gọi `ask({ prompt, input, images?, webSearch? })` với hạn 90 giây; `ask` đã parse bằng `prompt.output` và tự thử lại một lần, không parse lại hay tự thử lại thêm (AD-10);
   - HTML trong `data` → `sanitizePostHtml` (AD-22, `[QD-12]`);
   - thành công → ghi `payload`, `riskWarnings` + `PENDING`; lỗi → `FAILED` kèm thông báo tiếng Việt (AD-13, AD-18);
   - `sources`, `skipped`: ghi vào `Suggestion.sources` (Zod `{ url, title }[]`) và `Suggestion.skipped` (Zod mảng `images` | `webSearch`) (AD-9);
   - Không gọi `updateTag` trong `after()`: callback chỉ ghi `Suggestion` (CMS, không cache). Chỉ action Duyệt gọi `updateTag`. Buộc phải làm mới cache trong `after()` → `revalidateTag(tag, "max")` (AD-18).
4. Không gọi AI trong transaction; transaction chỉ chứa lệnh DB (AD-10, `[PR-28]`).
5. FR-12 nhiều phần (bài web, Threads, Facebook, bình luận): mỗi phần một `Suggestion`, một lần gọi AI riêng; một phần lỗi không làm hỏng phần khác (AD-18).
6. Route kích hoạt có `maxDuration` ≥ 90 (AD-18). `app/cms/layout.tsx` hiện đặt 60 — code cũ.

## Bước 4: Duyệt và từ chối

1. Duyệt trong `modules/suggestions/actions.ts`: một transaction gồm upsert vào đích qua `service.ts` của module chủ đích (chỉ `posts`, `products`, `content-sets`, `research`) và chuyển `APPROVED`, ghi `editedBeforeApproval`; rồi `updateTag` mọi tag bị ảnh hưởng (AD-9, AD-19).
2. Upsert theo khoá đích của AD-19 → Duyệt hai lần không tạo hai bản ghi đích. Nội dung đích sửa sau Duyệt không đổi trạng thái gợi ý.
3. Output AI là dữ liệu chưa tin: `payload` đọc ra phải `parse` bằng Zod theo `kind` (AD-15, `[BM-29]`).

## Bước 5: Màn hình

1. Hiển thị mọi trạng thái của AD-18; `FAILED` có thông báo tiếng Việt và nút tạo lại; `skipped` không rỗng thì báo năng lực bị bỏ qua (FR-6, FR-7).
2. Hỏi lại trạng thái cho tới khi hết `GENERATING` (AD-18): đặt `GeneratingPoller` (`modules/suggestions/components/generating-poller.client.tsx`) trên màn khi còn `GENERATING`: gọi `router.refresh()` mỗi 3 giây, dừng sau 120 giây; `GENERATING` quá 120 giây hiển thị là `FAILED`; Screen đọc lại `cms-queries` của `suggestions`. Không viết action đọc (AD-18).
3. Hook dùng chung đặt ở `components/shared/hooks/`; `cn` ở `components/ui/lib/utils.ts` (AD-17 bước 2).
4. Copy nội dung chưa Duyệt được phép nhưng phải cảnh báo (AD-21, FR-22). Phần UI còn lại theo `docs/cong-thuc/them-man-hinh.md`.

## Kiểm chứng

- `docs/kiem-chung.md` §1 và §3 dòng "Tính năng AI", "Server Action".
- Chạy thật một lần: rời màn hình khi đang `GENERATING`, quay lại vẫn thấy kết quả; thử nhà cung cấp lỗi → `FAILED` tiếng Việt, không crash; tạo lại → gợi ý cũ `SUPERSEDED`; Duyệt hai lần → một bản ghi đích.
- Có Vitest (AD-16): test `schema.ts` cho payload theo `kind`; test tích hợp `suggestions/service.ts` cho tạo lại và Duyệt; `platform/ai` chạy chế độ giả lập, không gọi AI thật.

## Checklist

Kiến trúc AI

- [ ] Có khối khai báo tính năng AI đủ trường trong Code Map; `kind` và đích khớp bảng AD-19.
- [ ] Không import SDK nhà cung cấp hay OpenAI ngoài `platform/ai`; không thêm dịch vụ trả phí (AD-10, `[QD-09]`, `[QD-10]`).
- [ ] Prompt là `modules/<miền>/prompts/<tên>.prompt.ts` theo `PromptDef`, không gọi AI, dùng `platform/ai/rules.ts` (AD-10, `[QD-11]`).
- [ ] Giọng văn, độ dài lấy từ Hồ sơ phong cách; không vượt giới hạn cứng (AD-25).

Vòng đời

- [ ] Action tạo và Duyệt chỉ ở `modules/suggestions/actions.ts`, qua `run()`; chỉ gọi `service.ts` của `posts`, `products`, `content-sets`, `research` (AD-2, AD-6, AD-9).
- [ ] Ghi `GENERATING`, trả về ngay, gọi AI trong `after()` với hạn 90 giây; route kích hoạt `maxDuration` ≥ 90 (AD-18).
- [ ] Kết thúc ở `PENDING` hoặc `FAILED` kèm thông báo tiếng Việt; không để kẹt `GENERATING` (AD-13, AD-18).
- [ ] FR-12: mỗi phần một `Suggestion`, một lần gọi AI (AD-18).
- [ ] Tạo lại: gợi ý cũ `SUPERSEDED`, gợi ý mới có `parentSuggestionId`; tối đa một gợi ý đang chờ mỗi khoá đích (AD-19).
- [ ] Duyệt: một transaction, upsert theo khoá đích, `updateTag` mọi tag bị ảnh hưởng (AD-9, AD-19).
- [ ] Không gọi AI trong transaction (AD-10, `[PR-28]`).

Dữ liệu và nội dung

- [ ] Không có nội dung AI nào xuất bản khi chưa Duyệt (`[QD-08]`).
- [ ] HTML từ AI đi qua `sanitizePostHtml` (AD-22, `[QD-12]`).
- [ ] `payload` đọc ra được `parse` bằng Zod theo `kind` (AD-15, `[BM-29]`).
- [ ] Chấm SEO dùng `posts.checkPostSeo` (không lưu, không Suggestion); mọi đầu ra AI khác là `Suggestion` (AD-9).

Test và quy định

- [ ] Có Vitest: test schema payload và service tạo lại/Duyệt; không gọi AI thật (AD-16).
- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
