# Công thức: bỏ một chức năng

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-4, AD-7, AD-9, AD-17, AD-19, AD-20), `docs/quy-dinh.md` · Kiểm lần cuối: 2026-11-04

Dùng khi gỡ một màn hình, một tính năng, một loại Gợi ý AI hoặc cả một module. `bmad-build` nạp công thức này; reviewer chấm diff theo mục **Checklist**.

## Tóm tắt cho agent

- **Xác nhận trước, gỡ sau.** Chức năng còn trong PRD hoặc spine → đây là đổi yêu cầu: chạy `bmad-correct-course` trước khi đụng code.
- **Kiểm kê đủ trước khi xoá.** Spec có bảng kiểm kê (Bước 2), Vinh duyệt ở CHECKPOINT 1.
- **URL công khai đã chia sẻ không tự cho chết.** 301 hay 404 do Vinh quyết.
- **Xoá bảng/cột là "phá dữ liệu"** → đi đường BLOCKER của `docs/cong-thuc/doi-schema.md`.
- **Chỉ xoá phần mồ côi do chính việc gỡ tạo ra** ([QD-24]); mồ côi có sẵn thì ghi vào báo cáo.

## Đọc trước

- Spine: AD-2, AD-3, AD-4, AD-6, AD-7, AD-9, AD-17, AD-19, AD-20, **Structural Seed**, **Capability → Architecture Map**.
- `docs/cong-thuc/doi-schema.md` (khi chạm DB), `docs/cong-thuc/chuyen-code-cu.md` (khi chạm file cũ).
- Quy định: `[QD-06]`, `[QD-07]`, `[QD-22]`, `[QD-23]`, `[QD-24]`.

## Bước 1: Xác nhận phạm vi

1. Tìm chức năng trong PRD (FR/NFR) và spine (AD, Capability Map, Chủ sở hữu bảng).
2. Còn được PRD/spine yêu cầu → dừng, đề xuất `bmad-correct-course` cho Vinh. Không gỡ code khi tài liệu nguồn chưa đổi ([QD-22]).
3. Gỡ cả module → phải sửa danh sách module của AD-3 và bảng Chủ sở hữu bảng trong spine trước.
4. Ghi vào spec: chức năng nào bị gỡ, phần nào **giữ lại** (dữ liệu, URL, component dùng chung).

## Bước 2: Kiểm kê (bắt buộc trong spec)

Quét theo tên route, module, model, action, prompt của chức năng:

```bash
grep -rn "<tên>" app modules platform components lib prisma proxy.ts next.config.ts
grep -rn "<tên>" docs _bmad-output/planning-artifacts AGENTS.md
grep -n "<BIẾN>" .env.example
```

Mỗi hạng mục một dòng; không có thì ghi "không có":

| Hạng mục | Chỗ tìm | Quyết định |
|---|---|---|
| Route và `_components/` | `app/(site)/…`, `app/cms/…` | xoá |
| File module | `modules/<m>/*` (bảng AD-5) | xoá / giữ |
| Action | `actions.ts` của module; `app/cms/actions.ts` (code cũ) | xoá |
| Query | `queries.ts`, `cms-queries.ts`; query module khác gọi tới (AD-2) | xoá / sửa |
| Prompt AI | `modules/<m>/prompts/*.prompt.ts`; `lib/ai.ts` (code cũ) | xoá |
| `kind` của Gợi ý AI | enum `kind` của `Suggestion`, bảng đích AD-19 | xem Bước 4 |
| Điều hướng | bottom nav CMS, nav site, footer | gỡ mục |
| Sitemap, robots | `app/sitemap.ts`, `app/robots.ts` | gỡ URL |
| Slug dành riêng | `RESERVED_ROOT_SLUGS` trong `platform/slug.ts` (AD-20) | gỡ khi xoá thư mục gốc `app/(site)` |
| Cache tag | `tags.ts`, mọi `cacheTag`/`updateTag` dùng tag đó | gỡ |
| Biến môi trường | `.env.example` | gỡ khi không còn ai đọc |
| Bảng/cột/enum | `prisma/schema/<m>.prisma` | xem Bước 4 |
| Seed, test | `prisma/seed.ts`, `*.test.ts` | gỡ phần tương ứng |
| Tài liệu | `docs/`, spine, PRD | sửa ở Bước 6 |

## Bước 3: URL công khai

1. Liệt kê URL công khai bị gỡ (trang bài, Danh mục, trang bio…) và xem có trong `sitemap.xml` hoặc đã chia sẻ chưa.
2. URL đã công khai → hỏi Vinh: **301** về trang nào, hay để **404**. Không tự chọn ([QD-23]).
3. Chọn 301 do đổi slug Bài web/Danh mục → bảng lịch sử slug của module chủ (AD-20). Gỡ cả một route public: giữ thư mục route với `page.tsx` chỉ gọi `permanentRedirect(<đích mới>)` ở cấp page (HTTP 308), hoặc xoá để trả 404 — hỏi Vinh chọn cái nào cho route đó (AD-20).

## Bước 4: Dữ liệu

1. Xoá bảng, cột hoặc giá trị enum (gồm `kind` của `Suggestion`) là **phá dữ liệu**: làm theo `doi-schema.md` Bước 2c–2d, BLOCKER, hỏi Vinh, ghi cách xử lý production ([QD-07]).
2. Vinh muốn giữ dữ liệu nhưng gỡ giao diện → chỉ gỡ code, giữ schema; ghi vào spec.
3. Bản ghi `Suggestion` đang `GENERATING`/`PENDING` của `kind` bị gỡ: cách xử lý ghi trong spec, hỏi Vinh (AD-18, AD-19).

## Bước 5: Gỡ code

1. Gỡ từ ngoài vào trong: điều hướng, sitemap → route → action → service, query → prompt → component → schema.ts, constants, tags → model.
2. Mỗi file còn lại bị chạm mà nằm ở vị trí cũ → chuyển theo `chuyen-code-cu.md` (AD-17).
3. Sau mỗi lớp, chạy `npx tsc --noEmit` để thấy import gãy; sửa import, không để lại re-export tạm.
4. Xoá import, hàm, kiểu, component, biến môi trường **chỉ khi việc gỡ làm chúng mồ côi** ([QD-24]). Kiểm bằng `grep -rn "<ký hiệu>" app modules platform components lib`.
5. Không xoá component dùng chung (`components/ui|shared`, `modules/*/components`) khi còn nơi khác dùng.

## Bước 6: Tài liệu

1. Sửa mọi chỗ trong `docs/` nhắc tới chức năng (kết quả grep Bước 2); mục bị bỏ có ID thì ghi "(đã bỏ)", không đánh số lại (`docs/chuan-tai-lieu.md` §3).
2. Spine, PRD đã được sửa ở Bước 1 qua `bmad-correct-course`; kiểm lại Capability Map và AD-3 khớp với code sau khi gỡ.

## Kiểm chứng

- `docs/kiem-chung.md` §1; `npm run build` (gỡ route, sitemap hoặc cache luôn chạm build).
- Chạm DB: Bước 4 của `doi-schema.md` (`migrate reset` + `db:seed` cục bộ).
- Mở app: điều hướng không còn link chết; URL đã gỡ trả 301/404 đúng quyết định; trang còn lại vẫn chạy.

## Checklist

- [ ] Chức năng đã được gỡ khỏi PRD/spine qua `bmad-correct-course` trước khi gỡ code ([QD-22]); gỡ module thì AD-3 đã sửa.
- [ ] Spec có bảng kiểm kê đủ hạng mục; mọi dòng đã xử lý hoặc ghi "không có".
- [ ] URL công khai bị gỡ có quyết định 301/404 của Vinh; 301 đổi slug theo AD-20.
- [ ] Bảng/cột/enum bị xoá đi đường "phá dữ liệu" của `doi-schema.md`, đã được Vinh duyệt ([QD-07], [QD-23]).
- [ ] Không còn link điều hướng, URL sitemap, cache tag, biến `.env.example`, `RESERVED_ROOT_SLUGS` trỏ tới chức năng đã gỡ ([QD-06], AD-7, AD-20).
- [ ] Chỉ xoá mồ côi do việc gỡ tạo ra; mồ côi có sẵn được ghi vào báo cáo ([QD-24]).
- [ ] File cũ bị chạm đã chuyển vị trí, mọi import đã sửa (AD-17).
- [ ] `docs/` không còn nhắc chức năng đã gỡ như đang có.
- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
