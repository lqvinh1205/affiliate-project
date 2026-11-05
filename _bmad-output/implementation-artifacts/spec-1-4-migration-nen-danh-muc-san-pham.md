---
title: 'Story 1.4: Migration nền — Danh mục và Sản phẩm dùng chung (AD-17 bước 3)'
type: 'refactor'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '4cb4ea8eddaf1ae2a430cdd428e46f44d8a96a41'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/nen-tang-ky-thuat/prisma-7.md'
warnings: []
deferred:
  - summary: >-
      Đường ghi Sản phẩm (replacePostProducts, deletePost) và dữ liệu migration chưa có test tự động.
    evidence: |-
      Chưa có khung test DB (AD-16). Thêm khi module products/posts có service.ts.
    location: >-
      app/cms/actions.ts
    severity: medium
  - summary: >-
      Tài liệu còn trỏ prisma/schema.prisma và mô tả Product thuộc một bài.
    evidence: |-
      AGENTS.md:41, docs/kiem-chung.md KC-03, docs/cong-thuc/doi-schema.md:26, docs/kien-truc-codebase.md, docs/nen-tang-ky-thuat/prisma-7.md PR-07. Làm ở Story 1.5.
    location: >-
      docs/
    severity: medium
  - summary: >-
      CMS vẫn tạo lại Sản phẩm mỗi lần lưu nên chưa dùng chung được; ghi Product nằm trong app/cms/actions.ts.
    evidence: |-
      NO-09; tách sang modules/products/service.ts và modules/posts/service.ts ở Epic 2.
    location: >-
      app/cms/actions.ts
    severity: low
  - summary: >-
      Query bài đọc Product nhưng chỉ gắn POSTS_TAG (AD-7 yêu cầu thêm tag products).
    evidence: |-
      Chưa có modules/products/tags.ts; hiện Sản phẩm chỉ ghi qua savePost có updateTag(POSTS_TAG).
    location: >-
      lib/posts.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Schema hiện có một file, enum `Category` thực chất là Loại bài, và Sản phẩm thuộc cứng một bài (`Product.postId`), nên không có Danh mục và không dùng lại Sản phẩm ở nhiều Bài web được.

**Approach:** Tách `prisma/schema/` theo module chủ; một migration duy nhất đổi `Category` → `PostType`, thêm model `Category`, `Post.categoryId`, `Product.categoryId`, bảng nối `PostProduct` (chép dữ liệu từ `Product.postId` rồi bỏ cột); sửa code đọc/ghi theo mô hình mới mà site và CMS chạy như trước.

## Boundaries & Constraints

**Always:** Chỉ thao tác Postgres cục bộ cổng 54329 ([QD-07]) — kiểm host/port của `DATABASE_URL`/`DIRECT_URL` mà không in giá trị ([QD-05]); `pg_dump` DB cục bộ vào thư mục tạm ngoài repo trước khi áp; migration tạo bằng `--create-only`, tên `verb_object`, SQL viết tay phần đổi tên và chép dữ liệu, đọc lại trước khi áp; import vẫn `@/generated/prisma/client`; quy ước Prisma AD-15 (id `String @id @default(uuid())`, không `@@map`, `onDelete` ghi rõ, bảng nối tường minh).

**Never:** Không thêm `hidden`, `priceText`, `searchText`, bảng lịch sử slug, `@db.VarChar` cho `Category` (story Danh mục 2.2 thêm cùng `constants.ts`); không tạo `modules/`; không đổi giao diện, route hay tên prop UI; không sửa [NO-08]/[NO-09]; không chạm DB khác; không sửa migration `20261102104412_init`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Áp migration trên DB có dữ liệu | 10 bài mẫu, N Sản phẩm | số `Post`, `Product` không đổi; `PostProduct` = N dòng, `sortOrder` giữ nguyên; `Post.postType` = giá trị `category` cũ; `categoryId` null | migration lỗi → rollback, khôi phục từ dump |
| Xoá Danh mục còn Bài web/Sản phẩm | `DELETE` Category đang được tham chiếu | DB từ chối (FR-28) | lỗi khoá ngoại |
| Xoá Bài web | bài có Sản phẩm | dòng `PostProduct` của bài bị xoá theo | — |
| Seed DB trống | `npm run db:seed` | ≥1 Danh mục, ≥1 bài `PUBLISHED` gắn Danh mục đó; Sản phẩm qua `PostProduct` | chạy lại lần 2 không lỗi |
| Lưu bài trong CMS | sửa danh sách Sản phẩm | Sản phẩm và thứ tự hiện đúng như trước; Sản phẩm cũ của bài không còn dùng ở bài nào bị xoá | lỗi → `UserError`/thông báo chung qua `run()` |

</intent-contract>

## Code Map

- `prisma/schema.prisma` → `prisma/schema/_base.prisma` (generator `output = "../../generated/prisma"`, datasource), `posts.prisma` (`Post`, `PostProduct`, enum `PostType`, `Status`), `products.prisma` (`Product`), `categories.prisma` (`Category`). Quan hệ ngược chỉ là field Prisma (AD-4).
- `prisma.config.ts:5` -- `schema: "prisma/schema.prisma"` → `"prisma/schema"`; `migrations.path` giữ.
- `Category`: `id`, `name`, `slug @unique`, `description String?`, `sortOrder Int @default(0)`, `createdAt`, `updatedAt`. `Post.categoryId String?` và `Product.categoryId String?` → `onDelete: Restrict` (FR-28: không xoá Danh mục còn bài/Sản phẩm). `PostProduct`: `id`, `postId` (`Cascade`), `productId` (`Restrict` — Sản phẩm dùng chung), `sortOrder Int`, `@@unique([postId, productId])`, index `productId`. Quan hệ đặt tên `postProducts` ở cả `Post` và `Product`. Bỏ `Product.postId`, `Product.sortOrder` (thứ tự thuộc bài, chuyển sang `PostProduct`). Index `Post` đổi `category` → `postType`.
- SQL viết tay, thứ tự bắt buộc: `ALTER TYPE "Category" RENAME TO "PostType"` và `ALTER TABLE "Post" RENAME COLUMN "category" TO "postType"` **trước** `CREATE TABLE "Category"` (Postgres: bảng tạo kiểu trùng tên); `INSERT INTO "PostProduct" SELECT gen_random_uuid(), "postId", "id", "sortOrder" FROM "Product"` trước khi bỏ cột; đổi tên index thay vì xoá/tạo.
- Code đọc/ghi: `lib/posts.ts:14,17,57,70,75,89,106` (select/where `category`, `products`), `app/cms/actions.ts:29-30,72,91` (ghi Sản phẩm lồng), `app/cms/page.tsx:26` (`_count.products`), `app/cms/posts/[id]/page.tsx:19,33,39`, `app/(site)/page.tsx`, `app/(site)/bai-viet/[slug]/page.tsx:48-49,87`, `components/site/post-card.tsx` (đọc `post.category`), `prisma/seed.ts` (kiểu `Category`, `deleteMany`, tạo Sản phẩm lồng). Prop UI (`CategoryBadge category=`), key form (`postInputSchema.category`, `newPostSchema.category`) và `CategoryKey` giữ tên; ánh xạ sang `postType` tại chỗ đọc/ghi Prisma.
- `savePost`/`createPost`: trong `db.$transaction`, xoá `PostProduct` của bài, xoá Sản phẩm vừa gỡ mà không còn `PostProduct` nào, tạo Sản phẩm mới + `PostProduct` theo thứ tự form.
- `docs/no-ky-thuat.md` -- mục nào nhắc `Product.postId` / enum `Category` thì cập nhật đường dẫn, không đổi ý nghĩa.

## Tasks & Acceptance

**Execution:**
- [x] Kiểm host/port DB là cục bộ 54329; đếm `Post`, `Product` và ghi lại; `pg_dump` ra thư mục tạm -- [QD-07], AC đếm
- [x] `prisma/schema/*.prisma`, `prisma.config.ts`, xoá `prisma/schema.prisma` -- tách schema, mô hình mới theo Code Map -- AD-4, AD-15
- [x] `prisma/migrations/<ts>_add_categories_and_post_products/migration.sql` -- `npx prisma migrate dev --create-only --name add_categories_and_post_products`, sửa tay theo Code Map, đọc lại, áp; `npx prisma generate` -- AD-15
- [x] Đếm lại: `Post`, `Product` không đổi, `PostProduct` = số `Product` cũ; `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script` (hoặc lệnh tương đương của Prisma 7) không ra thay đổi -- AC
- [x] Code ở Code Map -- sửa theo mô hình mới
- [x] `prisma/seed.ts` -- `upsert` một Danh mục theo `slug`; xoá bài rồi Sản phẩm mồ côi trước khi tạo; mọi bài `PUBLISHED`, ít nhất một bài gắn Danh mục; Sản phẩm qua `postProducts`; chạy `npm run db:seed` hai lần
- [x] Ghi kết quả đếm, SQL đã áp và kiểm `DELETE` Category bị từ chối vào báo cáo

**Acceptance Criteria:**
- Given migration đã áp, when mở trang chủ, `/meo-vat`, một bài có Sản phẩm, `/cms`, sửa và lưu một bài, then hiện và lưu như trước (Sản phẩm đúng thứ tự).
- Given repo, when `npx prisma generate` rồi `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, then đều sạch.
- Given `prisma/migrations`, when liệt kê, then chỉ thêm đúng một migration.

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review pass
- verdicts: 38 findings — high 0, medium 4, low 14, false 13, maybe-false 0 (cùng nhóm ghi theo từng lớp)
- findings:
  - Edge Case Hunter
    - `[medium]` `[patch]` `deletePost` để lại Sản phẩm mồ côi (trước đây cascade) — xoá trong transaction, dọn Sản phẩm không còn bài dùng
    - `[low]` `[reject]` Hai lần lưu cùng một bài chạy song song — chỉ một người vận hành; cần khoá hàng, quá mức
    - `[low]` `[reject]` `uniqueSlug` ngoài transaction — có từ trước
    - `[low]` `[defer]` Mỗi lần lưu tạo Sản phẩm mới, không dùng chung được ([NO-09]) — spec để lại; làm ở Epic 2 (module products); ghi rõ vào [NO-09]
    - `[false]` `[reject]` CMS không đọc/ghi `Post.categoryId` — CMS "như trước" không có Danh mục; màn Danh mục ở Story 2.2
    - `[medium]` `[patch]` Claim "CMS như trước" sai ở luồng xoá — cùng nhóm #1
  - Verification Gap
    - `[medium]` `[defer]` `replacePostProducts` không có test tự động — chưa có khung test DB (AD-16); làm khi có module products/posts
    - `[false]` `[reject]` Chép dữ liệu migration chỉ kiểm bằng đếm — subagent đã so bộ ba (productId, postId, sortOrder) trước/sau, diff rỗng
  - Blind Hunter
    - `[medium]` `[patch]` `deletePost` mồ côi — cùng nhóm #1
    - `[low]` `[patch]` Mô hình dùng chung nhưng CMS vẫn chép — ghi nợ vào [NO-09] (sửa tài liệu)
    - `[low]` `[patch]` Tạo tuần tự trong transaction có thể quá 5 s với DB từ xa — gộp `createManyAndReturn` + `createMany`
    - `[medium]` `[defer]` Tài liệu còn trỏ `prisma/schema.prisma` (`AGENTS.md`, `kiem-chung.md`, `doi-schema.md`, `kien-truc-codebase.md`, `prisma-7.md`) — Story 1.5
    - `[medium]` `[defer]` Không có test cho đường ghi và migration — cùng nhóm Verification Gap #1
    - `[low]` `[patch]` Khoá `category` (Loại bài) trùng tên quan hệ Danh mục — ghi vào [NO-20]; `categoryId` lọt qua `...rest`: UI không dùng, reject
    - `[low]` `[reject]` Ánh xạ `postType → category` lặp 4 chỗ — code cũ, sẽ gom khi chuyển sang `modules/posts`
    - `[low]` `[reject]` Seed không gắn Danh mục cho Sản phẩm, `update: {}` — AC chỉ cần bài gắn Danh mục
    - `[low]` `[reject]` `uniqueSlug` ngoài transaction — có từ trước
  - Intent Alignment
    - `[false]` `[reject]` Chỉ dùng chung ở mức mô hình (R1a) — đúng "So that các epic … xây trên mô hình dữ liệu đúng"
    - `[false]` `[reject]` Bỏ `Product.sortOrder` ngoài danh sách — thứ tự thuộc bảng nối "có thứ tự"; cột cũ vô nghĩa
    - `[false]` `[reject]` Không có script đếm trong diff — đã đếm và ghi ở Auto Run Result
    - `[false]` `[reject]` Seed "gắn Danh mục" chỉ phục vụ route tương lai — đúng ý AD-7
    - `[low]` `[defer]` Query bài đọc `Product` nhưng chỉ gắn `POSTS_TAG` (AD-7) — chưa có module `products`, Sản phẩm chỉ ghi qua `savePost` (có `updateTag`)
  - Quy ước dự án
    - `[false]` `[reject]` Spec thiếu bảng ảnh hưởng 2b/2c — sửa là sửa spec của chính lần build này
    - `[low]` `[reject]` Thiếu kế hoạch áp production (2d) — sửa spec; rủi ro ghi ở Auto Run Result
    - `[false]` `[reject]` Thiếu comment `///` cho SQL chép dữ liệu — AD-15 chỉ yêu cầu cho CHECK, partial unique, index đặc biệt
    - `[low]` `[reject]` `PostProduct` thiếu `createdAt/updatedAt` ([PR-07]) — spine không yêu cầu cho bảng nối; migration đã áp (AD-15)
    - `[low]` `[patch]` `ProductRow` gõ tay lần thứ ba — suy từ `productInputSchema`
    - `[false]` `[reject]` Thứ tự kiểu/hàm [QU-26] — chưa được duyệt
    - `[low]` `[defer]` `replacePostProducts` trong `actions.ts` ghi bảng `Product` (AD-4/5) — chuyển tiếp; tách khi chuyển `savePost` sang `modules/`
    - `[false]` `[reject]` CONTRACT-GAP `Post.categoryId`, `Product.categoryId`, `Category` chưa có UI — Story 2.2, 2.3
    - `[false]` `[reject]` Khoá `category` trong lib/posts — cùng nhóm Blind #6 (patch tài liệu)
    - `[low]` `[defer]` AD-7 tag `products` — cùng nhóm Intent #5
    - `[low]` `[reject]` `Product` thiếu `createdAt` — AD-17 bước 3: cột khác do story FR tương ứng thêm
    - `[false]` `[reject]` Seed/editor dùng khoá `category` — cố ý theo spec; ghi [NO-20]

## Verification

**Commands:**
- `npx prisma generate` -- expected: sạch
- `npx tsc --noEmit` -- expected: sạch
- `npm run lint` -- expected: sạch
- `npm test` -- expected: xanh
- `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` ở cổng trống (không dùng 3100/3101): trang bài có Sản phẩm hiện đủ; `/cms` có auth lưu bài hiện toast thành công.
</content>
</invoke>

## Auto Run Result

Status: done

**Thay đổi:**
- Tách `prisma/schema/` theo module chủ.
- Một migration viết tay `20261105081913_add_categories_and_post_products`:
  - đổi `Category` thành `PostType`, cột `category` thành `postType`;
  - thêm `Category`, `Post.categoryId`, `Product.categoryId`, `PostProduct`;
  - chép dữ liệu từ `Product.postId`/`sortOrder` sang `PostProduct` rồi bỏ hai cột đó.
- Code site/CMS đọc ghi qua `PostProduct`. Lưu và xoá bài chạy trong transaction, có dọn Sản phẩm mồ côi.
- Seed có Danh mục.

**File:**
- `prisma/schema/{_base,posts,products,categories}.prisma`, `prisma.config.ts`; xoá `prisma/schema.prisma`.
- `prisma/migrations/20261105081913_add_categories_and_post_products/migration.sql`.
- `lib/posts.ts`: đọc `postType`, `postProducts`, trả lại đúng hình dạng cũ.
- `app/cms/actions.ts`: thêm `replacePostProducts` (gộp `createMany`); `createPost`, `savePost`, `deletePost` chạy trong transaction.
- `app/cms/page.tsx`, `app/cms/posts/[id]/page.tsx`.
- `prisma/seed.ts`: upsert Danh mục, dọn Sản phẩm mồ côi.
- `docs/no-ky-thuat.md`: cập nhật [NO-09], [NO-12], [NO-20].

**Review:** 38 phát hiện (medium 4, low 14, false 13, cộng các mục trùng nhóm).
- Đã sửa:
  - `deletePost` để lại Sản phẩm mồ côi;
  - tạo hàng loạt trong transaction;
  - kiểu `ProductRow` suy từ schema;
  - ghi chú [NO-09], [NO-20].
- Để lại 4 mục:
  - chưa có test DB;
  - tài liệu còn trỏ `schema.prisma` (Story 1.5);
  - CMS chưa dùng chung Sản phẩm (Epic 2);
  - tag `products` (AD-7).
- Các mục bị loại có lý do trong Triage Log.

**Có cần review lần nữa không:** không (`false`). Chỉ 1 nhóm medium được sửa, không có nhóm high nào.

**Kiểm chứng:**
- DB `localhost:54329`. Dump trước khi áp ở `/tmp/claude-1000/-home-mor-project-affiliate-project/151abe54-4978-477d-8000-7b2d9dc21582/scratchpad/affiliate-before-1-4.sql`.
- Số dòng trước khi áp: Post 10, Product 19. Sau khi áp: Post 10, Product 19, PostProduct 19.
- Bộ ba (productId, postId, sortOrder) trước và sau giống hệt; `postType` khớp `category` cũ.
- `migrate diff` từ DB tới schema: rỗng.
- Khoá ngoại (thử rồi rollback):
  - xoá Category còn bài hoặc Sản phẩm: bị từ chối;
  - xoá Post: `PostProduct` xoá theo;
  - xoá Product còn đang dùng: bị từ chối.
- Seed chạy 2 lần không lỗi.
- `next start`: trang chủ, `/meo-vat`, `/gom-link`, trang bài và `/cms` đều trả 200; Sản phẩm đúng thứ tự.
- Gọi `savePost`, `createPost`, `deletePost` thật qua HTTP: đúng thứ tự, dọn Sản phẩm mồ côi, giữ Sản phẩm dùng chung. Sau đó seed lại.
- `prisma generate`, `tsc`, `lint`, `npm test` (84) và `build` đều sạch.

**Rủi ro còn lại:**
- Migration được tạo bằng tay (thư mục và SQL dựa trên `migrate diff`), vì `migrate dev --create-only` từ chối chạy không tương tác khi thấy mất cột.
- Trên production, Vinh phải tự sao lưu rồi chạy `prisma migrate deploy` ([QD-07]). Migration đổi tên enum và cột, và bỏ `Product.postId`/`sortOrder` sau khi đã chép sang `PostProduct`.
- Chưa bấm "Lưu" trên trình duyệt để xem toast; đã kiểm qua gọi action thật.
