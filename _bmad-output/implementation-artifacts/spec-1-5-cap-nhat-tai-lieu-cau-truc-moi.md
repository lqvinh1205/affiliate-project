---
title: 'Story 1.5: Cập nhật tài liệu theo cấu trúc mới (AD-17 bước 4)'
type: 'chore'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '877185125b0f6243c4f5dc39f38a86c2d53c513e'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/docs/chuan-tai-lieu.md'
warnings: []
deferred:
  - summary: >-
      Khối bmad:context của AGENTS.md chưa làm mới (vẫn ghi không có test suite, trỏ lib/sanitize.ts, lib/images.ts, lib/auth.ts).
    evidence: |-
      QD-03 cấm sửa tay; skill bmad-project-context cần Vinh duyệt từng lần ghi. Chạy: /bmad-project-context refresh.
    location: >-
      AGENTS.md
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Sau Story 1.1–1.4, `docs/` vẫn mô tả cấu trúc cũ (`lib/db.ts`, `lib/sanitize.ts`, `lib/utils.ts`, `app/styleguide`, `prisma/schema.prisma`, enum `Category`, `Product.postId`, "không có test suite"), nên agent sau sẽ làm theo đường dẫn không còn tồn tại.

**Approach:** Sửa `docs/` cho khớp code hiện tại và spine; sửa `[QD-12]`, `[QD-14]`, `[QD-20]` trong `docs/quy-dinh.md` và `[PR-15]`, `[PR-16]`; ghi Supabase là giả định (Deferred). Phần làm mới khối `bmad:context` trong `AGENTS.md` cần người duyệt (skill `bmad-project-context`), không làm trong lần chạy này.

## Boundaries & Constraints

**Always:** Theo `docs/chuan-tai-lieu.md` (giữ ID mục, dòng "Kiểm lần cuối" cập nhật ngày 2026-11-05 và commit hiện tại); spine thắng docs; đường dẫn mô tả code **hiện có** phải tồn tại; đường dẫn **đích** theo spine (`modules/<miền>/...`, `platform/ai`, `platform/storage`, `AffiliateLink`) ghi rõ là đích/chưa có; mục mô tả code cũ còn ở `lib/`, `components/site|cms/` thì nói rõ là code cũ chờ chuyển, không hướng dẫn tạo file mới ở đó.

**Never:** Không sửa `AGENTS.md` (QD-03); không sửa code, spine, PRD, `_bmad-output/`; không đổi ý nghĩa luật ngoài ba mục QD và hai mục PR nêu trên; không xoá mục `[NO-xx]` còn mở; không thêm tài liệu mới.

</intent-contract>

## Code Map

- `docs/quy-dinh.md` -- `[QD-12]`: sanitize khi ghi **và** khi render (AD-22) qua `platform/html/sanitize.ts`; `[QD-14]`: mẫu là `AffiliateLink` của `modules/products/components` (AD-11; đích, hiện vẫn là `components/site/product-card.tsx`); `[QD-20]`: ba ngoại lệ của AD-6 — `modules/engagement/actions.ts` (ghi Lượt xem/Lượt tim và đọc số tim), `posts.searchPosts`, `app/cms/upload/route.ts` (tự gọi `requireAdmin()`); `run()` ở `platform/auth/run.ts`. `[QD-01]` giữ nguyên.
- `docs/nen-tang-ky-thuat/prisma-7.md` -- `[PR-15]`, `[PR-16]`, `[PR-06]`, `[PR-07]` và mọi chỗ nhắc `prisma/schema.prisma` → `prisma/schema/` (`_base.prisma` + `<module>.prisma`), `PostType`, `PostProduct`, `Category`; Supabase là giả định production (spine Deferred).
- `docs/kien-truc-codebase.md` -- cây thư mục, bảng mô hình dữ liệu (Product không còn thuộc riêng một bài), vị trí `platform/*`, `components/ui/lib/utils.ts`, `/cms/styleguide`, `eslint.config.mjs` luật ranh giới.
- `docs/quy-uoc-code.md` -- `[QU-06]`, `[QU-07]`, `[QU-20]`, `[QU-21]`, dòng 57, 67 và checklist: `@/platform/db`, `@/platform/format`, `@/platform/html/*`, `@/components/ui/lib/utils`; `[QU-26]`–`[QU-28]` giữ trạng thái "chờ Vinh duyệt".
- `docs/nen-tang-ky-thuat/{giao-dien,kiem-tra-va-bao-mat,nextjs-16,lop-ai}.md` -- đường dẫn `lib/*` đã chuyển, `/styleguide` → `/cms/styleguide`, `maxDuration` 120, `[BM-08]`, `[BM-09]`, `[BM-12]` mô tả sanitize/ảnh/auth mới (không `a`/`img`, không `*.supabase.co`).
- `docs/cong-thuc/*.md` -- `doi-schema.md:26` (schema đã tách), `them-man-hinh.md:31` (`/cms/styleguide`), `chuyen-code-cu.md` (đánh dấu dòng đã chuyển ở epic nền: 9 file `platform/`, `lib/utils.ts`, `app/styleguide`), `them-tinh-nang-ai.md:61` (`maxDuration`).
- `docs/kiem-chung.md` -- `[KC-03]` `prisma/schema/`; thêm ESLint ranh giới vào mô tả `[KC-02]`.
- `docs/no-ky-thuat.md` -- chỉ sửa đường dẫn đã đổi trong mục còn mở.
- `docs/README.md` -- mục lục/mô tả nếu nhắc cấu trúc cũ.

## Tasks & Acceptance

**Execution:**
- [x] Các file ở Code Map -- sửa như mô tả
- [x] Kiểm đường dẫn: trích mọi đường dẫn trong backtick ở `docs/**/*.md` (trừ `PRD_AFFILIATE_PROJECT.md`), `ls` từng cái; cái không tồn tại phải là đích ghi rõ, mẫu có `<…>`, hoặc nằm trong mục `[NO-xx]`/lịch sử — liệt kê ngoại lệ vào báo cáo
- [x] `grep -rn "lib/db\|lib/sanitize\|lib/utils\|lib/images\|lib/auth\|lib/require-admin\|lib/slug\|lib/format\|lib/site\|lib/content\|app/styleguide\|schema.prisma\|maxDuration = 60" docs` chỉ còn trong ngữ cảnh lịch sử (bảng chuyển, NO đã đóng)

**Acceptance Criteria:**
- Given `docs/` sau thay đổi, when chạy bước kiểm đường dẫn, then mọi đường dẫn hiện có tồn tại và không còn câu hướng dẫn tạo file ở `lib/`, `components/site|cms/`.
- Given `docs/quy-dinh.md`, when đọc `[QD-12]`, `[QD-14]`, `[QD-20]`, then khớp AD-22, AD-11, AD-6.
- Given docs nhắc Supabase, when đọc, then ghi là giả định production (Deferred).

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review pass
- verdicts: 67 findings — high 0, medium 9, low 49, false 6, maybe-false 0 (Verification Gap: 0; Intent: 6 điểm mô tả)
- findings:
  - Blind Hunter (12)
    - `[low]` `[patch]` Câu styleguide lạc sang bullet AD-11 (giao-dien.md) — chuyển lại
    - `[low]` `[patch]` `products.prisma:6-7` lệch một dòng — `:7-8`
    - `[low]` `[patch]` [PR-07] SetNull vs Restrict cho liên kết tuỳ chọn — ghi Restrict cho Danh mục (FR-28)
    - `[medium]` `[patch]` [KC-02] mô tả phạm vi lint rộng hơn thực tế — ghi đúng phạm vi
    - `[low]` `[patch]` Mermaid mất cạnh vào `lib/categories.ts` — khôi phục
    - `[medium]` `[patch]` [KT-01] và checklist vẫn "chỉ tag posts", trái AD-7 — sửa
    - `[low]` `[patch]` 301/308 lệch giữa các tài liệu — dùng cách ghi của spine
    - `[medium]` `[patch]` `them-server-action.md` sót: `requiredText`/`slugField` như đã có, câu "đường dẫn cũ" — sửa
    - `[medium]` `[patch]` [NO-14] lỗi thời; thiếu mục nợ `AGENTS.md` cũ — sửa/thêm
    - `[medium]` `[patch]` [QD-20] phạm vi chữ; nextjs-16 thêm ngoại lệ route `app/api` — sửa phạm vi, bỏ hướng dẫn `app/api`
    - `[low]` `[patch]` `deletePost` id lạ trả thông báo chung — ghi vào BM
    - `[low]` `[patch]` `prose-a:` vô dụng — ghi chú
  - Edge Case Hunter (12)
    - `[low]` `[patch]` Câu styleguide lạc — cùng nhóm Blind #1
    - `[medium]` `[patch]` [KC-02] phạm vi lint — cùng nhóm Blind #4
    - `[medium]` `[patch]` Lint không chặn file mới ở `lib/` — ghi rõ chỉ review chặn (cùng nhóm Blind #4)
    - `[low]` `[patch]` [QU-06] `../` ở app trừ LEGACY_APP_FILES — cùng nhóm Blind #4
    - `[low]` `[patch]` `chuyen-code-cu.md` bước 5 thiếu điều kiện — bổ sung
    - `[low]` `[patch]` `:6-7` lệch dòng — cùng nhóm Blind #2
    - `[low]` `[patch]` `deletePost` P2025 — cùng nhóm Blind #11
    - `[low]` `[reject]` Giới hạn tần suất theo tiến trình — spine Deferred "Nhiều instance" đã ghi nhận
    - `[low]` `[patch]` `maxDuration` layout không phủ route handler — sửa câu
    - `[medium]` `[patch]` Mất luật "mọi action CMS qua run()" — khôi phục
    - `[medium]` `[patch]` Mất luật route handler admin tự `requireAdmin()` — khôi phục
    - `[low]` `[patch]` Upload route chỉ ngoại lệ với run()/proxy — cùng nhóm Blind #10
  - Verification Gap: không có lỗ hổng.
  - Intent Alignment (6)
    - `[medium]` `[defer]` Chưa làm mới khối `bmad:context` của `AGENTS.md` — cần Vinh duyệt qua `bmad-project-context` ([QD-03])
    - `[false]` `[reject]` Kiểm đường dẫn theo cách A2 (đích có ghi rõ) — A1 mâu thuẫn chính AC2 ([QD-14], [QD-20] trỏ đích)
    - `[false]` `[reject]` [PR-15]/[PR-16] sửa ở prisma-7.md — nơi duy nhất có hai mục này
    - `[false]` `[reject]` Sửa thêm README, no-ky-thuat, viet-workflow — theo "ở nơi docs nhắc tới"
    - `[false]` `[reject]` Không có test trong diff — thay đổi chỉ là tài liệu
    - `[false]` `[reject]` Luật mô tả đích chưa có code — AC2 yêu cầu đúng như vậy
  - Quy ước dự án (37)
    - `[low]` `[patch]` × 33 Ví dụ/công thức trái spine: lop-ai (nhà cung cấp, hợp đồng `ask`, 90 s, `suggestions` + `after()`), nextjs-16 (page mỏng AD-12 ×3, tag AD-7 ×4, chữ ký `renamePost`, giới hạn tần suất bắt buộc, Zod, log, `formatCount`, `localStorage`, vị trí `ViewCounter`, cookie, `ENGAGEMENT_TAG`, route `app/api`, placeholder phân trang), giao-dien (Category đã có bảng, service/action banner, page mỏng, form RHF, bỏ `useActionState`, số tim phía client, `formatCount`, [GD-40] ×2), prisma-7 (`Product.pinned` trái AD-4), kiem-tra-va-bao-mat (giới hạn từ constants, `fields.tsx` → module, [BM-40]), them-man-cms (khuôn form), kien-truc (AD-3→AD-4), chuyen-code-cu (`npm test`) — sửa theo spine
    - `[medium]` `[defer]` CONTRACT-GAP `AGENTS.md` — cùng nhóm Intent #1
    - `[low]` `[patch]` `requiredText`/`slugField` — cùng nhóm Blind #8
    - `[low]` `[patch]` Hình dạng kết quả `likePost`/`recordView` không thống nhất — gộp vào sửa nextjs-16/giao-dien
    - `[low]` `[reject]` Số dòng [GD-15] chưa đối chiếu — sẽ được kiểm lại sau lượt sửa

## Verification

**Commands:**
- `npm run lint` -- expected: sạch (không đổi code)
- `git diff --stat` -- expected: chỉ `docs/`

**Manual checks (if no CLI):**
- Kết quả bước kiểm đường dẫn trong báo cáo.
</content>
</invoke>

## Auto Run Result

Status: done (phần `docs/`). Phần `AGENTS.md` còn chờ Vinh.

**Thay đổi:** 20 file trong `docs/` khớp code sau Story 1.1–1.4 và khớp spine.
- `[QD-12]` khớp AD-22, `[QD-14]` khớp AD-11, `[QD-20]` ghi đủ ba ngoại lệ của AD-6 (phạm vi gồm mọi Server Action và Route Handler CMS).
- `[PR-15]`, `[PR-16]` theo `prisma/schema/`.
- Supabase ghi là giả định (Deferred).
- Ví dụ trong công thức viết lại theo AD-6/7/10/12/14/27.
- Thêm `[NO-25]` ghi nhận `AGENTS.md` đang lỗi thời.

**File:**
- `docs/quy-dinh.md`, `docs/quy-uoc-code.md`, `docs/kien-truc-codebase.md`, `docs/kiem-chung.md`, `docs/no-ky-thuat.md`, `docs/README.md`, `docs/viet-workflow.md`.
- `docs/nen-tang-ky-thuat/{prisma-7,giao-dien,kiem-tra-va-bao-mat,nextjs-16,lop-ai}.md`.
- `docs/cong-thuc/{chuyen-code-cu,doi-schema,them-man-hinh,them-man-cms,them-trang-public,them-tinh-nang-ai,them-server-action,bo-chuc-nang}.md`.

**Review:** 67 phát hiện (medium 9, low 49, false 6).
- Đã sửa mọi mục patch: sai lệch so với code, phạm vi lint, luật `run()` và `requireAdmin()` cho route handler, cùng 33 ví dụ trái spine.
- Để lại 1 mục: làm mới `AGENTS.md`.
- Loại 7 mục, lý do có trong Triage Log.

**Có cần review lần nữa không:** có (`true`). Lượt này sửa từ 2 nhóm medium trở lên, và các ví dụ công thức (`nextjs-16.md`, `giao-dien.md`, `lop-ai.md`) được viết lại nhiều mà chưa ai review lại sau khi sửa. Đây là mẫu agent sẽ chép theo.

**Kiểm chứng:**
- `git status`: chỉ đổi `docs/`.
- `npm run lint`: sạch.
- Grep đường dẫn cũ: chỉ còn trong bảng lịch sử `chuyen-code-cu.md` và `[NO-25]`.
- Subagent đã kiểm từng đường dẫn trong backtick. Đường dẫn của code hiện có đều tồn tại. Phần còn lại là đích có ghi rõ, mẫu `<…>`, hoặc mục lịch sử.

**Rủi ro còn lại:**
- `AGENTS.md` (khối `bmad:context`) vẫn mô tả cấu trúc cũ. Cần chạy `/bmad-project-context refresh` và Vinh duyệt ([QD-03]). Story 1.5 chỉ xong hẳn sau bước này.
- Ví dụ công thức dùng những thứ chưa có (`formatCount`, react-hook-form, shadcn `field`, `modules/*`), tất cả đều ghi là đích.
- Số dòng trích dẫn được tính tay theo `8771851`.

**Cập nhật 2026-11-05:** khối `bmad:context` của `AGENTS.md` đã được làm mới qua `bmad-project-context` (Vinh duyệt); [NO-25] đã đóng.
