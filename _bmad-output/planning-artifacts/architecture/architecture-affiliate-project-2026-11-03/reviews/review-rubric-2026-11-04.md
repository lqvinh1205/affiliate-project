# Review rubric — cập nhật spine 2026-11-04

> Đối tượng: `ARCHITECTURE-SPINE.md` (updated 2026-11-04) · Đối chiếu: `reviews/gaps-quy-tac-2026-11-04.md`, `components.json`, `app/cms/layout.tsx`, `docs/cong-thuc/chuyen-code-cu.md`, `node_modules/next/dist/docs/` (Next 16.4.3) · Chế độ: chỉ đọc, không sửa spine

## Kết luận

**Đạt có điều kiện.** Phần lớn gap trong phạm vi đã đóng, và cách giải #1 (tra slug ở `page.tsx` trước `<Suspense>`) khớp tài liệu Next 16: `not-found.md` ghi gọi `notFound()` trước khi stream thì trả 404, `ensureStatic.md` ghi param chưa prerender sẽ chờ bản tĩnh được tạo, nên tra cứu ở cấp page vẫn hợp với `ensureStatic = "navigation"`. Còn 2 lỗi cần sửa trước khi chốt: lời của AD-12 tự mâu thuẫn, và AD-7 có thể làm hỏng build khi thêm phân trang. Ngoài ra có 1 lỗ hổng vận hành ở AD-18, 1 quyết định UX bị đưa lén vào AD-14, và 2 luật không cưỡng chế được ở AD-17.

## Phát hiện

### F1 — AD-12: luật gốc mâu thuẫn với ngoại lệ site [Cao]

- **Vấn đề:** Gạch đầu dòng gốc ghi "`page.tsx` **chỉ** gồm metadata, `<Suspense>` và một `<…Screen>`" và "Screen `await params`, gọi `queries`". Ngoại lệ `(site)` ngay bên dưới lại cho `page.tsx` `await params`, gọi query, gọi `notFound`/`permanentRedirect` và truyền dữ liệu cho Screen. Agent đọc câu đầu sẽ làm sai: hoặc gọi `notFound()` trong Screen (trả HTTP 200), hoặc gọi query hai lần. AD-13 cũng còn ghi "trả `null` để **màn hình** gọi `notFound()`".
- **Sửa:** Viết lại câu gốc thành: "`page.tsx` gồm metadata, `<Suspense>`, một `<…Screen>`, và với trang `(site)` có tham số thì thêm phần tra cứu ở cấp page nêu dưới đây; không có logic nào khác. Trang không có tham số và trang CMS: Screen `await params` và tự gọi query." Sửa AD-13: "…trả `null`; `page.tsx` (site) hoặc Screen (CMS) gọi `notFound()` theo AD-12."

### F2 — AD-7 × AD-12/gap #5: `generateStaticParams` của `/[danh-muc]/trang/[n]` có thể trả mảng rỗng [Cao]

- **Vấn đề:** AD-7 bắt buộc `generateStaticParams` không bao giờ rỗng, và dựa vào seed (1 Danh mục, 1 Bài web) để bảo đảm điều đó. Với seed như vậy chưa có trang 2, và trang 1 là chính `/[danh-muc]`, nên route phân trang không có param hợp lệ nào. Theo `ensureStatic.md` mục "Dynamic route parameters", build sẽ fail. Spine cũng chưa định nghĩa `/trang/1`, và gap #5 chưa nêu kích thước trang của site (`PAGE_SIZE` chỉ được nêu ở gạch đầu dòng CMS).
- **Sửa (thêm vào AD-7):** "`/[danh-muc]/trang/[n]` trả các trang thật từ `n = 2`; nếu không có trang nào thì trả một param giữ chỗ `{ danh-muc: <Danh mục đầu>, n: "2" }`, page gọi `notFound()` khi prerender (404 tĩnh). `n = 1` → `permanentRedirect` về `/[danh-muc]`. Kích thước trang site là `PAGE_SIZE` trong `modules/posts/constants.ts`."

### F3 — AD-18: `GENERATING` mồ côi khoá khoá đích vĩnh viễn [Cao]

- **Vấn đề:** Nếu tiến trình restart giữa chừng (một tiến trình trên VPS) thì `after()` mất, và `Suggestion` đứng mãi ở `GENERATING`. Poller dừng sau 120 giây nhưng spine không nói điều gì xảy ra tiếp theo. Partial unique index của AD-19 (tối đa một `GENERATING`/`PENDING` cho mỗi khoá đích) sẽ chặn mọi lần tạo lại.
- **Sửa:** "`GENERATING` có `createdAt` quá 120 giây được coi là `FAILED` ('Quá thời gian, thử lại'): `cms-queries` trả trạng thái đó cho màn hình, còn action tạo/tạo lại chuyển bản quá hạn sang `FAILED` trong cùng transaction trước khi chèn bản mới."

### F4 — AD-14: quyết định UX của gap #7 bị đưa vào spine [Trung bình]

- **Vấn đề:** Gap #7 xếp "lỗi server vào trường hay toast" vào nhóm UX (`bmad-ux`). Spine lại chốt "`UserError` từ server hiện bằng toast". Ranh giới kỹ thuật thật sự chỉ là "`Result<T>` không mang lỗi theo trường".
- **Sửa:** "`UserError` từ server hiển thị ở cấp form, không gắn vào trường; cách trình bày (toast, banner) theo `EXPERIENCE.md`."

### F5 — AD-17 × AD-2: alias `hooks` làm `components/ui` phụ thuộc `components/shared` [Trung bình]

- **Vấn đề:** Component shadcn (ví dụ `sidebar` dùng `use-mobile`) import qua alias `hooks`. Đổi alias này thành `@/components/shared/hooks` sẽ tạo cạnh `ui → shared`, ngược với sơ đồ AD-2 (chỉ có `shared → ui`). Khi `shared` cũng import `ui` thì sinh ra vòng import.
- **Sửa:** "`hooks` → `@/components/ui/hooks`; hook không nghiệp vụ do mình viết đặt ở `components/shared/` và không được `components/ui` import."

### F6 — AD-17: luật ESLint "từ file mới" không cưỡng chế được [Trung bình]

- **Vấn đề:** ESLint không phân biệt được file mới và file cũ.
- **Sửa:** "Luật `no-restricted-imports` áp cho `modules/**`, `platform/**`, `components/shared/**`, `app/**`; các file cũ còn lại được miễn bằng danh sách `ignores` tường minh trong `eslint.config.mjs`. Mỗi story chuyển file thì xoá file đó khỏi danh sách."

## Phát hiện nhỏ

- **AD-17 / gap "Tài liệu lệch":** `app/cms/layout.tsx` vẫn đang `maxDuration = 60`, trong khi AD-18 yêu cầu ≥ 90. Bước 2 của epic nền chưa có việc sửa giá trị này → thêm "đặt `maxDuration = 90` ở `app/cms/layout.tsx`".
- **AD-17 / "Đưa vào epic nền":** việc duyệt `[QU-26]`–`[QU-28]` chưa được nhắc → thêm vào bước 4.
- **AD-9:** `checkPostSeo` gọi AI đồng bộ, không qua vòng đời của AD-18 → ghi rõ "hạn 90 giây, cùng `maxDuration`". Hai cụm "ngoại lệ duy nhất" (một cho AD-2, một cho "mọi đầu ra AI là `Suggestion`") dễ đọc nhầm → đổi cụm thứ hai thành "Ngoại lệ duy nhất của quy tắc *mọi đầu ra AI là `Suggestion`*". Sơ đồ phụ thuộc nên ghi `service.ts · prompts/ (AD-9)`.
- **AD-18:** câu "Nếu `after()` buộc phải làm mới cache thì dùng `revalidateTag(tag, "max")`" là cửa thoát dựa trên phán đoán. Hiện không có trường hợp nào cần (callback chỉ ghi CMS) → xoá câu này, hoặc nêu đích danh trường hợp áp dụng.
- **AD-20:** "chọn theo từng lần bỏ" chưa nói ai chọn → "story bỏ route ghi lựa chọn redirect/404 và lý do".
- **AD-27:** cần nói rõ cách tránh lỗi hydration: "`relative-time.client.tsx` render `formatDate` tuyệt đối ở server, đổi sang thời gian tương đối sau khi mount".

## Đối chiếu gap

| Gap | Trạng thái | Ghi chú |
| --- | --- | --- |
| #1 notFound/redirect | Đóng | Câu chữ cần sửa theo F1 |
| #2 poller | Đóng | Còn lỗ hổng `GENERATING` mồ côi (F3) |
| #3 components.json | Đóng | Alias `hooks` sai hướng (F5) |
| #4 bảng ánh xạ, tách `actions.ts` | Đóng | Bảng nằm ở `chuyen-code-cu.md`, luật tách ở AD-17 |
| #5 phân trang, tìm kiếm CMS, `PAGE_SIZE` | Một phần | Thiếu kích thước trang site, `/trang/1` và param rỗng (F2) |
| #9 styleguide | Đóng | Chuyển vào `app/cms/styleguide` |
| #10 SEO | Đóng | AD-26 |
| #11 shadcn CLI | Đóng | AD-11 |
| #12 định dạng | Đóng | AD-27 |
| #13 `error.tsx`, chuỗi UI, tên Screen | Đóng | Bảng Consistency Conventions |
| #14 `AGENTS.md` | Đóng | AD-17 bước 4 |
| #15 import prompt | Đóng | AD-9 |
| #16 `sources`/`skipped` | Đóng | AD-9 |
| #17 `after()` + `updateTag` | Đóng | Câu cửa thoát nên xoá (phát hiện nhỏ) |
| #18 `[QD-20]` | Đóng | AD-17 bước 4 |
| #19 route bị gỡ | Đóng | AD-20 |
| #20 vị trí còn trống | Đóng | `chuyen-code-cu.md` đã điền đủ |
| Tài liệu lệch | Một phần | Thiếu `maxDuration` ở `app/cms/layout.tsx` |
| #6–#8 (UX) | Một chỗ vượt ranh giới | Toast (F4). Vị trí `error.tsx` và skeleton là quyết định kỹ thuật, chấp nhận được |

## Kiểm tra mâu thuẫn chéo

- **AD-2 × AD-9:** nhất quán. Ngoại lệ được nêu ở cả hai nơi, và danh sách module mà AD-9 được import đã đóng.
- **AD-8 × poller:** không mâu thuẫn. Poller chỉ dùng `router.refresh()`, không import file server-only.
- **AD-7 `ensureStatic` × tra cứu ở page:** hợp lệ (đọc qua query có cache). Riêng phân trang bị lỗi ở F2.
- **AD-6:** `checkPostSeo` đi qua `run()`, nên không cần thêm ngoại lệ thứ tư.
