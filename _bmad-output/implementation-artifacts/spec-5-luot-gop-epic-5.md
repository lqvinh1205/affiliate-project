---
title: 'Lượt gộp Epic 5: Xưởng Bộ nội dung — Story 5.1–5.9'
type: 'feature'
created: '2026-11-06'
status: 'review'
review_loop_iteration: 0
baseline_revision: 'bcc2faf26c8af50dcd9f9a6728f6b1d789c15fc2'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md'
  - '{project-root}/docs/cong-thuc/them-tinh-nang-ai.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/bo-chuc-nang.md'
warnings: ['oversized', 'multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Chưa có Bộ nội dung: AI chỉ viết bài web đồng bộ theo chủ đề (`createPost` nhánh AI) và chuỗi Threads không lưu, bài cuối còn link website (`runThreads`, [NO-10]) — trái AD-9 ("mọi đầu ra AI là `Suggestion`"), FR-14, FR-17. Chưa có Hồ sơ phong cách, Bài Facebook, Bình luận kèm link, copy/đánh dấu đã đăng, Cảnh báo rủi ro, khoá Xuất bản. Epic 5 gồm Story 5.1–5.9 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai theo thứ tự 5.1 → 5.9, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). Dựng `style-profiles` (T0) và `content-sets` (T3) theo spine; mọi phần nội dung là một `Suggestion` (`WEB_POST`, `THREADS_POST`, `FACEBOOK_POST`, `LINK_COMMENT`) do `suggestions/actions.ts` điều phối (AD-9), mỗi phần một lần `ask()` trong `after()` chạy song song (AD-18); Duyệt upsert vào `Post` / `SocialPost` (AD-19). Gỡ nhánh AI của `createPost` và `runThreads`.

## Boundaries & Constraints

**Always:** Mọi quy tắc spine và mẫu đã có (module AD-5, đường ghi AD-6 qua `run()`, route mỏng AD-12, Prisma AD-15, test AD-16); AD-9/AD-10/AD-18/AD-19/AD-21/AD-22/AD-25 cho phần AI theo `docs/cong-thuc/them-tinh-nang-ai.md`; test chỉ dùng nhà giả lập (`AI_PROVIDERS=fake`), tối đa một lần gọi `claude -p` thật trong epic; mỗi story tối đa một migration (5.1 `add_style_profile`, 5.2 `add_content_set`, 5.3 `add_social_post`); gỡ chức năng theo `bo-chuc-nang.md`.

**Never:** Không thêm thư viện npm (spine/UX/PRD không nêu thư viện mới cho epic này); không dịch vụ trả phí; không cào dữ liệu Shopee; không gọi AI trong transaction; không `updateTag` trong `after()`; `posts` không import `suggestions`/`content-sets`; không Cảm hứng (Epic 10); không sửa khối `bmad:context`/nextjs của `AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hồ sơ phong cách lần đầu | chưa có `StyleProfile` | ba hồ sơ hiện giá trị khởi tạo từ `style-profiles/constants.ts`, không ghi DB | — |
| Sửa hồ sơ vượt giới hạn | Threads `lengthMax` 501 | lỗi tại trường "Tối đa 500 ký tự (giới hạn cứng)" | lưu được → Toast "Đã lưu — áp dụng cho nội dung tạo từ giờ" |
| Tạo bộ khi hồ sơ chưa Duyệt | hồ sơ *Chờ duyệt* | nút tắt, lý do "Duyệt Hồ sơ nghiên cứu trước"; server `UserError` cùng câu | món thêm chưa Duyệt → "'{tên}' chưa có hồ sơ đã duyệt" |
| Tạo bộ đủ 3 nền tảng | hồ sơ Duyệt, Góc viết, Người đọc | `ContentSet` + 5 gợi ý `GENERATING`, trả ngay, chuyển `/cms/bo-noi-dung/[id]`; `after()` 5 lần `ask()` song song | — |
| Một phần lỗi | Facebook lỗi nhà cung cấp | chỉ thẻ Facebook `FAILED` "Chưa tạo được bài Facebook. Phần khác vẫn giữ nguyên. Bấm Tạo lại." | thẻ khác `PENDING` |
| Duyệt Bài web | `WEB_POST` *Chờ duyệt* (có sửa) | `Post` nháp gắn Sản phẩm của bộ, `ContentSet.postId`, `editedBeforeApproval`; `updateTag(posts, content-sets)` | bài đích đã xuất bản → `UserError` "Bài đã xuất bản — sửa tay ở Soạn Bài web" |
| Duyệt Bình luận trước bài | `LINK_COMMENT` khi Threads chưa Duyệt | nút tắt "Duyệt bài Threads trước" | server `UserError` cùng câu |
| Threads > 500 ký tự | bài 2 dài 501 | bộ đếm đỏ, Duyệt tắt "Bài 2 vượt 500 ký tự" | server `UserError` cùng câu; đổi số bài → `UserError` |
| Bình luận kèm link | bộ 3 Sản phẩm, hồ sơ Threads có câu công khai | bình luận chứa nguyên 3 Link affiliate + câu công khai; link lạ AI bịa bị bỏ | quá dài → cắt phần chữ, link và câu công khai giữ nguyên |
| Copy chưa Duyệt | chạm CopyButton lần đầu | AlertDialog "Nội dung này chưa duyệt. Vẫn sao chép?"; ghi `Suggestion.firstCopiedAt` lần đầu; Duyệt chép sang `SocialPost` | copy sau Duyệt ghi `SocialPost.firstCopiedAt` lần đầu |
| Đánh dấu đã đăng | link tuỳ chọn | `postedAt` + `postUrl`, badge "Đã đăng · dd/mm/yyyy"; bỏ đánh dấu được; Sản phẩm hiện "Đã lên: …" | link không phải http(s) → lỗi tại trường |
| Tạo lại phần đã Duyệt | Threads `APPROVED` + chỉ dẫn | gợi ý cũ `SUPERSEDED`, mới `GENERATING` có `parentSuggestionId`; `SocialPost` giữ | đang tạo → `UserError`; màn cũ → "Phần này vừa được tạo lại ở nơi khác. Tải lại trang." |
| Khoá Xuất bản | `WEB_POST` Đang tạo / Chờ duyệt | Soạn Bài web: "Xuất bản" `aria-disabled` + "Cần duyệt bài AI trước khi xuất bản" + link Bộ nội dung | chỉ ở giao diện |
| Bài web → mạng xã hội | bài có Sản phẩm, chưa thuộc bộ | tạo bộ mới gắn bài + Sản phẩm, nguồn là nội dung bài; thẻ mới Đang tạo | bài chưa gắn Sản phẩm → "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận"; nền tảng đã có → "Bộ đã có Bài Threads" |
| Cảnh báo rủi ro | AI trả `riskWarnings` | RiskWarning trên thân thẻ và trong PostEditor; chạm → cuộn và bôi câu | không chặn Duyệt; câu đã sửa → Toast "Không còn thấy câu này…" |

</intent-contract>

## Code Map

**5.1 — Hồ sơ phong cách**

- `prisma/schema/content-sets.prisma` (enum `Platform`), `prisma/schema/style-profiles.prisma` (`StyleProfile { platform @unique, voice, lengthMin/Max, partsMin/Max, emoji, forbidden, rules, disclosure? }`), migration `add_style_profile`.
- `modules/style-profiles/{constants,schema,types,tags,cms-queries,service,actions}.ts`: `STYLE_PROFILE_DEFAULTS` (giọng thương hiệu + quy chuẩn chuyển từ prompt cũ), `STYLE_PLATFORMS`, `STYLE_HARD_LIMITS`; `styleProfileInputSchema` (≤ giới hạn cứng, lỗi tại trường); `listStyleProfilesForCms`, `getStyleProfileForCms`; `saveStyleProfileRecord` (upsert theo nền tảng); `saveStyleProfile`. Component `style-profile-form.client.tsx`.
- `app/cms/phong-cach/{page.tsx,_components/style-profiles-screen.tsx,_components/style-profiles-skeleton.tsx}`; mục "Hồ sơ phong cách" trong CmsShell.

**5.2 — Bộ nội dung và Bài web**

- `prisma/schema/content-sets.prisma` (`ContentSet`, `ContentSetProduct`), `suggestions.prisma` (`WEB_POST`, `Suggestion.platform`, FK `contentSetId`, CHECK `Suggestion_content_set_platform`, partial unique index `Suggestion_active_content_set_key`), quan hệ ngược `Post.contentSet`, `Product.contentSetProducts`; migration `add_content_set`.
- `modules/posts/prompts/web-post.prompt.ts` (version 2, `system(style)`, `toWebPostPayload` sanitize + Danh mục chỉ trong danh sách), `posts/service.applyWebPostSuggestionRecord`, `posts/cms-queries.parseWebPostPayload`, `posts/types` (`RiskWarning`, `PublishLock`), `posts/components/web-post-suggestion-form.client.tsx`.
- `modules/content-sets/{constants,schema,tags,types,service,cms-queries,actions}.ts`.
- `modules/suggestions/actions.ts`: `createContentSet`, `runContentSetParts` (song song, độc lập), Duyệt `WEB_POST`; `service.ts`: `startContentSetPartsRecord`, `completeSuggestionRecord`; `cms-queries.ts`: `getContentSetSuggestionsForCms`.
- Components: `suggestions/components/{create-content-set-panel.client,content-set-part-card,web-post-approval-form.client,approve-button.client,suggestion-footer}.tsx`, `research/components/choice-picker.client.tsx` (AudiencePicker / AnglePicker), `content-sets/components/platform-toggle.client.tsx`; `products/components/product-picker.client.tsx` thêm `showValue`, `noun`, giữ tham số URL khác.
- `app/cms/bo-noi-dung/[id]/page.tsx`, `_components/{content-set-screen,content-set-skeleton,content-set-jump-bar}.tsx`; `app/cms/san-pham/_components/product-research-section.tsx` ghép panel (`?bo=`, `?sp=`).
- Gỡ (bo-chuc-nang.md): nhánh AI của `posts.createPost`, `NewPostForm` chế độ "AI viết", `toCommaListValue`; test tương ứng.

Tính năng AI: Bài web của Bộ nội dung (FR-11, FR-13)
- kind: `WEB_POST`   - Gắn với: contentSetId (platform WEBSITE)
- Đích khi Duyệt: `Post` (module posts) — khoá `ContentSet.postId` (tạo khi chưa có)
- Prompt: `modules/posts/prompts/web-post.prompt.ts` — id `posts.web-post`, version 2, profile `quality`
- Output: `webPostOutputSchema` → payload `webPostPayloadSchema`; `riskWarnings` riêng
- Hồ sơ phong cách: có (Website: giọng văn, độ dài từ, số h2, emoji, điều cấm, quy chuẩn)
- images: không · webSearch: không
- HTML trong output: có → `sanitizePostHtml` khi nhận và khi ghi `Post` (AD-22)
- Action tạo: `suggestions.createContentSet` / `addContentSetPlatform` / `regenerateSuggestion`; route `/cms/san-pham/[id]`, `/cms/bo-noi-dung/[id]` (`maxDuration` 120 từ `app/cms/layout.tsx`)
- Màn hình: Bộ nội dung — GENERATING / PENDING / FAILED / APPROVED / REJECTED (SUPERSEDED không hiện)

**5.3 — Bài Threads và Bình luận kèm link**

- `SocialPost` (`@@unique([contentSetId, platform])`, `parts String[]`, `linkComment`, `styleProfileId`, `firstCopiedAt`, `postedAt`, `postUrl`; CHECK `SocialPost_social_platform`), `SuggestionKind` thêm `THREADS_POST`, `FACEBOOK_POST`, `LINK_COMMENT`; migration `add_social_post`.
- `content-sets/prompts/threads-post.prompt.ts` (version 2, thay prompt cũ: không link, theo hồ sơ), `link-comment.prompt.ts` (`toLinkCommentPayload` giữ nguyên Link affiliate, câu công khai); `content-sets/service.{upsertSocialPostRecord,setLinkCommentRecord}`.
- `suggestions/components/social-approval-form.client.tsx`, `content-sets/components/{threads-parts-field,social-text-field,social-post-editor}.client.tsx`.
- Gỡ: `content-sets.runThreads`, `threadsInputSchema`, `posts/components/post-threads.client.tsx`, khu "Chuỗi Threads (AI)" của `PostForm` ([NO-10] đóng). Gói `openai` đã gỡ từ Epic 4.

Tính năng AI: Bài Threads (FR-14) và Bình luận kèm link (FR-17)
- kind: `THREADS_POST`, `LINK_COMMENT`   - Gắn với: contentSetId (platform THREADS)
- Đích khi Duyệt: `SocialPost` (content-sets) — khoá `contentSetId` + `platform`; `SocialPost.linkComment` (cần bài đã Duyệt)
- Prompt: `content-sets/prompts/threads-post.prompt.ts` — id `content-sets.threads-post`, v2, `fast`; `link-comment.prompt.ts` — id `content-sets.link-comment`, v1, `fast`
- Hồ sơ phong cách: có (Threads; Bình luận dùng `disclosure`) · images, webSearch: không · HTML: không

**5.4 — Bài Facebook và Bình luận kèm link**

- `content-sets/prompts/facebook-post.prompt.ts` (id `content-sets.facebook-post`, v1, `fast`); Bình luận Facebook dùng chung `link-comment.prompt.ts`; `suggestions/components/add-platform-button.client.tsx` + `suggestions.addContentSetPlatform` ("Thêm Bài {nền tảng}").

**5.5 — Copy một chạm, đánh dấu đã đăng**

- `components/shared/copy-button.client.tsx` (UX-DR44), `suggestions.recordSuggestionCopy` + `recordSuggestionCopyRecord`, `content-sets.recordCopy`, `markPosted`, `unmarkPosted`, `content-sets/components/mark-posted-row.client.tsx`; Duyệt chép `firstCopiedAt` (AD-21).
- `content-sets/cms-queries.{listPostedPlatformsByProductForCms,listContentSetsForProductForCms}` → `/cms/san-pham` (cột/dòng "Đã lên") và Chi tiết Sản phẩm ("Đã lên: …", danh sách Bộ nội dung). SM-3: query ở `docs/kiem-chung.md` §7.

**5.6 — Cảnh báo rủi ro**

- `platform/ai/rules.ts`: `RISK_WARNING_RULES`, `riskWarningsOutput`, `cleanRiskWarnings`; mọi prompt nội dung đăng thêm `riskWarnings`; cột `Suggestion.riskWarnings` (`riskWarningsSchema`).
- `posts/components/risk-warning-list.client.tsx`, `components/shared/select-sentence.ts`, `PostBodyEditor` prop `highlight`.
- `scripts/risk-eval/{samples.json,run.ts}` (24 câu, chạy tay, AI thật); kết quả `docs/kiem-chung.md` §7.

**5.7 — Tạo lại phần đã Duyệt, khoá Xuất bản**

- `suggestions.regenerateSuggestion` (mọi trạng thái → `SUPERSEDED`, `expectLatestId`); `RegenerateDialog` thêm prop `part`.
- `suggestions/cms-queries.getPostAiStateForCms`; `PostForm`/`PostActionBar` props `publishLock`, `riskWarnings`; `PostScreenHeader` thêm "← Bộ nội dung" + `actions`.

**5.8 — Bộ nhiều Sản phẩm**

- CreateContentSetPanel: "Sản phẩm trong bộ" (hiện tại đầu tiên + StatusBadge hồ sơ), ProductPicker "Thêm Sản phẩm (bài Gom link)" (`?bo=`, tối đa `CONTENT_SET_PRODUCTS_MAX` = 3), lựa chọn nhóm theo Sản phẩm; Bình luận chứa link cả bộ; Duyệt Bài web gắn cả bộ.

**5.9 — Bài web → bài mạng xã hội**

- `suggestions.createSocialFromPost`; `suggestions/components/social-from-post-dialog.client.tsx` ở đầu Soạn Bài web; màn Bộ nội dung hiện Bài web "đã có" (không có gợi ý `WEB_POST`).

**Harness test:** `vitest.db.helpers.ts` `resetTestDb()` xoá thêm `SocialPost`, `ContentSetProduct`, `ContentSet`, `StyleProfile`. Test fake AI nhận ra phần qua JSON Schema của prompt.

**Docs:** `docs/kien-truc-codebase.md`, `docs/nen-tang-ky-thuat/lop-ai.md` ([AI-04], [AI-06], [AI-13], [AI-14]), `docs/no-ky-thuat.md` ([NO-10] đóng), `docs/cong-thuc/chuyen-code-cu.md`, `docs/kiem-chung.md` §7.

## Tasks & Acceptance

**Execution:**
- [x] 5.1 `StyleProfile` + migration; `/cms/phong-cach`; giá trị khởi tạo; giới hạn cứng
- [x] 5.2 `ContentSet` + migration; `createContentSet`; prompt `WEB_POST`; màn Bộ nội dung; Duyệt → `Post` nháp; gỡ `createPost` nhánh AI
- [x] 5.3 `SocialPost` + migration; `THREADS_POST` + `LINK_COMMENT`; gỡ `runThreads`
- [x] 5.4 `FACEBOOK_POST`; "Thêm Bài {nền tảng}"
- [x] 5.5 CopyButton, `recordSuggestionCopy`, `recordCopy`, `markPosted`/`unmarkPosted`; "Đã lên" ở Sản phẩm; SM-3
- [x] 5.6 `riskWarnings` mọi prompt; RiskWarning + bôi câu; bộ câu mẫu + script đo
- [x] 5.7 `regenerateSuggestion`; khoá Xuất bản + Cảnh báo trong PostEditor qua props
- [x] 5.8 panel nhiều Sản phẩm (`?bo=`)
- [x] 5.9 `createSocialFromPost` + SocialFromPostDialog
- [x] Test cho mọi action/query/service/schema mới; docs

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy (ghi báo cáo).
- Given `grep -rn "openai\|@/lib/\|runThreads\|PostThreads" app modules platform components`, then rỗng.
- Given `scripts/risk-eval/run.ts` với `claude -p` thật, then bắt ≥ 90% câu vi phạm, báo nhầm ≤ 20% (ghi `docs/kiem-chung.md`).

## Spec Change Log

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Ba migration theo story:** 5.1 `add_style_profile` (enum `Platform`, `StyleProfile`), 5.2 `add_content_set` (`ContentSet`, `ContentSetProduct`, kind `WEB_POST`, cột `Suggestion.platform`, FK, CHECK, partial unique index), 5.3 `add_social_post` (`SocialPost`, kind `THREADS_POST`, `FACEBOOK_POST`, `LINK_COMMENT`). Story 5.4 không có migration trong AC nên `FACEBOOK_POST` vào cùng migration 5.3.
2. **Thêm cột `Suggestion.platform`** (không có trong danh sách cột của spine) — khoá đích `LINK_COMMENT` là `contentSetId + platform` (AD-19), cần biết bình luận thuộc nền tảng nào; mọi gợi ý của Bộ nội dung đều có `platform` (CHECK), partial unique index trên `(kind, contentSetId, platform)`.
3. **`StyleProfile` cột chung** (`lengthMin/Max`, `partsMin/Max`, `emoji`, `forbidden`, `rules`, `disclosure`) với nghĩa theo nền tảng (`STYLE_PLATFORMS`: Website = từ + số h2; Threads = ký tự mỗi bài + số bài; Facebook = từ). Bản ghi tạo lười khi Vinh lưu lần đầu; thiếu bản ghi đọc giá trị khởi tạo. `SocialPost.styleProfileId` null khi hồ sơ chưa từng lưu (`suggestions` không được ghi bảng của `style-profiles` — AD-9).
4. **Giới hạn cứng chép lại ở `style-profiles/constants.ts`** (`STYLE_HARD_LIMITS`): `style-profiles` ở T0 không import được `posts`/`content-sets` (AD-2), nhưng AD-25 yêu cầu kiểm "≤ giới hạn cứng" ở `style-profiles/schema.ts`. Test `modules/content-sets/style-limits.test.ts` giữ hai nơi bằng nhau.
5. **Giá trị giới hạn cứng tự đặt:** `WEB_POST_WORDS_MAX` 3000, `WEB_POST_SECTIONS_MAX` 10, `THREADS_PARTS_MAX` 10, `FACEBOOK_WORDS_MAX` 1000, `FACEBOOK_POST_MAX` 8000 ký tự, `LINK_COMMENT_MAX` 2000, `SOCIAL_POST_URL_MAX` 500. Chỉ `THREADS_POST_MAX` = 500 có trong PRD.
6. **Góc viết / Người đọc lưu thành cột chụp lúc tạo** trên `ContentSet` (`angleId/Name/Hook/Edit`, `audience…`), nullable (bộ tạo từ Bài web có sẵn không có). Chưa có `inspirationId` (bảng `Inspiration` thuộc Epic 10).
7. **Cảnh báo rủi ro trong cùng lần gọi AI với nội dung** (mỗi prompt thêm trường `riskWarnings`), luật chung `RISK_WARNING_RULES` đặt ở `platform/ai/rules.ts` để bộ câu mẫu và nội dung thật dùng một nguồn. Không có lần gọi AI riêng để kiểm rủi ro.
8. **Bình luận kèm link do code bảo đảm:** bỏ mọi URL không phải Link affiliate của bộ, thêm dòng "👉 {tên}: {link}" cho Sản phẩm thiếu, thêm câu công khai khi hồ sơ có; thân Bài Threads/Facebook bị bỏ mọi URL (FR-14, FR-15, FR-25).
9. **AudiencePicker / AnglePicker đặt trong CreateContentSetPanel** (ngay dưới ResearchProfileCard) thay vì bên trong thẻ hồ sơ — để gom lựa chọn từ nhiều hồ sơ theo Sản phẩm (Story 5.8) và giữ form hồ sơ của Epic 4 nguyên vẹn. Component `ChoicePicker` ở `modules/research/components/`.
10. **Bộ nhiều Sản phẩm tối đa 3** (`CONTENT_SET_PRODUCTS_MAX`, theo "2–3 Sản phẩm" của story); món thêm nằm trên URL `?bo=` (AD-12); `ProductPicker` thêm `showValue`, `noun`, `addLabel` và giữ tham số URL khác khi tìm.
11. **Chọn Góc viết / Người đọc từ hồ sơ *Chờ duyệt* chỉ cho Sản phẩm hiện tại** (UJ-1 bước 3); món thêm phải có hồ sơ đã Duyệt mới hiện lựa chọn. Server chỉ nhận hồ sơ đã Duyệt, tìm lựa chọn theo `productId` + `id`.
12. **Tạo lại một phần chuyển bản hiện hành sang `SUPERSEDED` ở mọi trạng thái** (Chờ duyệt, Lỗi, Đã từ chối, Đã duyệt — Story 5.7); đích đã Duyệt (`Post`, `SocialPost`) giữ nguyên cho tới khi Duyệt bản mới. `expectLatestId` chặn Tạo lại từ màn cũ. Tạo lại Bình luận / bài độc lập nhau.
13. **Thẻ Bài web *Chờ duyệt* sửa được tiêu đề, tóm tắt, thân bài, SEO title/description;** thẻ, từ khoá, Danh mục, Loại bài gợi ý hiện chỉ đọc và được tự điền khi Duyệt (FR-11), sửa tiếp ở Soạn Bài web. Duyệt lại (sau Tạo lại) giữ slug và Sản phẩm của bài.
14. **`content-sets` và `style-profiles` có `tags.ts` và `updateTag`** dù chưa có query public nào có cache — giữ đúng AD-6 ("updateTag mọi module có dữ liệu đổi"); Duyệt `WEB_POST` gọi `posts` + `content-sets`.
15. **Form Duyệt bài mạng xã hội dùng state có kiểm soát** (không RHF): lý do tắt "Duyệt" tính phía client theo `THREADS_POST_MAX`, server kiểm bằng Zod của module chủ đích. Form Bài web dùng RHF + `zodResolver(webPostPayloadSchema)` (form ở `posts/components`, bọc bởi `suggestions/components/web-post-approval-form`).
16. **`/cms/phong-cach`: ba form, mỗi form nút Lưu riêng, không dính đáy** (ba nút dính sẽ chồng nhau — như quyết định 17 của Epic 4).
17. **Checkbox / radio:** checkbox gốc (`accent-primary`) cho PlatformToggle và nút `role="radio"` (mẫu `PostTypePicker`) cho Góc viết / Người đọc — không thêm `Checkbox`/`RadioGroup` của shadcn (tránh gọi CLI/mạng trong lượt chạy không người).
18. **CopyButton ở `components/shared/`** (component UX đã đặt tên, dùng ở `suggestions` và `content-sets`); hỏi xác nhận một lần mỗi nút cho nội dung chưa Duyệt.
19. **"Highlight" câu rủi ro = bôi chọn (selection) và cuộn tới câu** trong ô chữ / PostEditor. Chưa vẽ gạch chân lượn `tertiary` cho mọi câu bị cảnh báo (UX-DR43) — ghi `deferred-work.md`.
20. **Thông báo lỗi một phần luôn là câu chuẩn UX-DR96** ("Chưa tạo được bài …. Phần khác vẫn giữ nguyên. Bấm Tạo lại."), không nối lý do của nhà cung cấp.
21. **"Đã lên Website" = Sản phẩm có trong Bài web đã xuất bản;** Threads/Facebook = bài trong Bộ nội dung của Sản phẩm đã đánh dấu đã đăng. Query đặt ở `content-sets` (tầng cao nhất trong các bảng chạm — AD-2).
22. **Bộ tạo từ Bài web có sẵn (FR-16):** nguồn = chữ của bài (sau `visibleText`) + hồ sơ đã Duyệt của Sản phẩm nếu có; Góc viết hiện "Theo Bài web …". Nút SocialFromPostDialog dựa trên Sản phẩm **đã lưu** của bài.
23. **Lần gọi `claude -p` thật duy nhất của epic dùng cho bộ câu mẫu Cảnh báo rủi ro** (một lần `ask()` cho cả 24 câu, `haiku`) — vừa đo FR-23, vừa là lần đầu đi trọn adapter `ask` → `claude -p` → `structured_output`.

### 2026-11-06 — Kiểm chứng gộp (trước review gộp)

- Lần gọi `claude -p` thật duy nhất: `scripts/risk-eval/run.ts` qua `ask()` → 9,3 giây, bắt 12/12 câu vi phạm, báo nhầm 0/12 — Đạt (ghi `docs/kiem-chung.md` §7). Adapter chạy trọn qua `structured_output` lần đầu.
- `next start` cổng 3300 (`AI_PROVIDERS=fake`), dữ liệu thử chèn vào DB cục bộ rồi xoá: `/cms/phong-cach`, `/cms/bo-noi-dung/[id]` (5 thẻ: Bài web Chờ duyệt + RiskWarning, Threads Đã duyệt + "Đã đăng · …", Bình luận Threads Chờ duyệt, Facebook "Đang viết bài Facebook…", Bình luận Facebook Lỗi; "1/5 đã duyệt"; thanh nhảy), `/cms/san-pham/[id]` (panel "Tạo bộ nội dung", lý do "Chọn một Góc viết", "Đã lên: Threads", danh sách Bộ nội dung), `/cms/san-pham/[id]?bo=xyz`, `/cms/bai-viet/[id]` ("Cần duyệt bài AI trước khi xuất bản", "← Bộ nội dung", "Tạo bài mạng xã hội", RiskWarning), `/cms/san-pham`, `/cms/bai-viet/moi` đều 200; không đăng nhập 401. Log chỉ có lỗi `crypto.randomUUID()` ở `/cms/san-pham` đã ghi từ trước. Server đã tắt.

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npx tsx --conditions=react-server scripts/risk-eval/run.ts` (AI thật) — đã chạy, xem trên.
- Tạo Bộ nội dung thật với `AI_PROVIDERS=claude-cli` trên điện thoại 360px: đo thời gian từng phần (Bài web dùng `sonnet`), copy, đánh dấu đã đăng (chưa chạy: hết lượt gọi thật của epic).

**Kết quả (2026-11-06, trước review):** `npm test` 270/270 (28 file); `npm run test:db` 149/149 (17 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch; `grep "openai\|@/lib/\|runThreads\|PostThreads"` trong `app modules platform components` rỗng.
