# Epic 6 Context: Trang bio

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Người đọc từ Threads/Facebook chạm link trên hồ sơ → `/bio`: một trang ngắn có mọi Sản phẩm đang bán, nhóm và lọc theo Danh mục, mua trong vài chạm. Vinh sửa giới thiệu, câu công khai, chọn món hiện, ghim và sắp thứ tự ở `/cms/bio`. Trang chủ có dải "Gom link đồ xinh" lấy món từ Trang bio. Xong epic này UJ-1 trọn: Sản phẩm mới tự lên `/bio`. Cần Epic 2 (Kho Sản phẩm, Danh mục, ProductCard, AffiliateLink) và Epic 3 (Trang chủ).

## Stories

- Story 6.1: Trang bio public
- Story 6.2: Quản lý Trang bio trong CMS
- Story 6.3: Dải "Gom link đồ xinh" trên Trang chủ

## Requirements & Constraints

- **FR-30** `/bio`: giới thiệu ngắn, Nhãn công khai affiliate luôn hiện ở đầu trang, link về Trang chủ (link tuỳ chỉnh duy nhất), Sản phẩm đang *hiện* nhóm theo Danh mục; mỗi món ảnh, tên, giá tham khảo, nút tới Link affiliate (FR-25); lọc theo Danh mục; món ghim lên đầu.
- **FR-31** sửa giới thiệu và câu chữ nhãn (không tắt được), chọn món hiện, ghim, sắp thứ tự; Sản phẩm mới mặc định hiện; Sản phẩm ẩn (FR-5) không bao giờ hiện.
- **FR-5 / NFR-5 / QD-16** ẩn Sản phẩm → biến mất khỏi `/bio` và Trang chủ ≤ 1 phút (query gắn tag `products`, action ẩn đã `updateTag`).
- **FR-24, FR-25** Nhãn công khai + `AffiliateLink` (nguyên link, tab mới, `rel="sponsored nofollow noopener"`).
- **NFR-4** 360px; **NFR-8** `/bio` có trong sitemap, không JSON-LD (AD-26).
- Không thêm thư viện npm (Switch thêm bằng shadcn CLI, dependency `cn` đã có). Không cào dữ liệu Shopee.

## Technical Decisions

- **Module `bio` (T3, AD-3):** sở hữu `BioSettings`, `BioItem` (`prisma/schema/bio.prisma`). `BioItem` tạo lười khi Vinh chỉnh: thiếu bản ghi = hiện, không ghim; thứ tự = món ghim theo thứ tự đặt, rồi món còn lại theo `Product.createdAt` mới nhất. `products` không ghi `BioItem`; `Product` chỉ thêm trường quan hệ ngược (AD-4).
- **Đọc (AD-2, AD-7):** query đặt ở `bio` (tầng cao nhất chạm bảng), dùng `visibleProductWhere` + `publicProductSelect` của `products`; gắn tag `bio` + `products` + `categories` (trang `/bio`) và `bio` + `products` (dải Trang chủ). CMS đọc qua `bio/cms-queries.ts` trong `<Suspense>`.
- **Ghi (AD-6):** `bio/actions.ts` qua `run()` → `safeParse` → `service` → `updateTag(BIO_TAG)`.
- **Route (AD-12):** `app/(site)/bio/page.tsx` + `BioScreen`; `app/cms/bio/page.tsx` + Screen. Lọc chip phía client, không đổi URL, không đọc `searchParams` (AD-7).
- **Component (AD-11):** ProductCard *row*/*tile*, `AffiliateLink`, `AffiliateDisclosure` ở `modules/products/components/`; FilterChips là component không nghiệp vụ (UX-DR30, dùng cả `/bio` và Tìm kiếm) → `components/shared/`; Switch thêm bằng shadcn CLI.
- **Migration:** một migration ở Story 6.1 `add_bio` (Postgres cục bộ 54329).

## UX & Interaction Patterns

- **`/bio` (UX-DR66):** một cột, desktop căn giữa ≤ 560px. Thứ tự: giới thiệu + "Về trang chủ" → AffiliateDisclosure (không đóng được) → FilterChips → danh sách ProductCard *row*. Chip "Tất cả": nhóm "Nổi bật" (món ghim) rồi mỗi Danh mục một nhóm theo thứ tự hiển thị, tiêu đề `headline-sm` + số món, món ghim không lặp. Chip một Danh mục: danh sách phẳng, ghim lên đầu, giữ dấu Ghim. Rỗng: giới thiệu + nhãn + link Trang chủ + EmptyState "Sắp có đồ hay, ghé lại sau nhé". Không ô tìm, không link MXH/@handle, không "Bài mới nhất" (UX-DR99).
- **FilterChips (UX-DR30):** cao 36px, vùng bấm 44px, cách nhau `space-sm`, hàng cuộn ngang không thanh cuộn, chip chọn cuộn vào giữa; chip Danh mục kèm số món.
- **ProductCard (UX-DR20):** cả thẻ là một `<a>`; dấu Ghim là icon pin trên nền `primary-fixed`, chữ ẩn "Nổi bật".
- **`/cms/bio` (UX-DR80, UX-DR49):** ô giới thiệu, câu chữ nhãn; BioProductList mọi Sản phẩm đang hiện: ảnh 40px, tên, `Switch` "Hiện trên bio", nút Ghim (đang ghim nền `primary-fixed`), lên/xuống trong nhóm; nhóm "Đang ghim" ở trên, ngăn hairline; lưu từng thao tác ngay + Toast "Đã lưu".
- **Trang chủ (UX-DR62):** khu "Gom link đồ xinh" ngay sau Bài nổi bật: dải ProductCard *tile* cuộn ngang snap (mobile, thẻ 160px), desktop lưới 4 cột; tối đa 8 món theo thứ tự bio; dòng AffiliateDisclosure ngắn dưới tiêu đề; "Xem tất cả" → `/bio`; rỗng → ẩn khu.

## Cross-Story Dependencies

- 6.1 tạo bảng + thứ tự bio + query public; 6.2 ghi `BioSettings`/`BioItem` mà 6.1 đọc; 6.3 dùng cùng hàm thứ tự của 6.1.
- Dựa trên Epic 2: `visibleProductWhere`, `publicProductSelect`, ProductCard, AffiliateLink, AffiliateDisclosure, Danh mục có `sortOrder`. Dựa trên Epic 3: `HomeScreen`, `SectionHeading`, `EmptyState`, sitemap.
