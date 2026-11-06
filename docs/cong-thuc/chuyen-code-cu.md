# Công thức: chuyển code cũ sang cấu trúc spine

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-1, AD-2, AD-5, AD-8, AD-11, AD-17), danh sách file từ `ls lib components components/site components/cms app/cms` · Kiểm lần cuối: 2026-11-06 (lượt gộp Epic 4)

Dùng khi một story chạm file ở vị trí cũ: `lib/*`, `components/site/*`, `components/cms/*`, `components/*.tsx` ở gốc, `app/cms/actions.ts`, route CMS tên tiếng Anh. Áp dụng sau epic nền; trong epic nền, thứ tự chuyển theo AD-17. Các công thức khác (`them-man-hinh.md`, `sua-loi.md`, `bo-chuc-nang.md`, `doi-schema.md`) trỏ về đây.

## Tóm tắt cho agent

- **Chạm file cũ thì chuyển file đó trong cùng story** và sửa mọi import (AD-17). Không chuyển file story không chạm ([QD-24]).
- **Không tạo file mới ở vị trí cũ**; không tạo lại `lib/`, `components/site/`, `components/cms/` (AD-1).
- **Chuyển không đổi hành vi.** Đổi hành vi chỉ khi story yêu cầu, và làm ở bước riêng sau khi chuyển.
- **Không re-export tạm** từ vị trí cũ sang vị trí mới; sửa thẳng mọi import.
- **File không có trong bảng** và không suy ra chắc chắn từ AD-1/AD-5/AD-11 → BLOCKER, hỏi ([QD-23]); không tự đoán.

## Đọc trước

- Spine: AD-1, AD-2, AD-3, AD-5, AD-8, AD-11, AD-17, **Consistency Conventions**, **Structural Seed** (cây thư mục).
- `docs/no-ky-thuat.md`: mục `[NO-xx]` của file sắp chuyển (ví dụ `[NO-16]`–`[NO-19]`, `[NO-22]`) — ghi nhận, chỉ sửa khi story yêu cầu.

## Bảng file cũ → vị trí mới

Dòng ghi **Đã chuyển** là lịch sử của epic nền: file cũ không còn, chỉ dùng vị trí mới. Các dòng còn lại là code cũ chờ chuyển.

| File cũ | Vị trí mới | Căn cứ |
|---|---|---|
| `lib/db.ts` | **Đã chuyển** (epic nền): `platform/db.ts` | AD-8, Structural Seed |
| `lib/auth.ts` | **Đã chuyển** (epic nền): `platform/auth/basic-auth.ts` | Structural Seed |
| `lib/require-admin.ts` | **Đã chuyển** (epic nền): `platform/auth/require-admin.ts` (`run()` ở `platform/auth/run.ts`) | AD-6, Structural Seed |
| `lib/sanitize.ts` | **Đã chuyển** (epic nền): `platform/html/sanitize.ts` (`sanitizePostHtml`) | AD-22, Structural Seed |
| `lib/slug.ts` | **Đã chuyển** (epic nền): `platform/slug.ts` | AD-20 |
| `lib/images.ts` | **Đã chuyển** (epic nền): `platform/images.ts` | AD-14, AD-24 |
| `lib/format.ts` | **Đã chuyển** (epic nền): `platform/format.ts` | Consistency Conventions (Ngày giờ) |
| `lib/site.ts` | **Đã chuyển** (epic nền): `platform/site.ts` | Structural Seed |
| `lib/categories.ts` | **Đã chuyển** (lượt gộp 2.4–2.8): `modules/posts/constants.ts` — `POST_TYPES` (nhãn, slug, mô tả; khoá là enum `PostType`), `POST_TYPE_KEYS`; `CategoryKey` thay bằng `PostType` của `@/generated/prisma/enums`; `categoryFromSlug` bỏ (`/meo-vat`, `/gom-link` là thư mục riêng) | Consistency Conventions (Loại bài), AD-5 |
| `lib/posts.ts` | **Đã chuyển** (lượt gộp 2.4–2.8): `modules/posts/queries.ts` (`getPostsByCategory` → `getPostsByType`; khoá `category` của thẻ đổi thành `postType` — `[NO-20]`); `POSTS_TAG` → `modules/posts/tags.ts`; kiểu suy từ query → `modules/posts/types.ts` | AD-5, AD-7 |
| `lib/post-input.ts` | **Đã chuyển** (Epic 3, file đã xoá): `postInputSchema`, `postDraftInputSchema`, `newPostInputSchema` → `modules/posts/schema.ts`; khoá `category` → `postType`; `productInputSchema` đã thay bằng `modules/products/schema.ts` (Story 2.3, file cũ không còn schema Sản phẩm); trường dùng chung (`optionalText`, `imageUrl`, `shopeeAffiliateUrl`) đã ở `platform/validation/fields.ts`, `firstError` đã ở `platform/validation/errors.ts` (epic nền) | AD-4, AD-5, AD-14 |
| `lib/ai.ts` | **Đã chuyển** (Epic 4, file và thư mục `lib/` đã xoá, gói `openai` đã gỡ): gọi nhà cung cấp → `platform/ai/ask.ts` + `platform/ai/providers/claude-cli.ts`; prompt → `modules/posts/prompts/web-post.prompt.ts` (viết Bài web), `modules/posts/prompts/seo-review.prompt.ts` (chấm SEO), `modules/content-sets/prompts/threads-post.prompt.ts` (chuỗi Threads) | AD-10, `[QD-09]` |
| `lib/content.ts` (`readingMinutes`, `withHeadingIds`) | **Đã chuyển** (epic nền): `platform/html/content.ts` (tính sau sanitize) | AD-22, Structural Seed |
| `lib/utils.ts` (`cn`) | **Đã chuyển** (epic nền): `components/ui/lib/utils.ts`, alias `components.json` đã đổi; hook dùng chung → `components/shared/hooks/` | AD-17 bước 2 |
| `app/cms/actions.ts` | **Đã chuyển** (Epic 3 + Epic 4, file đã xoá): `setPostStatus`, `deletePost`, `savePost`, `createPostDraft` → `modules/posts/actions.ts` (Epic 3); `runSeoCheck` → `posts.checkPostSeo`, `createPost` → `modules/posts/actions.ts`, `runThreads` → `modules/content-sets/actions.ts` (Epic 4, hành vi giữ nguyên; Epic 5 thay `createPost` nhánh AI và `runThreads` bằng gợi ý `WEB_POST`, `THREADS_POST` ở `modules/suggestions/actions.ts`). Test `app/cms/actions.db.test.ts` → `modules/posts/actions.db.test.ts` | AD-6, AD-9 **Epic 5 (2026-11-06):** nhánh AI của `createPost` và `runThreads` đã gỡ (Story 5.2, 5.3) — thay bằng gợi ý `WEB_POST`, `THREADS_POST`, `LINK_COMMENT` của Bộ nội dung. |
| `app/cms/new/page.tsx` | **Đã chuyển** (Epic 3): `app/cms/bai-viet/moi/page.tsx` (route cũ 404) | Structural Seed |
| `app/cms/posts/[id]/page.tsx` | **Đã chuyển** (Epic 3): `app/cms/bai-viet/[id]/page.tsx` (route cũ 404) | Structural Seed |
| `components/site/affiliate-disclosure.tsx` | **Đã chuyển** (lượt gộp): `modules/products/components/affiliate-disclosure.tsx` (biến thể `box`, `text`) | AD-11 |
| `components/site/product-card.tsx` | **Đã chuyển** (lượt gộp): `modules/products/components/product-card.tsx` (*row*, *tile*, link qua `affiliate-link.tsx`) | AD-11 |
| `components/site/post-card.tsx` | **Đã chuyển** (lượt gộp): `modules/posts/components/post-card.tsx` (`PostCard`, `PostListItem`) | AD-11 (hiển thị một thực thể) |
| `components/site/site-header.tsx` | **Đã chuyển** (story 2.1, xong ở lượt gộp): `app/(site)/_components/site-header.tsx` | AD-11 |
| `components/site/site-footer.tsx`, `section-heading.tsx`, `components/json-ld.tsx` | **Đã chuyển** (lượt gộp): `app/(site)/_components/` cùng tên | AD-11 |
| `components/site/mobile-nav.tsx`, `nav-links.tsx` | **Đã xoá** (lượt gộp): thay bằng `app/(site)/_components/bottom-tab-bar.client.tsx`, `category-sheet.client.tsx`, `site-nav.ts` | AD-11, UX-DR11–13 |
| `components/theme-toggle.tsx` | **Đã xoá** (story 2.1): sáng/tối theo hệ điều hành, không có nút đổi tay (UX-DR2) | UX-DR2 |
| `components/cms/bottom-nav.tsx` | **Đã xoá** (story 2.1): thay bằng `app/cms/_components/cms-shell.client.tsx` | AD-11, UX-DR38 |
| `components/site/category-badge.tsx` | **Đã chuyển** (lượt gộp): `modules/posts/components/post-type-badge.tsx` (`PostTypeBadge postType=`, token `post-type-badge-*`) | AD-11, `[NO-20]` |
| `components/cms/status-badge.tsx` | **Đã chuyển** (Epic 3): `modules/posts/components/post-status-badge.tsx` (`PostStatusBadge`, nhãn "Nháp"/"Đã xuất bản") | AD-11 |
| `components/cms/post-editor.tsx`, `new-post-form.tsx` | **Đã chuyển** (Epic 3): `modules/posts/components/post-form.client.tsx` (+ `post-action-bar`, `post-seo-check`, `post-threads`, `post-body-editor` Tiptap), `new-post-form.client.tsx` (RHF + CmsForm) | AD-11 (form của thực thể) |
| `components/cms/fields.tsx` | **Đã chuyển** (Epic 3, file đã xoá): `Field` → shadcn `field` (`components/ui/`); `CategoryPicker` → `modules/posts/components/post-type-picker.client.tsx` (`PostTypePicker`); `CategorySelect` → `modules/categories/components/category-select.tsx` | AD-11, AD-14 |
| `components/cms/seo-score.tsx` | **Đã chuyển** (Epic 3): `modules/posts/components/seo-score.tsx` | AD-9 (ngoại lệ chấm SEO), AD-11 |
| `app/styleguide/page.tsx` | **Đã chuyển** (epic nền): `app/cms/styleguide/page.tsx` (noindex, sau Basic Auth) | AD-17 bước 2 |
| `app/cms/page.tsx`, `app/cms/layout.tsx` | giữ vị trí; **Đã làm mỏng** (Epic 3): `page.tsx` chỉ `redirect("/cms/bai-viet")` (307) | AD-12 |
| `components/ui/*` | giữ | AD-11 |

Tên file chính xác trong `platform/` (file hay thư mục, ví dụ `platform/db.ts` hay `platform/db/`) theo cây Structural Seed; chỗ cây không ghi rõ thì theo cách epic nền đã dựng (`ls platform`).

## Ngoại lệ

- **Story 2.3 — Kho Sản phẩm độc lập** (Vinh duyệt 2026-11-05): **hết hiệu lực** ở lượt gộp Epic 3 (2026-11-05) — trình soạn bài đã chuyển hẳn sang `modules/posts/` + `app/cms/bai-viet/`; `components/cms/`, `lib/post-input.ts`, `app/cms/new/`, `app/cms/posts/` đã xoá.
- **Code AI cũ** (`lib/ai.ts`, `app/cms/actions.ts`): **hết** ở lượt gộp Epic 4 (2026-11-06). `LEGACY_APP_FILES` trong `eslint.config.mjs` rỗng; không còn file cũ nào được miễn luật ranh giới. Tạm thời có hai tính năng AI chạy đồng bộ không qua `Suggestion` (`posts.createPost` nhánh AI, `content-sets.runThreads`) — giữ hành vi cũ tới Epic 5.

## Bước 1: Xác định vị trí đích

1. Tra bảng trên.
2. File không có trong bảng → xác định theo AD-1 (tầng), AD-5 (vai trò file trong module), AD-11 (bậc component). Không chắc → hỏi.
3. Ghi vào spec (`them-man-hinh.md` Bước 2d): file cũ, vị trí mới, danh sách file phải sửa import.

## Bước 2: Chuyển và tách

1. Tìm mọi nơi import:

   ```bash
   grep -rn "@/lib/<x>\|lib/<x>\"\|components/site/<x>\|components/cms/<x>\|cms/actions" app modules platform components lib prisma proxy.ts next.config.ts
   ```

2. Chuyển file. File gánh nhiều vai trò → tách theo bảng AD-5: đọc public → `queries.ts`, đọc CMS → `cms-queries.ts`, ghi → `service.ts` + `actions.ts`, Zod → `schema.ts`, kiểu → `types.ts`, nhãn/giới hạn → `constants.ts`, tag → `tags.ts`.
3. Đổi tên theo Consistency Conventions: kebab-case, `*.client.tsx` cho client component, hậu tố `…Card`/`…Form`/`…Screen`, hàm `get…`/`list…ForCms`/`save…`, `<x>InputSchema`, `<MIỀN>_TAG`. Đổi tên export thì sửa mọi chỗ gọi.
4. Mở đầu `import "server-only"` ở `service.ts`, `queries.ts`, `cms-queries.ts`, `platform/db`, `platform/ai`, `platform/storage` (AD-8).
5. Sửa mọi import tìm được ở bước 1; kiểm hướng import theo AD-2 (`platform/`, `components/` không import `modules/`, `app/`). File trong `app/` không còn import `@/lib/*`, `@/components/site|cms/*`, `@/platform/db`, `@/modules/*/service` và không còn import `../` → bỏ nó khỏi `LEGACY_APP_FILES` trong `eslint.config.mjs` (file đã đổi đường dẫn thì sửa hoặc bỏ dòng cũ) để luật ranh giới áp lên nó, rồi chạy `npm run lint`.
6. Xoá file cũ. Thư mục cũ rỗng → xoá thư mục.
7. Không đổi logic trong bước này. Story yêu cầu đổi hành vi → làm sau khi chuyển xong và đã qua kiểm chứng.

## Kiểm chứng

```bash
grep -rn "@/lib/<x>\|components/site/<x>\|components/cms/<x>" app modules platform components   # phải rỗng
npm test && npx tsc --noEmit && npm run lint && npm run build   # [KC-07], [KC-01], [KC-02], [KC-06]
```

- `npm run build` bắt buộc: chuyển file chạm import của route và ranh giới server/client.
- Mở các màn dùng file vừa chuyển; hành vi như trước khi chuyển.

## Checklist

- [ ] Chỉ chuyển file story chạm; vị trí lấy từ bảng hoặc AD-1/AD-5/AD-11, không có vị trí tự đoán ([QD-23], [QD-24]).
- [ ] Không còn file mới hay file sót ở `lib/`, `components/site/`, `components/cms/` cho phần đã chuyển (AD-1, AD-17).
- [ ] File nhiều vai trò đã tách đúng bảng AD-5; không có `index.ts` barrel, không re-export tạm.
- [ ] Mọi import đã sửa; grep đường dẫn cũ rỗng; hướng import đúng AD-2.
- [ ] `import "server-only"` có ở mọi file AD-8 yêu cầu.
- [ ] Tên file, export theo Consistency Conventions.
- [ ] Không đổi hành vi trong bước chuyển; `tsc`, `lint`, `build` sạch.
- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
