---
title: 'Lượt gộp Epic 11: Nhập Bài web từ URL — Story 11.1–11.2'
type: 'feature'
created: '2026-11-09'
status: 'done'
baseline_commit: 'fc2fc50f856d92c4bdb23efc547c4796f73a0b41'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
  - '{project-root}/docs/cong-thuc/them-man-hinh.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tạo Bài web chỉ có hai đường: nháp trống hoặc qua Bộ nội dung. Vinh muốn dán URL một bài ngoài, có sẵn nội dung để sửa thành bài mới (FR-39, FR-40).

**Approach:** Ở `/cms/bai-viet/moi`, khối "Nhập từ URL" gọi `posts.importPostFromUrl` (AI đọc trang qua `ask` + `webSearch`). Form bài hiện ra, điền sẵn; "Lưu nháp" gọi `createPostDraft` có sẵn. Nút "AI chỉnh sửa" (`posts.rewritePostDraft`) có ở form nhập và trình soạn `/cms/bai-viet/[id]`. Cả hai action là ngoại lệ có tên của AD-9 giống `checkPostSeo`: chạy đồng bộ, không lưu, không `Suggestion`, không `updateTag`.

**Quyết định (Vinh 2026-11-09):** form nhập ở `/moi` làm gọn gồm Loại bài, Danh mục, tiêu đề, tóm tắt, ảnh đại diện, thân bài. Thẻ, SEO, Sản phẩm thêm ở trình soạn sau khi Lưu nháp; sửa câu tương ứng trong EXPERIENCE.md, epics.md và epic-11-context.md. Giữ một spec cho cả 11.1 và 11.2 dù dài hơn 1600 token.

## Boundaries & Constraints

**Always:** action qua `run()` → `safeParse` → `ask()`. HTML trả về đi qua `sanitizePostHtml`, tiêu đề và tóm tắt cắt theo giới hạn trong `posts/constants.ts`. Mọi lỗi là `UserError` tiếng Việt. Prompt nằm ở `modules/posts/prompts/`, quy tắc chung lấy từ `platform/ai/rules.ts`. Rewrite đọc Hồ sơ phong cách Website và có `RISK_WARNING_RULES`. Kết quả chỉ điền form; DB chưa có gì cho tới khi Vinh lưu. Ô nhập có dòng nhắc R-9. Test dùng `AI_PROVIDERS=fake`.

**Never:** máy chủ tự `fetch` URL; thêm thư viện; đổi schema/migration; tự tải ảnh hay gán ảnh đại diện; đưa link/ảnh vào thân bài; tạo `Suggestion`/`ContentSet`; sửa luồng Bộ nội dung.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nhập OK | URL blog công khai | Form hiện, đã điền tiêu đề, tóm tắt, thân bài; khối "Ảnh trong bài gốc" liệt kê link http(s), không trùng, ≤ 20 | — |
| URL sai | `abc`, `ftp://…`, > 2000 ký tự | Không gọi AI | Lỗi dưới ô URL |
| Không đọc được trang | AI trả `readable: false` hoặc thân bài sau sanitize rỗng | Form cũ (nếu có) giữ nguyên | "Không đọc được nội dung trang này. Thử copy nội dung rồi dán vào trình soạn." |
| Nhà AI không đọc web | `ask` trả `sources === undefined` | như trên | "Nhà AI hiện tại không đọc được trang web." |
| Nhập lại | Form nhập đang hiện | ConfirmDialog "Ghi đè nội dung đang soạn?" trước khi gọi | — |
| Rewrite OK | Thân bài có chữ + chỉ dẫn tuỳ chọn | Tiêu đề, tóm tắt, thân bài thay mới, chưa lưu; Toast "Đã viết lại — chưa lưu" + "Hoàn tác"; RiskWarningList hiện cảnh báo | — |
| Rewrite thân rỗng | Thân bài trống | Không gọi AI | "Thân bài đang trống — viết hoặc nhập nội dung trước." |
| AI lỗi/quá hạn | — | Form không đổi | `UserError` của `ask` (AI_UNAVAILABLE / AI_BAD_OUTPUT) |
| Chưa đăng nhập | — | Không gọi AI | "Bạn cần đăng nhập CMS" |

</frozen-after-approval>

## Code Map

**Action**

```text
Action: importPostFromUrl            - Module: posts · File: modules/posts/actions.ts · Loại: CMS (AD-9 ngoại lệ có tên)
- Input: importPostInputSchema { url: http(s), ≤ POST_IMPORT_URL_MAX = 2000 }
- Output: Result<{ title; excerpt; content; imageUrls: string[] }>
- Quyền: run() · Service: không (không ghi DB) · Bảng ghi: không · updateTag: không
- UserError: URL sai (Zod), IMPORT_UNREADABLE, IMPORT_NO_WEB, lỗi của ask · Gọi từ: post-import.client.tsx

Action: rewritePostDraft             - Module: posts · File: modules/posts/actions.ts · Loại: CMS (AD-9 ngoại lệ có tên)
- Input: rewritePostInputSchema { title ≤ POST_TITLE_MAX, excerpt ≤ POST_EXCERPT_MAX, content ≤ POST_CONTENT_MAX,
  instruction ≤ POST_REWRITE_INSTRUCTION_MAX = 200 }
- Output: Result<{ title; excerpt; content; riskWarnings: RiskWarning[] }>
- Quyền: run() · Service: không · Bảng ghi: không · updateTag: không
- UserError: REWRITE_EMPTY (visibleText rỗng), lỗi của ask · Gọi từ: post-ai-rewrite.client.tsx
```

**Tính năng AI** (ngoại lệ AD-9: không `kind`, không đích, không Duyệt, không `after()`; chạy đồng bộ ≤ 90s, `maxDuration = 120` ở `app/cms/layout.tsx`)

- `posts.import-post` v1, profile `fast`. Output `{ readable, title, excerpt, content, imageUrls }`. Không dùng Hồ sơ phong cách. `webSearch: true`; khi `sources === undefined` thì báo IMPORT_NO_WEB. Có HTML → sanitize. Prompt yêu cầu: dùng WebFetch đọc đúng URL; chép nguyên văn thân bài, bỏ menu, quảng cáo, bình luận; chỉ dùng thẻ h2, h3, p, ul, ol, li, strong, em, blockquote; không viết thêm; liệt kê URL ảnh trong thân bài; không đọc được thì `readable: false`.
- `posts.rewrite-post` v1, profile `quality`. Output `{ title, excerpt, content, riskWarnings }`. Hồ sơ phong cách Website lấy qua `getStyleProfileForCms("WEBSITE")` (T0, posts ở T2 được import), dùng cùng các trường với `web-post.prompt.ts`. Không `webSearch`. Có HTML → sanitize.
- Mẫu: `modules/posts/prompts/web-post.prompt.ts` (khuôn PromptDef, `toWebPostPayload` clip/sanitize); `checkPostSeo` trong `modules/posts/actions.ts:81` (action đồng bộ + test `actions.db.test.ts:322`).

**UI**

| Phần UI | Quyết định | Vị trí |
|---|---|---|
| Khối Nhập từ URL (ô URL, nhắc R-9, nút, lỗi, ConfirmDialog, bọc `children` = NewPostForm khi chưa nhập) | tạo mới | `modules/posts/components/post-import.client.tsx` |
| Form bài từ nội dung nhập (CmsForm + `postDraftInputSchema`, "Lưu nháp" → `createPostDraft` → `router.push(/cms/bai-viet/[id])`, khối "Ảnh trong bài gốc" với CopyButton) | tạo mới | `modules/posts/components/import-post-form.client.tsx` |
| Nút + Dialog AI chỉnh sửa (ô chỉ dẫn, "Viết lại", Toast Hoàn tác) | tạo mới | `modules/posts/components/post-ai-rewrite.client.tsx` |
| Trường, PostBodyEditor, RiskWarningList, UploadField, ConfirmDialog, CopyButton, Dialog, callAction | dùng lại | `modules/posts/components/*`, `components/shared/*`, `components/ui/dialog.tsx` |
| PostForm: thêm nút AI chỉnh sửa trên thân bài; cảnh báo hiện = cảnh báo của rewrite ?? prop `riskWarnings` | mở rộng | `modules/posts/components/post-form.client.tsx` (`PostAiActions` thêm `rewrite`) |

**Lưu ý chặn:** `PostBodyEditor` chỉ đọc `value` lúc mount, nên sau khi rewrite, hoàn tác hay nhập lại phải đổi `key` của editor để nó mount lại với nội dung mới. Form dùng `setValue(..., { shouldDirty: true })` để UnsavedChangesGuard bắt được.

**Trạng thái màn:** đang đọc trang ("Đang đọc trang…", nút tắt), lỗi dưới ô URL, đã nhập (form hiện, NewPostForm ẩn), đang viết lại ("AI đang viết…"), lỗi rewrite (Toast), đang lưu (CmsForm). Token màu và chữ theo `PostForm` và `PostSeoCheck`.

## Tasks & Acceptance

**Execution:**
- [x] `modules/posts/constants.ts` -- thêm `POST_IMPORT_URL_MAX`, `POST_IMPORT_IMAGES_MAX = 20`, `POST_REWRITE_INSTRUCTION_MAX` -- giới hạn một nơi (AD-25)
- [x] `modules/posts/schema.ts` -- `importPostInputSchema`, `rewritePostInputSchema` + type -- AD-14
- [x] `modules/posts/prompts/import-post.prompt.ts` + `rewrite-post.prompt.ts` -- PromptDef + hàm `toImportedPost`, `toRewrittenPost` (sanitize, clip, lọc imageUrls http(s)/không trùng/≤ 20, `cleanRiskWarnings`) -- như `toWebPostPayload`
- [x] `modules/posts/actions.ts` -- `importPostFromUrl`, `rewritePostDraft` theo khối khai báo -- AD-9
- [x] `modules/posts/components/post-ai-rewrite.client.tsx`, `import-post-form.client.tsx`, `post-import.client.tsx` -- như bảng UI
- [x] `modules/posts/components/post-form.client.tsx` -- nút AI chỉnh sửa, key editor, cảnh báo -- FR-40
- [x] `app/cms/bai-viet/_components/post-create-screen.tsx` -- bọc NewPostForm trong PostImport, truyền actions + categories; `post-edit-screen.tsx` -- `ai={{ seoCheck, rewrite: rewritePostDraft }}`
- [x] `modules/posts/prompts/*.prompt.test.ts`, `modules/posts/schema.test.ts`, `modules/posts/actions.db.test.ts` -- test các dòng của I/O Matrix (fake AI; kiểm `webSearch: true`, không `Suggestion`, `updatedTags` rỗng, HTML đã lọc `<a>`/`<img>`)

**Acceptance Criteria:**
- Given form nhập đã điền, when bấm "Lưu nháp", then tạo đúng một Post `DRAFT` qua `createPostDraft` rồi chuyển sang `/cms/bai-viet/[id]`; trước bước này `db.post.count()` không đổi.
- Given `/cms/bai-viet/[id]`, when AI chỉnh sửa rồi "Hoàn tác", then tiêu đề, tóm tắt, thân bài về đúng giá trị trước đó.
- Given chưa nhập gì ở `/moi`, then form "Tạo bản nháp" cũ hoạt động như trước.

## Spec Change Log

## Review Triage Log

Lượt 1 (2026-11-09), 4 lớp: blind-hunter (BH), edge-case (EC), verification-gap (VG), project-conventions (PC).

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Hướng |
|---|---|---|---|---|---|
| 1 | EC, BH, PC | Nhà có đọc web nhưng `sources` rỗng → vẫn nhận nội dung (AI có thể tự bịa) | medium | `ask.ts:150` trả `sources: []` + `skipped` có `webSearch`; action chỉ kiểm `undefined` | patch: `sources.length === 0` → IMPORT_UNREADABLE + test |
| 2 | VG | Thiếu test action cho rewrite thân rỗng sau lọc → AI_BAD_OUTPUT | low | chỉ có test ở helper | patch: thêm test db |
| 3 | EC | Đổi `key` editor khi `highlight` còn giá trị → effect chạy lại lúc mount, toast "Không còn thấy câu này" giả | low | effect phụ thuộc `[editor, highlight?.key]`, chạy khi editor mount | patch: xoá highlight khi điền form |
| 4 | BH, PC | Logic rewrite/undo chép nguyên ở hai form ([QU-28]) | medium | sửa lỗi #3 phải sửa hai nơi | patch: hook `usePostRewrite` |
| 5 | PC | Kiểu `ImportPostInput`/`RewritePostInput` trùng tên ở prompt và schema, khác hình | medium | import nhầm file sai kiểu `instruction` mà không báo | patch: đổi tên `…PromptInput` |
| 6 | BH, PC | Kiểu kết quả khai ba nơi (action inline, `ImportedPost`, `RewriteResult`) | medium | đổi action thì component không lỗi biên dịch | patch: một nguồn ở `types.ts` |
| 7 | BH, PC | Prompt nhập gọi đích danh "WebFetch" (AD-10) | low | chỉ đúng với `claude-cli`; sửa một câu | patch: viết trung tính |
| 8 | BH | Tóm tắt AI trả trống xoá tóm tắt cũ, tiêu đề thì giữ | low | `toRewrittenPost` chỉ fallback tiêu đề | patch: fallback tóm tắt |
| 9 | PC | Nhập thành công không có `toast.success` ([GD-40]); file form 256 dòng ([QU-28]) | low | — | patch: toast + tách `SourceImages` |
| 10 | EC, BH | URL localhost/IP nội bộ chuyển cho WebFetch | low | chỉ Vinh (admin) dùng được qua `run()`; chặn host cần thêm nhánh kiểm | reject (low, thêm phức tạp) |
| 11 | EC, BH | Cắt HTML sau sanitize có thể đứt thẻ | low | chỉ khi > 200.000 ký tự; cùng mẫu `web-post` đang có | reject (hiếm, sửa cần thêm xử lý) |
| 12 | EC, BH, VG | Hoàn tác ở toast cũ sau lần viết lại thứ hai lệch cảnh báo; hoàn tác ghi đè sửa tay | low | mỗi lần viết lại mất 30–90 giây > toast 10 giây; hoàn tác là ý định người dùng | reject |
| 13 | EC, BH | Nhập lần đầu xoá dữ liệu đang gõ ở form "Tạo bản nháp" | low | form đó chỉ có Loại bài/Danh mục/chủ đề; chặn cần nâng state | reject |
| 14 | EC, BH | Sửa form trong lúc nhập lại bị ghi đè | false | Vinh đã bấm "Ghi đè" ở ConfirmDialog trước khi gọi | reject |
| 15 | EC | Tiêu đề/tóm tắt quá dài → toast lỗi chung | low | form đã báo lỗi tại trường khi vượt giới hạn | reject |
| 16 | BH | Mất URL nguồn sau khi lưu, trình soạn không nhắc viết lại | low | R-9 (PRD) chỉ yêu cầu nhắc ở màn nhập + nút AI chỉnh sửa | reject (ngoài intent) |
| 17 | PC | Tên `PostImport`/`PostAiRewrite` thiếu hậu tố vai trò | false | cùng kiểu `PostSeoCheck`, `PostActionBar` đang có | reject |
| 18 | PC | `clip` lặp 3 lần trong `posts/prompts`; thứ tự khai báo [QU-26] | low | chép theo khuôn `web-post.prompt.ts` | reject (thẩm mỹ) |
| 19 | PC | Lỗi nhập hiện dưới ô URL thay vì toast (AD-14) | false | EXPERIENCE.md và spec quy định hiện dưới ô URL | reject |
| 20 | VG | Logic client (hoàn tác, guard, ConfirmDialog) không có test tự động | medium | repo không có hạ tầng test component | defer |
| 21 | PC | `docs/cong-thuc/them-tinh-nang-ai.md` chưa theo AD-9 mới | low | tài liệu quy tắc agent | defer |

## Verification

**Commands:**
- `npm test` -- qua
- `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- qua
- `npx tsc --noEmit` và `npm run lint` -- không lỗi

**Manual checks:**
- `npm run dev` với `AI_PROVIDERS=claude-cli`: nhập một URL blog công khai ở `/cms/bai-viet/moi`, xem 360px và desktop, sáng/tối; thử URL cần đăng nhập → thông báo lỗi; AI chỉnh sửa + Hoàn tác ở form nhập và màn sửa.

## Implementation Notes
- Thông báo lỗi `IMPORT_UNREADABLE`, `IMPORT_NO_WEB`, `REWRITE_EMPTY` đặt ở `modules/posts/constants.ts` (file `"use server"` chỉ export được hàm async).
- Rewrite trả thân bài rỗng sau sanitize → `AI_BAD_OUTPUT` (form không đổi); tiêu đề AI trả trống → giữ tiêu đề cũ.
- `ImportPostForm` mount với nội dung nhập làm giá trị rồi `form.reset(BLANK, { keepValues: true })` để form dirty ngay (UnsavedChangesGuard bật) mà PostEditor vẫn đọc được nội dung lúc mount.
- Hoàn tác khôi phục cả cảnh báo rủi ro trước lần viết lại gần nhất.
