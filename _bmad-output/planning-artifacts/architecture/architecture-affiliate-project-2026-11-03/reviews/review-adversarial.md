# Review đối kháng — ARCHITECTURE-SPINE (affiliate-project)

- **Ngày:** 2026-11-03
- **Lăng kính:** dựng hai unit (story/module) do hai agent khác nhau làm, cả hai tuân thủ đúng từng chữ của mọi AD, nhưng ghép lại vẫn vỡ (hình dạng dữ liệu chung lệch nhau, hai chủ của một thực thể, hai đường đổi trạng thái).
- **Đầu vào:** `ARCHITECTURE-SPINE.md`, `prd.md`, `addendum.md`, code hiện tại (`prisma/schema.prisma`, `lib/posts.ts`, `app/cms/actions.ts`).
- **Không sửa spine.** Mỗi lỗ hổng kèm đề xuất AD mới hoặc siết AD cũ.

## Tóm tắt

| Mức | Số lượng |
| --- | --- |
| Critical | 3 |
| High | 9 |
| Medium | 7 |
| Low | 4 |
| **Tổng** | **23** |

---

## Critical

### C1 — AD-4 không thực hiện được với Prisma; nhãn ERD tạo hai chủ cho cùng một bảng

- **Unit A:** story `content-sets` tạo `SocialPost` trong `prisma/schema/content-sets.prisma` (ERD: `ContentSet ||--o{ SocialPost : "content-sets"`).
- **Unit B:** story `style-profiles` khai báo quan hệ `StyleProfile ||--o{ SocialPost : "style-profiles"`. Theo câu “Nhãn trên quan hệ là module sở hữu bảng phía khoá ngoại”, bảng phía khoá ngoại là `SocialPost` → `style-profiles` cũng là chủ `SocialPost`.
- **Cùng kiểu:** `Category ||--o{ Post : "categories"` và `Category ||--o{ Product : "categories"` → theo đúng luật nhãn, `categories` sở hữu bảng chứa `categoryId`, tức `Post` và `Product`, trái với `posts`/`products`.
- **Vì sao cả hai đúng luật:** AD-4 nói “quan hệ khai báo trong file của module chủ phía khoá ngoại, **không sửa model của module kia**”. Nhưng Prisma bắt buộc trường quan hệ ngược ở **cả hai** model (`Post.stat PostStat?`, `Product.postLinks PostProduct[]`, `Product.researchProfiles ResearchProfile[]`, `Product.suggestions Suggestion[]`…). Agent `engagement` không được sửa `Post` → schema không validate; agent kia tự thêm trường ngược vào `posts.prisma` → vi phạm AD-4. Nhiều module cùng thêm trường ngược vào `Product` → xung đột file `products.prisma` khi ghép.
- **Đóng bằng (siết AD-4 + sửa ERD):**
  1. Đổi luật nhãn: nhãn = module chủ **bảng chứa cột khoá ngoại**, và sửa ERD cho khớp: `SocialPost` chủ duy nhất `content-sets`; `Post.categoryId` thuộc `posts`; `Product.categoryId` thuộc `products`.
  2. Thêm vào AD-4: “Module phía khoá ngoại **được** thêm trường quan hệ ngược (chỉ trường list/optional ảo, không cột, không `@relation(fields:)`) vào model của module kia, kèm comment `// back-relation: <module>`; chủ model không xoá các trường này.”
  3. Bảng nối nhiều-nhiều phải là model tường minh có chủ (cấm implicit m-n như `ContentSet }o--o{ Product` → `ContentSetProduct`, chủ `content-sets`, có `sortOrder`).

### C2 — Duyệt và Tạo lại không có ngữ nghĩa “tạo hay cập nhật”, sinh trùng thực thể đích

- **Unit A:** `suggestions` làm FR-21 (Tạo lại): tạo `Suggestion` mới `PENDING` cùng `kind=THREADS_POST` cho cùng `contentSetId`; bản cũ vẫn `PENDING` (AD-9 không nói gì về bản cũ).
- **Unit B:** `content-sets` viết `service.createSocialPostRecord(tx, …)` — đúng AD-9 “Duyệt gọi service module đích”.
- **Va chạm:** Vinh duyệt cả hai bản → một Bộ nội dung có hai Bài Threads (PRD: tối đa một mỗi nền tảng). Tương tự với Bài web: `ContentSet |o--o| Post` — duyệt `WEB_POST` lần hai tạo `Post` mới (slug khác) hay ghi đè `Post` đã sửa tay sau duyệt (AD-9: “sửa đích sau Duyệt không đổi trạng thái” nhưng không nói duyệt lại có được ghi đè). `ResearchProfile` cũng vậy: `Product ||--o{ ResearchProfile` → mỗi lần duyệt thêm một hồ sơ, không ai biết hồ sơ nào là hiện hành.
- **Đóng bằng (AD mới “Ngữ nghĩa Duyệt”):**
  - Mỗi `kind` khai báo **khoá đích** và **chế độ**: `WEB_POST` → upsert theo `contentSetId` (Post đã có thì cập nhật, giữ slug); `THREADS_POST`/`FACEBOOK_POST`/`LINK_COMMENT` → upsert theo `(contentSetId, platform)` với `@@unique`; `RESEARCH` → upsert theo `productId` (hoặc `inspirationId`), một hồ sơ hiện hành.
  - Tạo lại: trong cùng transaction tạo bản mới thì bản `PENDING` cùng khoá chuyển `REJECTED` (hoặc trạng thái `SUPERSEDED`), lưu `parentSuggestionId`. Chỉ một `PENDING` cho mỗi khoá đích (partial unique index trong SQL).
  - Duyệt khi đích đã sửa tay sau lần duyệt trước: hiện xác nhận “ghi đè”; ghi rõ ai quyết định.

### C3 — Thứ tự migration và va chạm tên `Category` (enum cũ ↔ model mới)

- **Unit A:** story `categories` (FR-28) tạo `model Category` trong `categories.prisma`.
- **Unit B:** story `posts` giữ Loại bài bằng enum hiện có — enum đang **tên `Category`** (`prisma/schema.prisma`). AD-15 “enum cho tập cố định” → agent posts giữ nguyên enum.
- **Va chạm:** Prisma không cho enum và model trùng tên → schema không generate. Thêm: chuyển `Product.postId (Cascade)` sang `PostProduct` (A4) là data migration chạm `Post`, `Product`, `PostProduct` — story `products` (FR-4) và story `posts` đều có lý do làm; hai agent chạy `migrate dev --create-only` song song trên cùng một thư mục `migrations/` tạo hai migration xung đột hoặc migration sau chứa diff của module kia. Việc chuyển `prisma/schema.prisma` → `prisma/schema/*.prisma` cũng không được gán cho story nào.
- **Đóng bằng (AD mới “Migration nền”, gắn vào epic platform của AD-17):** một story duy nhất (i) tách schema sang thư mục `prisma/schema/`, (ii) đổi enum `Category` → `PostType` (giá trị `MEO_VAT`, `GOM_LINK`), (iii) tạo `Category`, `PostProduct`, chuyển dữ liệu `Product.postId` → `PostProduct` và bỏ cột, (iv) seed 2 Danh mục mặc định. Sau đó: migration tạo **tuần tự**, story nào tạo migration phải rebase lên migration mới nhất và không gộp diff của module khác; tên `verb_object` kèm tiền tố module.

---

## High

### H1 — `tags.ts` không được import chéo, nên Duyệt không thể làm mới cache đích

- **Unit A:** `suggestions/actions.ts approveSuggestion` theo AD-6 phải `updateTag(<mọi tag bị ảnh hưởng>)` = `POSTS_TAG`, `PRODUCTS_TAG`, `CATEGORIES_TAG`…
- **Unit B:** AD-2 liệt kê file được import chéo: `queries.ts`, `cms-queries.ts`, `types.ts`, `constants.ts`, `components/` — **không có `tags.ts`**.
- **Va chạm:** agent suggestions hoặc gõ cứng chuỗi `"posts"` (lệch khi posts đổi giá trị), hoặc bỏ `updateTag` → bài vừa duyệt-xuất bản không hiện trên site. Tương tự `bio` hoặc `products` khi ẩn Sản phẩm: danh sách bài ở trang chủ/danh mục dùng ảnh Sản phẩm đầu tiên làm ảnh đại diện (code hiện có), nhưng AD-7 chỉ ví dụ `getPostBySlug`, nên agent posts gắn `PRODUCTS_TAG` cho trang chi tiết mà quên cho list.
- **Đóng bằng:** thêm `tags.ts` vào danh sách import chéo của AD-2; quy định giá trị tag = tên module (`"posts"`, `"products"`…), một tag mỗi module; mỗi `service.ts` ghi xuất `affectedTags` hoặc mỗi module có hàm `tagsFor<Action>` để action gọi `updateTag` cho từng tag. Bổ sung bảng “query → tag” bắt buộc: mọi query public render dữ liệu Sản phẩm (kể cả ảnh fallback) gắn `PRODUCTS_TAG`; mọi query render tên/slug Danh mục (menu, breadcrumb) gắn `CATEGORIES_TAG`.

### H2 — Duyệt “Danh mục gợi ý” gọi sai module đích

- **Unit A:** `suggestions` theo AD-9 duyệt `kind=CATEGORY` gọi `categories/service.ts` (AD-9 liệt kê `categories` là đích).
- **Unit B:** `categories` chỉ sở hữu bảng `Category`; gán Danh mục cho Sản phẩm là cột `Product.categoryId` (chủ `products`), cho Bài web là `Post.categoryId` (chủ `posts`). `products` **không** có trong danh sách đích của AD-9.
- **Va chạm:** categories service ghi `Product.categoryId` → vi phạm AD-4; hoặc không ai ghi. Thêm: FR-11 nói giá trị gợi ý được **tự điền** — trong khi gợi ý còn `PENDING`, agent posts có thể đặt `categoryId` NOT NULL nên duyệt `WEB_POST` trước `CATEGORY` thì lỗi.
- **Đóng bằng:** sửa AD-9: đích của `CATEGORY` là `products` (với `productId`) hoặc `posts` (với Bài web); thêm `products` vào danh sách đích. Quy định “tự điền” = payload `WEB_POST` chứa `categoryId` + `postType` gợi ý; `Post.categoryId` bắt buộc và lấy từ payload; `CATEGORY` riêng chỉ cho Sản phẩm.

### H3 — Không ai được phép điều phối FR-12 (một nút tạo Bộ nội dung)

- **Unit A:** `content-sets/actions.ts createContentSet` tạo `ContentSet` (đúng AD-4), rồi muốn gọi AI và lưu `Suggestion` — nhưng không được ghi bảng `Suggestion`, không được import `suggestions/service.ts`.
- **Unit B:** `suggestions/actions.ts generateContentSet` cần `contentSetId` có sẵn (CHECK “đúng một anchor”), nhưng ngoại lệ AD-9 chỉ cho **Duyệt** gọi service module khác — tạo `ContentSet` lúc sinh nội dung không thuộc ngoại lệ.
- **Va chạm thêm:** FR-2 “Bộ nội dung tạo từ Cảm hứng → Cảm hứng chuyển *đã dùng*”: `content-sets` không được ghi `Inspiration.status` (chủ `inspirations`).
- **Đóng bằng:** mở rộng ngoại lệ AD-9 thành “`suggestions/actions.ts` là bộ điều phối duy nhất cho mọi luồng AI: sinh và duyệt”, liệt kê rõ các service được gọi (tạo `ContentSet`, đánh dấu `Inspiration` đã dùng). Hoặc cho *đã dùng* là trạng thái suy ra (`exists ContentSet with inspirationId`) thay vì cột. Ghi rõ: AI chạy **trước**, transaction chỉ bao các lệnh ghi (AD-10).

### H4 — Copy nội dung chưa Duyệt, mốc SM-3 và Đánh dấu đã đăng không có chủ

- **Unit A:** `content-sets` làm FR-19/FR-20 trên `SocialPost` (chỉ tồn tại sau Duyệt theo AD-9) và ghi `firstCopiedAt` lên `ContentSet`.
- **Unit B:** `suggestions` làm FR-22 “Bài mạng xã hội chưa Duyệt vẫn copy được, có cảnh báo” → nút copy nằm trên `Suggestion`, ghi mốc copy đầu tiên lên `Suggestion` (bảng của mình).
- **Va chạm:** SM-3 lấy mốc “copy đầu tiên” ở hai nơi khác nhau; Vinh copy bản chưa duyệt rồi đăng → không đánh dấu *đã đăng* được (chưa có `SocialPost`) → SM-2 thiếu.
- **Đóng bằng:** AD mới “Mốc đo lường”: liệt kê từng mốc, cột và module ghi: `Product.createdAt` (products), `ContentSet.createdAt` + `ContentSet.firstCopiedAt` (content-sets, ghi qua một action `recordCopy` dùng cho cả nguồn Suggestion và SocialPost), `SocialPost.postedAt` (content-sets). Quy định đánh dấu *đã đăng* trên bản chưa Duyệt = tự Duyệt rồi đánh dấu (một action điều phối).

### H5 — Cài đặt Trang bio theo từng Sản phẩm không có chỗ lưu

- **Unit A:** `bio` (FR-31) cần “hiện trên bio”, “ghim”, “thứ tự” cho từng Sản phẩm; ERD chỉ có `BioSettings` đứng riêng; AD-4 cấm thêm cột vào `Product`; AD-15 cấm tự thêm bảng → `[SCHEMA-UNKNOWN]` hoặc tự tạo `BioProduct`.
- **Unit B:** `products` thấy “Sản phẩm mới mặc định hiện trên bio” → tự thêm `Product.showOnBio @default(true)`, `bioPinned`.
- **Va chạm:** hai nguồn sự thật cho cùng cờ; bio query lọc theo `BioProduct`, products CMS sửa `showOnBio`.
- **Đóng bằng:** ghi vào ERD: `Product.bioVisible`, `bioPinned`, `bioSortOrder` thuộc `products`; màn CMS bio gọi action của `products` (`setProductBio…`). Hoặc bảng `BioItem` chủ `bio` với quy tắc tạo dòng khi tạo Sản phẩm — chọn một, ghi rõ.

### H6 — Chuyển hướng 301 và đường dẫn dành riêng

- **Unit A:** `posts` (FR-27) tạo bảng `PostSlugHistory` và gọi `permanentRedirect` trong screen bài.
- **Unit B:** `categories` (FR-28) tạo bảng `Redirect { from, to }` dùng chung, xử lý ở `proxy.ts` hoặc `next.config` (tĩnh).
- **Va chạm:** hai cơ chế, hai bảng ngoài spine; slug cũ của bài A bị bài B dùng lại → redirect trỏ nhầm; chuỗi A→B→C. Đường dẫn dành riêng: FR-28 liệt kê `cms, bai-viet, bio, tim-kiem, api` nhưng route tĩnh `/meo-vat`, `/gom-link`, `/styleguide`, `sitemap.xml`, `robots.txt` cũng nằm ở gốc; Danh mục slug `meo-vat` bị route tĩnh che. Agent route thêm trang gốc mới không cập nhật danh sách của categories.
- **Đóng bằng:** AD mới “Slug và chuyển hướng”: mỗi chủ lưu lịch sử slug của mình (`PostSlugHistory` thuộc posts, `CategorySlugHistory` thuộc categories); screen gọi `queries.resolve…Slug` khi không tìm thấy rồi `permanentRedirect`; slug mới không được trùng slug sống, trùng lịch sử thì xoá dòng lịch sử đó (slug sống thắng); lưu đích cuối (không chuỗi). `RESERVED_ROOT_SLUGS` đặt ở `platform/site.ts`, gồm mọi segment gốc của `app/(site)` + `meo-vat`, `gom-link`, có test so với thư mục `app/`.

### H7 — Hồ sơ phong cách sửa được, nhưng giới hạn độ dài lại cứng trong schema

- **Unit A:** `style-profiles` (FR-18) cho Vinh sửa “tiêu đề ≤ 70, SEO title ≤ 60…” và lưu giá trị khởi tạo trong `style-profiles/constants.ts`.
- **Unit B:** `posts/schema.ts` theo AD-14 đặt `title` max 70 và `@db.VarChar(70)`; prompt trong `content-sets/prompts` tự chép mặc định FR-13 vào prompt cho trường hợp chưa có hồ sơ.
- **Va chạm:** Vinh nâng tiêu đề lên 90 → AI tuân theo → Duyệt lỗi ở DB. Ba nơi giữ mặc định (constants, seed, prompt). Enum nền tảng (`WEBSITE/THREADS/FACEBOOK`) cũng được hai module tự khai báo (`StyleProfile.platform`, `SocialPost.platform`).
- **Đóng bằng:** tách “giới hạn cứng” (posts/constants, nguồn của VarChar) và “mục tiêu mềm” (hồ sơ phong cách, phải ≤ giới hạn cứng, validate trong `style-profiles/schema.ts` bằng cách import constants của posts). Mặc định chỉ ở `style-profiles/constants.ts`, seed đọc từ đó, prompt chỉ nhận hồ sơ qua `system(style)` và không có fallback riêng; `style-profiles/queries` trả mặc định nếu chưa có dòng. Enum `Platform` một chủ (`style-profiles`), module khác dùng lại.

### H8 — `PostStat` một dòng không tính được “Xem nhiều 30 ngày”; ai tạo dòng

- **Unit A:** `engagement` theo ERD (`Post ||--o| PostStat`) lưu tổng `views`, `hearts`; tạo dòng bằng upsert khi có lượt xem đầu.
- **Unit B:** `posts` làm trang chủ FR-34 “Xem nhiều 30 ngày” và CMS FR-38 sắp xếp theo lượt xem, đọc `PostStat` qua include; giả định mọi Post có `PostStat` (tạo khi xuất bản) → nhưng posts không được ghi bảng của engagement.
- **Va chạm:** không có dữ liệu theo ngày → không tính được 30 ngày; agent engagement thêm `PostViewDaily` → `[SCHEMA-UNKNOWN]`. Bài chưa có `PostStat` bị sắp xếp sai (null). Khối “Xem nhiều” được cache, engagement không `updateTag` → không nói khi nào làm mới.
- **Đóng bằng:** ERD thêm `PostViewDaily(postId, day, views)` thuộc engagement (hoặc đổi giả định FR-34 sang tổng). `PostStat` tạo lười bằng upsert, mọi query coi thiếu = 0. “Xem nhiều” là `engagement/queries.ts` trả danh sách id, `cacheLife` cố định (ví dụ `hours`), không phụ thuộc `updateTag`; posts ghép dữ liệu bài.

### H9 — Mỗi module tự định nghĩa “Sản phẩm đang hiện” và hình dạng dữ liệu Sản phẩm

- **Unit A:** `posts/queries.ts getPostBySlug` include `postProducts.product` với `where: { hidden: false }` và select tự chọn; ảnh đại diện fallback lấy ảnh Sản phẩm đầu tiên **không lọc ẩn** (theo code hiện tại).
- **Unit B:** `bio/queries.ts` lọc `hidden: false` + `bioVisible`, select khác; `products/components/ProductCard` nhận kiểu `ProductCardData` có `priceText`, `priceUpdatedAt`.
- **Va chạm:** ba select lệch nhau, component nhận thiếu trường; Sản phẩm ẩn vẫn lộ qua ảnh OG/ảnh đại diện; FR-5 thất bại trên trang này dù trang kia đúng.
- **Đóng bằng:** siết AD-7/AD-11: `products/queries.ts` (hoặc `types.ts`) xuất `publicProductSelect` và `visibleProductWhere`, mọi module include Sản phẩm phải dùng đúng hai hằng này; ảnh fallback chỉ lấy từ Sản phẩm đang hiện. Thêm test tích hợp “ẩn Sản phẩm → không xuất hiện ở bài, bio, ảnh đại diện”.

---

## Medium

### M1 — Trạng thái `Suggestion` thiếu “đang tạo / lỗi”
- **A:** `suggestions` chỉ có `PENDING/APPROVED/REJECTED`, tạo bản ghi sau khi AI trả về. **B:** `content-sets` làm FR-12 “phần lỗi tạo lại riêng” và NFR-3 “rời màn hình quay lại vẫn thấy kết quả” → cần biết phần nào đang chạy/lỗi, tự thêm cột `ContentSet.facebookError`.
- **Đóng bằng:** thêm trạng thái `GENERATING`, `FAILED` (+ `errorMessage` tiếng Việt) vào `Suggestion`, tạo bản ghi trước khi gọi AI; content-sets suy trạng thái từ đó.

### M2 — Hồ sơ nghiên cứu cho Cảm hứng và quan hệ Bộ nội dung ↔ Góc viết
- **A:** `research` theo ERD chỉ có `Product ||--o{ ResearchProfile`. **B:** `inspirations` (FR-2) cần Hồ sơ nghiên cứu từ Cảm hứng; `content-sets` cần lưu Góc viết đã chọn và hồ sơ đã dùng; có thể sinh Bộ nội dung từ hồ sơ còn `PENDING` hay không.
- **Đóng bằng:** ERD thêm `ResearchProfile.inspirationId` (CHECK đúng một anchor), `ContentSet.angle` (Json có Zod) + `researchProfileIds`; quy định chỉ hồ sơ đã Duyệt mới dùng được để sinh Bộ nội dung.

### M3 — CHECK “đúng một anchor” của `Suggestion` không phủ hết luồng
- Góc viết cho bài Gom link sinh từ **nhiều** hồ sơ (FR-10) → anchor nào? FR-16 chuyển Bài web **tự viết** (chưa có `ContentSet`) thành bài MXH → cần anchor `contentSetId` chưa tồn tại.
- **Đóng bằng:** quy định Góc viết thuộc `ContentSet` (tạo ContentSet trước khi sinh góc), FR-16 tạo `ContentSet` gắn `postId` qua bộ điều phối (H3).

### M4 — Danh sách Sản phẩm của Bộ nội dung và của Bài web tách đôi
- **A:** `content-sets` lưu `ContentSetProduct`. **B:** `posts` lưu `PostProduct`; Vinh thêm Sản phẩm vào bài sau Duyệt. FR-5 “liệt kê Bài web và Bộ nội dung đang dùng Sản phẩm” và FR-20 “Sản phẩm đã lên nền tảng nào” cho kết quả khác nhau.
- **Đóng bằng:** ghi rõ `PostProduct` được sao từ `ContentSetProduct` lúc Duyệt `WEB_POST`, sau đó độc lập; FR-5/FR-20 đọc cả hai nguồn. Trạng thái Bộ nội dung là **suy ra** (không có cột status).

### M5 — Chữ Nhãn công khai affiliate: ai sở hữu
- AD-11: chỉ `products/components` render nhãn. FR-31: Vinh sửa câu chữ nhãn trong `bio` (`BioSettings`). Trang bài cũng hiện nhãn → products component đọc `bio/queries` (products phụ thuộc bio, bio phụ thuộc products).
- **Đóng bằng:** component nhãn nhận `text` qua props; screen lấy text từ `bio/queries.getDisclosureText` (gắn `BIO_TAG`); nói rõ một câu chữ dùng cho cả site hay riêng bio.

### M6 — Định nghĩa “Sản phẩm còn được dùng”
- `products` kiểm `PostProduct` trước khi cho xoá cứng (AD-15); nhưng `ContentSetProduct`, `ResearchProfile`, `Suggestion` cũng trỏ tới `Product` với `onDelete` do module kia chọn (Cascade sẽ xoá mất hồ sơ nghiên cứu; Restrict gây lỗi Prisma thô).
- **Đóng bằng:** liệt kê `onDelete` của mọi quan hệ tới `Product` trong ERD; “còn được dùng” = có bất kỳ dòng tham chiếu nào; products đọc qua `cms-queries` của từng module.

### M7 — Phiên bản Hồ sơ phong cách
- `SocialPost → StyleProfile` (ERD) vô nghĩa khi hồ sơ sửa tại chỗ; `Suggestion` lưu `promptVersion` nhưng không lưu phong cách đã dùng → không truy được vì sao hai lần tạo khác nhau, SM-C2 khó phân tích.
- **Đóng bằng:** bỏ FK `SocialPost.styleProfileId` hoặc thay bằng `Suggestion.styleSnapshot`/`styleProfileUpdatedAt`.

---

## Low

- **L1 — `prisma/seed.ts` một file chung:** mọi module sửa cùng file. Đề xuất `prisma/seed/<module>.ts` + `seed.ts` chỉ gọi tuần tự.
- **L2 — Tìm kiếm không dấu (FR-36):** cần extension `unaccent` hoặc cột chuẩn hoá — chưa có trong spine, posts sẽ `[SCHEMA-UNKNOWN]`. Ghi rõ lựa chọn và chủ.
- **L3 — Vòng import giữa module:** `posts` → `products/queries` và `products/cms-queries` → `posts/cms-queries` (FR-5). AD-2 không cấm; nói rõ được phép hay chỉ một chiều.
- **L4 — Không đếm lượt xem của Người vận hành:** Basic Auth chỉ gửi trong `/cms`; engagement không có cách nhận biết. Ghi rõ cơ chế (cookie đánh dấu do CMS đặt) hoặc bỏ giả định.
