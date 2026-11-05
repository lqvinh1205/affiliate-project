# Review — Kiểm chứng thực tế (verification lens)

- Đối tượng: `ARCHITECTURE-SPINE.md` (2026-11-03), không sửa spine.
- Ngày kiểm: 2026-11-03.
- Nguồn đối chiếu: `node_modules` đã cài, `npm view` / `npm pack` (registry, 2026-11-03), tài liệu Next cài sẵn `node_modules/next/dist/docs`, `@prisma/config` d.ts, chạy thử Prisma CLI 7.10.1 trên một schema thử trong scratchpad (`validate`, `migrate diff`, `generate`), registry shadcn (`ui.shadcn.com/r/styles/base-nova/*.json`), trang releases GitHub của `@hookform/resolvers`.

## Kết luận

**Đạt có điều kiện.** Phiên bản trong bảng Stack khớp với bản đã cài và với npm. Phần lớn API Next/Prisma mà spine dựa vào đều có thật và đúng ngữ nghĩa. Còn **3 điểm sai hoặc thiếu có hậu quả khi build** (V-1 đến V-3) và **4 điểm cần ghi rõ để agent không vấp** (V-4 đến V-7).

## Phát hiện

### V-1 [CAO] `/tim-kiem` trong `(site)` mâu thuẫn với `ensureStatic = "navigation"`

Theo `ensureStatic.md` (mục `'navigation'` › Validation): `searchParams` phía server và truy vấn DB không cache **làm build thất bại, kể cả khi bọc `<Suspense>`**. Trang tìm kiếm (FR-36) chạy truy vấn theo từng request, nên không thể đọc `searchParams` và gọi `queries.ts` phía server. Ngoài ra, `/api` bị `proxy.ts` chặn (matcher `/api/:path*`), nên cũng không dùng Route Handler công khai được. Spine chưa chỉ ra đường đọc. Hai hướng hợp lệ:

- (a) Client component dùng `useSearchParams()` trong `<Suspense>` (tài liệu cho phép), rồi gọi một Server Action đọc của `posts`. Đây sẽ là một ngoại lệ "action công khai" thứ hai bên cạnh `engagement`, trái với câu "duy nhất" trong AD-6.
- (b) Đưa `tim-kiem` ra khỏi layout `(site)` (ví dụ đặt `ensureStatic = false`). Không làm được nếu route vẫn nằm dưới layout đặt `'navigation'`, vì tài liệu ghi: "A child segment cannot override a parent segment with a less-constrained `ensureStatic`."

→ Cần sửa AD-6/AD-7 hoặc cây thư mục.

### V-2 [CAO] Route động dưới `(site)` cần `generateStaticParams` trả **ít nhất 1** phần tử

Theo `ensureStatic.md` › *Dynamic route parameters* và `generate-static-params.md:57,311`: với `'navigation'`, hoặc khi bật Cache Components, trả mảng rỗng là **lỗi build**. Spine biến Danh mục thành bảng do Vinh quản lý (AD-15), nên `[danh-muc]` sẽ đọc từ DB lúc build, và DB rỗng (máy mới, DB test, lần deploy đầu) sẽ làm build hỏng. `bai-viet/[slug]` có cùng rủi ro: code hiện tại `getPublishedSlugs()` trả rỗng khi chưa có bài xuất bản. Spine không nêu ràng buộc này, cũng không có seed bắt buộc. → Cần ghi vào AD-7 hoặc AD-12: seed tối thiểu, hoặc giá trị giữ chỗ dẫn tới `notFound()`.

### V-3 [CAO] shadcn `base-nova` **không có** component `form`

`https://ui.shadcn.com/r/styles/base-nova/form.json` trả về item rỗng: không có `files`, không có `dependencies`. Bản `new-york-v4/form.json` thì có (Radix + RHF). Với base-nova, cách được hỗ trợ là component `field` (đã có trong registry base-nova) kết hợp `Controller` của react-hook-form. AD-11 bắt "component nền chỉ thêm bằng shadcn CLI", còn AD-14 bắt RHF. Agent chạy `shadcn add form` sẽ không nhận được gì và có thể tự viết `components/ui/form.tsx`, vi phạm AD-11. → Ghi rõ trong AD-14: dùng `field` + `Controller`, không dùng `form`.

### V-4 [TRUNG BÌNH] Vitest 5.1 cần `vite` (peer **bắt buộc**), và bảng Stack thiếu `vite`

`npm view vitest@5.1.0`: `peerDependencies.vite = ^6.4 || ^7 || ^8` với `optional: false`. Vitest không còn kèm vite trong `dependencies`. Bảng Stack không có `vite` (bản mới nhất hiện là 8.3.5, engines `^20.19 || >=22.12`, Node 22.14 thoả). → Thêm `vite` vào Stack.

### V-5 [TRUNG BÌNH] `import "server-only"` sẽ làm test tích hợp `service.ts` ném lỗi

Gói `server-only@0.0.1` chỉ trả file rỗng dưới điều kiện export `react-server`; điều kiện `default` thì `throw new Error(...)`. Vitest chạy Node không có điều kiện `react-server`, nên mọi test import `service.ts`, `queries.ts` hay `platform/db` (AD-8 + AD-16) sẽ lỗi ngay khi import. → Cấu hình Vitest phải alias `server-only` sang một file rỗng (hoặc mock nó). Spine nên ghi điều này cùng AD-16.

Ghi chú thêm: theo `05-server-and-client-components.md:584-604`, Next xử lý `server-only` nội bộ và việc cài gói là **tuỳ chọn**. Quyết định thêm gói không sai, chỉ là không bắt buộc.

### V-6 [THẤP] Alias `@/` trong Vitest

Hướng dẫn Next (`02-guides/testing/vitest.md`) dùng `vite-tsconfig-paths` (bản hiện tại 6.1.1). Vite 8 đã có sẵn `resolve.tsconfigPaths?: boolean` (kiểm trong `vite/dist/node/index.d.ts`). Cả hai cách đều được, nhưng spine nên chọn một để hai agent không làm khác nhau.

### V-7 [THẤP] Chuyển sang `prisma/schema/` phải sửa đường dẫn `output` của generator

Đã chạy thử: thư mục nhiều file `*.prisma` qua `defineConfig({ schema: "prisma/schema" })` chạy được với `validate`, `migrate diff --script` và `generate`. Tuy nhiên `output` của generator tính tương đối theo file chứa nó: `"../generated/prisma"` hiện tại phải đổi thành `"../../generated/prisma"`. Nếu quên, client sẽ sinh sai chỗ. Lưu ý thêm: `migrate diff` không in gì nếu config thiếu `datasource.url` (gặp khi thử). `migrate dev --create-only` chưa chạy thật vì không muốn tạo DB trên Postgres dev.

## Bảng kiểm chứng

| # | Tuyên bố trong spine | Trạng thái | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Node 22.14 | Đúng | `node -v` = v22.14.0; thoả engines của vitest 5.1 (`^22.12`) và vite 8 |
| 2 | TypeScript 5.9.3 | Đúng (đã cài) | npm latest là **7.0.2**; không nâng khi chưa kiểm plugin TS của Next |
| 3 | Next 16.4.3 | Đúng | đã cài; npm có bản vá 16.4.4 |
| 4 | React 19.3.0 | Đúng | đã cài; npm có 19.3.1 |
| 5 | Prisma / client / adapter-pg 7.10.1 | Đúng | đã cài; npm `latest` = 8.0.0-rc.29 (rc), giữ 7 là hợp lý |
| 6 | PostgreSQL 17 (docker) | Đúng | `docker-compose.yml`: `postgres:17-alpine` |
| 7 | Zod 4.6.7 | Đúng | đã cài = latest |
| 8 | Tailwind 4.3.3 | Đúng | đã cài (package.json ghi `^4`); npm có 4.3.4 |
| 9 | shadcn 4.23.0 / @base-ui/react 1.9.0, style base-nova | Đúng | đã cài = latest; `components.json` style `base-nova`; CLI có chuỗi `base-nova` |
| 10 | sanitize-html 2.18.1 | Đúng | đã cài = latest |
| 11 | react-hook-form 7.91.0, peer React 19 | Đúng | npm: peer `react ^16.8 \|\| ^17 \|\| ^18 \|\| ^19`; phát hành 2026-10-23 |
| 12 | @hookform/resolvers 7.0.1 với Zod 4 | Đúng | peer `zod ^3.25 \|\| ^4`, `react-hook-form ^7.55`; `zodResolver` từ `@hookform/resolvers/zod` có overload Zod 4 (`zod/v4/core`, zod 4.6.7 export subpath này); major 6/7 chỉ phá effect-ts/typebox (GitHub releases). Lưu ý: 7.0.1 mới phát hành 2026-11-01 |
| 13 | server-only 0.0.1 | Đúng, nhưng xem V-5 | npm; tài liệu Next vẫn khuyến nghị dùng, gói là tuỳ chọn |
| 14 | vitest 5.1.0, peer @types/node ^22 | Đúng, thiếu vite (V-4) | peer `@types/node ^22 \|\| >=24` (optional); phát hành 2026-11-02 (1 ngày tuổi) |
| 15 | openai 7.47.0 (gỡ bỏ) | Đúng | đã cài 7.47.0 |
| 16 | `ensureStatic = "navigation"` | Đúng, xem V-1, V-2 | `ensureStatic.md`; yêu cầu `cacheComponents: true` (đã bật trong `next.config.ts`) |
| 17 | `"use cache"` + `cacheLife` + `cacheTag` nhiều tag | Đúng | `cacheTag.md:97-103` (nhiều tag, tối đa 128/lần); với `'navigation'`, `cacheLife` phải có expire ≥ 5 phút, stale ≥ 30 giây, revalidate ≠ 0 (`"days"` đang dùng thoả). Spine chưa nêu ràng buộc này |
| 18 | `updateTag` chỉ trong Server Action | Đúng | `updateTag.md`: "can only be called from within Server Actions" |
| 19 | Client gọi Server Action trên trang tĩnh (lượt xem/tim) | Đúng | `07-mutating-data.md:553-555` nêu đúng ví dụ đếm lượt xem bằng `useEffect`; action được gửi tuần tự theo từng client (`server-actions.md:26-28`) |
| 20 | `requireAdmin` trong mọi action dù proxy chặn `/cms` | Đúng, cần thiết | `data-security.md:281`: action gọi được bằng POST trực tiếp từ bất kỳ route nào, nên proxy theo đường dẫn không bảo vệ action |
| 21 | `queries.ts` cấm `headers()`/`cookies()` | Đúng | `ensureStatic.md`: dữ liệu runtime làm build thất bại |
| 22 | `PageProps<"/route">` / `LayoutProps` global | Đúng | `03-layouts-and-pages.md:337,361`; code hiện tại đã dùng |
| 23 | Thư mục private `_components` | Đúng | `02-project-structure.md:257` |
| 24 | Prisma schema là thư mục nhiều file | Đúng, xem V-7 | `@prisma/config` d.ts: "path to a folder that shall be recursively searched"; chạy thử `validate`/`migrate diff`/`generate` thành công |
| 25 | CHECK phải viết SQL tay | Đúng | chạy thử `@@check(...)`: P1012 "Attribute not known" |
| 26 | `Prisma.TransactionClient` cho `Tx` | Đúng | `generated/prisma/internal/prismaNamespace.ts:969` |
| 27 | `@id @default(uuid())` | Đúng | schema hiện tại đang dùng, validate được |
| 28 | `unaccent` viết tay trong SQL | Chưa kiểm | không chạy `CREATE EXTENSION` trên DB dev; image postgres chính thức có sẵn contrib nên rủi ro thấp |
| 29 | `/tim-kiem` dưới `(site)` tĩnh | **Sai/thiếu** | V-1 |
| 30 | Route động `(site)` từ DB | **Thiếu ràng buộc** | V-2 |
| 31 | RHF + shadcn base-nova (AD-11 + AD-14) | **Sai giả định** | V-3 |
