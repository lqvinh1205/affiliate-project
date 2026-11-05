# Epic 2 Context: Kho Sản phẩm và Danh mục

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Biến Sản phẩm và Danh mục thành dữ liệu dùng chung do Vinh quản lý trong CMS: tạo, sửa, ẩn Sản phẩm với Link affiliate Shopee hợp lệ, giá tham khảo có ngày cập nhật; tạo, sửa, sắp thứ tự, xoá Danh mục thay cho hai mục cố định cũ. Người đọc duyệt site theo Danh mục và Loại bài có phân trang, và mọi link Shopee đều hiện nguyên link chính chủ kèm nhãn công khai affiliate. Epic cũng dựng bộ token thiết kế và khung CMS mà mọi màn sau dùng lại. Đây là epic nghiệp vụ đầu tiên tạo `modules/` (`categories`, `products`, rồi `posts` cho phần site) — hiện chưa có thư mục này, nghiệp vụ còn ở `lib/`, `components/site|cms/`, `app/cms/actions.ts`.

## Stories

- Story 2.1: Bộ token thiết kế và khung CMS
- Story 2.2: Quản lý Danh mục trong CMS
- Story 2.3: Kho Sản phẩm — danh sách, tạo và sửa
- Story 2.4: AffiliateLink, nhãn công khai và ProductCard
- Story 2.5: Ẩn Sản phẩm
- Story 2.6: Điều hướng site theo Danh mục
- Story 2.7: Trang Danh mục và trang Loại bài có phân trang
- Story 2.8: Tải ảnh Sản phẩm từ điện thoại

## Requirements & Constraints

- **Link affiliate:** bắt buộc, chỉ nhận domain Shopee chính chủ (`shopee.vn`, `s.shopee.vn`, `shope.ee`), sai thì báo lý do tại trường. Trên website hiện nguyên link, mở tab mới, `rel="sponsored nofollow noopener"`, không qua đường chuyển hướng nội bộ (`/go/...`), không đếm click. Không tự thêm quy tắc đường dẫn: nếu link tìm kiếm Shopee của bài mẫu vẫn qua domain check thì ghi câu hỏi mở cho PRD.
- **Nhãn công khai:** bài có ≥ 1 Sản phẩm luôn hiện nhãn ở vị trí dễ thấy, không thu nhỏ/ẩn; bài không có Sản phẩm thì không render.
- **Giá:** luôn là "giá tham khảo" kèm ngày cập nhật tuyệt đối; đổi giá thì cập nhật ngày.
- **Sửa Sản phẩm** cập nhật mọi nơi đang dùng (chữ trong thân bài không tự đổi). **Ẩn Sản phẩm** một thao tác, có hoàn tác; Sản phẩm ẩn và link của nó biến mất khỏi website; CMS liệt kê Bài web đang dùng để Vinh tự xử lý.
- **Độ tươi:** sửa/ẩn Sản phẩm, sửa/xoá Danh mục thấy trên site trong ~1 phút, không deploy lại.
- **Danh mục:** dùng chung cho Bài web và Sản phẩm; enum `PostType` (`MEO_VAT`, `GOM_LINK`) giữ làm Loại bài, `/meo-vat`, `/gom-link` vẫn chạy. Không xoá được Danh mục còn Bài web/Sản phẩm; đổi đường dẫn đã công khai thì đường cũ chuyển hướng vĩnh viễn (308); đường dẫn không được trùng đường dẫn hệ thống. 8 Danh mục khởi tạo đề xuất (Vinh xác nhận trước khi đóng story).
- **SEO:** trang Danh mục có metadata riêng (meta description = mô tả Danh mục), có trong menu và sitemap; trang `/trang/n` không vào sitemap.
- **CMS ưu tiên điện thoại:** mọi luồng làm trọn trên màn 360px. Sáng/tối theo hệ thống, không nút đổi tay.
- **Upload (2.8):** ảnh từ điện thoại; video ≤ 100 MB; file > 10 MB phải nhận nguyên vẹn; Basic Auth phải được gửi khi upload trên Chrome và Safari iOS (kiểm tay, ghi `docs/kiem-chung.md`). Trước khi có 2.8 thì ảnh chỉ nhập bằng dán URL.
- Không làm cào dữ liệu Shopee; mọi trường Sản phẩm nhập tay.

## Technical Decisions

- **Module và tầng:** `categories` (T0) → `products` (T1) → `posts` (T2); chỉ import tầng thấp hơn, và chỉ `queries.ts`, `cms-queries.ts`, `types.ts`, `constants.ts`, `tags.ts`, `components/`. Query chạm bảng nhiều module đặt ở module tầng cao nhất: "Danh mục có bài đã xuất bản" và "Sản phẩm đang dùng ở bài nào" → `posts`.
- **Hợp đồng file module:** `schema.ts` (Zod), `types.ts`, `constants.ts` (nhãn, giới hạn cứng = `@db.VarChar(n)`), `tags.ts` (`<MIỀN>_TAG` = tên module), `queries.ts` (public, `"use cache"`), `cms-queries.ts` (không cache), `service.ts` (ghi DB, `import "server-only"`), `actions.ts`, `components/`. Không barrel.
- **Đường ghi:** action `run()` → `<x>InputSchema.safeParse` → `service` → `updateTag` tag của **mọi** module có dữ liệu đổi (sửa/ẩn Sản phẩm: `products` + `posts`). Lỗi người dùng là `UserError` tiếng Việt, hiện bằng Toast; lỗi validate hiện tại trường phía client bằng **cùng** schema (RHF + `zodResolver` + `field` shadcn + `Controller`). Schema ghép từ `platform/validation/fields.ts`; host ảnh chỉ khai báo ở `platform/images.ts`.
- **Đường đọc public:** trang `(site)` giữ tĩnh; không đọc `searchParams`/`headers()`/`cookies()`. Query gắn tag của mọi bảng nó đọc (trang Danh mục/Loại bài: `posts` + `categories`; có Sản phẩm thì thêm `products`). Mọi query public trả Sản phẩm (kể cả ảnh đại diện fallback) dùng `visibleProductWhere` + `publicProductSelect` từ `products/queries.ts`, không viết lại điều kiện.
- **Phân trang tĩnh:** `/[danh-muc]/trang/[n]`, `/meo-vat/trang/[n]`, `/gom-link/trang/[n]` (Loại bài là thư mục riêng, không qua `[danh-muc]`); `generateStaticParams` không bao giờ trả rỗng (giữ chỗ `n = "2"` → `notFound()`); `n = 1` → `permanentRedirect` về trang gốc; `PAGE_SIZE` ở `posts/constants.ts`.
- **Route mỏng:** `page.tsx` = metadata + `<Suspense>` + `<…Screen>`; trang site có tham số tra dữ liệu, tra lịch sử slug và gọi `notFound()`/`permanentRedirect()` **trước** `<Suspense>`. CMS Screen đọc `searchParams` trong `<Suspense>`, fallback là `<x>-skeleton.tsx`, không `loading.tsx`. Form RHF chỉ đọc `defaultValues` lúc mount.
- **Slug:** `RESERVED_ROOT_SLUGS` + `slugify` ở `platform/slug.ts`, có test so với thư mục `app/(site)`; slug Danh mục kiểm trong `categories/schema.ts`. Lịch sử đổi slug ở `CategorySlugRedirect` (chủ `categories`); không dùng `next.config` redirects hay `proxy.ts`.
- **Dữ liệu:** `Product` thuộc `products` (thêm `priceText`, `priceUpdatedAt`, Dữ liệu thô, `hidden`; chuyển dữ liệu `price` cũ sang `priceText`). Sản phẩm đang dùng chỉ ẩn, không xoá cứng. `Json` chỉ khi có Zod theo loại. Migration: `--create-only`, đọc SQL trước khi áp, tên `verb_object`, mỗi story tối đa một migration, chỉ chạy trên Postgres cục bộ.
- **Component:** hiển thị/form thực thể ở `modules/<miền>/components/` (`AffiliateLink`, `AffiliateDisclosure`, `ProductCard` ở `products`); dùng chung site+CMS hoặc form module cần (`CmsForm`, `ConfirmDialog`, `UnsavedChangesGuard`, `UploadField`) ở `components/shared/`; chỉ CMS (`CmsShell`) ở `app/cms/_components/`; chỉ site (SiteHeader, BottomTabBar, SiteFooter) ở `app/(site)/_components/`. `components/ui/` chỉ thêm bằng shadcn CLI. Client component đặt `*.client.tsx`, nhận props serialize được (`Date` → ISO). Thiếu component phù hợp → đánh dấu `[COMPONENT-UNKNOWN]` và hỏi.
- **Định dạng:** ngày/giá qua `platform/format.ts` (vi-VN, `Asia/Ho_Chi_Minh`).
- **Upload:** `app/cms/upload/route.ts` nằm ngoài matcher proxy, tự gọi `requireAdmin()` trước khi đọc body, thiếu quyền trả 401 + `WWW-Authenticate` cùng realm `proxy.ts`; gọi `platform/storage.put(file) → { url }`, module chỉ lưu `url`. Nơi lưu: đĩa cục bộ, thư mục cấu hình bằng biến môi trường (thêm vào `.env.example`), ngoài `public/` và thư mục build; story 2.8 chốt cách phục vụ file và backup, thêm host/đường dẫn ảnh vào `platform/images.ts`.
- **Test:** Vitest, file `*.test.ts` cạnh nguồn, tên test tiếng Việt; unit test bắt buộc cho `schema.ts`; test tích hợp `service.ts` trên Postgres test, gồm "ẩn Sản phẩm biến mất khỏi mọi query public". Không e2e.
- **Chuyển code cũ:** chạm file cũ thì chuyển nó về vị trí mới trong cùng thay đổi, sửa mọi import, bỏ khỏi danh sách miễn ESLint, theo `docs/cong-thuc/chuyen-code-cu.md`.

## UX & Interaction Patterns

- **Token:** một nguồn duy nhất từ frontmatter `DESIGN.md` vào theme Tailwind 4/biến shadcn (màu light + giá trị `-dark` cùng biến, Be Vietnam Pro, rounded, spacing, elevation, icon Lucide); cặp chữ/nền đạt WCAG AA; màu CTA Shopee chỉ cho AffiliateLink. `/cms/styleguide` (noindex) hiện mọi token và component ở cả hai chế độ.
- **CMS:** CmsShell — mobile có thanh trên dính (tên mục + nút menu mở Sheet trái theo thứ tự IA), ≥ 1024px sidebar cố định, nút "Xem site" mở `/` tab mới; mục chưa có màn thì không hiện. Mobile mọi Button/Input cao 44px; sắp thứ tự bằng nút lên/xuống, không kéo-thả. DataList: mobile là Card, desktop là Table; tìm/trang qua `?q`, `?trang`; nút tạo dính đáy; rỗng = một câu + nút tạo. CmsForm: nút Lưu tắt + spinner khi gửi, dính đáy mobile, dữ liệu không mất khi lỗi; lưu xong ở lại màn chi tiết. ConfirmDialog cho mọi thao tác xoá (focus mặc định "Huỷ"); **ẩn Sản phẩm không cần xác nhận** — một chạm + Toast "Hoàn tác". UnsavedChangesGuard: "Bạn có thay đổi chưa lưu. Rời trang?".
- **Site:** < 1024px có SiteHeader + BottomTabBar 5 tab (Tạp chí, Mẹo vặt, Gom link, Danh mục → CategorySheet, Đồ hay), tab khớp route kể cả `/trang/n`, không hiện trên trang bài; ≥ 1024px nav ngang, Danh mục không vừa gom vào "Thêm". CategorySheet: dòng 44px, chỉ Danh mục có bài đã xuất bản, đóng bằng vuốt/Esc/chạm nền, bẫy và trả focus. Vùng bấm ≥ 44px.
- **ProductCard:** một `<a>` duy nhất (không phần tử bấm lồng), tên truy cập "tên → giá → Xem trên Shopee, mở Shopee trong tab mới", ảnh lỗi dùng ImageFallback; *row* trong bài, *tile* cho dải Trang chủ. Microcopy giá: "Giá tham khảo ~89.000đ · cập nhật dd/mm/yyyy"; câu công khai mặc định lấy theo `EXPERIENCE.md`.
- **Trang Danh mục/Loại bài:** Breadcrumb một cấp, mô tả hoặc nhãn Loại bài, lưới PostCard, Pagination (trang đầu, cuối, ±1; một trang thì ẩn; không "tải thêm"); rỗng → "Danh mục này chưa có bài nào" + link Trang chủ.
- **UploadField:** chọn file hoặc dán URL, thanh tiến trình, huỷ được, xem trước đúng tỉ lệ; lỗi tại trường, trường khác giữ nguyên.

## Cross-Story Dependencies

- 2.1 đi trước mọi story có UI (token, CmsShell, Toast). 2.2 dựng `CmsForm`, `ConfirmDialog`, `UnsavedChangesGuard` dùng lại ở 2.3 trở đi; 2.3 cần Danh mục của 2.2.
- 2.4 cần dữ liệu giá của 2.3; 2.5 dựng `visibleProductWhere`/`publicProductSelect` mà mọi query public trả Sản phẩm phải dùng (2.4, 2.7 và Epic 3, 6).
- 2.6 cần Danh mục + thứ tự từ 2.2; 2.7 cần điều hướng của 2.6 và làm phần đổi đường dẫn + 308 cho Danh mục mà 2.2 để lại (có migration `CategorySlugRedirect`).
- Migration: 2.3 (giá, Dữ liệu thô), 2.5 (`hidden`), 2.7 (`CategorySlugRedirect`) — mỗi story một migration, không chạy song song.
- 2.8 để cuối, cần `platform/storage` (dựng trong story này); Epic 1 đã mở matcher proxy cho `/cms/upload` và ghi route upload là ngoại lệ ghi dữ liệu.
- Epic 3 (Bài web gắn nhiều Sản phẩm, trang bài, đổi slug bài) và Epic 6 (Trang bio) dựa trên `products`, `categories`, `AffiliateLink`, `ProductCard` của epic này.
