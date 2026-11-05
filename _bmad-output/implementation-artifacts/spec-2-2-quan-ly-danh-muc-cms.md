---
title: 'Story 2.2: Quản lý Danh mục trong CMS'
type: 'feature'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '76148e90b3a7be72afee3f0045e0bf4c1229f9e7'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
  - '{project-root}/docs/nen-tang-ky-thuat/giao-dien.md'
warnings: ['oversized']
deferred:
  - summary: >-
      AGENTS.md chưa nhắc npm run test:db (cần Postgres + TEST_DATABASE_URL) ở bước bàn giao và còn ghi "hiện chỉ có POSTS_TAG".
    evidence: |-
      Sửa qua bmad-project-context (record/refresh), cần Vinh duyệt (QD-03).
    location: >-
      AGENTS.md
    severity: medium
  - summary: >-
      Chưa có khung test Server Action (run → safeParse → service → updateTag) cho categories/actions.ts.
    evidence: |-
      Cần stub next/cache và requireAdmin; nên dựng một mẫu dùng chung khi có thêm module.
    location: >-
      modules/categories/actions.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Bảng `Category` đã có (Story 1.4) nhưng Vinh chưa tạo, sửa, sắp thứ tự hay xoá được Danh mục; chưa có module `categories`, chưa có component form dùng chung cho CMS, và `service.ts` chưa có khung test tích hợp DB (AD-16).

**Approach:** Dựng module `categories` theo AD-5 và màn `/cms/danh-muc` (danh sách + tạo/sửa + lên/xuống + xoá); dựng `CmsForm`, `ConfirmDialog`, `UnsavedChangesGuard` ở `components/shared/`; thêm `RESERVED_ROOT_SLUGS` vào `platform/slug.ts`; dựng khung test DB trên database riêng `affiliate_test`; seed 8 Danh mục Vinh đã duyệt (2026-11-05).

## Boundaries & Constraints

**Always:** Đường ghi AD-6: action trong `run()` → `categoryInputSchema.safeParse` → `categories/service.ts` → `updateTag(CATEGORIES_TAG)`; form React Hook Form + `zodResolver` với cùng `schema.ts`, shadcn `field` + `Controller`, lỗi validate tại trường phía client, `UserError` bằng Toast (AD-14); giới hạn cứng trong `modules/categories/constants.ts`; `categories` (T0) không import module khác; số Bài web/Sản phẩm của Danh mục đọc qua `modules/posts/cms-queries.ts` (tầng cao nhất chạm `Post`/`Product`/`Category` — AD-2) và Screen truyền xuống; xoá Danh mục còn tham chiếu bị chặn cả phía server (FK `Restrict` → `UserError`); test DB chỉ chạy trên Postgres cục bộ 54329, database tên kết thúc `_test` ([QD-07]); câu UI theo `EXPERIENCE.md`.

**Never:** Không đổi đường dẫn kèm 308 (Story 2.7); không trang public Danh mục; không thêm cột vào `Category` ngoài `@db.VarChar` cho `name`/`slug`/`description` theo hằng (một migration, AD-15); không kéo-thả; không đụng màn bài viết ngoài việc gán Danh mục trong seed.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tạo hợp lệ | tên "Đồ bếp", đường dẫn trống | lưu, đường dẫn = `slugify(tên)` = `do-bep`, thứ tự cuối danh sách, ở lại màn sửa | — |
| Đường dẫn hệ thống | `cms`, `bai-viet`, `meo-vat`, `trang`, … | từ chối tại trường | "Đường dẫn này đã dành cho hệ thống" |
| Đường dẫn trùng | trùng slug Danh mục khác | từ chối | `UserError` "Đường dẫn đã được dùng" → Toast |
| Đường dẫn sai dạng | có dấu, khoảng trắng, chữ hoa | từ chối tại trường | thông báo tiếng Việt |
| Tên rỗng / quá dài | "" hoặc > giới hạn | từ chối tại trường | thông báo tiếng Việt |
| Xoá Danh mục trống | 0 bài, 0 sản phẩm | ConfirmDialog (focus "Huỷ") → xoá | — |
| Xoá Danh mục còn dùng | 3 bài, 2 sản phẩm | chặn, không gọi xoá | Toast "Danh mục còn 3 Bài web và 2 Sản phẩm. Chuyển sang Danh mục khác trước." |
| Xoá bị đua | bài vừa gắn sau khi tải trang | server từ chối | `UserError` cùng ý → Toast |
| Lên/xuống | mục đầu bấm lên, mục cuối bấm xuống | nút tắt; mục giữa đổi chỗ ngay, lưu thứ tự | — |
| Rời form chưa lưu | sửa tên rồi bấm mục menu / đóng tab | hỏi "Bạn có thay đổi chưa lưu. Rời trang?" | — |
| Seed | `npm run db:seed` hai lần | 8 Danh mục đúng thứ tự, mỗi bài mẫu gắn một Danh mục | không lỗi |

</intent-contract>

## Code Map

- `prisma/schema/categories.prisma` -- `Category` (`name`, `slug @unique`, `description?`, `sortOrder`); thêm `@db.VarChar(n)` theo `modules/categories/constants.ts` qua migration `limit_category_fields` (`--create-only`, đọc SQL).
- `platform/slug.ts` -- thêm `RESERVED_ROOT_SLUGS` (spine AD-20: `cms`, `api`, `bai-viet`, `bio`, `tim-kiem`, `meo-vat`, `gom-link`, `trang`, cộng mọi thư mục tĩnh gốc của `app/(site)`); `platform/slug.test.ts` thêm test: mọi thư mục tĩnh ở gốc `app/(site)` (bỏ `[…]`, `_…`, `(…)`) đều nằm trong danh sách. Hiện `app/(site)` có `bai-viet`, `[category]`, `_components`.
- `platform/validation/fields.ts` -- thêm `requiredText(max, message)` và `slugField` (chữ thường không dấu, số, `-`) theo AD-14; test cạnh nó.
- `modules/categories/` (mới) -- `constants.ts` (giới hạn, nhãn), `tags.ts` (`CATEGORIES_TAG = "categories"`), `schema.ts` (`categoryInputSchema`: `id?`, `name`, `slug` trống → slugify, kiểm `RESERVED_ROOT_SLUGS`, `description`), `types.ts`, `cms-queries.ts` (`getCategoryForCms(id)`), `service.ts` (`import "server-only"`; `saveCategoryRecord`, `deleteCategoryRecord` bắt P2003 → `UserError`, P2002 slug → `UserError`; `moveCategoryRecord(id, "up"|"down")` đổi `sortOrder` trong transaction; nhận `tx?`), `actions.ts` (`saveCategory`, `deleteCategory`, `moveCategory` — đều qua `run()`, `updateTag(CATEGORIES_TAG)`), `components/category-form.client.tsx`. Tên theo Consistency Conventions và [QU-27].
- `modules/posts/cms-queries.ts` (mới, `import "server-only"`) -- `listCategoriesForCms()` trả Danh mục theo `sortOrder` kèm số Bài web và Sản phẩm (`_count`).
- `components/shared/` (mới) -- `cms-form.client.tsx` (bọc RHF: nút Lưu dính đáy mobile, tắt + spinner khi gửi, lỗi server → Toast, lỗi mạng → Toast "Chưa gửi được, kiểm tra mạng rồi thử lại", giữ dữ liệu), `confirm-dialog.client.tsx` (shadcn `alert-dialog`, focus mặc định "Huỷ"), `unsaved-changes-guard.client.tsx` (`beforeunload` + chặn click link nội bộ khi form bẩn). Base component thêm bằng `npx shadcn add field alert-dialog`; CLI kéo dependency mới ngoài bảng Stack → dừng, ghi báo cáo.
- `package.json` -- `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.1` (spine Stack "thêm mới"); script `test:db`.
- `app/cms/danh-muc/page.tsx`, `app/cms/danh-muc/[id]/page.tsx`, `app/cms/danh-muc/moi/page.tsx` + `_components/*-screen.tsx`, `*-skeleton.tsx` (AD-12); danh sách mobile dạng Card, có nút lên/xuống 44px, sửa, xoá; rỗng → "Chưa có Danh mục nào. Tạo Danh mục đầu tiên."; `notFound()` → "Không tìm thấy. Có thể đã bị xoá." + link về danh sách.
- `app/cms/_components/cms-shell.client.tsx` -- thêm mục "Danh mục" `/cms/danh-muc` đúng vị trí IA (sau Bài web).
- `prisma/seed.ts` -- bỏ Danh mục `nha-cua-doi-song`; upsert 8 Danh mục theo slug, thứ tự: Nhà bếp, Nhà cửa & Decor, Giặt giũ & Tủ đồ, Làm đẹp, Thời trang, Cây cảnh, Học tập & Làm việc, Du lịch; gắn mỗi bài mẫu Danh mục khớp nội dung (vd nồi chiên/bếp → Nhà bếp, decor phòng ngủ → Nhà cửa & Decor, gấp/giặt quần áo → Giặt giũ & Tủ đồ, lỗ chân lông → Làm đẹp, phụ kiện → Thời trang, cây thiết mộc lan → Cây cảnh, góc học tập → Học tập & Làm việc, vali → Du lịch); xoá Danh mục ngoài danh sách khi không còn tham chiếu.
- Khung test DB: `vitest.db.config.ts` (include `**/*.db.test.ts`, `globalSetup` từ chối chạy nếu `TEST_DATABASE_URL` không phải host `localhost`/`127.0.0.1` cổng 54329 và tên DB kết thúc `_test`; tạo DB nếu chưa có; `prisma migrate reset --force` với `DATABASE_URL`=`TEST_DATABASE_URL`, `DIRECT_URL` bỏ trống); `vitest.config.ts` loại `**/*.db.test.ts`; `.env.example` thêm `TEST_DATABASE_URL` giá trị giả + chú thích ([QD-06]); `modules/categories/service.db.test.ts` phủ các dòng DB của Matrix; `docs/kiem-chung.md` thêm `[KC-08] npm run test:db`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `components/ui/{field,alert-dialog}.tsx` (CLI) -- thư viện form
- [x] `platform/slug.ts`, `platform/validation/fields.ts` + test -- AD-14, AD-20
- [x] `prisma/schema/categories.prisma` + migration `limit_category_fields` -- AD-15
- [x] `modules/categories/*`, `modules/posts/cms-queries.ts` -- AD-5, AD-6
- [x] `components/shared/*` -- UX-DR58..60
- [x] `app/cms/danh-muc/**`, `cms-shell.client.tsx` -- UX-DR78
- [x] `prisma/seed.ts` -- 8 Danh mục
- [x] Khung test DB + `modules/categories/schema.test.ts` + `service.db.test.ts` -- AD-16
- [x] `docs/kiem-chung.md`, `docs/cong-thuc/them-man-cms.md` (trỏ component shared vừa dựng), `eslint.config.mjs` nếu cần

**Acceptance Criteria:**
- Given `npm run build && npm start`, when Vinh tạo, sửa, đổi thứ tự, xoá Danh mục ở 360px, then đúng Matrix, Toast tiếng Việt, menu CMS có "Danh mục".
- Given `npm test` và `npm run test:db`, when chạy, then xanh, phủ mọi dòng Matrix (dòng UI kiểm tay ghi vào báo cáo).

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review pass
- verdicts: 52 findings — high 0, medium 4, low 30, false 18, maybe-false 0 (gộp nhóm theo nguyên nhân)
- findings:
  - Intent Alignment (8)
    - `[false]` `[reject]` "Dùng cho menu site" chưa thấy trên site — đọc A1: menu site là Story 2.6
    - `[false]` `[reject]` Toast khi đua không có số — spec chọn B1, server dùng FK (AD-2 cấm `categories` đếm bảng tầng cao)
    - `[low]` `[defer]` Action layer không có test — chưa có khung test Server Action
    - `[false]` `[reject]` Test thư mục một chiều — đúng AD-20 ("mọi thư mục gốc")
    - `[false]` `[reject]` Component shared không có test tự động — đã kiểm tay 26 bước trên Chrome headless
    - `[false]` `[reject]` Seed làm thêm việc (gán bài, xoá Danh mục cũ) — đúng Code Map, Vinh duyệt danh sách
    - `[low]` `[patch]` Nhãn UX-DR trong comment sai — sửa
    - `[false]` `[reject]` Lỗi theo trường chỉ test ở schema — cùng schema với `zodResolver`, đã kiểm tay
  - Verification Gap (5)
    - `[medium]` `[defer]` `npm run test:db` không có trong bước bàn giao của `AGENTS.md` — sửa file ngữ cảnh agent qua `bmad-project-context` (cần Vinh duyệt)
    - `[low]` `[defer]` Không test action dùng `parsed.data` — chưa có khung test Server Action
    - `[low]` `[defer]` Không test thứ tự khi `sortOrder` trùng — seed đã khác nhau, lần chuyển đầu đánh số lại
    - `[false]` `[reject]` `AGENTS.md` không nhắc `TEST_DATABASE_URL` — cùng nhóm #1
    - `[low]` `[reject]` Migration thu hẹp VarChar không kiểm dữ liệu dài — chưa có production; dữ liệu cục bộ ngắn
  - Edge Case Hunter (5)
    - `[medium]` `[patch]` UnsavedChangesGuard bỏ sót Back/Forward — chặn popstate
    - `[low]` `[reject]` Migration dữ liệu dài — như trên
    - `[low]` `[reject]` Route group lồng trong `app/(site)` — chưa có, hiếm
    - `[low]` `[reject]` Hai `moveCategory` đồng thời — một người vận hành
    - `[low]` `[reject]` Số đếm cũ chặn xoá Danh mục vừa trống — tải lại trang là xong
  - Blind Hunter (13)
    - `[medium]` `[patch]` Guard bỏ sót Back — cùng nhóm Edge #1
    - `[false]` `[reject]` Slug trùng chỉ Toast không lên trường — AD-14: `Result<T>` không mang lỗi theo trường, `UserError` bằng Toast
    - `[false]` `[reject]` Sửa slug không cảnh báo/308 — Story 2.7 (intent C1), chưa có trang public
    - `[medium]` `[defer]` `AGENTS.md` "hiện chỉ có `POSTS_TAG`", thiếu `test:db` — cùng nhóm Verification #1 (ý "không có test suite" sai: đã làm mới)
    - `[false]` `[reject]` `CATEGORIES_TAG` chưa ai đọc — query public Danh mục ở Story 2.6/2.7 phải gắn
    - `[low]` `[reject]` Migration dữ liệu dài — như trên
    - `[low]` `[defer]` Action layer không test — cùng nhóm
    - `[false]` `[reject]` `package-lock.json` không có trong diff — diff được dựng loại trừ lockfile; lockfile có trong working tree
    - `[low]` `[patch]` Lên/xuống không báo trình đọc màn hình, mất focus — `aria-live`, giữ focus
    - `[low]` `[patch]` `NETWORK_ERROR` và try/catch chép hai nơi — gom helper
    - `[false]` `[reject]` `notFound()` trong Suspense trả 200 — AD-12 chấp nhận cho CMS; tiêu đề chung: low reject
    - `[low]` `[reject]` Bộ đếm ký tự trước trim — hiếm, không chặn sai
    - `[low]` `[patch]` TRUNCATE chép tay mỗi file test — helper chung; chặn trong worker: reject (globalSetup đã chặn)
  - Quy ước dự án (21)
    - `[low]` `[patch]` `types.ts` chứa kiểu input (AD-5) — chuyển vào `schema.ts`
    - `[low]` `[patch]` Chữ ký service `delete`/`move` ([QU-27]) — dùng `z.infer` schema
    - `[low]` `[patch]` Thứ tự import `category-list-screen.tsx` — sửa
    - `[low]` `[patch]` `NETWORK_ERROR` lặp — cùng nhóm
    - `[low]` `[patch]` Lên/xuống thiếu spinner + `toast.success` ([GD-40]) — thêm
    - `[low]` `[patch]` 404 theo route trái AD-12 — chuyển `app/cms/not-found.tsx`
    - `[low]` `[patch]` Styleguide thiếu mẫu component shared ([GD-40]) — thêm
    - `[false]` `[reject]` Spec thiếu khối khai báo action — sửa spec của chính lần build
    - `[false]` `[reject]` Spec thiếu bảng 2a–2e — sửa spec
    - `[false]` `[reject]` Spec thiếu bảng ảnh hưởng doi-schema — sửa spec; rủi ro dữ liệu dài ghi ở Auto Run Result
    - `[low]` `[reject]` `TEST_DATABASE_URL` đọc ở hai file công cụ test — ngoài `platform/`, chỉ phục vụ test
    - `[false]` `[reject]` CONTRACT-GAP `CATEGORIES_TAG` — như trên
    - `[false]` `[reject]` CONTRACT-GAP toast khi đua — như trên
    - `[false]` `[reject]` × 8 mục "Cần kiểm tay" — đã kiểm tay (báo cáo triển khai: 26 bước, 360/1280px, sáng/tối)

## Verification

**Commands:**
- `npm test` -- expected: xanh
- `npm run test:db` -- expected: xanh (Postgres cục bộ đang chạy)
- `npx tsc --noEmit` -- expected: sạch
- `npm run lint` -- expected: sạch
- `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng trống, `/cms/danh-muc` ở 360px và 1280px: các dòng UI của Matrix (ConfirmDialog, lên/xuống, rời form chưa lưu, Toast).
</content>
</invoke>

## Auto Run Result

Status: done

**Thay đổi:**
- Module `categories` theo AD-5: schema, constants, tags, cms-queries, service, actions, form.
- Màn `/cms/danh-muc` để tạo, sửa, đổi thứ tự (nút lên/xuống có spinner, thông báo cho trình đọc màn hình, giữ focus) và xoá. Xoá bị chặn khi còn Bài web hoặc Sản phẩm: client chặn trước, server chặn bằng FK.
- `listCategoriesForCms` đặt ở `modules/posts/cms-queries.ts` (AD-2).
- Component dùng chung trong `components/shared/`: `CmsForm`, `ConfirmDialog`, `UnsavedChangesGuard` (bắt cả nút Back), `callAction`.
- `RESERVED_ROOT_SLUGS`, `requiredText`, `slugField` trong `platform/`.
- Migration `limit_category_fields`: VarChar 60/80/300.
- Seed 8 Danh mục Vinh duyệt; các bài mẫu được gắn vào Danh mục.
- Khung test DB: `npm run test:db` chạy trên database `affiliate_test`, có chặn để không chạy nhầm sang DB khác.
- 404 chung cho CMS ở `app/cms/not-found.tsx`.
- Styleguide có mẫu form.

**Review:** 52 phát hiện (medium 4, low 30, false 18).
- Đã sửa 9 nhóm: guard bắt nút Back, trợ năng và phản hồi của thao tác lên/xuống, gom helper lỗi mạng, chuyển kiểu dữ liệu vào `schema.ts`, chữ ký service, 404 theo AD-12, mẫu trong styleguide, helper reset DB cho test, nhãn UX-DR.
- Để lại 2 mục: `AGENTS.md` chưa nhắc `test:db` (cần sửa qua `bmad-project-context`), và chưa có khung test cho Server Action.

**Có cần review lần nữa không:** không (`false`). Chỉ 1 nhóm medium được sửa.

**Kiểm chứng:**
- `npm test`: 130 test xanh.
- `npm run test:db`: 13 test xanh.
- `tsc`, `lint`, `build`: sạch.
- Trước lượt sửa, subagent chạy 26 bước kiểm tay trên Chrome headless ở 360px và 1280px; tất cả đạt.

**Rủi ro còn lại:**
- Sau lượt sửa chưa chạy lại trình duyệt: phần chặn nút Back, spinner, toast và focus chưa được kiểm trên giao diện thật.
- Khi form đã sạch, một mục giữ chỗ vẫn nằm trong lịch sử trình duyệt, nên lần bấm Back đầu tiên sau khi lưu chưa rời trang.
- Test DB dùng `migrate deploy` thay cho `reset`, vì Prisma 7 chặn agent chạy reset.
- `prisma.config.ts` đổi `??` thành `||`.
- Vinh cần thêm `TEST_DATABASE_URL` vào `.env`.
- Nếu production có dữ liệu Danh mục dài hơn giới hạn mới, migration thu hẹp VarChar sẽ lỗi khi deploy; nên kiểm độ dài trước.
