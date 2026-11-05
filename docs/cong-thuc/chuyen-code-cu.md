# Công thức: chuyển code cũ sang cấu trúc spine

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-1, AD-2, AD-5, AD-8, AD-11, AD-17), danh sách file từ `ls lib components components/site components/cms app/cms` · Kiểm lần cuối: 2026-11-05 @ 8771851

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
| `lib/categories.ts` | `modules/posts/constants.ts` (nhãn, slug, màu Loại bài; giá trị lấy từ enum `PostType`) | Consistency Conventions (Loại bài), AD-5 |
| `lib/posts.ts` | `modules/posts/queries.ts`; `POSTS_TAG` → `modules/posts/tags.ts`; kiểu → `modules/posts/types.ts` | AD-5, AD-7 |
| `lib/post-input.ts` | `postInputSchema`, `newPostSchema` → `modules/posts/schema.ts`; `productInputSchema` đã thay bằng `modules/products/schema.ts` (Story 2.3, file cũ không còn schema Sản phẩm); trường dùng chung (`optionalText`, `imageUrl`, `shopeeAffiliateUrl`) đã ở `platform/validation/fields.ts`, `firstError` đã ở `platform/validation/errors.ts` (epic nền) | AD-4, AD-5, AD-14 |
| `lib/ai.ts` | phần gọi nhà cung cấp → `platform/ai` (không giữ OpenAI); prompt → `modules/<miền>/prompts/*.prompt.ts` theo module chủ đích: viết Bài web → `modules/posts/prompts/web-post.prompt.ts`, chấm SEO → `modules/posts/prompts/seo-review.prompt.ts`, chuỗi Threads → `modules/content-sets/prompts/threads-post.prompt.ts` | AD-10, `[QD-09]` |
| `lib/content.ts` (`readingMinutes`, `withHeadingIds`) | **Đã chuyển** (epic nền): `platform/html/content.ts` (tính sau sanitize) | AD-22, Structural Seed |
| `lib/utils.ts` (`cn`) | **Đã chuyển** (epic nền): `components/ui/lib/utils.ts`, alias `components.json` đã đổi; hook dùng chung → `components/shared/hooks/` | AD-17 bước 2 |
| `app/cms/actions.ts` | `setPostStatus`, `deletePost` → `modules/posts/actions.ts` + `service.ts`; `savePost` → `modules/posts/actions.ts`; `createPost` có AI → `modules/suggestions/actions.ts` (kind `WEB_POST`); `runThreads` → `modules/suggestions/actions.ts` (kind `THREADS_POST`); `runSeoCheck` → `posts.checkPostSeo`. Chỉ chuyển action bị chạm; file xoá khi rỗng | AD-6, AD-9 |
| `app/cms/new/page.tsx` | `app/cms/bai-viet/moi/page.tsx` | Structural Seed |
| `app/cms/posts/[id]/page.tsx` | `app/cms/bai-viet/[id]/page.tsx` | Structural Seed |
| `components/site/affiliate-disclosure.tsx` | `modules/products/components/` | AD-11 |
| `components/site/product-card.tsx` | `modules/products/components/` (link qua `AffiliateLink`) | AD-11 |
| `components/site/post-card.tsx` | `modules/posts/components/` | AD-11 (hiển thị một thực thể) |
| `components/site/site-header.tsx` | **Đã chuyển một phần** (story 2.1): `app/(site)/_components/site-header.tsx`; vẫn import `components/site/mobile-nav`, `nav-links` nên còn trong `LEGACY_APP_FILES` | AD-11 |
| `components/site/site-footer.tsx`, `mobile-nav.tsx`, `nav-links.tsx`, `section-heading.tsx`, `components/json-ld.tsx` | `app/(site)/_components/` (hiện chỉ site dùng, ngoài `/cms/styleguide`) | AD-11 |
| `components/theme-toggle.tsx` | **Đã xoá** (story 2.1): sáng/tối theo hệ điều hành, không có nút đổi tay (UX-DR2) | UX-DR2 |
| `components/cms/bottom-nav.tsx` | **Đã xoá** (story 2.1): thay bằng `app/cms/_components/cms-shell.client.tsx` | AD-11, UX-DR38 |
| `components/site/category-badge.tsx` | `modules/posts/components/post-type-badge.tsx` | AD-11, `[NO-20]` |
| `components/cms/status-badge.tsx` | `modules/posts/components/post-status-badge.tsx` | AD-11 |
| `components/cms/post-editor.tsx`, `new-post-form.tsx` | `modules/posts/components/post-form.client.tsx`, `new-post-form.client.tsx` | AD-11 (form của thực thể) |
| `components/cms/fields.tsx` | `Field` → thay bằng shadcn `field` (`components/ui/`); `CategoryPicker` → `modules/posts/components/post-type-picker.client.tsx`; `ProductFields` → `modules/products/components/` | AD-11, AD-14 |
| `components/cms/seo-score.tsx` | `modules/posts/components/seo-score.tsx` | AD-9 (ngoại lệ chấm SEO), AD-11 |
| `app/styleguide/page.tsx` | **Đã chuyển** (epic nền): `app/cms/styleguide/page.tsx` (noindex, sau Basic Auth) | AD-17 bước 2 |
| `app/cms/page.tsx`, `app/cms/layout.tsx` | giữ vị trí; `page.tsx` làm mỏng theo AD-12 | AD-12 |
| `components/ui/*` | giữ | AD-11 |

Tên file chính xác trong `platform/` (file hay thư mục, ví dụ `platform/db.ts` hay `platform/db/`) theo cây Structural Seed; chỗ cây không ghi rõ thì theo cách epic nền đã dựng (`ls platform`).

## Ngoại lệ đang hiệu lực

- **Story 2.3 — Kho Sản phẩm độc lập** (Vinh duyệt 2026-11-05; hết hiệu lực khi Epic 3 chuyển trình soạn bài). Sửa **tại chỗ, không chuyển**: `app/cms/actions.ts`, `app/cms/posts/[id]/page.tsx`, `lib/post-input.ts`, `lib/posts.ts`, `lib/ai.ts`, `components/cms/{post-editor,new-post-form,fields}.tsx`, `components/site/product-card.tsx`. Lý do: trình soạn bài cũ phải ngừng tạo/sửa/xoá Sản phẩm ngay khi có Kho, nhưng chuyển cả trình soạn bài là việc của Epic 3. `app/cms/styleguide/_components/styleguide-screen.tsx` (đã miễn ESLint) đổi một prop mẫu `price` → `priceText` theo `ProductCard`. Story sau chạm lại các file này thì chuyển theo bảng như thường.

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
