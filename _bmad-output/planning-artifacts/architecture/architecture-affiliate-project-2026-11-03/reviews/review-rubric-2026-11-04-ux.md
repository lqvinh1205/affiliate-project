---
type: review-rubric
target: ARCHITECTURE-SPINE.md (sau "Update 2026-11-04 (lần 2)" — đối chiếu UX)
inputs:
  - ARCHITECTURE-SPINE.md
  - .memlog.md (dòng 77–93)
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/EXPERIENCE.md
  - code hiện tại: proxy.ts, app/layout.tsx, app/(site)/layout.tsx, app/(site)/not-found.tsx
  - node_modules/next/dist/docs: not-found.md, proxy.md (matcher), proxyClientMaxBodySize.md
date: 2026-11-04
---

# Review rubric — spine sau đối chiếu UX (2026-11-04, lần 2)

## Verdict

Các sửa lần 2 đóng đúng phần lớn follow-up UX (route Loại bài, upload > 10 MB, mốc copy trước Duyệt, khoá Xuất bản, BioItem lười) và không phá AD-1/AD-3/AD-4. Nhưng còn **5 điểm High** khiến hai agent vẫn có thể làm khác nhau hoặc buộc phải vi phạm spine: AD-5 không có file hợp lệ cho đọc không cache của action công khai; luật "không vòng import" không có thứ tự module để quyết định và không được ESLint kiểm; vòng `posts ↔ suggestions` do PostEditor + RiskWarning; 404 chỉ có `app/not-found.tsx` không phủ CMS và nằm ngoài layout site; LINK_COMMENT chạy song song có thể được Duyệt trước khi `SocialPost` tồn tại. Không có Critical. Cần một vòng vá ngắn trước khi viết story.

Tổng: 0 Critical · 5 High · 8 Medium · 6 Low.

## Phát hiện

### H-1 — AD-5 không có chỗ hợp lệ cho đọc không cache của action công khai

- **Mức:** High
- **Vị trí:** AD-5 (bảng file), AD-6 ngoại lệ 1 (đọc số tim) và 2 (`posts.searchPosts`).
- **Vấn đề:** AD-6 giờ có hai action **đọc** công khai, nhưng theo AD-5: `actions.ts` cấm gọi Prisma trực tiếp và được mô tả là "cửa ngõ ghi"; `queries.ts` bắt buộc `"use cache"` (số tim sẽ cũ tới hết `cacheLife`, sai mục đích "đọc phía client"); `cms-queries.ts` là đọc cho CMS; `service.ts` là ghi. Agent sẽ hoặc gọi Prisma trong action (vi phạm AD-5), hoặc bọc `"use cache"` cho số tim (sai dữ liệu), hoặc đặt vào `cms-queries.ts` (lẫn vai trò). Hai agent làm `engagement` và `posts.searchPosts` gần như chắc chắn chọn khác nhau.
- **Đề xuất:** Thêm một dòng vào AD-5: "Đọc không cache phục vụ action công khai (AD-6) đặt trong `service.ts` của module chủ, tên `get…`/`search…`, chỉ trả dữ liệu công khai." Sửa mô tả `actions.ts` thành "cửa ngõ ghi và action công khai có tên (AD-6)".

### H-2 — "Không có vòng import giữa hai module" không quyết định được và không được kiểm

- **Mức:** High
- **Vị trí:** AD-2 (câu cuối Rule + gạch đầu dòng "Đọc chéo bảng", "Màn tổng hợp"), AD-17 bước 2 (ESLint).
- **Vấn đề:** Nhiều cặp module có nhu cầu hai chiều thật: `posts → products` (`visibleProductWhere`, `AffiliateLink`) và `products` cần "đang dùng ở bài nào"; `categories → posts` (CategorySheet chỉ Danh mục có bài đã xuất bản cần điều kiện "đã xuất bản" của `posts`; xoá Danh mục cần đếm Bài web) và `posts` dùng Danh mục; `suggestions ↔ content-sets`. Spine chỉ nói "khi tạo vòng import thì ghép ở Screen", tức agent đầu tiên import chiều nào thì thắng, agent sau phải tự phát hiện vòng. `no-restricted-imports` ở AD-17 chỉ chặn đường dẫn, không phát hiện vòng; không có `import/no-cycle` hay công cụ tương đương trong Stack.
- **Đề xuất:** Thay câu "Không có vòng import…" bằng **thứ tự tầng module cố định**, chỉ import sang tầng thấp hơn, ví dụ: `categories` < `products` < `posts`, `research`, `style-profiles`, `inspirations`, `banners`, `bio`, `engagement` < `content-sets` < `suggestions`. Khi cần chiều ngược thì ghép ở Screen hoặc đọc qua quan hệ Prisma mà không import. Vì thứ tự cố định nên ESLint `no-restricted-imports` cấu hình theo từng thư mục module là đủ để kiểm (không cần thêm dependency). Ghi thứ tự này một lần ở AD-2 và trong sơ đồ.

### H-3 — Vòng `posts ↔ suggestions` qua PostEditor và RiskWarning

- **Mức:** High
- **Vị trí:** AD-11 (màn ghép), AD-19 gạch "Khoá nút Xuất bản"; UX: PostEditor ("RiskWarning highlight câu ngay trong ô soạn"), SuggestionCard `WEB_POST` dùng PostEditor.
- **Vấn đề:** SuggestionCard (`suggestions/components`) render `WEB_POST` bằng PostEditor (`posts/components`) ⇒ `suggestions → posts`. PostEditor cần hiển thị RiskWarning — khái niệm của `suggestions` (kiểu `riskWarnings`, component RiskWarning) ⇒ `posts → suggestions`. AD-19 đã chốt "posts không import suggestions" cho riêng nút Xuất bản nhưng không nói gì về RiskWarning, nên agent làm PostEditor sẽ import `suggestions/types` hoặc `suggestions/components/risk-warning`.
- **Đề xuất:** Thêm vào AD-19 (hoặc AD-11): "PostEditor nhận cảnh báo qua props kiểu `HighlightRange[]` do `posts/types.ts` (hoặc `components/shared`) định nghĩa; danh sách RiskWarning là component của `suggestions`, được Screen hoặc SuggestionCard đặt cạnh PostEditor; `posts` không import `suggestions` dưới bất kỳ hình thức nào."

### H-4 — 404: một file `app/not-found.tsx` không phủ CMS và nằm ngoài layout site

- **Mức:** High
- **Vị trí:** AD-12 (đoạn cuối), Cây thư mục (`app/`, `app/(site)/`, `app/cms/`).
- **Vấn đề:**
  1. `notFound()` render file `not-found` gần nhất ở trên. Với chỉ `app/not-found.tsx`, CMS (`/cms/san-pham/<id-đã-xoá>`) sẽ hiện trang 404 công khai (SearchBox, Xem nhiều), trái UX: "Không tìm thấy. Có thể đã bị xoá." + link về danh sách.
  2. `app/not-found.tsx` render trong root layout, **không** trong `app/(site)/layout.tsx`, nên mất SiteHeader/SiteFooter/BottomTabBar. Đồng thời vì `(site)` có `[danh-muc]` ở gốc, mọi URL một đoạn (`/abc`) khớp `[danh-muc]` và đi qua `notFound()` của page, chỉ URL nhiều đoạn mới tới "URL không khớp route". Hai đường 404 sẽ khác nhau.
  3. Repo hiện có `app/(site)/not-found.tsx`; cây thư mục bỏ nó nhưng không nói xoá hay giữ.
- **Đề xuất:** Cây thư mục ghi rõ ba file: `app/(site)/not-found.tsx` (404 site, trong layout site), `app/cms/not-found.tsx` (404 CMS theo UX), `app/not-found.tsx` (URL không khớp route). AD-12: "`app/not-found.tsx` và `app/(site)/not-found.tsx` render cùng `NotFoundScreen` ở `app/(site)/_components/`; file gốc tự bọc khung site (SiteHeader/SiteFooter) vì nằm ngoài layout `(site)`." Thêm vào AD-17 bước 1: `curl -I /a/b/c` trả 404.

### H-5 — LINK_COMMENT chạy song song có thể được Duyệt trước khi `SocialPost` tồn tại

- **Mức:** High
- **Vị trí:** AD-18 (song song, "bình luận kèm link không chờ bài chính"), AD-19 (đích `LINK_COMMENT` = `SocialPost.linkComment`, khoá `contentSetId + platform`), AD-21 (Duyệt chép `firstCopiedAt` sang `SocialPost`).
- **Vấn đề:** Sau sửa AD-18, `LINK_COMMENT` thường xong trước bài chính, và UX cho Duyệt từng thẻ riêng. Duyệt `LINK_COMMENT` upsert vào `SocialPost` chưa có ⇒ phải tạo `SocialPost` thiếu nội dung bài (cột nội dung NOT NULL sẽ lỗi), hoặc từ chối Duyệt. Spine không chọn. Cùng lúc `SocialPost.firstCopiedAt` là một cột cho cả bài và bình luận, nên Duyệt bình luận có thể "chiếm" mốc trước bài.
- **Đề xuất:** Chọn một trong hai và ghi vào AD-19: (a) `SocialPost` có nội dung bài `nullable`, Duyệt `LINK_COMMENT` tạo `SocialPost` chỉ có `linkComment`; hoặc (b) nút Duyệt `LINK_COMMENT` khoá tới khi bài cùng nền tảng đã Duyệt (Screen truyền props, server kiểm trong `approveSuggestion`). Ghi rõ `firstCopiedAt` của `SocialPost` lấy mốc sớm nhất từ cả hai gợi ý.

### M-1 — "Màn tổng hợp" không dùng được cho sắp xếp/phân trang theo cột của module khác

- **Mức:** Medium
- **Vị trí:** AD-2 gạch "Màn tổng hợp" (ví dụ "bài xếp theo Lượt xem").
- **Vấn đề:** `/cms/bai-viet` sắp xếp theo Lượt xem/Lượt tim có phân trang (FR-38, UX DataList). Ghép ở Screen bằng hai query rời buộc tải hết rồi sắp trong bộ nhớ. Ví dụ trong spine lại xếp đúng trường hợp này vào "ghép ở Screen", dẫn agent đi sai.
- **Đề xuất:** Tách luật: "Lọc/sắp/phân trang theo cột của B → query ở module chủ của danh sách (A) đọc B qua quan hệ Prisma (`posts/cms-queries` đọc `PostStat`). Ghép ở Screen chỉ cho dữ liệu phụ tra theo id (nơi đang dùng Sản phẩm, nền tảng đã đăng)." Bỏ "bài xếp theo Lượt xem" khỏi ví dụ ghép.

### M-2 — RESEARCH + PRODUCT_CATEGORY một lần gọi: chưa rõ lỗi một phần và tạo lại

- **Mức:** Medium
- **Vị trí:** AD-19 gạch đầu tiên; AD-18 (giả định 1 lần gọi ↔ 1 `Suggestion`).
- **Vấn đề:** "Duyệt và tạo lại độc lập" nhưng sinh chung một lần gọi. Chưa nói: tạo lại riêng Danh mục gọi prompt nào (gọi lại cả nghiên cứu rồi bỏ phần hồ sơ, hay prompt riêng); tạo lại hồ sơ có sinh `PRODUCT_CATEGORY` mới và SUPERSEDE gợi ý Danh mục đang chờ/đã duyệt không; AI trả `categoryId` không tồn tại thì cả hai FAILED hay chỉ `PRODUCT_CATEGORY`.
- **Đề xuất:** Thêm hai câu: "Tạo lại `RESEARCH` sinh lại cả hai, chỉ SUPERSEDE `PRODUCT_CATEGORY` đang `PENDING`; tạo lại `PRODUCT_CATEGORY` dùng prompt riêng `research/prompts/product-category.prompt.ts` với hồ sơ hiện có. Danh mục gợi ý không hợp lệ → chỉ `PRODUCT_CATEGORY` FAILED."

### M-3 — `ask()` không có đầu vào video nhưng lại có `skipped: "video"`

- **Mức:** Medium
- **Vị trí:** AD-10 (hợp đồng `ask`), AD-9 (`skipped`), Deferred (đọc video).
- **Vấn đề:** Hợp đồng `ask({ prompt, input, images?, webSearch? })` không có cách yêu cầu đọc video, nên không có điều kiện để "bỏ qua video". Agent làm FR-2 sẽ tự thêm tham số theo cách riêng hoặc nhét URL video vào `input` (khi đó `platform/ai` không biết là video để ghi `skipped`).
- **Đề xuất:** Sửa hợp đồng thành `ask({ prompt, input, images?, videoUrl?, webSearch? })`; `skipped` có `video` khi có `videoUrl` mà nhà cung cấp không đọc được.

### M-4 — Ngày tuyệt đối và lịch Banner không chốt múi giờ

- **Mức:** Medium
- **Vị trí:** AD-27, AD-7 gạch "Banner theo lịch", Consistency Conventions (Ngày giờ).
- **Vấn đề:** UX bắt buộc "cập nhật dd/mm/yyyy", "Đã đăng · dd/mm/yyyy" render trên trang tĩnh (server). `formatDate` vi-VN không ghi `timeZone` sẽ theo múi giờ VPS (thường UTC) — lệch một ngày cho mốc trước 7h sáng. Lịch Banner nhập ngày ở CMS cũng cần quy ước ngày bắt đầu/kết thúc theo giờ Việt Nam để query lọc và StatusBadge CMS khớp nhau.
- **Đề xuất:** AD-27: "`platform/format.ts` luôn dùng `timeZone: "Asia/Ho_Chi_Minh"`; ngày nhập từ form CMS hiểu theo giờ Việt Nam, lưu UTC; ngày kết thúc lịch tính tới hết ngày."

### M-5 — Trạng thái Banner tính ở hai nơi

- **Mức:** Medium
- **Vị trí:** AD-7 gạch "Banner theo lịch"; UX StatusBadge Banner (Tắt / Chờ lịch / Hết hạn / Đang hiện).
- **Vấn đề:** Query public lọc "đang hiện" bằng điều kiện Prisma; CMS hiện bốn trạng thái. Hai agent sẽ viết hai luật (ví dụ biên `<` hay `<=` ở ngày kết thúc).
- **Đề xuất:** "`banners/queries.ts` xuất `activeBannerWhere(now)`; `banners/types.ts` (hoặc `constants.ts`) xuất hàm thuần `bannerState(banner, now)` dùng cho StatusBadge; cả hai cùng định nghĩa biên." Nên gọi tên profile `cacheLife` (ví dụ profile `banner` khai báo trong `next.config.ts`) thay vì chỉ "revalidate ≤ 60 giây".

### M-6 — BioItem tạo lười: thứ tự trộn chưa rõ

- **Mức:** Medium
- **Vị trí:** Bảng Chủ sở hữu bảng, dòng `bio`.
- **Vấn đề:** "Thiếu bản ghi = … xếp theo `Product.createdAt`" không nói tăng hay giảm, và Sản phẩm có `order` tường minh xếp thế nào so với Sản phẩm chưa có bản ghi. Nút lên/xuống trong nhóm "còn lại" (UX BioProductList) chỉ đúng khi mọi món trong nhóm có `order`. Trang chủ (dải 8 thẻ) và `/bio` cần cùng một thứ tự.
- **Đề xuất:** "Thứ tự: ghim trước, rồi `order` tăng dần (null xếp sau), rồi `Product.createdAt` giảm dần. Thao tác sắp xếp đầu tiên trong một nhóm upsert `BioItem` cho mọi Sản phẩm của nhóm. Một hàm sắp xếp duy nhất trong `bio/queries.ts` dùng cho cả `/bio` và Trang chủ."

### M-7 — Đọc tương tác qua URL va chạm form chưa lưu và giữ trạng thái client

- **Mức:** Medium
- **Vị trí:** AD-12 gạch "Trang CMS" (Combobox tìm Sản phẩm qua URL); UX UnsavedChangesGuard, ProductPicker trong Soạn Bài web, AudiencePicker "trạng thái trên màn".
- **Vấn đề:** ProductPicker nằm trong form Soạn Bài web. Đưa ô tìm lên URL nghĩa là mỗi lần gõ là một điều hướng: UnsavedChangesGuard có thể chặn chính nó; nếu Suspense hiện lại fallback thì form RHF bị unmount và mất dữ liệu chưa lưu (trái NFR-2). Spine không nói cách điều hướng.
- **Đề xuất:** Thêm: "Trạng thái URL đổi bằng `router.replace(…, { scroll: false })` trong `startTransition`, debounce 300 ms; UnsavedChangesGuard bỏ qua điều hướng cùng pathname; tham số URL tương tác chỉ ảnh hưởng `<Suspense>` con quanh kết quả, không bọc form."

### M-8 — AD-17 bước 1 kiểm thứ chưa tồn tại

- **Mức:** Medium
- **Vị trí:** AD-17 bước 1.
- **Vấn đề:** Bước 1 yêu cầu `curl -I` slug cũ trả 308 và upload > 10 MB qua `/cms/upload`, nhưng `PostSlugRedirect` chỉ có ở bước 3 (migration nền) và `app/cms/upload/route.ts` chưa được dựng. Agent sẽ hoặc bỏ qua kiểm, hoặc dựng sớm một phần bước 2–3.
- **Đề xuất:** Ghi rõ "bước 1 là spike: route tạm gọi `permanentRedirect` cứng và route upload tạm ghi ra `/dev/null`, xoá sau khi kiểm", hoặc chuyển hai kiểm này sang cuối bước 3.

### L-1 — Matcher loại `/cms/upload` chưa ghi biểu thức

- **Mức:** Low
- **Vị trí:** AD-24.
- **Vấn đề:** "Loại trừ đúng `/cms/upload`" cần regex âm; viết `(?!upload)` sẽ loại cả `/cms/uploads…`, và dễ quên `/cms` gốc. Ngoài ra `next.config` có `experimental.proxyClientMaxBodySize` — phương án thay thế đã bị loại nhưng spine không ghi.
- **Đề xuất:** Ghi biểu thức chốt, ví dụ `matcher: ["/cms", "/cms/((?!upload$).*)", "/api/:path*"]`, và thêm vào AD-17 bước 1: `curl -I /cms/uploadx` (không auth) trả 401 từ proxy. Một cụm "không dùng `proxyClientMaxBodySize`" là đủ.

### L-2 — Đường dẫn tạo Sản phẩm và `?cam-hung`

- **Mức:** Low
- **Vị trí:** Cây thư mục (`san-pham[/moi|/[id]]`); UX: "`/cms/san-pham/[id]` (cũng là màn tạo mới)", InspirationActions "màn tạo Sản phẩm kèm `?cam-hung=<id>`".
- **Vấn đề:** UX và spine lệch nhẹ về màn tạo. Lưu ở `/moi` rồi chuyển sang `/[id]` mà không mang `?cam-hung` thì CreateContentSetPanel mất liên kết Cảm hứng (FR-2).
- **Đề xuất:** Một câu ở AD-12 hoặc cây thư mục: "`/cms/san-pham/moi` lưu xong chuyển tới `/cms/san-pham/[id]` giữ nguyên `searchParams`."

### L-3 — AD-18 song song: hạn 90 giây có tính thời gian chờ không

- **Mức:** Low
- **Vị trí:** AD-18; Deferred "cooldown AI".
- **Vấn đề:** Tới 5 lần gọi song song; nếu nhà cung cấp (Claude CLI, API miễn phí) buộc xếp hàng, phần sau vượt 120 giây và bị coi FAILED giả. Chưa nói 90 giây tính từ lúc xếp hàng hay lúc gọi.
- **Đề xuất:** "Hạn 90 giây tính từ lúc `ask()` được gọi, gồm cả thời gian chờ trong `platform/ai`."

### L-4 — Capability map thiếu tham chiếu mới

- **Mức:** Low
- **Vị trí:** Capability → Architecture Map.
- **Vấn đề:** Dòng FR-1, FR-2 thiếu AD-10 (video `skipped`); FR-33..FR-35, FR-38 thiếu AD-2 (đọc chéo `PostStat` cho cột/sắp xếp CMS); FR-30/31 thiếu bảng chủ sở hữu (BioItem lười); FR-26 thiếu AD-12 cho 404.
- **Đề xuất:** Bổ sung các AD tương ứng vào cột Governed by.

### L-5 — Follow-up "Góc viết bộ nhiều Sản phẩm" chưa được đóng tường minh

- **Mức:** Low
- **Vị trí:** AD-19; UX "Follow-up cho bmad-architecture" mục 2.
- **Vấn đề:** UX hỏi có cần một lần gọi AI tổng hợp góc chung không. Spine im lặng; agent có thể tự thêm kind mới.
- **Đề xuất:** Một câu: "Bộ nhiều Sản phẩm dùng Góc viết/Người đọc chọn từ các hồ sơ có sẵn; không có lần gọi AI tổng hợp góc."

### L-6 — Độ ngắn gọn

- **Mức:** Low
- **Vị trí:** AD-11, AD-6 mục 1, AD-12 gạch "(site) có tham số", AD-18, AD-24.
- **Vấn đề:** AD-11 là một đoạn ~250 từ trộn năm quyết định (nơi đặt, shadcn CLI, màn ghép, AffiliateLink, `[COMPONENT-UNKNOWN]`) — khó trích theo từng story. Một số chỗ có lý do dài trong Rule: "Lý do: gọi trong `<Suspense>` thì…" (AD-12), "(chỉ đọc, để trang tĩnh hiện số tim kể cả khi không gửi lượt xem)" (AD-6), "để mốc 120 giây dưới đây tính đúng cho từng phần" và "(tiến trình khởi động lại làm mất `after()`)" (AD-18), "(proxy chỉ đệm body tối đa 10 MB và cắt phần thừa — …)" (AD-24).
- **Đề xuất:** Tách AD-11 thành gạch đầu dòng (Vị trí · shadcn · Màn ghép · AffiliateLink · Thiếu component). Chuyển các câu lý do sang memlog, giữ trích dẫn tài liệu Next dạng tham chiếu ngắn.

## Kiểm theo checklist

| Mục | Kết quả |
| --- | --- |
| AD-2 đọc chéo bảng | Thực thi được (import `visibleProductWhere`); luật vòng import không quyết định được → H-2; ví dụ sắp xếp sai → M-1. |
| AD-6 đọc số tim | Đúng hướng; thiếu nơi đặt đọc không cache → H-1. |
| AD-7 route Loại bài | Nhất quán với AD-20 `RESERVED_ROOT_SLUGS`, AD-26, cây thư mục; đạt. |
| AD-7 Banner theo lịch | Hợp `cacheLife` sàn (expire ≥ 5 phút giữ trong prerender); thiếu hàm trạng thái chung và múi giờ → M-4, M-5. |
| AD-9/AD-10 video | `skipped` nhất quán giữa AD-9, AD-10, Deferred; thiếu đầu vào → M-3. |
| AD-11 components/shared | Quyết định được (module cần → shared); không mâu thuẫn AD-2. Màn ghép còn vòng PostEditor/RiskWarning → H-3. |
| AD-12 searchParams CMS / URL tương tác / not-found | searchParams trong Suspense đúng; URL tương tác → M-7; 404 → H-4. |
| AD-17 bước 1 | Thứ tự không thực hiện được → M-8. |
| AD-18 song song | Nhất quán với AD-19 về khoá; mở ra H-5, L-3. |
| AD-19 nghiên cứu một lần gọi / khoá Xuất bản | Khoá Xuất bản rõ, giữ `posts` không import `suggestions`; tạo lại → M-2. |
| AD-21 `Suggestion.firstCopiedAt` | Nhất quán với bảng chủ sở hữu và AD-19; tên action trong memlog (`recordCopy`) khác spine (`recordSuggestionCopy`) — spine thắng, không cần sửa. |
| AD-24 matcher | Đúng theo `proxyClientMaxBodySize.md`; sơ đồ Hệ thống đã cập nhật; biểu thức → L-1. |
| Cây thư mục | Thiếu `app/(site)/not-found.tsx`, `app/cms/not-found.tsx` (H-4), `layout.tsx` hai nhóm (nhỏ, có thể bỏ qua). |
| Bảng chủ sở hữu (BioItem) | `products` không ghi `BioItem` rõ; thứ tự → M-6. |
| AD-1, AD-3, AD-4, AD-5 | Không bị sửa lần 2 phá; AD-5 cần một dòng cho H-1. |
