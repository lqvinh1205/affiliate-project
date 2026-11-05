# Kiểm chứng kỹ thuật — spine cập nhật 2026-11-04

Phạm vi: AD-9, AD-11, AD-12, AD-14, AD-17, AD-18, AD-20, AD-26, AD-27 của `ARCHITECTURE-SPINE.md`.
Phiên bản cài đặt: `next` 16.4.3, `react` 19.3.0, `prisma`/`@prisma/client` 7.10.1, `shadcn` 4.23.0 (`@shadcn/registry` 0.2.1). `next.config.ts` bật `cacheComponents: true`, `partialPrefetching: true`; `app/(site)/layout.tsx:46` đặt `ensureStatic = "navigation"`.
Cách kiểm: đọc docs trong `node_modules/next/dist/docs/`, mã nguồn đã build của Next/shadcn, registry shadcn (web). **Chưa chạy `next build`/`next start`** — mọi kết luận về mã HTTP là theo docs, chưa đo thực tế.

**Kết luận chung:** 6/7 điểm đúng theo docs; **điểm 5 (alias shadcn) sai** và phải sửa trước khi làm epic nền. Điểm 4 đúng về hành vi nhưng lý do ghi trong spine chưa chính xác.

## 1. `notFound()` trong / trước `<Suspense>` — ĐÚNG (theo docs)

- `not-found.md:193` — gọi sau khi stream từ `<Suspense>` thì "keeps its `200` status", thêm `noindex`.
- `not-found.md:195` — gọi trước khi stream trả `404`; "A page that reaches `notFound()` during prerendering can remain ○ Static and serve a `404`".
- `loading.md:101-120` — body bắt đầu stream khi một Suspense fallback render; gọi `notFound()` trước thời điểm đó giữ mã 404.
- `ensureStatic.md:76,99-105` — với `'navigation'`, route động phải có `generateStaticParams()` trả ít nhất một bộ tham số (không có thì build lỗi); URL chưa prerender thì request đầu **chờ trang tĩnh hoàn chỉnh**, không stream shell (`incremental-static-regeneration-cache-components.md:209-211`). Dù bật `partialPrefetching` (vốn phục vụ App Shell, dòng 197-207), `'navigation'` vẫn buộc chờ, nên `notFound()` ở `page.tsx` vẫn trả 404.
- Lưu ý: `app/layout.tsx` và `app/(site)/layout.tsx` hiện không bọc `children` trong `<Suspense>`; nếu sau này thêm thì `notFound()` ở `page.tsx` sẽ nằm trong Suspense và trả 200. Nên ghi thêm điều này vào AD-12.
- Đề xuất: AD-17 bước 1 kiểm thêm `curl -I` trên slug không tồn tại và slug cũ (mong đợi 404/308) sau `npm run build && npm start`.

## 2. `permanentRedirect` — ĐÚNG

- `permanentRedirect.md:11` — mã 308; trong ngữ cảnh streaming thì chèn thẻ meta để chuyển hướng phía client; trong Server Action có form progressive enhancement thì trả 303.
- `redirect.md:204-215` — giải thích vì sao dùng 307/308 thay 302/301. Ghi chú "301 nghĩa là chuyển hướng vĩnh viễn" ở AD-20 (dòng 217) là hợp lý.
- Docs không nói rõ `permanentRedirect()` gặp trong lúc prerender có giữ được 308 khi phục vụ bản tĩnh hay không (khác với `notFound`, có câu ở `not-found.md:195`). → Kiểm bằng `curl -I` ở AD-17 bước 1.

## 3. `router.refresh()` để hỏi lại trạng thái — ĐÚNG

- `use-router.md:46` — gửi request mới lên server, lấy lại dữ liệu, render lại Server Component; giữ nguyên state phía client; **không** làm mất hiệu lực cache phía server.
- `use-router.md:56` — nếu dữ liệu có cache thì `refresh()` có thể trả lại kết quả cũ. Vì vậy `cms-queries` của `suggestions` **không được** dùng `"use cache"`. AD-18 (dòng 195) đã ghi "CMS, không cache", khớp.
- Docs không có ví dụ polling, nhưng không có gì cấm gọi `router.refresh()` theo `setInterval` từ client component. CMS không đặt `ensureStatic` (`app/cms/layout.tsx`).

## 4. `updateTag` / `revalidateTag` / `after()` — ĐÚNG, lý do chưa chính xác

- `updateTag.md:6,12` — chỉ dùng trong Server Action; `updateTag.md:121-133` có ví dụ lỗi khi gọi trong Route Handler.
- `revalidateTag.md:35` — chữ ký `revalidateTag(tag: string, profile: string | { expire?: number })`; `"max"` là giá trị được khuyên dùng (`:23`); dạng một tham số đã bị deprecated (`:61`). `revalidateTag(tag, "max")` hợp lệ.
- `after()` trong Server Action: mã nguồn `node_modules/next/dist/server/web/spec-extension/revalidate.js:55-61` — `updateTag` chỉ ném lỗi khi không có `workStore` hoặc trang là `/route`. `dist/server/after/after-context.js:37-40,133` — callback `after` chạy với `phase = 'after'` trong `withExecuteRevalidates(workStore)`. Vậy gọi `updateTag` trong `after()` của một action **không ném lỗi**, nhưng response đã gửi rồi nên mất tác dụng read-your-own-writes; docs không nói gì về trường hợp này (chưa kiểm chứng được).
- Đề xuất sửa câu cuối AD-18: "Nếu `after()` buộc phải làm mới cache thì dùng `revalidateTag(tag, "max")`: lúc đó response đã gửi, nên `updateTag` không còn tác dụng read-your-own-writes."
- `after.md:48-50` — `after` chạy trong giới hạn `maxDuration` của route, khớp với điều kiện "`maxDuration` ≥ 90" (hiện `app/cms/layout.tsx:11` đặt 60, cần nâng lên).

## 5. Alias `components.json` — SAI

- Registry `https://ui.shadcn.com/r/styles/base-nova/utils.json`: file `registry/base-nova/lib/utils.ts`, kiểu `registry:lib`, **không có** `target`.
- `node_modules/@shadcn/registry/dist/chunk-72U3XV6C.js` (hàm `m`/`v`/`u`): file `registry:lib` được ghi vào `resolvedPaths.lib` + phần đường dẫn sau đoạn `lib` → `utils.ts`. Với `lib: "@/components/ui/lib"`, `cn` sẽ bị ghi ra `components/ui/lib/utils.ts`.
- `chunk-LZTMLCKN.js` (bảng alias, `canonical:"@/lib/utils"` → `aliases.utils`): import trong component sinh ra được viết lại thành `@/components/ui/utils`. Kết quả: import trỏ tới một file không tồn tại, hoặc có hai bản `cn`.
- Quy ước của CLI là `utils = ${lib}/utils` (`shadcn/dist/index.js`, hàm `$t`; `@shadcn/registry/dist/chunk-BNK6BOPU.js`, hàm `Cs`).
- Đề xuất sửa AD-17 bước 2: "`lib` → `@/components/ui/lib`, `utils` → `@/components/ui/lib/utils` (nơi đặt `cn`; CLI ghi file `registry:lib` vào alias `lib`), `hooks` → `@/components/shared/hooks`." Alias `hooks` thì đúng (file `registry:hook` → `resolvedPaths.hooks`).

## 6. CMS đọc `searchParams` trong `<Suspense>` — ĐÚNG

- `01-getting-started/08-caching.md:158-180` — `searchParams` là runtime API; component đọc nó phải nằm trong `<Suspense>`.
- `ensureStatic.md:89` chỉ cấm `searchParams` phía server dưới `'navigation'`; CMS không đặt `ensureStatic`.
- Điều kiện: `page.tsx` truyền promise `searchParams` cho Screen, **không** `await` nó ở ngoài Suspense. AD-12 (dòng 152) khớp với điều kiện này.

## 7. Prisma `Json?` cho `sources` / `skipped` — ĐÚNG

- `prisma/schema.prisma:7` dùng `provider = "postgresql"` (cột `jsonb`). Client đã sinh có `DbNull`, `JsonNull`, `AnyNull` (`generated/prisma/internal/prismaNamespace.ts:105-130`).
- Lưu ý khi cài đặt: muốn ghi giá trị rỗng vào cột `Json?` thì dùng `Prisma.DbNull`, không dùng `null` thuần. Khớp với AD-15 (parse bằng Zod, không truy vấn bên trong).

## Ngoài phạm vi, nên biết

- AD-14 dùng React Hook Form + `zodResolver`, nhưng `package.json` chưa có `react-hook-form` và `@hookform/resolvers`. Thêm vào là dependency mới, theo [QD-04] phải hỏi trước. Câu "base-nova không có `form`" chưa kiểm chứng được.
