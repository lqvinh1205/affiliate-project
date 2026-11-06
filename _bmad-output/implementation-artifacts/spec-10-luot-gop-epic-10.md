---
title: 'Lượt gộp Epic 10: Kho Cảm hứng — Story 10.1–10.2'
type: 'feature'
created: '2026-11-06'
status: 'review'
review_loop_iteration: 0
baseline_revision: '8fb16ea651920527d0ef23b3b2d5c6337a85de49'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
  - '{project-root}/docs/cong-thuc/them-tinh-nang-ai.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/nen-tang-ky-thuat/nextjs-16.md'
warnings: []
deferred:
  - 'Khung hình của file video chưa gửi cho AI (claude -p không đọc video) — deferred-work.md'
---

<intent-contract>

## Intent

**Problem:** Vinh thấy video mẹo hay ban ngày (TikTok, Pinterest) nhưng chưa có chỗ lưu nhanh, và chưa có đường đi từ ý tưởng đó tới Sản phẩm + Bộ nội dung. Epic 10 gồm Story 10.1–10.2 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai 10.1 → 10.2, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). Module mới `inspirations` (T1) chủ bảng `Inspiration` (AD-4); trạng thái lưu chỉ *Mới* / *Bỏ qua*, *Đã dùng* suy ra từ `ContentSet.inspirationId`. Nghiên cứu Cảm hứng là gợi ý `RESEARCH` gắn `inspirationId` đi qua đúng vòng đời Epic 4 (`suggestions/actions.ts` điều phối, `after()`, Duyệt upsert `ResearchProfile` theo `inspirationId` — AD-18, AD-19). "Gắn sản phẩm" chỉ mang `?cam-hung=<id>` sang màn Sản phẩm; liên kết chỉ ghi khi tạo Bộ nội dung (mô hình Sản phẩm ↔ Bài độc lập).

## Boundaries & Constraints

**Always:** Spine AD-2 (`inspirations` T1 không import tầng cao; query đọc cả `ContentSet` nằm ở `content-sets`), AD-4, AD-5, AD-6 (`run()` → `safeParse` → `service` → `updateTag`), AD-8, AD-10 (không đọc được video → `skipped` có `video`, không thêm nhà AI), AD-12 (lọc/trang/`?cam-hung`/`?sp` trên URL), AD-14, AD-15 (một migration, CHECK + partial unique index viết tay có comment), AD-18, AD-19, AD-24 (video ≤ 100 MB); mọi action/query mới có test DB, mọi hàm thuần có test đơn vị; test AI dùng `fakeAi`.

**Never:** Không cào Shopee, không tự chuyển link; không lưu cột "đã dùng"; không thêm thư viện npm (không `ffmpeg`); không gọi AI thật trong test; không sửa PRD/spine/`AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lưu nhanh | "Lưu cảm hứng" → Sheet, ô link tự focus → dán → "Lưu cảm hứng" | tạo Cảm hứng *Mới*, Toast "Đã lưu cảm hứng", Sheet đóng, danh sách *Mới* làm mới (dưới 3 chạm sau khi dán) | — |
| Dán đoạn chia sẻ | "Xem video này… https://vt.tiktok.com/abc/." | lưu `https://vt.tiktok.com/abc/` (link http(s) đầu tiên, bỏ dấu câu cuối) | không có link http(s) → "Link phải bắt đầu bằng http:// hoặc https://" |
| Chỉ file | video/ảnh qua UploadField + ghi chú | lưu `mediaUrl` `/uploads/<sha256>.<đuôi>` | video > 100 MB, loại lạ → lỗi tại trường; link ngoài ở `mediaUrl` → lỗi; không link, không file → "Dán một link hoặc tải lên một file" (Zod + CHECK DB) |
| Lọc | `?trang-thai=moi|da-dung|bo-qua`, `?trang=n` | chip kèm số; *Đã dùng* = có Bộ nội dung, thắng *Bỏ qua*; mới nhất trước; trang vượt cuối kẹp lại | giá trị lạ → *Mới*, trang 1 |
| Bỏ qua | "Bỏ qua" ở Chi tiết | *Bỏ qua*, Toast "Đã bỏ qua Cảm hứng" + "Hoàn tác" (về *Mới*) | Cảm hứng đã xoá → thông báo tiếng Việt |
| Đưa lại | Cảm hứng *Bỏ qua* → "Đưa lại vào Mới" | *Mới* | *Đã dùng* không có hai nút này |
| Nghiên cứu | "Nghiên cứu" ở Chi tiết | gợi ý `RESEARCH` `GENERATING` gắn `inspirationId`, trả ngay; `after()` gọi AI (ghi chú, link + tìm web, ảnh nếu có) → `PENDING` với từ khoá + dàn ý | AI lỗi → `FAILED` câu tiếng Việt + Tạo lại; đang tạo → "AI đang nghiên cứu…"; quá 120 giây → `FAILED`, Tạo lại được |
| Không đọc được video | link TikTok/Pinterest… hoặc file video | `skipped` có `video`; thẻ nói rõ hồ sơ dựa trên gì, gợi ý tải ảnh chụp màn hình/ file rồi Tạo lại | — |
| Duyệt / Từ chối / Tạo lại | thẻ "Từ khoá Shopee và dàn ý" | Duyệt (sửa trước được) → `ResearchProfile` theo `inspirationId`, `editedBeforeApproval`; Từ chối → `REJECTED`; Tạo lại kèm chỉ dẫn → bản cũ `SUPERSEDED`, bản mới có `parentSuggestionId` | sửa sai schema → lỗi tại trường; đã Duyệt → sửa trực tiếp hồ sơ, không Tạo lại |
| Gắn sản phẩm | "Gắn sản phẩm" → "Tạo Sản phẩm mới" / chọn trong ProductPicker | `/cms/san-pham/moi?cam-hung=<id>` (tạo xong sang Chi tiết vẫn kèm `?cam-hung`) / `/cms/san-pham/<sp>?cam-hung=<id>`; dải "Từ Cảm hứng: …" | `?cam-hung` không tồn tại → không hiện dải, tạo bộ không ghi liên kết |
| Tạo Bộ nội dung | Chi tiết Sản phẩm kèm `?cam-hung` → "Tạo bộ nội dung" | `ContentSet.inspirationId` được ghi; Cảm hứng thành *Đã dùng*; Chi tiết Cảm hứng có link tới bộ; Bộ nội dung có link "Từ Cảm hứng" | Cảm hứng đã bị xoá → UserError, không tạo bộ |
| Xoá Cảm hứng (DB) | xoá dòng `Inspiration` | gợi ý, hồ sơ của nó xoá theo; Bộ nội dung giữ lại, mất liên kết | — |
| Chưa đăng nhập | gọi action thẳng | bị từ chối, không ghi | — |

</intent-contract>

## Code Map

- **10.1 Lưu Cảm hứng nhanh:**
  - `prisma/schema/inspirations.prisma` `Inspiration` (+ enum `InspirationStatus`); sửa `content-sets.prisma`, `research.prisma`, `suggestions.prisma`; migration `20261106170000_add_inspiration` (bảng, cột `ContentSet.inspirationId`, `ResearchProfile.inspirationId`, FK `Suggestion.inspirationId`; viết tay CHECK `Inspiration_has_source`, `ResearchProfile_one_target`, partial unique index `Suggestion_active_inspiration_key`).
  - `platform/upload-rules.ts` (+ test): `uploadedMediaKind`.
  - `modules/inspirations/{constants,tags,schema,service,actions,cms-queries,types}.ts`; test `schema.test.ts`, `actions.db.test.ts`.
  - `modules/inspirations/components/{inspiration-form.client, inspiration-status-badge, inspiration-status-actions.client, inspiration-media, inspiration-strip}.tsx`.
  - `modules/content-sets/cms-queries.ts`: `listInspirationsForCms` (+ `inspirations.db.test.ts`).
  - `app/cms/cam-hung/page.tsx`, `_components/{inspiration-list-screen, inspiration-list-skeleton, inspiration-create-sheet.client}.tsx`; `app/cms/_components/cms-shell.client.tsx` mục "Cảm hứng".
  - `vitest.db.helpers.ts`: `resetTestDb` xoá cả `Inspiration`.
- **10.2 Từ Cảm hứng tới Bộ nội dung:**
  - `modules/research/prompts/research-inspiration.prompt.ts` (+ test), `constants.ts` (`INSPIRATION_*`), `service.ts` `upsertInspirationResearchRecord`, `actions.ts` `saveInspirationResearch`, `cms-queries.ts` `getInspirationResearchForCms`, `types.ts`; components `inspiration-research-form.client`, `inspiration-research-editor.client`.
  - `modules/suggestions/{schema,constants,service,actions,cms-queries,types}.ts`: `researchInspiration`, `startInspirationResearchRecord`, `completeResearchSuggestionRecord`, Duyệt nhánh `inspirationId`, `getInspirationSuggestionForCms`, `createContentSet` nhận `inspirationId`; components `inspiration-research-card`, `inspiration-research-approval-form.client`; `research-button`, `regenerate-dialog` nhận `inspirationId`; `create-content-set-panel` hiện dải + gửi `inspirationId`. Test `modules/suggestions/inspirations.db.test.ts`.
  - `modules/content-sets/{service,cms-queries,types}.ts`: `createContentSetRecord` ghi `inspirationId`, `listContentSetsForInspirationForCms`, `getContentSetForCms` trả `inspirationId`.
  - `modules/products/components/{product-form.client (createdQuery), product-picker.client (noun)}.tsx`.
  - `app/cms/cam-hung/[id]/page.tsx`, `_components/{inspiration-detail-screen, inspiration-detail-skeleton, attach-product-sheet.client}.tsx`; `app/cms/san-pham/moi/page.tsx`, `_components/{product-create-screen, product-edit-screen, product-research-section}.tsx`; `app/cms/bo-noi-dung/_components/content-set-screen.tsx` (link "Từ Cảm hứng").
- Docs: `docs/kien-truc-codebase.md` (dòng module `inspirations`, route `app/cms/cam-hung/**`, mục Dự kiến).

```text
Action: saveInspiration / setInspirationStatus
- Module chủ: inspirations           - File: modules/inspirations/actions.ts
- Loại: CMS
- Input: inspirationInputSchema { id?, url: extractLink → http(s) ≤ 2000 | null, mediaUrl: /uploads/<sha256>.<đuôi> | null,
         note ≤ 500 | null } (cần url hoặc mediaUrl) / setInspirationStatusInputSchema { id, status: NEW|SKIPPED }
- Output: Result<{ id }>
- Quyền: run() → requireAdmin()
- Service: saveInspirationRecord / setInspirationStatusRecord   - Bảng ghi: Inspiration — chủ là inspirations
- updateTag: INSPIRATIONS_TAG
- UserError: lỗi validate (tiếng Việt), "Không tìm thấy Cảm hứng. Có thể đã bị xoá."
- Gọi từ: InspirationForm, InspirationStatusActions

Action: researchInspiration (suggestions/actions.ts — điểm điều phối AI, AD-9)
- Input: researchInspirationInputSchema { inspirationId, instruction? ≤ SUGGESTION_INSTRUCTION_MAX }
- Output: Result<{ id }> (gợi ý GENERATING); AI chạy trong after() → completeResearchSuggestionRecord | failSuggestionsRecord
- Ghi: Suggestion (RESEARCH, inspirationId) — chủ là suggestions; không updateTag (CMS, không cache)
- Duyệt (approveSuggestion có sẵn): upsertInspirationResearchRecord → ResearchProfile theo inspirationId, updateTag(RESEARCH_TAG)
- Gọi từ: ResearchButton, RegenerateDialog (inspirationId)

Action: createContentSet (có sẵn, Epic 5) — thêm inspirationId?: string | null; Cảm hứng không có → UserError

Query: listInspirationsForCms({ filter, page }), listContentSetsForInspirationForCms(id) (content-sets/cms-queries.ts)
Query: getInspirationForCms(id) (inspirations/cms-queries.ts) — trạng thái lưu, label, mediaKind, videoLink; ISO date
Query: getInspirationSuggestionForCms(id) (suggestions), getInspirationResearchForCms(id) (research)
```

**Bảng phân tích ảnh hưởng schema (doi-schema.md Bước 2):**

| Hạng mục | File / ký hiệu bị ảnh hưởng | Việc phải làm |
|---|---|---|
| Query public | không có (Cảm hứng chỉ ở CMS) | — |
| Query CMS | `inspirations/cms-queries.ts`, `content-sets/cms-queries.ts` (danh sách, bộ theo Cảm hứng, `getContentSetForCms` thêm `inspirationId`), `research/cms-queries.ts`, `suggestions/cms-queries.ts` | đã thêm |
| Kiểu | `InspirationForCms`, `InspirationListItem`, `InspirationResearchForCms`, `InspirationResearchSuggestionView` | suy từ query |
| Validate + form | `inspirations/schema.ts`, `constants.ts` (= `@db.VarChar`), `inspirationResearchSchema` | đã thêm |
| Ghi | `inspirations/service.ts`, `research/service.ts`, `suggestions/service.ts`, `content-sets/service.ts` | đã thêm |
| Cache tag | `INSPIRATIONS_TAG` (mới); Duyệt hồ sơ Cảm hứng `updateTag(RESEARCH_TAG)`; tạo bộ giữ tag cũ | đã làm |
| Module khác đọc qua AD-2 | `content-sets`, `suggestions`, màn Sản phẩm đọc `getInspirationForCms` | đã làm |
| Seed | không có (0 Cảm hứng hợp lệ) | — |
| Test | `modules/inspirations/*.test.ts`, `*.db.test.ts`, `content-sets/inspirations.db.test.ts`, `suggestions/inspirations.db.test.ts`, `research/actions.db.test.ts`; TRUNCATE `Inspiration` | đã thêm |
| Code cũ | không có | — |

Phân loại: **an toàn** (thêm bảng, thêm cột nullable, thêm FK cho cột đang trống). Production: Vinh chạy `npx prisma migrate deploy`.

## Tasks & Acceptance

**Execution:**
- [x] 10.1 bảng `Inspiration` + migration (CHECK nguồn, CHECK đích hồ sơ, partial unique index), `uploadedMediaKind`, schema/service/actions, `/cms/cam-hung` (Sheet "Lưu cảm hứng", chip lọc kèm số, phân trang), StatusBadge, mục CmsShell "Cảm hứng"
- [x] 10.2 prompt `research.inspiration` v1, `researchInspiration` + Duyệt/Từ chối/Tạo lại, thẻ "Từ khoá Shopee và dàn ý" (dải `skipped` video), `/cms/cam-hung/[id]` (Bỏ qua + Hoàn tác, Đưa lại vào Mới, Gắn sản phẩm), dải "Từ Cảm hứng" ở màn Tạo/Chi tiết Sản phẩm, `ContentSet.inspirationId` khi tạo bộ, link hai chiều Cảm hứng ↔ Bộ nội dung
- [x] Test cho mọi action/query/hàm thuần mới; docs
- [x] Kiểm tay (`next start -p 3300`): xem mục Auto Run Result

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy.
- Given `npm run build`, when xem bảng route, then `/cms/cam-hung`, `/cms/cam-hung/[id]` có trong bảng.
- Given `/cms/cam-hung` và Chi tiết ở 360px và 1280px, then đúng AC Story 10.1–10.2 trong `epics.md`.

## Spec Change Log

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Cảm hứng cần một link _hoặc_ một file** (AC ghi "chỉ cần một link"; FR-1 cho cả file). Không có cả hai → lỗi tại trường + CHECK DB `Inspiration_has_source`.
2. **Ô link nhận cả đoạn chữ chia sẻ của app** (TikTok/Shopee hay chép kèm câu mô tả): giữ link http(s) đầu tiên, bỏ dấu câu cuối — để dán một lần là lưu được (UX-DR76). Không kiểm host (link nào cũng nhận).
3. **Mỗi Cảm hứng một file** (video hoặc ảnh) qua `UploadField` kind `media`; muốn thêm file sau thì mở "Sửa Cảm hứng" ở Chi tiết. Ghi chú một dòng, tối đa 500 ký tự.
4. **Trạng thái:** lưu chỉ `NEW` / `SKIPPED`; *Đã dùng* (có ≥ 1 Bộ nội dung trỏ tới) thắng trạng thái lưu, nên Cảm hứng *Bỏ qua* mà đã có bộ hiện ở *Đã dùng*. Cảm hứng *Đã dùng* không có nút Bỏ qua / Đưa lại vào Mới. "Hoàn tác" trong Toast đặt lại *Mới*.
5. **Danh sách và bộ theo Cảm hứng nằm ở `content-sets/cms-queries.ts`** (đọc cả `ContentSet`, AD-2: query chạm bảng nhiều module ở module tầng cao nhất), 20 Cảm hứng mỗi trang, mới nhất trước.
6. **Hồ sơ nghiên cứu Cảm hứng** = `summary` (≤ 600) + 1–8 từ khoá (≤ 80 ký tự) + 2–8 mục dàn ý (`heading` ≤ 120, `detail` ≤ 500), có `id` ổn định (AD-19); form Duyệt/sửa chỉ sửa nội dung từng ý, không thêm/xoá (muốn khác thì Tạo lại kèm chỉ dẫn). Lưu ở `ResearchProfile.data` theo `inspirationId` (AD-19), CHECK `ResearchProfile_one_target`.
7. **Như Epic 4: hồ sơ đã Duyệt thì không Tạo lại** — sửa trực tiếp hồ sơ ("Hồ sơ nghiên cứu của Cảm hứng đã duyệt. Sửa trực tiếp trên hồ sơ.").
8. **Đọc video (AD-10):** link thuộc `VIDEO_LINK_HOSTS` (tiktok, pinterest, pin.it, youtube, facebook, fb.watch, instagram, threads) hoặc file video được gửi `ask({ videoUrl })`; `claude -p` không đọc video nên `skipped` có `video`, thẻ hiện câu riêng cho link / file kèm gợi ý tải ảnh chụp màn hình rồi Tạo lại. AI vẫn đọc tiêu đề/chú thích trang link qua tìm web (`webSearch` bật khi có link) và đọc ảnh nếu file là ảnh. **Khung hình của file video chưa làm** (cần `ffmpeg`, không có trong spine) — ghi `deferred-work.md`.
9. **"Gắn sản phẩm" là Sheet hai lựa chọn:** nút "Tạo Sản phẩm mới" và ProductPicker "Chọn Sản phẩm có sẵn" (ô tìm `?sp=`; có từ khoá thì Sheet mở sẵn). Chọn một món → Chi tiết Sản phẩm kèm `?cam-hung`. Tạo Sản phẩm xong chuyển sang Chi tiết vẫn giữ `?cam-hung`. Gắn không ghi gì vào DB — liên kết chỉ ghi khi tạo Bộ nội dung (mô hình Sản phẩm độc lập).
10. **Dải "Từ Cảm hứng: …"** ở đầu màn Tạo Sản phẩm và đầu khối "Tạo bộ nội dung" của Chi tiết Sản phẩm; nhãn là ghi chú, không có thì host của link, rồi "Video/Ảnh tải lên". `?cam-hung` trỏ Cảm hứng không có → bỏ qua lặng lẽ (không dải, không liên kết).
11. **Tạo bộ với Cảm hứng đã bị xoá** → `UserError` "Không tìm thấy Cảm hứng. Có thể đã bị xoá." (không tạo bộ thiếu liên kết). Xoá Cảm hứng: gợi ý + hồ sơ xoá theo (Cascade), Bộ nội dung giữ lại (`SetNull`). CMS chưa có nút xoá Cảm hứng (story không yêu cầu; Bỏ qua thay thế).
12. **Bộ nội dung hiện link "Từ Cảm hứng"** ở đầu màn `/cms/bo-noi-dung/[id]` (chiều ngược của "chi tiết hiện link tới Bộ nội dung").
13. **Mục CmsShell "Cảm hứng" đặt ngay sau "Sản phẩm"** (UX không nêu vị trí).
14. **Migration tên `20261106170000_add_inspiration`** để xếp sau `add_banner`.
15. **Không gọi `claude -p` thật trong epic này**: `platform/ai` và `skipped` video đã có test (Epic 4); gọi thật chỉ xác nhận lại adapter, không kiểm thêm gì của Epic 10. Vinh nên thử một lần "Nghiên cứu" với link TikTok thật.

### Auto Run Result (mốc trước review gộp)

- `npm test` 391/391 (46 file); `npm run test:db` 254/254 (29 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch (`/cms/cam-hung`, `/cms/cam-hung/[id]` có trong bảng route).
- `npx prisma migrate status`: DB cục bộ (cổng 54329) đã có `20261106170000_add_inspiration`; DB test tự áp khi chạy `test:db`.
- `next start` cổng 3300: chèn thẳng một Cảm hứng thử (link TikTok + ghi chú). `/cms/cam-hung` không đăng nhập 401, có Basic Auth 200 (Cảm hứng ở chip *Mới*; `?trang-thai=bo-qua` rỗng); `/cms/cam-hung/[id]` 200 có "Nghiên cứu", "Gắn sản phẩm"; `/cms/san-pham/moi?cam-hung=<id>` và `/cms/san-pham/<sp>?cam-hung=<id>` 200 có dải "Từ Cảm hứng"; id không có → màn "Không tìm thấy". Dữ liệu thử đã xoá (bảng về 0 dòng); server 3300 đã tắt; không đụng cổng 3100/3200.
- Không gọi `claude -p` thật (quyết định 15).
- Cần Vinh: xem Quyết định tự chọn (nhất là 1, 4, 6, 8, 9); thử trên điện thoại thật: chia sẻ link TikTok → dán vào "Lưu cảm hứng"; tải video ~50 MB; "Nghiên cứu" với AI thật; "Gắn sản phẩm" → tạo bộ → Cảm hứng thành *Đã dùng*; chạy `npx prisma migrate deploy` khi triển khai.

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Kết quả (mốc trước review gộp, 2026-11-06):** `npm test` 391/391; `npm run test:db` 254/254; tsc, lint, build sạch.

**Manual checks (if no CLI):**
- `npm start` cổng 3300+ (không dùng 3100, 3200), điện thoại thật: lưu Cảm hứng bằng cách dán đoạn chia sẻ TikTok; Bỏ qua → Hoàn tác; Nghiên cứu → Duyệt; Gắn sản phẩm → Tạo bộ nội dung → kiểm *Đã dùng* và link hai chiều.
