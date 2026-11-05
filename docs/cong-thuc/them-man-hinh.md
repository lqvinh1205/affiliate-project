# Công thức: thêm hoặc sửa màn hình

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-xx), `docs/nen-tang-ky-thuat/giao-dien.md` · Kiểm lần cuối: 2026-11-05 @ 8771851

Dùng khi thêm hoặc sửa một màn hình, ở site public (`app/(site)/`) hoặc CMS (`app/cms/`). `bmad-build` nạp công thức này qua `_bmad/custom/bmad-build.toml`, và reviewer "UI & quy ước" chấm diff theo mục **Checklist** cuối file.

## Tóm tắt cho agent

- **Spine thắng docs.** Vị trí file, tên và luồng dữ liệu lấy theo spine. `docs/nen-tang-ky-thuat/*` chỉ dùng cho cách dùng thư viện (Next.js, Base UI, Tailwind); đường dẫn `lib/`, `components/site|cms/` trong đó mô tả code cũ.
- **Kiểm tra UI trước khi code.** Spec phải có đủ 5 bảng ở Bước 2, và Vinh duyệt ở CHECKPOINT 1 của `bmad-build`.
- **UI và dữ liệu phải khớp.** Mỗi trường, thao tác, trạng thái trên màn có nguồn ở query hoặc action; chỗ thiếu là `[CONTRACT-GAP]`, chặn ở CHECKPOINT 1.
- **Tái sử dụng trước, tạo mới sau.** Thiếu component nền thì để dấu `[COMPONENT-UNKNOWN]` và hỏi, không tự thêm vào `components/ui|shared` (AD-11).
- **Chạm file cũ thì chuyển file đó** về vị trí mới trong cùng thay đổi và sửa mọi import (AD-17). Không tạo file mới ở vị trí cũ.

## Đọc trước

- Spine: AD-1, AD-2, AD-3, AD-5, AD-7, AD-8, AD-11, AD-12, AD-13, AD-14, AD-17, mục **Consistency Conventions** và **Structural Seed**.
- Theo màn: có Sản phẩm/link Shopee → AD-11 (`AffiliateLink`), `[QD-13]`–`[QD-15]`; có slug → AD-20; có HTML bài → AD-22; có AI → AD-9, AD-18, AD-19; có upload → AD-24; có Lượt xem/Lượt tim → AD-23.
- Giao diện: `[GD-01]`, `[GD-11]`, `[GD-13]`, `[GD-14]`, `[GD-40]`. Màn CMS: thêm `[GD-17]`. Widget client trên trang public: thêm `[GD-18]`.
- UX: `_bmad-output/planning-artifacts/ux-designs/*/EXPERIENCE.md` và `DESIGN.md` khi `status: final`.

## Bước 1: Xác định màn hình

1. **Mặt:** site hay CMS.
2. **Module chủ:** thuộc danh sách đóng ở AD-3. Không khớp module nào → BLOCKER, hỏi ([QD-23]).
3. **Route:** lấy từ cây `app/` ở Structural Seed; tiếng Việt không dấu. Route chưa có trong cây → hỏi.
4. **Yêu cầu:** FR/NFR trong PRD và mục màn hình tương ứng trong `EXPERIENCE.md`.

## Bước 2: Kiểm tra UI (bắt buộc trong `## Code Map` của spec)

**a. Đối chiếu UI.** Liệt kê các trạng thái của màn (đang tải, rỗng, lỗi, không tìm thấy, đang gửi, thành công) và các token màu/chữ sẽ dùng. Nguồn theo thứ tự: `EXPERIENCE.md`/`DESIGN.md` (khi `final`) → `[GD-14]` + `/cms/styleguide`. Trạng thái nào không nguồn nào quy định → ghi vào Open Questions.

**b. Kiểm kê tái sử dụng.** Quét những gì đã có trước khi đề xuất component mới:

```bash
ls components/ui components/shared modules/*/components app/\(site\)/_components app/cms/_components 2>/dev/null
ls components/site components/cms lib   # code cũ, chưa di chuyển
```

Mỗi phần UI của màn là một dòng:

| Phần UI | Quyết định | Component / vị trí | Lý do |
|---|---|---|---|
| Thẻ Sản phẩm | dùng lại | `modules/products/components/product-card.tsx` | — |
| Nút lưu | dùng lại | `components/ui/button.tsx` | — |
| Bộ lọc trạng thái | tạo mới | `app/cms/san-pham/_components/status-filter.client.tsx` | chỉ màn này dùng |

Quyết định chỉ là `dùng lại`, `mở rộng qua props` hoặc `tạo mới`. Với `tạo mới`, vị trí phải theo bậc thang của AD-11: hiển thị một thực thể → `modules/<miền>/components/`; chỉ một màn → `_components/` cạnh route; chỉ CMS → `app/cms/_components/`; chỉ site → `app/(site)/_components/`; dùng cả hai mặt, không nghiệp vụ → `components/shared/`; nền → `components/ui/` (chỉ qua shadcn CLI, `[GD-16]`).

**c. Cây file dự kiến.** Mọi file sẽ tạo hoặc sửa, mỗi file một dòng: đường dẫn · vai trò theo bảng AD-5 · tên export theo Consistency Conventions (`…Screen`, `…Form`, `saveX`, `listXForCms`, `<x>InputSchema`, `*.client.tsx`).

**d. Di chuyển file cũ.** File cũ (`lib/*`, `components/site|cms/*`, `app/cms/actions.ts`) mà màn này chạm: vị trí mới (tra bảng trong `docs/cong-thuc/chuyen-code-cu.md`) và danh sách file phải sửa import (`grep -rn "<đường dẫn cũ>" app components modules platform lib`).

**e. Hợp đồng UI ↔ dữ liệu.** Mỗi thứ màn hiển thị hoặc làm là một dòng, chỉ tới đúng hàm và trường:

| Trên màn | Loại | Nguồn | Ghi chú |
|---|---|---|---|
| Tên, giá Sản phẩm | hiển thị | `listProductsForCms` → `name`, `priceText` | — |
| Nút "Ẩn" | thao tác | `setProductHidden({ id, hidden })` → `Result` | tag `products` |
| Lỗi "Link không phải Shopee" | lỗi | `UserError` trong `saveProduct` | hiện dưới trường, toast |
| Danh sách trống | trạng thái | `listProductsForCms` trả `[]` | bảng 2a |

- Action hoặc query chưa có → khai báo theo khuôn của `docs/cong-thuc/them-server-action.md`.
- Ghi `[CONTRACT-GAP]` khi: màn cần dữ liệu mà không query nào trả về được nếu không đổi schema (→ `docs/cong-thuc/doi-schema.md`); action trả lỗi hoặc trạng thái mà màn không có chỗ hiển thị; màn gửi trường mà `schema.ts` không nhận; `EXPERIENCE.md` mô tả hành vi mà PRD hoặc spine không có. Mỗi `[CONTRACT-GAP]` là một Open Question, chặn CHECKPOINT 1.

## Bước 3: Code theo thứ tự

1. `prisma/schema/<module>.prisma` + migration nếu cần (`docs/cong-thuc/doi-schema.md`, AD-4, AD-15).
2. `schema.ts`, ghép từ `platform/validation/fields.ts` (AD-14); `constants.ts` cho nhãn và giới hạn.
3. `service.ts`, rồi `actions.ts` theo đường ghi AD-6: `run()` → `safeParse` → `service` → `updateTag`.
4. `queries.ts` (public, có cache, AD-7) hoặc `cms-queries.ts` (CMS, không cache, đọc trong `<Suspense>`).
5. Component của module, rồi `_components/<x>-screen.tsx`, rồi `page.tsx` mỏng (AD-12).
6. Nối điều hướng: mục `NAV_ITEMS` của CmsShell (`app/cms/_components/cms-shell.client.tsx`, đúng thứ tự IA) hoặc nav site nếu là màn chính; `app/sitemap.ts` nếu là trang public được index.

## Bước 4: Kiểm chứng

- `docs/kiem-chung.md` §1; `npm run build` khi chạm route `(site)` hoặc cache.
- Có Vitest (sau epic nền): test cho `schema.ts` và `service.ts` mới (AD-16).
- Chạy app, xem màn ở 360px và desktop, chế độ sáng và tối, đi qua từng trạng thái của bảng 2a. Ghi những gì đã xem và chưa xem vào báo cáo.

## Checklist

Cấu trúc và vị trí

- [ ] Không có file mới trong `lib/`, `components/site/`, `components/cms/`; file cũ bị chạm đã được chuyển, mọi import đã sửa (AD-1, AD-17).
- [ ] Module thuộc danh sách AD-3; module chỉ gồm các file của bảng AD-5, đúng trách nhiệm, không `index.ts` barrel.
- [ ] Hướng import đúng AD-2: `app → modules → platform`; không import `service.ts`/`actions.ts`/`schema.ts` của module khác; `app/` không import `platform/db` hay `service.ts`.
- [ ] Component mới nằm đúng bậc AD-11, khớp bảng 2b đã duyệt; không có component mới trong `components/ui|shared` ngoài bảng.
- [ ] Tên file, route, component, hàm theo Consistency Conventions.

Route và dữ liệu

- [ ] `page.tsx` chỉ có metadata, `<Suspense>` và một `<…Screen>` (AD-12). Trang `(site)` có tham số: `page.tsx` gọi query có cache, tra lịch sử slug, gọi `notFound()`/`permanentRedirect()` **trước** `<Suspense>` rồi truyền dữ liệu cho Screen. Trang CMS: `notFound()` trong Screen.
- [ ] Đang tải là `<x>-skeleton.tsx` làm fallback Suspense, không `loading.tsx`; lỗi đi qua `error.tsx` của nhóm route (AD-12).
- [ ] Metadata, canonical, JSON-LD, sitemap đúng bảng AD-26; ngày, số đếm qua `platform/format.ts`, thời gian tương đối qua `relative-time.client.tsx` (AD-27).
- [ ] Trang `(site)`: chỉ đọc qua `queries.ts` có `"use cache"` + `cacheLife` + `cacheTag` của mọi module có dữ liệu trả về; không `searchParams`/`headers()`/`cookies()` phía server (AD-7).
- [ ] Sản phẩm cho public đi qua `visibleProductWhere` + `publicProductSelect` (AD-7).
- [ ] File server mở đầu `import "server-only"`; client component là `*.client.tsx`, chỉ nhận props serialize được, ngày là chuỗi ISO (AD-8).

Ghi dữ liệu và form

- [ ] Ghi qua `actions.ts` của module chủ: `run()` (có `requireAdmin()`) → `safeParse` → `service` → `updateTag` mọi tag bị ảnh hưởng; không thêm ngoại lệ ngoài ba ngoại lệ của AD-6.
- [ ] Lỗi cho người dùng là `UserError` tiếng Việt; query trả `null` thay vì ném lỗi nghiệp vụ (AD-13).
- [ ] Form dùng React Hook Form + `zodResolver` với cùng `schema.ts` của module, ghép bằng `field` + `Controller`; form một trường được dùng `useTransition` + `Result` (AD-14).

Giao diện

- [ ] Mọi mục trong `[GD-40]`.
- [ ] Mọi trạng thái ở bảng 2a đều có giao diện.
- [ ] Code khớp bảng 2e: mọi trường hiển thị lấy từ đúng query đã khai báo; mọi lỗi và trạng thái action trả về đều có chỗ hiện; không còn `[CONTRACT-GAP]` chưa giải quyết.
- [ ] Link Shopee chỉ render qua `AffiliateLink`; có `AffiliateDisclosure` nơi có Sản phẩm (AD-11, `[QD-15]`).
- [ ] Xem trước trong CMS dùng đúng component render của trang public (AD-11).

Quy định

- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
