---
title: Sprint Change Proposal — Nhập Bài web từ URL
status: final
created: 2026-11-09
mode: batch
scope: minor
---

# Sprint Change Proposal — Nhập Bài web từ URL

## 1. Tóm tắt vấn đề

**Lý do thay đổi:** yêu cầu mới của Vinh (2026-11-09), PRD chưa có.

Khi tạo Bài web, Vinh muốn dán URL một bài viết bên ngoài. Hệ thống lấy tiêu đề, tóm tắt và thân bài về điền sẵn vào trình soạn. Sau đó Vinh tự sửa tay, hoặc bấm **"AI chỉnh sửa"** để AI viết lại thành bài mới theo giọng của trang.

Hiện tại chỉ có hai đường tạo Bài web: tạo bản nháp trống bằng tay (`/cms/bai-viet/moi`), hoặc qua Bộ nội dung (bắt đầu từ Sản phẩm hay Cảm hứng). Kho Cảm hứng (Epic 10) cũng nhận URL, nhưng chỉ cho ra từ khoá và dàn ý rồi đi qua Sản phẩm. Vinh đã chọn **không** mở rộng Cảm hứng mà làm đường riêng ngay trong trình soạn bài.

**Các quyết định Vinh đã chốt (2026-11-09):**

| Câu hỏi | Chọn |
| --- | --- |
| Lấy nội dung bằng cách nào | Qua AI: `ask()` bật đọc web, nhà `claude-cli` tự đọc trang. Máy chủ **không** tự tải URL, không thêm thư viện |
| Kết quả đi vào bài thế nào | Điền sẵn vào form (chưa lưu). Vinh có thể bấm "AI chỉnh sửa" để AI viết lại, cũng điền vào form. Lưu form như bài tự viết, không qua Gợi ý AI / Duyệt |
| Nhập ở đâu | Ngay ở màn Tạo bài `/cms/bai-viet/moi`: dán URL → form bài đầy đủ hiện ra đã điền sẵn → bấm "Lưu nháp" mới tạo bài. Không tạo bản nháp trống trước |
| Ảnh của bài gốc | Chỉ liệt kê link ảnh để Vinh tự lưu và tải lên. Không tự tải ảnh, không đưa ảnh vào thân bài (AD-22) |
| Cách duyệt đề xuất | Gộp một lần |

## 2. Phân tích tác động

### Epic

- Epic 1–10 không đổi; không story nào phải làm lại hay quay lui.
- Thêm **Epic 11: Nhập Bài web từ URL**, gồm 2 story. Không gộp vào Epic 3 vì Epic 3 đang chờ review gộp.
- Phụ thuộc: Epic 3 (trình soạn bài), Epic 4 (`platform/ai`), Epic 5 (Hồ sơ phong cách Website, RiskWarningList). Tất cả đã có code.

### Tài liệu

| Tài liệu | Tác động |
| --- | --- |
| PRD | Thêm FR-39, FR-40 (§4.6), R-9 (§6), một gạch ở FR-22, một dòng ở §8.2 |
| Spine | AD-9: thêm ngoại lệ có tên thứ hai (cùng kiểu với `checkPostSeo`); thêm một dòng vào Capability Map |
| UX (EXPERIENCE.md) | Màn Soạn/sửa Bài web có thêm nút "Nhập từ URL" và "AI chỉnh sửa" |
| epics.md | Thêm FR-39/40 vào danh mục yêu cầu, Coverage Map, UX-DR72, và Epic 11 |
| sprint-status.yaml | Thêm `epic-11` và hai story ở trạng thái `backlog` |
| AGENTS.md, docs/ | Không đổi. Luật hiện có (`ask()`, `sanitizePostHtml`, `run()`) đã đủ |
| Schema DB | **Không đổi.** Không thêm cột, không cần migration |

### Kỹ thuật

- **Không có SSRF ở máy chủ:** URL chỉ được chuyển cho AI dưới dạng chữ trong prompt; công cụ `WebFetch` của `claude -p` mới là bên đọc trang. Server Action chỉ validate URL có dạng `http(s)`.
- **Đồng bộ ≤ 90 giây:** giống `checkPostSeo`, action gọi `ask()` và chờ kết quả, không dùng `after()`/poller (AD-18 chỉ áp cho `Suggestion`). Trong lúc chờ, nút hiện trạng thái đang xử lý (NFR-3).
- **Giới hạn:** `WebFetch` có thể tóm tắt thay vì trả nguyên văn, và không đọc được trang cần đăng nhập hoặc render bằng JS. Prompt yêu cầu giữ nguyên văn; khi AI báo không đọc được thì hiện `UserError` tiếng Việt và gợi ý copy nội dung dán vào trình soạn.
- **Nhà AI không hỗ trợ đọc web** (ví dụ `fake` hay nhà dự phòng sau này): `skipped` chứa `webSearch` thì ném `UserError` "Nhà AI hiện tại không đọc được trang web". Test dùng `AI_PROVIDERS=fake`.
- HTML trả về đi qua `sanitizePostHtml` trước khi về client (AD-22). Link và ảnh bị lọc khỏi thân bài; link ảnh trả riêng thành danh sách.
- **Lưu không cần đường mới:** `posts.createPostDraft` (đã có) nhận đủ trường của `postDraftInputSchema`. Form nhập ở `/cms/bai-viet/moi` gọi nó khi Vinh bấm "Lưu nháp" rồi chuyển sang `/cms/bai-viet/[id]` như hiện nay. Chưa lưu thì chưa có bản ghi nào.

## 3. Hướng đi đề xuất

**Điều chỉnh trực tiếp:** thêm FR và một epic nhỏ, không quay lui, không cắt MVP.

- **Công sức:** thấp. Gồm 2 prompt, 2 action, 2 dialog nhỏ trong trình soạn, không migration.
- **Rủi ro:** thấp về kỹ thuật. Rủi ro chính là **bản quyền và nội dung trùng lặp** (R-9): giảm bằng nút "AI chỉnh sửa" luôn có sẵn và một dòng nhắc trong dialog nhập.
- **Tiến độ:** xếp vào giai đoạn 1.5, sau Epic 10. Không chặn việc gì đang dở.

## 4. Đề xuất sửa chi tiết

### 4.1 PRD — `prds/prd-affiliate-project-2026-11-03/prd.md`

**§4.6, thêm sau FR-27:**

```
#### FR-39: Nhập Bài web từ URL
Ở màn Tạo Bài web, người vận hành có thể dán URL một bài viết bên ngoài để AI đọc trang và điền sẵn tiêu đề, tóm tắt và thân bài vào form bài đầy đủ (chưa lưu). Bài chỉ được tạo (Nháp) khi Vinh bấm Lưu; không tạo bản nháp trống trước.
- Thân bài chỉ giữ định dạng website hỗ trợ và được làm sạch (AD-22). Link và ảnh của bài gốc không vào thân bài; link ảnh được liệt kê riêng để Vinh tự lưu và tải lên nếu muốn. Hệ thống không tự tải ảnh về.
- Nhập lại URL khác khi form đã có nội dung thì hỏi xác nhận trước khi ghi đè.
- Không đọc được trang (cần đăng nhập, bị chặn, render bằng JS) thì báo rõ bằng tiếng Việt và gợi ý dán nội dung tay.
- Nội dung nhập về không tự lưu; Vinh lưu form như bài tự viết.

#### FR-40: AI chỉnh sửa nội dung trong trình soạn
Người vận hành có thể bấm "AI chỉnh sửa", kèm chỉ dẫn ngắn tuỳ chọn (ví dụ "viết lại cho người ở trọ"), để AI viết lại tiêu đề, tóm tắt và thân bài đang có trong form theo Hồ sơ phong cách Website (FR-18), kèm Cảnh báo rủi ro (FR-23). Kết quả điền vào form (chưa lưu).
- Có ở form nhập từ URL (trước khi lưu) và ở trình soạn Bài web (bài đã có), cho cả nội dung nhập về lẫn nội dung Vinh tự viết.
- Hoàn tác được về nội dung trước lần chỉnh sửa gần nhất, khi chưa lưu.
```

**§4.5 FR-22, thêm một gạch đầu dòng:**

```
- Ngoại lệ: kết quả của FR-39 và FR-40 điền thẳng vào form soạn bài và được coi là nội dung Vinh tự viết khi Vinh lưu; không tạo Gợi ý AI.
```

**§6, thêm:**

```
- **R-9. Bản quyền và nội dung trùng lặp** khi nhập bài từ trang khác (FR-39). Đăng gần nguyên văn có thể vi phạm bản quyền và bị Google coi là nội dung trùng lặp. **Giảm thiểu:** dialog nhập nhắc "Viết lại trước khi xuất bản"; "AI chỉnh sửa" (FR-40) luôn có sẵn. Vinh chịu trách nhiệm nội dung xuất bản.
```

**§8.2, thêm:** `- Nhập Bài web từ URL và AI chỉnh sửa (FR-39, FR-40). *(thêm 2026-11-09)*`

**Frontmatter:** `updated: 2026-11-09`.

### 4.2 Spine — `ARCHITECTURE-SPINE.md`

**AD-9 Rule.** OLD:

```
Ngoại lệ có tên duy nhất: chấm điểm SEO là `posts.checkPostSeo` (action CMS qua `run()`), gọi `platform/ai`, trả báo cáo cho màn hình, không lưu, không qua Duyệt.
```

NEW:

```
Ngoại lệ có tên (đều là action CMS của `posts` qua `run()`, gọi `platform/ai` đồng bộ, trả kết quả cho màn hình, không lưu, không tạo `Suggestion`, không `updateTag`): chấm điểm SEO `posts.checkPostSeo`; nhập bài từ URL `posts.importPostFromUrl` (FR-39, `ask` với `webSearch`, máy chủ không tự tải URL); AI chỉnh sửa trong trình soạn `posts.rewritePostDraft` (FR-40). Kết quả hai action sau điền vào form soạn bài, HTML qua AD-22 trước khi trả về; Vinh lưu như nội dung tự viết.
```

**Capability Map, thêm dòng:** `| FR-39, FR-40 Nhập từ URL, AI chỉnh sửa | posts, platform/ai | AD-9 (ngoại lệ có tên), AD-10, AD-22 |`

Ghi vào `.memlog.md` của spine: `(change 2026-11-09) AD-9 thêm ngoại lệ có tên importPostFromUrl, rewritePostDraft — Sprint Change Proposal 2026-11-09`.

### 4.3 UX — `EXPERIENCE.md`

**Bảng màn hình, dòng "Soạn / sửa Bài web".** Màn `/cms/bai-viet/moi` có hai cách: form "Tạo bản nháp" như cũ, và khối **"Nhập từ URL"** (ImportFromUrl, FR-39) ở đầu màn. Màn `/cms/bai-viet/[id]` thêm nút **"AI chỉnh sửa"** (AiRewriteDialog, FR-40). Thêm FR-39, FR-40 vào cột FR.

**Mẫu trạng thái, thêm:**

- *ImportFromUrl (`/cms/bai-viet/moi`):* ô URL + dòng nhắc "Nội dung lấy từ trang khác — hãy viết lại trước khi xuất bản". Nút "Lấy nội dung" → "Đang đọc trang…" (có thể tới 90 giây). Thành công: màn chuyển sang **form bài đầy đủ** (Loại bài, Danh mục, tiêu đề, tóm tắt, PostEditor, ảnh đại diện, thẻ, SEO) đã điền sẵn, có nút "AI chỉnh sửa" và khối "Ảnh trong bài gốc" (danh sách link, mỗi link có nút copy) cạnh ô ảnh đại diện; nút dính đáy "Lưu nháp" → tạo bài rồi chuyển sang `/cms/bai-viet/[id]`. UnsavedChangesGuard bật ngay khi form được điền. Lấy lại từ URL khác khi form đã có nội dung → ConfirmDialog. Lỗi: thông báo dưới ô URL, giữ URL đã nhập; vẫn dùng được form "Tạo bản nháp" thường.
- *AiRewriteDialog:* ô chỉ dẫn tuỳ chọn, nút "Viết lại" → "AI đang viết…". Thành công: điền form, Toast "Đã viết lại — chưa lưu" kèm "Hoàn tác"; Cảnh báo rủi ro hiện qua RiskWarningList.

### 4.4 epics.md

- **Requirements Inventory › FR:** thêm FR-39, FR-40 (tóm tắt như PRD).
- **Dòng giai đoạn (dòng 80):** GĐ1.5 thêm FR-39, FR-40.
- **Ánh xạ FR → AD:** thêm `| FR-39, FR-40 | posts, platform/ai | AD-9, AD-10, AD-22 | — |`.
- **UX-DR72:** thêm câu "Nút 'Nhập từ URL' (FR-39) và 'AI chỉnh sửa' (FR-40) mở dialog; kết quả điền form chưa lưu, UnsavedChangesGuard bắt như sửa tay."
- **FR Coverage Map:** thêm FR-39, FR-40 → Epic 11; dòng giai đoạn: GĐ1.5 = Epic 8–11.
- **Epic List, thêm:**

```
### Epic 11: Nhập Bài web từ URL (GĐ1.5)
Vinh dán URL một bài bên ngoài, AI điền sẵn nội dung vào trình soạn, rồi Vinh sửa tay hoặc nhờ AI viết lại thành bài mới. FR-39, FR-40. Cần Epic 3, 4, 5.
```

- **Thân epic, thêm sau Epic 10:**

```
## Epic 11: Nhập Bài web từ URL (giai đoạn 1.5)

Vinh dán URL một bài viết bên ngoài; AI đọc trang và điền sẵn tiêu đề, tóm tắt, thân bài vào trình soạn; Vinh sửa tay hoặc bấm "AI chỉnh sửa". Không đổi schema. Cần Epic 3, Epic 4, Epic 5.

### Story 11.1: Nhập nội dung từ URL vào trình soạn

As a Vinh,
I want dán URL một bài viết để tiêu đề, tóm tắt và thân bài được điền sẵn,
So that tôi không phải copy tay từng đoạn.

**Acceptance Criteria:**

**Given** `/cms/bai-viet/moi`
**When** dán URL `http(s)` vào khối "Nhập từ URL", chạm "Lấy nội dung"
**Then** `posts.importPostFromUrl` qua `run()` validate URL (Zod ở `posts/schema.ts`, độ dài ở `posts/constants.ts`), gọi `ask()` với prompt `modules/posts/prompts/import-post.prompt.ts` và `webSearch: true`; máy chủ không tự fetch URL (spine AD-9 ngoại lệ có tên); chưa ghi gì vào DB
**And** kết quả `{ title, summary, contentHtml, imageUrls[] }`: `contentHtml` qua `sanitizePostHtml` trước khi trả về; tiêu đề/tóm tắt cắt theo giới hạn trong `posts/constants.ts`
**And** màn hiện form bài đầy đủ đã điền sẵn (Loại bài, Danh mục, tiêu đề, tóm tắt, PostEditor, ảnh đại diện, thẻ, SEO) theo `postDraftInputSchema`, qua CmsForm + UnsavedChangesGuard; khối "Ảnh trong bài gốc" liệt kê `imageUrls` (link + nút copy), không tự tải ảnh, không gán ảnh đại diện

**Given** form nhập đã điền
**When** chạm "Lưu nháp"
**Then** gọi `posts.createPostDraft` (đã có) với giá trị form, rồi chuyển sang `/cms/bai-viet/[id]`; không có bản nháp trống nào được tạo trước đó

**Given** form nhập đã có nội dung
**When** lấy lại từ URL khác
**Then** ConfirmDialog "Ghi đè nội dung đang soạn?" trước khi gọi action

**Given** trang không đọc được (AI báo không đọc được, hoặc `skipped` chứa `webSearch`)
**When** action kết thúc
**Then** `UserError` tiếng Việt tại dialog, gợi ý copy nội dung dán vào trình soạn; URL vẫn giữ trong ô

**And** dialog có dòng nhắc viết lại trước khi xuất bản (R-9); test prompt + action với `AI_PROVIDERS=fake`

### Story 11.2: AI chỉnh sửa nội dung trong trình soạn

As a Vinh,
I want bấm "AI chỉnh sửa" kèm chỉ dẫn ngắn để AI viết lại bài đang soạn theo giọng của trang,
So that bài nhập về thành bài của tôi.

**Acceptance Criteria:**

**Given** form nhập từ URL ở `/cms/bai-viet/moi` (Story 11.1) hoặc trình soạn `/cms/bai-viet/[id]`, thân bài không rỗng
**When** chạm "AI chỉnh sửa", nhập chỉ dẫn tuỳ chọn, chạm "Viết lại"
**Then** `posts.rewritePostDraft` qua `run()` gửi tiêu đề, tóm tắt, thân bài hiện tại (chưa cần lưu) + chỉ dẫn; prompt `modules/posts/prompts/rewrite-post.prompt.ts` lấy Hồ sơ phong cách Website và `platform/ai/rules.ts`; kết quả `{ title, summary, contentHtml, riskWarnings }`, `contentHtml` qua `sanitizePostHtml`
**And** form được điền, chưa lưu; Toast "Đã viết lại" có "Hoàn tác" trả form về đúng nội dung trước lần viết lại; Cảnh báo rủi ro hiện qua RiskWarningList

**Given** AI lỗi hoặc quá 90 giây
**When** action kết thúc
**Then** `UserError` tiếng Việt, nội dung form không đổi (NFR-2, NFR-3)

**And** test prompt + action với `AI_PROVIDERS=fake`
```

### 4.5 sprint-status.yaml

```
  epic-11: backlog
  11-1-nhập-nội-dung-từ-url-vào-trình-soạn: backlog
  11-2-ai-chỉnh-sửa-nội-dung-trong-trình-soạn: backlog
  epic-11-retrospective: optional
```

## 5. Bàn giao

- **Mức thay đổi:** nhỏ (Minor). Không cần lên lại kế hoạch hay đổi kiến trúc lớn.
- **Sau khi Vinh duyệt:**
  1. Áp các sửa ở §4.1–4.5 vào PRD, spine (kèm `.memlog.md`), EXPERIENCE.md, epics.md, sprint-status.yaml.
  2. `bmad-build` làm Story 11.1 và 11.2 theo lượt gộp (code cả hai rồi review/test một lần).
- **Tiêu chí thành công:** ở `/cms/bai-viet/moi` dán một URL blog công khai → form bài đầy đủ được điền trong ≤ 90 giây, chưa có bản ghi nào cho tới khi bấm "Lưu nháp", thân bài không còn link/ảnh, có danh sách link ảnh; "AI chỉnh sửa" viết lại và hoàn tác được; `npm test`, `npm run test:db`, `npx tsc --noEmit`, `npm run lint` đều qua.
