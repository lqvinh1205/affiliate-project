# Công thức: thêm hoặc sửa Server Action và query

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-xx), `docs/quy-dinh.md`, `docs/nen-tang-ky-thuat/nextjs-16.md`, `docs/nen-tang-ky-thuat/kiem-tra-va-bao-mat.md` · Kiểm lần cuối: 2026-11-05 @ 8771851

Công thức theo spine; code hiện tại chưa theo, xem `docs/cong-thuc/chuyen-code-cu.md`.

Dùng khi thêm hoặc sửa một thao tác ghi (Server Action) hoặc một hàm đọc (`queries.ts`, `cms-queries.ts`). Action gọi AI: làm thêm `docs/cong-thuc/them-tinh-nang-ai.md`. Reviewer chấm diff theo mục **Checklist**.

## Tóm tắt cho agent

- **Spine thắng docs.** `docs/nen-tang-ky-thuat/*` đã theo cấu trúc mới; chỗ nào nhắc `lib/`, `components/site|cms/`, `app/cms/actions.ts` thì đó là code cũ chờ chuyển, ghi rõ tại chỗ.
- **Một đường ghi:** `actions.ts` của module chủ: `run()` → `<x>InputSchema.safeParse` → `service` → `updateTag` (AD-6). Chỉ ba ngoại lệ có tên của AD-6; không thêm ngoại lệ.
- **Ghi bảng nào thì module chủ bảng đó ghi** (AD-4). Action chỉ gọi `service.ts` của chính module; riêng `modules/suggestions/actions.ts` được gọi `service.ts` của `posts`, `products`, `content-sets`, `research` (AD-2, AD-9).
- **Lỗi cho người dùng là `UserError` tiếng Việt**, action trả `Result<T>`; query trả `null`, không ném lỗi nghiệp vụ (AD-13).
- **Mỗi action và query mới phải có khối khai báo** trong `## Code Map` của spec trước khi code.

## Đọc trước

- Spine: AD-2, AD-4, AD-5, AD-6, AD-7, AD-8, AD-9, AD-13, AD-14, AD-15, AD-16, AD-22, AD-23; mục **Consistency Conventions**, bảng *Chủ sở hữu bảng* ở **Structural Seed**.
- Quy định: `[QD-12]`, `[QD-20]`, `[QD-21]`. Thư viện: `[NX-04]`, `[NX-05]`, `[NX-06]`, `[NX-08]`, `[NX-55]`, `[NX-65]`, `[BM-11]`, `[PR-11]`, `[PR-28]`.

## Bước 1: Khuôn khai báo action (bắt buộc trong `## Code Map`)

Mỗi action mới hoặc bị sửa có một khối:

```text
Action: <động từ + thực thể, ví dụ saveProduct>
- Module chủ: <thuộc AD-3>          - File: modules/<miền>/actions.ts
- Loại: CMS | ngoại lệ AD-6 số 1 (engagement) | số 2 (posts.searchPosts)
- Input: <x>InputSchema trong modules/<miền>/schema.ts — trường: <tên: kiểu từ fields.ts>
- Output: Result<T>, T = <kiểu serialize được, ngày là chuỗi ISO>
- Quyền: run() → requireAdmin() | lý do ngoại lệ (AD-6) + giới hạn tần suất (AD-23)
- Service gọi tới: <miền>/service.ts → <hàm …Record / set…>
- Bảng ghi: <bảng> — chủ là <module> (AD-4, phải là module chủ)
- updateTag: <MIỀN>_TAG của mọi module có dữ liệu đổi | không (chỉ ngoại lệ số 1)
- UserError có thể trả: "<thông báo tiếng Việt>", …
- Gọi từ: <màn hình / component *.client.tsx>
```

Ngoại lệ số 3 (`app/cms/upload/route.ts`) là Route Handler, không phải action; xem AD-24.

Mỗi query mới có một khối ngắn:

```text
Query: get… (queries.ts, public) | list…ForCms / get…ForCms (cms-queries.ts)
- Module: <miền>                     - Trả về: <kiểu trong types.ts> | null khi không có
- Cache (chỉ queries.ts): "use cache" + cacheLife(<profile>) + cacheTag(<tag mọi module có dữ liệu trả về>)
- Lọc Sản phẩm (nếu có): visibleProductWhere + publicProductSelect
- Gọi từ: <…-screen.tsx>
```

## Bước 2: Xác định chỗ đặt

1. Bảng bị ghi → module chủ theo bảng *Chủ sở hữu bảng*. Ghi nhiều bảng của nhiều module → chỉ hợp lệ khi điều phối từ `suggestions` (AD-9); trường hợp khác là BLOCKER, hỏi (`[QD-23]`).
2. Action đang nằm ở `app/cms/actions.ts`: chuyển về `modules/<miền>/actions.ts` trong cùng thay đổi, sửa mọi import (AD-17), theo bảng trong `docs/cong-thuc/chuyen-code-cu.md`. Chỉ chuyển action bị chạm cùng hàm phụ của nó; `app/cms/actions.ts` xoá khi rỗng (AD-17).

## Bước 3: Code theo thứ tự

1. **`schema.ts`:** `<x>InputSchema` ghép từ `platform/validation/fields.ts` (hiện có `optionalText`, `imageUrl`, `shopeeAffiliateUrl`; `requiredText`, `slugField` là đích theo AD-14, chưa có — story cần thì thêm vào đó kèm test); giới hạn cứng lấy từ `constants.ts`, bằng `@db.VarChar(n)` (AD-14, AD-25). Form CMS dùng **cùng** schema này với React Hook Form + `zodResolver`.
2. **`service.ts`:** `import "server-only"`; nhận input đã validate và `tx` tuỳ chọn; chỉ ghi bảng của module mình (AD-4, AD-5, AD-8). Không `"use server"`, `updateTag`, `requireAdmin`, validate.
   - HTML thân Bài web → `sanitizePostHtml` của `platform/html` trước khi ghi (AD-22, `[QD-12]`).
   - Nhiều lệnh ghi phải cùng thành bại → một transaction; chỉ đặt lệnh DB trong callback, không gọi AI hay việc chậm (AD-10, `[PR-11]`, `[PR-28]`).
   - Vi phạm nghiệp vụ → `throw new UserError("<tiếng Việt>")` (AD-13).
3. **`actions.ts`:** `"use server"`; mỗi action bọc trong `run()` → `safeParse` → `service` → `updateTag` của mọi module có dữ liệu đổi, trước `return`/`redirect` (AD-6, AD-7). Không gọi Prisma trực tiếp (AD-5). Trả giá trị nhỏ, serialize được (`[NX-65]`).
   - Ngoại lệ số 1 (`engagement`): không `requireAdmin`, có validate và giới hạn tần suất, không `updateTag`, không lưu định danh người đọc (AD-23, `[QD-18]`).
   - Ngoại lệ số 2 (`posts.searchPosts`): chỉ đọc, validate, giới hạn tần suất, chỉ trả Bài web đã xuất bản.
4. **Query (nếu có):** `queries.ts` đọc dữ liệu xuất bản/đang hiện, có `"use cache"` + `cacheLife` (stale ≥ 30 giây, revalidate > 0, expire ≥ 5 phút) + `cacheTag`; không `headers()`, `cookies()`, `requireAdmin` (AD-7, `[NX-04]`, `[NX-05]`). `cms-queries.ts` không cache, đọc trong `<Suspense>`. Cả hai mở đầu `import "server-only"`, kiểu trả về khai trong `types.ts`, không có kết quả thì trả `null` (AD-13).
5. **Test** (sau epic nền, AD-16): `schema.test.ts` cho schema mới (trường hợp hợp lệ, thiếu, quá dài, sai domain); `service.test.ts` tích hợp trên Postgres test cục bộ. Đặt cạnh file nguồn, tên test tiếng Việt, không gọi AI thật.

## Kiểm chứng

- `docs/kiem-chung.md` §1 và §3 dòng "Server Action", "Ghi dữ liệu hiển thị public".
- Gọi action khi chưa đăng nhập → bị từ chối; input sai → `UserError` tiếng Việt; sau khi ghi, trang public đổi mà không build lại. Chạm `queries.ts` → `npm run build`.
- Có Vitest: `npx vitest run <file>` cho test mới.

## Checklist

Khai báo và vị trí

- [ ] Mỗi action/query mới hoặc bị sửa có khối khai báo đủ trường trong Code Map, khớp code.
- [ ] Action nằm trong `actions.ts` của module chủ bảng bị ghi; không file mới ở `app/cms/actions.ts` hay `lib/` (AD-1, AD-4, AD-17).
- [ ] Tên theo Consistency Conventions: action động từ + thực thể, service `…Record`/`set…`, query `get…`/`list…ForCms`/`get…ForCms`, schema `<x>InputSchema`, tag `<MIỀN>_TAG`.
- [ ] Không import `service.ts`/`actions.ts`/`schema.ts`/`prompts/` của module khác, trừ `suggestions` gọi `service.ts` của `posts`, `products`, `content-sets`, `research` (AD-2, AD-9).

Đường ghi

- [ ] Action CMS: `run()` (có `requireAdmin()`) → `safeParse` → `service` → `updateTag` (AD-6, `[QD-20]`).
- [ ] Không có action công khai nào ngoài ngoại lệ số 1, số 2 của AD-6; ngoại lệ có validate và giới hạn tần suất (AD-6, AD-23).
- [ ] `updateTag` gắn tag của **mọi** module có dữ liệu đổi; không gọi ngoài Server Action, không gọi mỗi lượt xem/tim (AD-7, `[NX-55]`, `[NX-56]`).
- [ ] `service.ts` không có `"use server"`, `updateTag`, `requireAdmin`, validate; `actions.ts` không gọi Prisma (AD-5).
- [ ] Transaction chỉ chứa lệnh DB, không gọi AI (AD-10, `[PR-28]`).
- [ ] HTML thân bài đi qua `sanitizePostHtml` khi ghi (AD-22).

Kiểu và lỗi

- [ ] Input ghép từ `platform/validation/fields.ts`; giới hạn lấy từ `constants.ts`, khớp `@db.VarChar` (AD-14, AD-25).
- [ ] Action trả `Result<T>` serialize được; lỗi cho người dùng là `UserError` tiếng Việt; query trả `null` (AD-13).
- [ ] `service.ts`, `queries.ts`, `cms-queries.ts` mở đầu `import "server-only"` (AD-8).

Đọc

- [ ] `queries.ts` có `"use cache"` + `cacheLife` đủ ngưỡng + `cacheTag` mọi module trả về; Sản phẩm qua `visibleProductWhere` + `publicProductSelect` (AD-7).
- [ ] `cms-queries.ts` không `"use cache"` (AD-5).

Test và quy định

- [ ] Có Vitest: test cho `schema.ts` và `service.ts` mới, cạnh file nguồn, tên tiếng Việt (AD-16).
- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
