---
title: 'Story 1.2: Dựng platform/ và khung test Vitest (AD-17 bước 2, phần 1)'
type: 'refactor'
created: '2026-11-05'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c1892642ebc94665ca81365f7316b1a807b5aa75'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/docs/cong-thuc/chuyen-code-cu.md'
  - '{project-root}/docs/no-ky-thuat.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hạ tầng chung nằm rải ở `lib/`, không có test, và còn 7 lỗi đã biết (`[NO-01]`..`[NO-06]`, `[NO-11]`): thân bài còn nhận `a`/`img`, `//evil.com` lọt kiểm ảnh, `affiliateUrl` nhận mọi domain, lỗi Prisma/“Unauthorized” tiếng Anh lọt ra toast.

**Approach:** Chuyển 9 file hạ tầng của `lib/` sang `platform/` theo bảng `docs/cong-thuc/chuyen-code-cu.md`, sửa thẳng mọi import, thêm `run()`/`UserError`, thêm Vitest kèm unit test cho từng lỗi đã sửa. Site và CMS chạy như trước.

## Boundaries & Constraints

**Always:** Chuyển không đổi hành vi, trừ các lỗi NO được sửa; không re-export từ chỗ cũ; `platform/db` mở đầu `import "server-only"` (AD-8); lỗi cho người dùng là `UserError` tiếng Việt, lỗi bất ngờ trả "Có lỗi xảy ra, thử lại sau" (AD-13); test tên tiếng Việt, đặt cạnh nguồn (`*.test.ts`), không chạm DB, không gọi AI (AD-16); host ảnh chỉ khai báo ở `platform/images.ts`.

**Never:** Không chuyển `lib/posts.ts`, `lib/categories.ts`, `lib/ai.ts`, `lib/utils.ts` và không tách schema bài/sản phẩm sang `modules/` (story sau); không thêm ESLint tầng (Story 1.3); không đổi Prisma schema; không thêm `formatCount` hay hàm chưa ai dùng; không commit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Thân bài có link/ảnh | `<p>a<a href="x">b</a><img src="y"></p>` | `<p>ab</p>` (giữ chữ, bỏ thẻ) | N/A |
| Ảnh URL lạ | `//evil.com/x.png`, `http://cf.shopee.vn/a.png`, `https://evil.com/a.png` | bị từ chối | lỗi tại trường tiếng Việt |
| Ảnh hợp lệ | `https://cf.shopee.vn/a.png`, `/anh/a.png` | nhận | N/A |
| Link affiliate | `https://s.shopee.vn/x`, `https://shopee.vn/a`, `https://shope.ee/x` | nhận | N/A |
| Link affiliate sai | `https://evil.com`, `https://shopee.vn.evil.com`, `ftp://shopee.vn` | từ chối | "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)" |
| Gọi action không auth | POST action CMS không header | `{ ok:false, error:"Bạn cần đăng nhập CMS" }` | không lộ "Unauthorized" |
| Lỗi Prisma/không lường trước | bài không tồn tại, lỗi DB | `{ ok:false, error:"Có lỗi xảy ra, thử lại sau" }` hoặc `UserError` "Không tìm thấy bài viết" | `console.error` phía server |
| Ngày | `formatDate(new Date("2026-11-04T18:00:00Z"))` | "5 tháng 11, 2026" (giờ `Asia/Ho_Chi_Minh`) | null → "" |

</frozen-after-approval>

## Code Map

- `lib/db.ts` → `platform/db.ts` (+ `import "server-only"`); dùng ở `app/cms/actions.ts`, `app/cms/page.tsx`, `app/cms/posts/[id]/page.tsx`, `lib/posts.ts`.
- `lib/auth.ts` → `platform/auth/basic-auth.ts`; dùng ở `proxy.ts`.
- `lib/require-admin.ts` → `platform/auth/require-admin.ts` (ném `UserError`); `run()` mới ở `platform/auth/run.ts` thay hàm `run` cục bộ trong `app/cms/actions.ts`.
- `platform/errors.ts` (mới): `UserError`, kiểu `Result<T>`.
- `lib/sanitize.ts` + `lib/content.ts` → `platform/html/{sanitize,content}.ts`; dùng ở `app/cms/actions.ts`, `app/(site)/bai-viet/[slug]/page.tsx`, `lib/posts.ts`.
- `lib/slug.ts` → `platform/slug.ts`; `lib/images.ts` → `platform/images.ts` (bỏ `*.supabase.co` vì nơi lưu đã chốt là đĩa cục bộ — AD-24); `next.config.ts` import từ đây.
- `lib/format.ts` → `platform/format.ts`; `lib/site.ts` → `platform/site.ts`.
- `lib/post-input.ts`: giữ chỗ cũ (schema bài/sản phẩm chuyển ở story sau) nhưng lấy `optionalText`, `imageUrl`, `shopeeAffiliateUrl` từ `platform/validation/fields.ts`, `firstError` chuyển sang `platform/validation/errors.ts`; người dùng: `components/cms/{fields,new-post-form,post-editor}.tsx`.
- `app/cms/actions.ts`: dùng `run` của platform; `createPost` cho bài nháp AI qua `postInputSchema` (NO-06); `setPostStatus` bỏ `findUniqueOrThrow`.
- `lib/ai.ts:10,27`: hai `throw new Error` tiếng Việt → `UserError` để thông báo không bị nuốt.
- Không đổi: `lib/posts.ts` (ngoài import), `lib/categories.ts`, `lib/utils.ts`, `components/ui/*`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- thêm `vitest@5.1.0`, `vite@8.3.5`, `server-only@0.0.1`, script `test` = `vitest run`; nâng `@types/node` lên `^22` -- AD-16, AD-8, danh sách stack của spine
- [x] `vitest.config.ts` -- alias `@/` theo `tsconfig`, alias `server-only` sang file rỗng -- AD-16
- [x] `platform/**` -- tạo các file theo Code Map, chuyển nội dung từ `lib/`, xoá file `lib/` tương ứng -- AD-17 bước 2
- [x] `platform/html/sanitize.ts` -- bỏ `a`, `img` khỏi allowlist và transform `a` -- NO-01, NO-02, AD-22
- [x] `platform/images.ts` -- đường dẫn tương đối chỉ nhận một `/` đầu; bỏ `*.supabase.co` -- NO-03, NO-04
- [x] `platform/validation/fields.ts` -- `shopeeAffiliateUrl` (https, host đúng `shopee.vn`, `s.shopee.vn`, `shope.ee`) dùng cho `affiliateUrl` -- NO-05, AD-14
- [x] `platform/format.ts` -- thêm `timeZone: "Asia/Ho_Chi_Minh"` -- AD-27
- [x] `app/cms/actions.ts`, `lib/ai.ts`, `platform/auth/*` -- `run()`/`UserError` như Code Map -- NO-06, NO-11, AD-13
- [x] mọi file import -- sửa thẳng sang `@/platform/...`
- [x] `platform/**/*.test.ts` -- test cho html, images, slug, validation/fields, format, errors/run theo I/O Matrix
- [x] `docs/no-ky-thuat.md` -- xoá NO-01..06, NO-11; `docs/kiem-chung.md` -- thêm lệnh `npm test` -- quy ước của file docs

**Acceptance Criteria:**
- Given repo sau thay đổi, when chạy `npm test`, then mọi test xanh và có test cho từng dòng I/O Matrix.
- Given `ls lib`, when kiểm, then chỉ còn `ai.ts`, `categories.ts`, `post-input.ts`, `posts.ts`, `utils.ts`.
- Given `npm run build && npm start`, when đọc bài, soạn và xuất bản bài trong CMS, then hoạt động như trước; `/cms` không auth vẫn 401.

## Implementation Notes

## Verification

**Commands:**
- `npm test` -- expected: tất cả xanh
- `npx tsc --noEmit` -- expected: sạch
- `npm run lint` -- expected: sạch
- `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng 3100: trang chủ, một bài, `/cms` (có auth) mở được; lưu một bài nháp hiện toast thành công.

## Review Triage Log

| # | Nguồn | Vị trí | Phát hiện | Verdict | Bằng chứng | Route |
|---|-------|--------|-----------|---------|-----------|-------|
| 1 | edge, blind | `platform/images.ts:8` | `"/\t/evil.com/x.png"` qua kiểm (trình duyệt bỏ tab → `//evil.com`) | low | `startsWith("//")` chỉ bắt chuỗi thô; Zod `.trim()` chỉ cắt hai đầu. Chỉ admin nhập được, nhưng NO-03 hứa chỉ nhận đường dẫn trong site | patch |
| 2 | blind, conventions | `platform/images.ts:2-3,13` | nhánh wildcard `*.` còn lại, lệch `remotePatterns` một cấp khi thêm host wildcard (AD-24) | low | không host nào dùng `*.`; host lưu file của AD-24 sẽ thêm vào đây và lệch lại NO-04 | patch (xoá nhánh) |
| 3 | edge, verif, blind | `app/cms/actions.ts:93` | bản nháp AI có tag/từ khoá rỗng bị từ chối cả bài, kèm lỗi Zod tiếng Anh | medium | `postDraftSchema.tags` là `z.array(z.string())`, `postInputSchema.tags` `min(1)` không message → "Too small…" lọt vào `UserError` | patch (lọc chuỗi rỗng trước safeParse) |
| 4 | verif, blind | `docs/no-ky-thuat.md:9` | ghi "NO-01–06 có unit test trong platform/" — NO-06 không có test | low | grep: không test nào import `app/cms/actions` | patch (sửa câu) |
| 5 | blind | `platform/auth/basic-auth.ts` | `isAuthorized` không có test trực tiếp (thiếu env, không `Basic `, base64 hỏng) | low | AD-16 bắt buộc unit test cho `platform/`; `run.test.ts` chỉ phủ đúng/sai mật khẩu | patch |
| 6 | verif | `app/cms/actions.ts:41-61` | nhánh AI của `createPost` (NO-06) không có test | medium | xoá safeParse thì 46 test vẫn xanh; test cần tách hàm sang module (AD-17, story `suggestions`) | defer |
| 7 | verif | `lib/post-input.ts` | schema ghép không có test dùng `shopeeAffiliateUrl`/`imageUrl` | low | không test nào import `lib/post-input`; file sẽ chuyển sang `modules/` | defer |
| 8 | verif, edge | `app/cms/actions.ts:99-103` | `setPostStatus` không có test not-found; race giữa findUnique và update | low | cần DB; race chỉ ra thông báo chung, không hỏng dữ liệu | defer (test); race reject |
| 9 | edge | `platform/html/content.ts:809` | id heading trùng với dãy "X","X 3","X" | low | code chuyển nguyên, có từ trước | defer |
| 10 | edge | `platform/format.ts` | Invalid Date làm `Intl` ném lỗi | false | `Date` chỉ đến từ Prisma, không thể invalid; hành vi cũ | reject |
| 11 | edge | `app/cms/actions.ts:96` | `slice(0,500)` cắt đôi emoji | low | có từ trước, hiếm | reject |
| 12 | edge, verif, blind, conventions | `IMAGE_HOSTS`, `shopeeAffiliateUrl`, sanitize | dữ liệu cũ (Supabase, link ngoài Shopee, `<a>/<img>` trong thân bài) hỏng khi sửa/hiển thị | false | DB cục bộ: 0 dòng vi phạm ở cả 4 truy vấn; production chưa deploy (spine Deferred) | reject |
| 13 | edge | acceptance "hoạt động như trước" | sửa bài cũ không lưu được | false | như #12: không có dữ liệu cũ vi phạm | reject |
| 14 | blind | `lib/ai.ts` | lỗi nhà cung cấp AI (429, timeout) thành thông báo chung | false | đúng ý AD-13; `platform/ai` sẽ thay ở Epic 4 | reject |
| 15 | blind | `platform/html/sanitize.ts` | còn `figure/figcaption`, mất `colspan` | low | không ảnh hưởng hiển thị; prompt AI không sinh bảng | reject |
| 16 | blind | `vitest.config.ts`, `package.json` | alias vào `server-only/empty.js`, ghim version cứng | false | `empty.js` là file xuất chính thức của gói; ghim theo bảng Stack của spine | reject |
| 17 | blind | `docs/kiem-chung.md` | KC-07 sai thứ tự, số test cứng | false | đúng mẫu "Đã kiểm <ngày>: …" của KC khác | reject |
| 18 | blind, conventions | `AGENTS.md`, `docs/*` | còn trỏ `lib/*` đã xoá | medium | grep xác nhận; sửa file ngữ cảnh agent → Story 1.5 / `bmad-project-context` | defer |
| 19 | conventions | `app/cms/page.tsx`, `posts/[id]/page.tsx`, `actions.ts` | `app/` import `platform/db` (AD-2) | low | vi phạm có từ trước (`lib/db`), chỉ đổi đường dẫn | defer |
| 20 | conventions | `platform/slug.ts`, `validation/fields.ts` | thiếu `RESERVED_ROOT_SLUGS`, `requiredText`, `slugField` | low | spec cấm thêm hàm chưa dùng; thuộc story Danh mục / tách schema | defer |
| 21 | conventions | nhiều file | thứ tự import, thứ tự hằng ([QU-26]), `createPost` dài ([QU-28]) | false | [QU-26]–[QU-28] còn chờ duyệt, chưa ràng buộc | reject |
| 22 | conventions | `app/cms/actions.ts:46` | cắt excerpt trước safeParse | low | hành vi có từ trước | reject |
