---
title: 'Story 1.3: Khoá ranh giới module bằng ESLint (AD-17 bước 2, phần 2)'
type: 'chore'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '4d3d8d393a682b2f19e158af459e8acb252c7101'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/docs/cong-thuc/chuyen-code-cu.md'
warnings: []
deferred:
  - summary: >-
      Tài liệu còn trỏ app/styleguide, /styleguide, @/lib/utils, maxDuration 60.
    evidence: |-
      docs/kien-truc-codebase.md, docs/quy-uoc-code.md:57,67, docs/nen-tang-ky-thuat/giao-dien.md, nextjs-16.md:201-204, kiem-tra-va-bao-mat.md:145, cong-thuc/them-man-hinh.md:31, them-tinh-nang-ai.md:61, chuyen-code-cu.md:44. Làm ở Story 1.5 (AD-17 bước 4).
    location: >-
      docs/
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Chưa có gì chặn import sai tầng (AD-2) hay vòng import, nên 11 module xây sau có thể trộn lẫn; alias shadcn còn trỏ `lib/`, `/styleguide` còn công khai ([NO-15]), `maxDuration` CMS là 60 thay vì 120 (AD-18).

**Approach:** Thêm luật `no-restricted-imports` theo tầng và `import/no-cycle` vào `eslint.config.mjs`, miễn file cũ bằng danh sách tường minh; chuyển `cn` sang `components/ui/lib/utils.ts` và đổi alias `components.json`; chuyển `/styleguide` vào `/cms/styleguide`; đặt `maxDuration = 120`.

## Boundaries & Constraints

**Always:** Thông báo lỗi lint tiếng Việt, nêu AD-2; luật sinh từ một bảng tầng duy nhất trong `eslint.config.mjs` (T0 `categories`, `style-profiles` · T1 `products`, `inspirations` · T2 `research`, `posts`, `banners` · T3 `engagement`, `content-sets`, `bio` · T4 `suggestions`); file được miễn liệt kê từng đường dẫn, không glob; chuyển file không đổi hành vi; không re-export từ chỗ cũ.

**Never:** Không chuyển file cũ nào khác ngoài `lib/utils.ts` và `app/styleguide/page.tsx`; không thêm thư viện (`eslint-plugin-import` và resolver TypeScript có sẵn qua `eslint-config-next`); không tự duyệt `[QU-26]`–`[QU-28]` (Vinh duyệt riêng — điều kiện đóng story, ghi vào báo cáo); không sửa `AGENTS.md`; không commit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Module tầng thấp import tầng cao | `modules/products/x.ts` import `@/modules/posts/queries` | `npm run lint` báo lỗi | thông báo nêu AD-2 |
| Cùng tầng | `modules/posts/x.ts` import `@/modules/research/queries` | báo lỗi | — |
| File cấm của module khác | `modules/posts/x.ts` import `@/modules/products/service` (hoặc `actions`, `schema`, `prompts/*`) | báo lỗi | — |
| Import hợp lệ | `modules/suggestions/x.ts` import `@/modules/posts/queries`, `@/modules/categories/types`, `@/modules/products/tags`, `@/modules/products/components/y`; `modules/posts/x.ts` import `@/modules/posts/service` | không báo | — |
| Ngoại lệ AD-9 | `modules/suggestions/actions.ts` import `@/modules/posts/service`, `@/modules/research/prompts/z.prompt` | không báo | — |
| platform / shared | `platform/x.ts` hoặc `components/shared/x.ts` import `@/modules/posts/queries` hoặc `@/app/...` | báo lỗi | — |
| app | file mới trong `app/` import `@/platform/db` hoặc `@/modules/posts/service` | báo lỗi | — |
| Code cũ | file mới trong `modules/`, `platform/`, `app/` import `@/lib/posts`, `@/components/site/x`, `@/components/cms/x` | báo lỗi | — |
| Vòng import | `modules/posts/a.ts` ↔ `modules/posts/b.ts` | `import/no-cycle` báo lỗi | — |

</intent-contract>

## Code Map

- `eslint.config.mjs` -- flat config hiện chỉ có `nextVitals`, `nextTs`; plugin `import` đã đăng ký và có `import/resolver` typescript (`node_modules/eslint-config-next/dist/index.js:117-170`) nên `import/no-cycle` resolve được `@/`. Block sau cùng cho cùng một luật ghi đè block trước → khối ngoại lệ AD-9 phải nhắc lại mọi hạn chế trừ phần được phép.
- `lib/utils.ts` -- chỉ `export { cn } from "cn"`; chuyển sang `components/ui/lib/utils.ts`. Người dùng `@/lib/utils`: `components/cms/{fields,status-badge,seo-score,bottom-nav}.tsx`, `components/site/{category-badge,product-card}.tsx`. `components/ui/*` import thẳng gói `cn` — giữ nguyên.
- `components.json:14-20` -- alias `utils` `@/lib/utils`, `lib` `@/lib`, `hooks` `@/hooks` → đổi theo spine AD-17 bước 2.
- `app/styleguide/page.tsx` -- đã có `robots: { index: false }`; import `components/site/*`, `components/cms/seo-score`, `components/theme-toggle` (giữ nguyên import, file mới vào danh sách miễn). Đích `app/cms/styleguide/page.tsx` (nằm trong `app/cms/layout.tsx`, sau Basic Auth của `proxy.ts`).
- `app/robots.ts:6` -- `disallow` có `"/styleguide"` → bỏ (route không còn).
- `app/cms/layout.tsx:11` -- `maxDuration = 60` → 120, comment nêu AD-18.
- File `app/**` hiện import `@/lib/*`, `@/components/site|cms/*` hoặc `@/platform/db` → danh sách miễn (tìm bằng grep, liệt kê từng file).
- `docs/no-ky-thuat.md` -- [NO-15] đã sửa → xoá; [NO-22] cập nhật đường dẫn `@/components/ui/lib/utils`.

## Tasks & Acceptance

**Execution:**
- [x] `eslint.config.mjs` -- bảng `TIERS`, hàm sinh block `no-restricted-imports` cho từng `modules/<m>/**` (cấm module cùng/cao tầng, cấm `service|actions|schema|prompts/**` của module khác, cấm `@/app/**`, `@/lib/**`, `@/components/site/**`, `@/components/cms/**`); block ngoại lệ `modules/suggestions/actions.ts`; block `platform/**` và `components/shared/**` (cấm `@/modules/**`, `@/app/**`, code cũ); block `app/**` (cấm `@/platform/db`, `@/modules/*/service`, code cũ) với `ignores` tường minh; `import/no-cycle: "error"` cho mọi file TS -- AD-2, AD-9, AD-17
- [x] `components/ui/lib/utils.ts`, 6 file người dùng, `lib/utils.ts` (xoá), `components.json` -- chuyển `cn`, đổi alias -- AD-17 bước 2
- [x] `app/styleguide/page.tsx` → `app/cms/styleguide/page.tsx` (`git mv`), `app/robots.ts` -- chuyển route -- [NO-15], NFR-10
- [x] `app/cms/layout.tsx` -- `maxDuration = 120` -- AD-18
- [x] `eslint-rules.test.ts` (gốc repo, cạnh `eslint.config.mjs`) -- Vitest dùng API `ESLint` của gói `eslint` có sẵn: mỗi dòng I/O Matrix một test, `lintText(code, { filePath })` với đường dẫn ảo, kiểm có/không có lỗi `no-restricted-imports`; dòng vòng import tạo hai file thật trong thư mục tạm dưới `modules/` ở `beforeAll`, xoá ở `afterAll`; tên test tiếng Việt -- AD-16
- [x] `npx shadcn add separator` thử: xác nhận file ghi vào `components/ui/`, import `cn` đúng alias mới; rồi gỡ (file và mọi thay đổi `package.json`/lock). Không có mạng thì ghi rõ chưa kiểm được
- [x] `docs/no-ky-thuat.md` -- xoá [NO-15], sửa [NO-22]

**Acceptance Criteria:**
- Given repo sau thay đổi, when `npm run lint`, then sạch (file cũ miễn đúng danh sách, không file mới nào bị miễn).
- Given mỗi dòng I/O Matrix, when lint file thử, then kết quả đúng cột Expected.
- Given `npm run build && npm start`, when mở `/styleguide`, then 404; `/cms/styleguide` không auth 401, có auth hiện đủ như trước.
- Given `ls lib`, when kiểm, then còn `ai.ts`, `categories.ts`, `post-input.ts`, `posts.ts`.

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review pass
- verdicts: 36 findings — high 0, medium 3, low 13, false 11, maybe-false 0 (9 trùng nhóm được ghi theo từng lớp bên dưới; Verification Gap: 0 gap, 4 "other")
- findings:
  - Blind Hunter
    - `[medium]` `[patch]` Import tương đối `../` lọt mọi luật tầng — edge xác nhận 0 lỗi; thêm pattern cấm `^\.\./` ở mọi block ranh giới + test (không file nào đang dùng `../`)
    - `[low]` `[patch]` Pattern nội bộ chỉ khớp `service$`, bỏ sót `service/…`, `service.ts` — sửa thành `(service|actions|schema)(\.tsx?)?(/|$)` + test
    - `[low]` `[patch]` `components/ui/**` không có block, trái AD-2 ("components/ không import modules/app") — thêm vào block platform/shared + test
    - `[medium]` `[defer]` Tài liệu còn trỏ `app/styleguide`, `@/lib/utils` — thuộc AD-17 bước 4 (Story 1.5)
    - `[low]` `[reject]` Không kiểm `LEGACY_APP_FILES` khớp đĩa — mục sai không miễn gì, lint sẽ báo; hiếm gặp, sửa cần thêm test phức tạp
    - `[low]` `[reject]` Test vòng import để lại file nếu bị kill — hiếm; sửa cần cơ chế thư mục riêng ngoài cây lint
    - `[false]` `[reject]` `import/no-cycle` toàn repo quá chậm — `npm run lint` toàn repo chạy bình thường; timeout 30s chỉ là biên an toàn
    - `[low]` `[reject]` `import()` động không bị chặn — repo không dùng import động cho module; sửa cần thêm `no-restricted-syntax`
    - `[low]` `[patch]` Thiếu test module import `@/app/*` — thêm test; T3/message coverage: low, reject (logic sinh chung từ bảng)
    - `[false]` `[reject]` `maxDuration` đặt ở layout thay vì route — spine AD-17 bước 2 và epics ghi rõ `app/cms/layout.tsx`
    - `[false]` `[reject]` Không có bằng chứng thử `shadcn add` và kiểm 404/401 — subagent đã chạy, ghi ở Auto Run Result
  - Edge Case Hunter
    - `[medium]` `[patch]` Import tương đối lọt luật — cùng nhóm Blind #1
    - `[low]` `[reject]` Module không có trong `TIERS` không có luật — AD-3 đóng danh sách module; thêm module phải sửa spine trước
    - `[low]` `[patch]` Subpath `service/inner` lọt — cùng nhóm Blind #2
    - `[low]` `[reject]` File `.js` và `import()` động lọt — repo chỉ TS (Consistency), không dùng import động
    - `[low]` `[patch]` `app/` import `@/platform/db/...` lọt — gộp vào sửa pattern `^@/platform/db(/|$)`; `app/` import `prompts`/`schema` của module: AD-2 chỉ cấm `platform/db` và `service.ts` cho `app/` → false
    - `[low]` `[patch]` `components/ui` import modules lọt — cùng nhóm Blind #3
    - `[low]` `[reject]` Test bị kill để lại vòng import — như Blind #6
    - `[false]` `[reject]` Hai lần chạy test song song xoá `modules/` của nhau — chỉ xoá khi chính lần chạy tạo ra và thư mục rỗng; từ Story sau `modules/` có sẵn nên không xoá
    - `[low]` `[patch]` Spec nói cấm mọi file nội bộ nhưng subpath/relative lọt — cùng nhóm Blind #1, #2
  - Verification Gap
    - `[medium]` `[patch]` Import tương đối lọt — cùng nhóm Blind #1
    - `[medium]` `[defer]` Tài liệu cũ — cùng nhóm Blind #4
    - `[low]` `[reject]` `/cms/styleguide` nằm trong khung CMS `max-w-2xl` — hệ quả tất yếu của việc chuyển vào `app/cms`; 7 mục hiển thị đủ (subagent đã kiểm)
    - `[low]` `[reject]` Test ghi vào `modules/` thật — như Blind #6
  - Intent Alignment
    - `[false]` `[reject]` Test qua Node API thay vì CLI — cùng config; `npm run lint` CLI sạch trên repo thật
    - `[false]` `[reject]` `ignores` nên gắn cho `import/no-cycle` (C1) — spine AD-17 gắn miễn trừ cho luật import tầng; code cũ không có vòng
    - `[low]` `[reject]` Chưa test hướng T4 → T3 — sinh từ cùng một bảng, hướng T4 → T0..T2 đã test
    - `[false]` `[reject]` Luật rộng hơn chữ của story (B2) — story ghi "(AD-2)"; spine thắng
    - `[false]` `[reject]` Không thấy thử `shadcn add` — như Blind #11
    - `[low]` `[patch]` Styleguide còn comment "xoá trước khi deploy" dù [NO-15] đã đóng — sửa comment
    - `[false]` `[reject]` QU-26..28 chưa duyệt — cổng của Vinh, ghi ở Auto Run Result, không phải lỗi code
  - Quy ước dự án
    - `[false]` `[reject]` Không có vi phạm
    - `[low]` `[reject]` Comment `LEGACY_APP_FILES` vs styleguide vừa chuyển — file vẫn import code cũ nên đúng là phải miễn
    - `[medium]` `[patch]` Import tương đối — cùng nhóm Blind #1
    - `[false]` `[reject]` `@/components/theme-toggle`, `json-ld` không bị chặn — AD-17 chỉ yêu cầu chặn `lib/*`, `components/site|cms/*`
    - `[medium]` `[defer]` Tài liệu cũ — cùng nhóm Blind #4
    - `[low]` `[reject]` Thư mục tạm của test — như Blind #6

## Verification

**Commands:**
- `npm run lint` -- expected: sạch
- `npx tsc --noEmit` -- expected: sạch
- `npm test` -- expected: xanh
- `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng khác 3100/3101: `curl -I /styleguide` 404, `/cms/styleguide` 401 không auth và 200 có auth.
</content>
</invoke>

## Auto Run Result

Status: done

**Thay đổi:** luật ranh giới module trong ESLint (bảng tầng T0–T4, chặn module cùng/cao tầng, file nội bộ của module khác kể cả đường dẫn con, `@/app`, code cũ, import tương đối `../`; ngoại lệ AD-9; `platform/`, `components/ui|shared` không import `modules/`/`app/`; `app/` không import `platform/db`, `service`; `import/no-cycle` toàn repo; 11 file `app/` cũ miễn tường minh); `cn` chuyển sang `components/ui/lib/utils.ts`, alias `components.json` mới; `/styleguide` → `/cms/styleguide`; `maxDuration = 120`.

**File:**
- `eslint.config.mjs` — luật ranh giới sinh từ bảng `TIERS`, danh sách miễn `LEGACY_APP_FILES`.
- `eslint-rules.test.ts` — 30 test cho bảng I/O và các trường hợp review thêm.
- `components/ui/lib/utils.ts` (từ `lib/utils.ts`), `components.json`, 6 file `components/site|cms` đổi import `cn`.
- `app/cms/styleguide/page.tsx` (từ `app/styleguide`), `app/robots.ts`, `app/cms/layout.tsx`.
- `docs/no-ky-thuat.md` — đóng [NO-15], sửa [NO-22].

**Review:** 36 phát hiện (medium 3, low 13, false 11 + trùng nhóm). Đã sửa 5 nhóm: import tương đối, đường dẫn con, `components/ui`, test `@/app`, comment styleguide. Để lại 1 mục: tài liệu cũ, làm ở Story 1.5. Các mục bị loại và lý do có trong Triage Log.

**Có cần review lần nữa không:** không (`false`). Chỉ có 1 nhóm medium được sửa, không có nhóm high nào.

**Kiểm chứng:**
- `npm run lint`: sạch.
- `npx tsc --noEmit`: sạch.
- `npm test`: 10 file, 84 test xanh.
- `npm run build`: sạch.
- Subagent chạy `next start`: `/styleguide` trả 404; `/cms/styleguide` trả 401 khi không auth, 200 khi có auth, có noindex, đủ 7 mục.
- `npx shadcn add separator`: ghi vào `components/ui/`, không đổi `package.json`, đã gỡ lại.

**Rủi ro còn lại:**
- Chưa kiểm được việc shadcn dùng alias `utils` mới, vì component base-nova import thẳng gói `cn`.
- `/cms/styleguide` giờ nằm trong khung CMS `max-w-2xl`.
- Cấm mọi `../`, nên trong cùng một module cũng phải import bằng `@/modules/<m>/...`.
- **Chưa đóng được story:** Vinh phải tự duyệt `[QU-26]`–`[QU-28]` trong `docs/quy-uoc-code.md`.

**Cập nhật 2026-11-05:** Vinh đã duyệt [QU-26]–[QU-28]; điều kiện đóng story đã đủ.
