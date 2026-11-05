# Review đối kháng — ARCHITECTURE-SPINE sau đợt sửa theo UX (2026-11-04)

- **Lăng kính:** dựng hai unit (story/agent) một cấp dưới, mỗi bên tuân thủ từng chữ mọi AD, mà ghép lại vẫn vỡ.
- **Đầu vào:** `ARCHITECTURE-SPINE.md` (updated 2026-11-04), `ux-designs/ux-affiliate-project-2026-11-03/EXPERIENCE.md`. Đã đối chiếu `reviews/review-adversarial.md` (2026-11-03) để không báo lại lỗ đã đóng (AD-4 trường ngược, AD-19 upsert, AD-20, AD-21, `tags.ts` trong AD-2, `BioItem`…).
- **Không sửa spine.** Mỗi mục: Unit A / Unit B, AD mỗi bên dựa vào, chỗ vỡ, cách bịt.

## Tóm tắt

| Mức | Số | Mục |
| --- | --- | --- |
| Critical | 2 | C1 vòng import cấp module do chính AD-2/AD-7 bắt buộc; C2 sau Duyệt không rõ ai giữ "nội dung hiện hành" của bài MXH |
| High | 8 | H1 tag cache theo "dữ liệu trả về" bỏ sót lọc/đếm; H2 URL-state + poller `router.refresh()` xoá form đang sửa; H3 payload theo `kind` không có chủ hình dạng; H4 RESEARCH + PRODUCT_CATEGORY một lần gọi; H5 không có file cho đọc công khai không cache; H6 xem trước "đúng component public" không dựng được; H7 múi giờ; H8 Tạo lại `WEB_POST` sau khi đã có Post |
| Medium | 7 | upload CSRF và hình dạng phản hồi; BioItem thứ tự + `onDelete`; LINK_COMMENT duyệt trước bài; `after()` ghi đè vô điều kiện; service đọc chéo; `?cam-hung` rơi khi tạo Sản phẩm; ví dụ "bài xếp theo Lượt xem" sai chỗ |
| Low | 6 | xem mục Low |

Verdict: spine đã đóng phần lớn lỗ ở review trước, nhưng các đoạn vừa thêm (AD-2 đọc chéo, AD-12 URL-state, AD-18 poller, AD-19 một lần gọi) mở ra lỗ mới, nặng nhất là vòng import bắt buộc và hai chủ của nội dung bài MXH sau Duyệt.

---

## Critical

### C1 — AD-2 + AD-7 bắt buộc import ngược chiều, sinh vòng import cấp module

- **Unit A — `posts` (trang bài, Danh mục, Loại bài):** `posts/queries.getPostBySlug` đọc `Category` (breadcrumb, AD-26 `BreadcrumbList`) và `Product` qua quan hệ. AD-2 "Đọc chéo bảng": select/điều kiện B đã định nghĩa **phải** import từ `queries.ts` của B → import `products/queries` (`visibleProductWhere`, `publicProductSelect` — AD-7 bắt buộc) và `categories/queries` (`publicCategorySelect` nếu categories đã định nghĩa).
- **Unit B — `categories` (CategorySheet, nav desktop trong layout `(site)`):** EXPERIENCE: CategorySheet "chỉ Danh mục có ≥ 1 Bài web đã xuất bản". `categories/queries.getNavCategories` đọc `Post` qua quan hệ, điều kiện "đã xuất bản" posts đã định nghĩa (`publishedPostWhere`) → AD-2 bắt import `posts/queries`.
- **Vỡ:** `posts → categories → posts`. Cùng kiểu: `/bio` FilterChips "mỗi Danh mục có Sản phẩm hiện, kèm số món" (`categories` hoặc `bio` → `products/queries`) trong khi `products/queries` dùng `publicCategorySelect` → `products ↔ categories`; `products/cms-queries` ("đang dùng ở bài nào", lọc bài đã xuất bản → import `posts/queries`) trong khi `posts/queries → products/queries` → `posts ↔ products`. Điều khoản "Màn tổng hợp… không tạo query… **khi việc đó tạo vòng import**" chỉ có hiệu lực với unit làm **sau**: unit trước đã hợp lệ, unit sau buộc phải chọn giữa "import điều kiện của B" (AD-2 câu 1) và "không tạo vòng" (AD-2 câu 2) — và với CategorySheet trong layout public thì không có Screen để ghép. ESLint `no-restricted-imports` (AD-17) không phát hiện vòng cấp module (`posts/queries.ts → products/queries.ts`, `products/cms-queries.ts → posts/queries.ts` không phải vòng cấp file).
- **Bịt (sửa AD-2):** khai báo **thứ tự module cố định** (DAG) trong spine, ví dụ: `categories` < `products` < `posts` < {`engagement`, `bio`, `banners`, `style-profiles`, `inspirations`} < `research` < `content-sets` < `suggestions`. Rule: module chỉ import module **thấp hơn**. Query cần dữ liệu của module cao hơn (Danh mục có bài, số món theo Danh mục) **đặt ở module cao nhất trong số bảng nó chạm** (ví dụ `posts/queries.getCategoriesWithPublishedPosts`, `bio/queries.getBioCategoryChips`), không đặt ở module chủ bảng gốc. Thêm `import/no-cycle` (hoặc dependency-cruiser) với ranh giới thư mục `modules/*` vào bước 2 của AD-17.

### C2 — Sau Duyệt, "nội dung hiện hành" của bài Threads/Facebook/Bình luận có hai chủ

- **Unit A — `suggestions/components/suggestion-card`:** EXPERIENCE › SuggestionCard: "APPROVED → nội dung vẫn sửa được, sửa không đổi trạng thái (AD-19)". Card là của `suggestions`, nên lưu sửa vào `Suggestion.payload` qua `suggestions.updateSuggestion…`; CopyButton chép `payload`; "Đánh dấu đã đăng" nằm dưới card.
- **Unit B — `content-sets`:** AD-19: đích là `SocialPost`; "Sửa nội dung đích sau khi Duyệt" → sửa `SocialPost`. AD-21: sao chép sau Duyệt ghi `SocialPost.firstCopiedAt` qua `content-sets.recordCopy`, `markPosted` trên `SocialPost`. Unit B làm form sửa `SocialPost` trong `content-sets/components`.
- **Vỡ:** cùng một bài có hai bản sửa được sau Duyệt; CopyButton của A chép `payload` cũ trong khi B coi `SocialPost` là sự thật (hoặc ngược lại); A gọi `recordSuggestionCopy` cho card đã APPROVED (AD-21 nói phải gọi `recordCopy`); A không có `socialPostId` để gọi `markPosted`. Đánh dấu đã đăng khi bài **chưa** Duyệt (UX đặt hàng "Đánh dấu đã đăng" dưới bình luận, không điều kiện) không có đích vì `SocialPost` chưa tồn tại.
- **Bịt (thêm vào AD-19):** "Sau Duyệt, nội dung hiện hành là bản ghi đích. `Suggestion.payload` bất biến từ lúc APPROVED. Màn Bộ nội dung render khối đã Duyệt bằng component của module đích (`content-sets/components/social-post-card`, Bài web → chỉ đọc + link) với Sửa, CopyButton (`content-sets.recordCopy`) và MarkPosted; SuggestionCard chỉ cho GENERATING/PENDING/REJECTED/FAILED. `markPosted` chỉ bật khi `SocialPost` tồn tại; chưa Duyệt thì nút hiện lý do 'Duyệt bài trước'." Sửa EXPERIENCE › SuggestionCard tương ứng.

---

## High

### H1 — AD-7 gắn tag theo dữ liệu "trả về", bỏ sót dữ liệu chỉ dùng để lọc/đếm

- **Unit A — `categories`/`bio`:** query CategorySheet hoặc FilterChips `/bio` chỉ **trả về** `Category` (tên, slug, số món), dùng `Post`/`Product` để lọc và đếm. AD-7: "gắn tag của mọi module có dữ liệu nó **trả về**" → gắn `categories` (và `bio`).
- **Unit B — `products`/`posts`:** ẩn Sản phẩm → `updateTag("products")`; chuyển bài về nháp → `updateTag("posts")` (AD-6).
- **Vỡ:** ẩn món cuối của một Danh mục → chip `/bio` vẫn hiện, bấm ra rỗng (EXPERIENCE: "Lọc Danh mục không có món — Không xảy ra"); gỡ bài cuối của Danh mục → CategorySheet vẫn liệt kê, dẫn tới trang rỗng. Không vi phạm chữ nào của AD-7.
- **Bịt (sửa câu AD-7):** "Một query gắn tag của mọi module có bảng nó **đọc** — trả về, lọc, đếm hoặc sắp xếp theo." Thêm test tích hợp: "ẩn Sản phẩm cuối của Danh mục làm chip Danh mục biến mất khỏi `/bio`".

### H2 — URL-state (AD-12) và poller `router.refresh()` (AD-18) làm mất nội dung form đang sửa

- **Unit A — form (`posts/components/post-form.client.tsx`, SuggestionCard PENDING sửa được):** AD-14 RHF; agent làm form "đồng bộ khi props đổi" (`useEffect(() => reset(props.post))`) hoặc Screen đặt `key` theo `searchParams`/`updatedAt` — không AD nào cấm.
- **Unit B — ProductPicker (`products/components`) và poller:** AD-12: Combobox tìm Sản phẩm đẩy trạng thái lên URL, Server Component đọc lại; AD-18: mỗi SuggestionCard GENERATING gắn `generating-poller` gọi `router.refresh()` mỗi 3 giây.
- **Vỡ:** (1) Soạn bài: gõ tìm Sản phẩm → URL đổi → Screen render lại → form `reset` → mất thân bài đang sửa. (2) Bộ nội dung: Vinh sửa thẻ Bài web (PENDING) trong khi 4 thẻ khác còn GENERATING → refresh mỗi 3 giây (5 poller = tối đa 5 refresh / 3 giây) → bản sửa bị ghi đè; AnglePicker/AudiencePicker là "trạng thái trên màn" (EXPERIENCE) cũng mất nếu bị remount. (3) `UnsavedChangesGuard` chặn "rời trang qua link trong app" sẽ bắt luôn `router.replace` do chính ProductPicker phát ra, hoặc ngược lại bị tắt để không vướng → mất bảo vệ.
- **Bịt (thêm vào AD-12/AD-14):** "Form CMS chỉ đọc `defaultValues` lúc mount; không `reset` theo props; `key` của form = id thực thể (+ `status` cho SuggestionCard), không theo `searchParams`/`updatedAt`. Một poller mỗi màn (đặt trong `_components` của màn), không mỗi thẻ. Cập nhật URL do component trên cùng màn phát ra (`router.replace` cùng pathname) không phải 'rời trang' với `UnsavedChangesGuard`." Ghi tên tham số URL của ProductPicker cố định (ví dụ `?tim-sp`) để không đụng `?q` của DataList.

### H3 — Hình dạng `payload` theo `kind` không có chủ; `RESEARCH` bị dùng cho hai nghĩa

- **Unit A — `suggestions`:** AD-9: "`payload` (Zod theo `kind`)" → khai báo Zod payload trong `suggestions/schema.ts`.
- **Unit B — module đích (`research`, `content-sets`, `posts`):** AD-10: prompt `output` là Zod trong `prompts/` của miền; AD-5: `service.ts` nhận input của mình; `types.ts` suy từ select.
- **Vỡ:** ba hình dạng cho cùng dữ liệu: `prompt.output`, Zod payload ở `suggestions`, input service đích. Cụ thể: chuỗi Threads `string[]` trong payload vs `SocialPost.content` kiểu text (hay Json?) — spine không nói; Góc viết/Người đọc trong payload `RESEARCH` không có khoá ổn định, nên AnglePicker (chọn khi hồ sơ *Chờ duyệt* — EXPERIENCE) lưu theo index, Vinh sửa hồ sơ rồi Duyệt → index trỏ góc khác; `ContentSet` lưu "góc viết, người đọc" dưới dạng gì (text, `{title, hook}`, hay id) không ai định. Thêm: Cảm hứng nghiên cứu (từ khoá Shopee + dàn ý — UJ-2) neo `inspirationId` và đích `ResearchProfile` cũng là `kind RESEARCH` (AD-19 bảng), nhưng payload khác hẳn hồ sơ Sản phẩm → một `kind`, hai Zod.
- **Bịt (sửa AD-9/AD-19):** "Zod payload của mỗi `kind` **là** `prompt.output` của prompt sinh ra nó, xuất từ module đích (`types.ts` export kiểu; prompt trong `prompts/`); service đích nhận đúng kiểu đó; `suggestions` không định nghĩa lại." Tách `kind` `INSPIRATION_RESEARCH` (hoặc payload `RESEARCH` là discriminated union theo neo). Mỗi phần tử Góc viết/Người đọc có `key` ổn định; `ContentSet` lưu bản chép `{ key, title, hook | reason }` (kiểu ở `content-sets/types.ts`). Picker đọc từ đích nếu APPROVED, từ payload nếu PENDING.

### H4 — `RESEARCH` + `PRODUCT_CATEGORY` một lần gọi nhưng "tạo lại độc lập"; "tự điền" Danh mục có hai đường ghi

- **Unit A — `research`/`suggestions` (FR-6..FR-11):** AD-19: một lần gọi AI trả hồ sơ + Danh mục, ghi hai `Suggestion`; Tạo lại hồ sơ dùng lại prompt gộp → ghi lại **cả hai** (cho nhất quán với lần đầu), supersede luôn `PRODUCT_CATEGORY` mà Vinh chưa đụng.
- **Unit B — Danh mục gợi ý:** "hai gợi ý Duyệt và tạo lại độc lập" → Tạo lại Danh mục chạy prompt gộp rồi bỏ phần hồ sơ (tốn một lần nghiên cứu), hoặc tự viết prompt riêng (AD-19 không cho phép/không cấm).
- **Vỡ thêm:** EXPERIENCE UJ-1 bước 3 "Danh mục gợi ý đã **tự điền**" — Unit `products` điền sẵn vào form Sản phẩm và `saveProduct` ghi `Product.categoryId` trong khi `PRODUCT_CATEGORY` vẫn PENDING; Duyệt sau đó ghi đè lựa chọn tay. Và `Product.categoryId` phải nullable (Sản phẩm tạo trước khi nghiên cứu) trong khi `/bio` nhóm theo Danh mục (EXPERIENCE bố cục `/bio` 4a): Sản phẩm chưa có Danh mục, không ghim → không thuộc nhóm nào → không hiện trên `/bio`, trái UJ-1 bước 6 "Sản phẩm tự có trên `/bio`".
- **Bịt (sửa AD-19):** "Tạo lần đầu: một prompt gộp, hai `Suggestion`. Tạo lại: mỗi `kind` một prompt riêng (`research/prompts/product-category.prompt.ts`), chỉ supersede `Suggestion` cùng `kind`. 'Tự điền' = SuggestionCard Danh mục hiện giá trị gợi ý; chỉ Duyệt ghi `Product.categoryId`; form Sản phẩm không đọc payload." Thêm rule `/bio`: Sản phẩm `categoryId = null` vào nhóm "Khác" cuối (hoặc `categoryId` bắt buộc khi tạo — chọn một, ghi vào Structural Seed).

### H5 — Không có file hợp lệ cho đọc công khai không cache (`searchPosts`, đọc số tim)

- **Unit A — `posts.searchPosts`:** AD-5 cấm `actions.ts` gọi Prisma; đọc công khai thuộc `queries.ts` → phải `"use cache"` → cache theo từng từ khoá người đọc gõ (không giới hạn, NFR-7 "không log từ khoá" nhưng cache giữ từ khoá).
- **Unit B — `engagement` đọc số tim:** cùng lập luận, đặt `getLikeCount` trong `queries.ts` có cache (stale ≥ 30 giây theo AD-7) → sau khi tim, đọc lại thấy số cũ; hoặc đặt trong `cms-queries.ts` (không cache nhưng là "đọc cho CMS") — mỗi agent chọn một nơi.
- **Vỡ:** hai trong ba ngoại lệ của AD-6 không có chỗ hợp pháp cho phần đọc; cách chọn khác nhau giữa module, và chọn `queries.ts` thì vi phạm ý NFR-7 / hiện số tim sai.
- **Bịt (sửa bảng AD-5):** thêm dòng "`public-reads.ts` — đọc không cache chỉ cho action công khai của AD-6; `server-only`; chỉ dữ liệu đã xuất bản; cấm `"use cache"`, ghi". Hoặc cho `service.ts` của `engagement`/`posts` chứa hàm đọc đó — ghi rõ một lựa chọn.

### H6 — "Xem trước dùng đúng component render của trang public" không dựng được theo AD-11/AD-12

- **Unit A — trang `/bai-viet/[slug]`:** AD-12: Screen ở `app/(site)/bai-viet/[slug]/_components/post-screen.tsx` ghép `posts` (ArticleBody, TOC), `products` (ProductCard, AffiliateDisclosure), `engagement` (LikeButton), ShareButtons; AD-11: "một màn → `_components/` cạnh route".
- **Unit B — PreviewSheet trong `/cms/bai-viet/[id]`:** AD-11: "Xem trước trong CMS dùng đúng component render của trang public" → không import được `_components` riêng của route site (route-private theo AD-11), nên tự ghép lại từ component module → bố cục lệch (đúng điều AD-11 muốn chặn). Thêm: dữ liệu CMS có kiểu từ `cms-queries` (gồm Sản phẩm ẩn, bài nháp), component public nhận kiểu từ `queries` select → hai `types.ts` khác nhau; LikeButton trong xem trước gọi action công khai, ghi tim cho bài nháp.
- **Bịt (thêm vào AD-11):** "Phần thân trang bài (`PostArticle`: đầu bài, disclosure, thân, TOC, khối Sản phẩm, PostTags) là một component trong `posts/components`, nhận kiểu `PostArticleData` khai trong `posts/types.ts`; cả `queries` và `cms-queries` map về kiểu này (CMS lọc Sản phẩm ẩn bằng `visibleProductWhere`). Phần tương tác (LikeButton, ShareButtons, RelatedPosts) truyền qua slot; xem trước không truyền."

### H7 — Không có quy ước múi giờ

- **Unit A — `banners` form:** `datetime-local` gửi "2026-11-05T08:00" (giờ Việt Nam, không offset); `banners/schema.ts` dùng `z.coerce.date()` trên server (VPS thường UTC) → lưu lệch 7 giờ. Query lịch (AD-7) so `now()` đúng, nhưng mốc đã sai.
- **Unit B — `platform/format.ts`:** `formatDate` vi-VN chạy lúc prerender trên server UTC → "cập nhật dd/mm/yyyy" (EXPERIENCE: luôn tuyệt đối) lệch một ngày cho giá cập nhật trước 7 giờ sáng; `engagement` tính `PostViewDaily.day` theo UTC trong khi "Xem nhiều 30 ngày" và StatusBadge Banner "Chờ lịch/Hết hạn" tính theo giờ Vinh.
- **Bịt (Consistency Conventions, dòng Ngày giờ):** "Múi giờ nghiệp vụ `Asia/Ho_Chi_Minh` khai ở `platform/format.ts`; `formatDate` luôn truyền `timeZone`; input ngày giờ từ form gửi ISO có offset (client chuyển) và Zod dùng `z.iso.datetime({ offset: true })`; `PostViewDaily.day` là ngày theo múi giờ nghiệp vụ."

### H8 — Tạo lại `WEB_POST` khi đã có `Post`: Duyệt upsert đè bài đã sửa/đã xuất bản; khoá Xuất bản chỉ ở một màn

- **Unit A — `suggestions` (RegenerateDialog "mọi SuggestionCard"):** AD-19 cho Tạo lại mọi `kind`; Duyệt `WEB_POST` mới **upsert** vào `Post` theo `ContentSet.postId` → ghi đè tiêu đề, thân, slug, Danh mục của bài Vinh đã sửa tay hoặc đã xuất bản. Đổi slug bài công khai mà `posts/service` upsert không biết phải ghi `PostSlugRedirect` (AD-20 chỉ nói "đổi slug" chung).
- **Unit B — `posts` danh sách:** DataList có thao tác nhanh "Xuất bản/Về nháp" gọi `posts.setPostStatus` (action hiện có, AD-17). AD-19: khoá Xuất bản chỉ là props từ Screen màn soạn; "Server không kiểm thêm vì `Post` chỉ sinh từ Duyệt" — sai: `/cms/bai-viet/moi` tạo bài tự viết (AD-9), và trường hợp duy nhất có `WEB_POST` PENDING cạnh `Post` chính là tạo lại sau Duyệt.
- **Vỡ:** bài AI chưa duyệt được xuất bản từ danh sách; hoặc Duyệt bản tạo lại xoá mất chỉnh sửa và đổi URL bài đã có traffic.
- **Bịt (sửa AD-19):** chọn một: (a) cấm Tạo lại `WEB_POST` khi `ContentSet.postId` đã có — sửa tiếp ở Soạn Bài web (khớp EXPERIENCE "Đã Duyệt → chỉ đọc + Mở bài web"); hoặc (b) upsert vào `Post` có sẵn chỉ ghi thân/tiêu đề/SEO, giữ `slug`, `status`, `categoryId`. Đồng thời: `posts.setPostStatus` nhận cờ chặn từ action — đơn giản nhất là chọn (a) để điều kiện khoá không bao giờ xảy ra, và xoá câu "Post chỉ sinh từ Duyệt".

---

## Medium

### M1 — Route upload ngoài proxy: CSRF và hình dạng phản hồi

- **Unit A — `app/cms/upload/route.ts`:** AD-24 chỉ yêu cầu `requireAdmin()`. Basic Auth được trình duyệt tự gửi kèm cả request cross-site; Server Action có kiểm Origin sẵn, Route Handler thì không → trang lạ POST file vào storage (host nằm trong allowlist ảnh).
- **Unit B — `components/shared/upload-field.client.tsx`:** đọc phản hồi theo `Result<{ url }>` (AD-13), còn route trả `Response.json({ error }, { status: 400 })`.
- **Bịt (AD-24):** "Route từ chối khi `Origin` khác host hoặc `Sec-Fetch-Site` khác `same-origin`; luôn trả JSON `Result<{ url }>` (lỗi `UserError` tiếng Việt, HTTP 4xx), 401 khi chưa xác thực."

### M2 — `BioItem` tạo lười: thứ tự lên/xuống và `onDelete` chưa định

- **Unit A — `bio`:** lên/xuống trong "nhóm còn lại" (EXPERIENCE BioProductList) chỉ ghi `sortOrder` cho món được bấm; món chưa có `BioItem` xếp theo `Product.createdAt` → đổi chỗ với hàng xóm chưa có bản ghi là không xác định (null-sort lẫn với số).
- **Unit B — `products`:** "Sản phẩm còn được dùng thì không xoá cứng" (AD-15) — tự kiểm `PostProduct`, `ContentSetProduct`; `bio` khai `BioItem → Product` là `Restrict` (AD-15 "tham chiếu thực thể dùng chung") → xoá Sản phẩm chỉ từng bật/tắt trên bio nổ lỗi FK ("Có lỗi xảy ra"). `ResearchProfile`, `Suggestion` → `Product` cùng vấn đề.
- **Bịt:** Structural Seed ghi `onDelete` cho từng quan hệ tới `Product` (`BioItem`: Cascade; `PostProduct`, `ContentSetProduct`: Restrict; `ResearchProfile`, `Suggestion`: Cascade hoặc Restrict — chọn) và định nghĩa "đang được dùng" = tập Restrict đó. Thứ tự bio: lần đầu thao tác lên/xuống trong một nhóm thì `bio/service` tạo `BioItem` cho cả nhóm với `sortOrder` theo thứ tự đang hiển thị (một transaction).

### M3 — Duyệt `LINK_COMMENT` trước bài chính

- **Unit A — `content-sets`:** `SocialPost.content` NOT NULL, `styleProfileId` bắt buộc (AD-19: `@@unique([contentSetId, platform])`).
- **Unit B — `suggestions`:** Duyệt `LINK_COMMENT` (đích `SocialPost.linkComment`, AD-19) khi `THREADS_POST` còn GENERATING (AD-18: song song, độc lập — bình luận thường xong trước) → phải tạo `SocialPost` chỉ có `linkComment` → vi phạm NOT NULL; `Suggestion` không lưu `styleProfileId` nên Duyệt không biết điền gì.
- **Bịt (AD-19):** "`SocialPost.content` nullable; upsert theo `(contentSetId, platform)` từ bất kỳ phần nào; `styleProfileId` lấy từ `Suggestion.styleProfileId` (thêm cột) hoặc hồ sơ của `platform` lúc Duyệt."

### M4 — Callback `after()` ghi đè vô điều kiện; lỗi index lộ ra người dùng

- **Unit A — lõi `suggestions`:** callback ghi `update({ where: { id }, data: { payload, status: PENDING } })`.
- **Unit B — Tạo lại:** sau 120 giây đánh dấu bản cũ `FAILED` và chèn bản mới `GENERATING` (AD-18). Nhà cung cấp trả muộn (AD-10 không có timeout trong hợp đồng `ask`) → callback cũ đổi `FAILED` thành `PENDING` → hai bản `PENDING` cùng khoá đích → vi phạm partial unique index (callback nổ) hoặc thẻ cũ sống lại. Bấm Tạo lại khi bản cũ chưa quá 120 giây → P2002 thô → "Có lỗi xảy ra".
- **Bịt (AD-18):** "Callback chỉ cập nhật `where: { id, status: GENERATING }`; `ask` nhận `signal` (hạn 90 giây). Action tạo/tạo lại bắt vi phạm partial unique thành `UserError` 'Phần này đang được tạo'." Poller tính 120 giây từ `createdAt`, không từ lúc mount.

### M5 — `service.ts` đọc chéo bảng không có luật

- **Unit A — `categories.deleteCategory`:** EXPERIENCE: "Toast lỗi nêu số Bài web và Sản phẩm còn lại". AD-2 chỉ cho **query** đọc chéo; `service.ts` "ghi DB" → không đếm được, dựa vào FK Restrict → P2003 → "Có lỗi xảy ra" (AD-13), không có số.
- **Unit B — cùng nhu cầu ở `products` (xoá khi "còn được dùng"), `suggestions` (Duyệt `WEB_POST` kiểm `categoryId` tồn tại).**
- **Bịt (AD-2):** "`service.ts` được đọc bảng module khác qua quan hệ Prisma để kiểm điều kiện trước khi ghi (trong cùng `tx`), theo cùng luật import điều kiện như query."

### M6 — `?cam-hung` rơi khi tạo Sản phẩm mới; route tạo mới lệch giữa spine và UX

- **Unit A — `inspirations` (InspirationActions):** link "Tạo Sản phẩm mới" → `/cms/san-pham/moi?cam-hung=<id>` (cây thư mục spine có `san-pham/moi`).
- **Unit B — `products`:** EXPERIENCE: `/cms/san-pham/[id]` "cũng là màn tạo mới"; `saveProduct` xong chuyển tới `/cms/san-pham/[id]` không mang query (products không biết khái niệm Cảm hứng).
- **Vỡ:** UJ-2 bước 3 "Chi tiết Sản phẩm mở với dải 'Từ Cảm hứng'" mất; Bộ nội dung không ghi liên kết Cảm hứng → Cảm hứng không bao giờ *Đã dùng*.
- **Bịt:** chốt một route tạo mới (spine hoặc UX sửa theo nhau); Rule AD-12: "Màn tạo mới giữ nguyên `searchParams` khi chuyển sang màn chi tiết sau Lưu"; liệt kê tham số URL dùng chung giữa module (`cam-hung`) trong `constants.ts` của module chủ (`inspirations`).

### M7 — Ví dụ "bài xếp theo Lượt xem" trong AD-2 đặt sai mẫu

- **Unit A — `posts` (CMS `/cms/bai-viet`, FR-38: cột Lượt xem/Lượt tim, **sắp xếp**, phân trang `?trang`):** theo ví dụ AD-2 → Screen gọi `engagement` lấy thống kê rồi ghép.
- **Unit B — `engagement`:** làm `listStatsByPostIds(ids)`.
- **Vỡ:** ghép ở Screen không sắp xếp + lọc trạng thái + phân trang được trên hai nguồn (chỉ sắp được trong trang hiện tại). Cách đúng là `posts/cms-queries` `orderBy: { stat: { views } }` qua quan hệ — chính AD-2 câu 1 cho phép.
- **Bịt:** bỏ ví dụ "bài xếp theo Lượt xem" khỏi đoạn Màn tổng hợp; thêm: "Khi cần lọc/sắp/phân trang theo cột của module khác, query của bảng được phân trang đọc chéo qua quan hệ (không ghép ở Screen)."

---

## Low

- **L1 — Action engagement nhận `postId` tuỳ ý:** `recordView`/`toggleLike` với id bài nháp hoặc không tồn tại → upsert `PostStat` cho bài nháp hoặc lỗi FK. Bịt: AD-23 "action kiểm bài đã xuất bản trước khi ghi". Cũng chưa nói đọc số tim và ghi lượt xem dùng chung bucket giới hạn tần suất hay không — đọc bị chặn thì tim hiện "—".
- **L2 — `Suggestion` thiếu `styleProfileId`** (xem M3) — cũng cần cho FR-18 "nội dung đã tạo không đổi khi sửa hồ sơ" nếu sau này muốn truy vết.
- **L3 — Slug Danh mục cũ trên trang phân trang:** AD-20 nói "màn hình khi không thấy slug thì tra lịch sử", nhưng agent làm `[danh-muc]/trang/[n]` có thể chỉ `notFound()`. Bịt: AD-20 ghi rõ áp cho mọi route có `[danh-muc]`, giữ phần đuôi `/trang/n`.
- **L4 — `UploadField` trong `components/shared` gõ cứng `/cms/upload`,** trái câu AD-11 "component dùng chung không biết mình ở site hay CMS". Bịt: nhận `endpoint` qua props hoặc nêu `UploadField` là ngoại lệ có tên.
- **L5 — Chạy song song 5 lần gọi AI (AD-18)** với nhà cung cấp miễn phí/CLI (Deferred) dễ bị giới hạn đồng thời → nhiều thẻ FAILED cùng lúc. Bịt: `platform/ai` có hàng đợi với mức đồng thời cấu hình được; mốc 120 giây tính từ lúc lần gọi bắt đầu chạy, không từ lúc xếp hàng (hoặc ngược lại — ghi một).
- **L6 — Banner theo lịch với stale-while-revalidate:** sau thời gian không có truy cập, người đầu tiên vẫn nhận bản cache có Banner đã hết hạn (AD-7 cho expire ≥ 5 phút). Chấp nhận được nếu ghi rõ "hết lịch có thể còn hiện tới một lượt truy cập"; nếu không thì Banner component kiểm `endsAt` phía client để ẩn.
