# Kiểm chứng kỹ thuật — phần spine sửa theo UX (2026-11-04)

Phạm vi: AD-7, AD-12, AD-18, AD-24 và cấu trúc route `(site)` trong `ARCHITECTURE-SPINE.md`. Nguồn: tài liệu Next 16.4.3 trong `node_modules/next/dist/docs/` (viết tắt `D/` = `node_modules/next/dist/docs/01-app/`), mã nguồn `node_modules/next/dist/`, và code repo. Matcher và thứ tự route được chạy thử bằng chính hàm của Next (`getMiddlewareMatchers`, `getSortedRoutes`), không suy từ trí nhớ.

**Kết luận:** Cả 6 điểm đều đúng về hướng. Có một chỗ cần sửa (matcher phải liệt kê `/cms` riêng) và một điểm chưa xác minh được bằng nguồn trong repo (trình duyệt có gửi lại header Basic Auth cho `/cms/upload` không). Có vài lưu ý bổ sung nên ghi vào spine.

| # | Điểm | Verdict |
|---|------|---------|
| 1a | Proxy đệm body tối đa 10 MB và cắt phần thừa | ĐÚNG |
| 1b | Matcher loại trừ đúng `/cms/upload` | ĐÚNG, nhưng spine chưa ghi matcher; ghi sai dễ làm hở `/cms` (xem đề xuất) |
| 1c | Route Handler có giới hạn body riêng không | ĐÚNG (không có giới hạn của Next) |
| 1d | Trình duyệt gửi `Authorization` cho fetch tới `/cms/upload` | CHƯA XÁC MINH ĐƯỢC (có bằng chứng gián tiếp mạnh) |
| 2 | Chỉ `app/not-found.tsx` gốc bắt URL không khớp; không cần `global-not-found` | ĐÚNG (kèm lưu ý) |
| 3 | `new Date()` trong `"use cache"`; `cacheLife` revalidate ≤ 60 s với `ensureStatic` | ĐÚNG (kèm lưu ý) |
| 4 | Screen CMS đọc `searchParams` trong `<Suspense>`; client đẩy trạng thái lên URL | ĐÚNG |
| 5 | Chạy song song trong `after()`; `maxDuration` có áp cho `after` | ĐÚNG (kèm lưu ý về self-host) |
| 6 | `meo-vat/trang/[n]` cạnh `[danh-muc]/trang/[n]` | ĐÚNG |

---

## 1. AD-24 — Upload qua Route Handler ngoài proxy

### 1a. Proxy đệm body 10 MB, cắt phần thừa: ĐÚNG

- `D/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.md:14-16`: khi có proxy, Next clone body và đệm trong bộ nhớ, mặc định **10MB**; vượt quá thì "the body will only be buffered up to the limit".
- `…/proxyClientMaxBodySize.md:78-83`: chỉ đệm N byte đầu, log cảnh báo, request vẫn chạy bình thường nhưng chỉ có body cụt, **không** trả lỗi cho client. Route Handler sẽ nhận file hỏng mà không biết.
- Mã nguồn khớp: `node_modules/next/dist/server/body-streams.js:30` (`DEFAULT_BODY_CLONE_SIZE_LIMIT = 10 * 1024 * 1024`), `:93-105` (vượt giới hạn thì `push(null)` cho cả hai nhánh).
- Loại khỏi matcher là đủ để tránh việc này. Wrapper clone được gắn cho mọi request (`server/lib/router-utils/resolve-routes.js:125-126`), nhưng `cloneBodyStream()` (chỗ thực sự đệm và cắt) chỉ được gọi khi proxy chạy (`server/next-server.js:1195,1224`). Proxy chỉ chạy khi matcher khớp (`resolve-routes.js:342-351`).

### 1b. Matcher loại trừ `/cms/upload`: ĐÚNG, cần ghi cú pháp cụ thể

Tài liệu cho phép regex và negative lookahead trong matcher: `D/03-api-reference/03-file-conventions/proxy.md:88-99` (ví dụ `'/((?!api|_next/static|…).*)'`), `:126-130` (source bắt đầu bằng `/`, được dùng regex trong ngoặc, khớp từ đầu path), `:634-650` (mục Negative matching). Matcher phải là hằng số (`proxy.md:136`).

Kết quả chạy thử bằng `getMiddlewareMatchers` của Next (`node_modules/next/dist/build/analysis/get-page-static-info.js:349`):

| Path | `["/cms/:path*", …]` (hiện tại) | `["/cms/((?!upload$).*)", …]` | **Đề xuất** `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]` |
|---|---|---|---|
| `/cms` | chặn | **KHÔNG chặn** | chặn |
| `/cms/` | chặn | chặn | chặn |
| `/cms/upload` | chặn | bỏ qua | **bỏ qua** |
| `/cms/uploads`, `/cms/upload/x` | chặn | chặn | chặn |
| `/cms/posts`, `/cms/posts/1/edit` | chặn | chặn | chặn |
| `/cms.rsc`, `/cms/posts.rsc` | chặn | `/cms.rsc` **không chặn** | chặn |
| `/api`, `/api/x` | chặn | chặn | chặn |
| `/`, `/bai-viet/a` | bỏ qua | bỏ qua | bỏ qua |

**Lưu ý quan trọng:** nếu chỉ thay `/cms/:path*` bằng `/cms/((?!upload$).*)` thì trang `/cms` (và payload `/cms.rsc`) **mất bảo vệ**. Regex sinh ra yêu cầu bắt buộc có `/` sau `cms`. Vì vậy phải có thêm phần tử `"/cms"` riêng.

Đề xuất ghi vào AD-24:

```ts
export const config = {
  matcher: ["/cms", "/cms/((?!upload$).*)", "/api/:path*"],
};
```

Ghi chú thêm:
- Dùng `upload$` thay cho `upload(?:/|$)`. Biến thể sau cũng loại cả `/cms/upload/x`, nghĩa là mọi route con tương lai dưới `/cms/upload/…` sẽ âm thầm nằm ngoài proxy.
- `/cms/upload/` (có `/` ở cuối) vẫn bị proxy chặn. Với `trailingSlash: false` thì Next chuyển hướng về `/cms/upload`, nên client phải gọi đúng `/cms/upload` không có `/` cuối.
- Next thử matcher trên cả pathname gốc lẫn pathname đã decode (`resolve-routes.js:349-351`). Khớp một trong hai là proxy chạy, nên `/cms/%75pload` vẫn qua proxy, không mở thêm lỗ.
- Server Function bị loại khỏi matcher cũng bỏ qua proxy (`proxy.md:249-251`). `/cms/upload` là Route Handler, không có action, nên không ảnh hưởng. Nhưng không được đặt `page.tsx` kèm action ở `/cms/upload`.
- Thêm vào kiểm chứng Story 0 (spine dòng 187): `curl -I /cms` và `curl -I /cms.rsc` không kèm header phải trả 401.

### 1c. Giới hạn body của Route Handler: ĐÚNG (không có giới hạn từ Next)

- Server Action: mặc định 1 MB, chỉnh bằng `serverActions.bodySizeLimit` (`D/03-api-reference/05-config/01-next-config-js/serverActions.md:59-63`; `D/02-guides/server-actions.md:83`). Mã nguồn trả 413 khi vượt (`server/app-render/action-handler.js:514-540`).
- Route Handler: tài liệu không nêu giới hạn và nói rõ không cần `bodyParser` (`D/03-api-reference/03-file-conventions/route.md:597`). Trong `server/route-modules/app-route/` cũng không có kiểm tra kích thước nào. Vì vậy việc "route kiểm dung lượng (video ≤ 100 MB)" trong AD-24 là bắt buộc phải tự làm, đúng như spine ghi.
- Lưu ý (không phải lỗi spine): `request.formData()` đệm toàn bộ file 100 MB vào RAM. Nên kiểm `Content-Length` trước khi đọc body. Reverse proxy production (ví dụ `client_max_body_size` của nginx) phải cho phép ≥ 100 MB. Mục này thuộc hạng mục hạ tầng Deferred (spine dòng 428), nên ghi kèm.

### 1d. Basic Auth cho request ngoài proxy: CHƯA XÁC MINH ĐƯỢC

- Tài liệu Next trong repo không nói gì về việc trình duyệt gửi lại thông tin Basic Auth. Đây là hành vi của trình duyệt (RFC 7617 §2.2 về "protection space" theo tiền tố đường dẫn, và Fetch Standard về "authentication entry" khi `credentials` là `same-origin`/`include`). Các nguồn này không có trong repo nên tôi không trích dẫn được ở đây.
- Bằng chứng gián tiếp trong repo: Server Action là `fetch` POST cùng origin (`node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js:75-76`) tới URL dưới `/cms/…`. Proxy hiện tại chặn mọi request `/cms/:path*` không có `Authorization` (`proxy.ts:4-10`), và `requireAdmin()` cũng đọc header này (`lib/require-admin.ts:5-8`). Nếu CMS hiện tại lưu bài được thì trình duyệt đang tự gắn header cho `fetch` cùng origin dưới `/cms/`. `/cms/upload` nằm cùng tiền tố `/cms/`, nên khả năng cao cũng được gắn header.
- Đề xuất:
  1. Thêm vào kiểm chứng Story 0: từ trình duyệt đã đăng nhập ở `/cms`, `fetch("/cms/upload", { method: "POST", body: formData })` **không tự thêm header** phải được 2xx. Thử ít nhất trên Chrome và Safari iOS (Vinh dùng điện thoại).
  2. Khi thiếu hoặc sai header, route trả `401` kèm `WWW-Authenticate: Basic realm="CMS", charset="UTF-8"` giống `proxy.ts:7-8` (cùng realm), không ném lỗi 500. Như vậy trình duyệt vẫn có thể hỏi lại đăng nhập.

---

## 2. AD-12 — Trang 404 cho URL không khớp: ĐÚNG

- `D/03-api-reference/03-file-conventions/not-found.md:135`: "the root `app/not-found.js` and `app/global-not-found.js` files handle any unmatched URLs for your whole application". `not-found.js` ở segment khác chỉ bắt `notFound()` được gọi trong segment đó (`not-found.md:8,13`).
- `global-not-found` chỉ cần trong hai trường hợp: có nhiều root layout, hoặc root layout nằm trong segment động ở cấp cao nhất (`not-found.md:57-60`), và nó vẫn là tính năng experimental (`:49,62-71`). Repo chỉ có **một** root layout chứa `<html>` (`app/layout.tsx`). `app/(site)/layout.tsx` và `app/cms/layout.tsx` là layout lồng. Vì vậy **không cần** `global-not-found`.
- Lưu ý nên ghi vào spine:
  - Hiện repo chỉ có `app/(site)/not-found.tsx` và chưa có `app/not-found.tsx`. URL không khớp đang hiện trang 404 mặc định của Next. Cây thư mục trong spine (dòng 331) đã có `not-found.tsx` gốc, đúng hướng.
  - `app/not-found.tsx` render trong root layout, **không** có `(site)/layout` (header/footer của site). Nếu muốn 404 có khung site thì component 404 phải tự dựng khung.
  - Vì có `[danh-muc]` ở gốc, URL một đoạn như `/khong-ton-tai` **khớp route** `[danh-muc]` chứ không "không khớp". Trang đó gọi `notFound()` ở cấp page (AD-12), và `app/(site)/not-found.tsx` (gần nhất) xử lý, trả 404 vì gọi trước khi stream. Chỉ URL không khớp route nào (ví dụ `/a/b`, `/x/trang/2/y`) mới rơi về `app/not-found.tsx`. Spine nên giữ cả hai file và ghi rõ vai trò của từng file.

---

## 3. AD-7 — Banner lọc theo "bây giờ" trong `"use cache"`: ĐÚNG

**Gọi `new Date()` / `Date.now()` trong hàm `"use cache"` là hợp lệ, không có lỗi build:**
- `D/01-getting-started/08-caching.md:331` (Cache Components yêu cầu xử lý rõ `Date.now()`…) và `:356-363` ("Alternatively, you can **cache the result**": giá trị được chốt tới lần revalidate).
- `D/03-api-reference/04-functions/io.md:6-8,54`: bọc trong `"use cache"` thì giá trị được chốt vào static shell, và trong cache scope `io()` là no-op.
- Mã nguồn: hàm `io()` mà `Date.now()` được vá để gọi (`server/node-environment-extensions/date.js:19`) chỉ báo lỗi ở `prerender`/`prerender-client`/`request` (`server/node-environment-extensions/io-utils.js:24-90`). Với `case 'cache'` thì bỏ qua (`io-utils.js:93-97`). Lỗi `blocking-prerender-current-time` (`server/app-render/sync-io-messages.js:28,45`) chỉ xảy ra khi gọi **ngoài** cache scope.

**`cacheLife` revalidate ≤ 60 s tương thích với `ensureStatic = "navigation"` và luật stale ≥ 30 s / expire ≥ 5 phút:**
- `D/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md:90`: "navigation" chỉ fail khi `expire` < 5 phút, `stale` < 30 s hoặc `revalidate` = 0. "A `stale` time between 30 seconds and five minutes is allowed."
- `D/03-api-reference/04-functions/cacheLife.md:264-270`: cùng các ngưỡng này cho việc được đưa vào prerender. Preset `minutes` (stale 5 phút, revalidate 1 phút, expire 1 giờ, `cacheLife.md:143`) thoả cả AD-7 lẫn yêu cầu ≤ 60 s.

Lưu ý nên ghi vào AD-7:
- **Không truyền `now` làm tham số** cho query có cache. Tham số là một phần khoá cache, nên mỗi mili-giây sẽ sinh một entry mới. Phải gọi `new Date()` **bên trong** hàm.
- Độ trễ thật khi banner bật hoặc tắt so với lịch không phải ≤ 60 s. Nó gồm `revalidate` (stale-while-revalidate: request đầu tiên sau hạn vẫn nhận bản cũ, rồi mới tạo lại ở nền), cộng thời gian chờ có request tiếp theo, cộng client cache theo `stale` (tối thiểu 30 s, preset `minutes` là 5 phút; `cacheLife.md:250-254`). Nếu cần sát giờ hơn, dùng profile inline `{ stale: 30, revalidate: 60, expire: 300 }` và chấp nhận độ trễ cỡ vài phút ở trang ít truy cập.
- Nếu query banner được gọi bên trong một `"use cache"` khác có `cacheLife` tường minh dài hơn (ví dụ component hay layout có cache `max`), lifetime của lớp ngoài thắng (`cacheLife.md:406`). Khi đó banner không làm mới sau 60 s. Component chứa banner không được tự bọc `"use cache"` dài hơn.
- Cache có `stale` < 5 phút bị loại khỏi App Shell (`cacheLife.md:268`; `D/04-glossary.md:17`). `next.config.ts` đang bật `partialPrefetching`, nên chỗ banner nên nằm trong `<Suspense>` có fallback giữ chỗ để không nhảy layout. Prerender đầy đủ vẫn chứa banner, nên "navigation" không bị vi phạm.

---

## 4. AD-12 — Screen CMS đọc `searchParams`, client đẩy trạng thái lên URL: ĐÚNG

- `searchParams` là Request-time API. Với Cache Components, vị trí đọc nó quyết định phần prerender được (`D/03-api-reference/03-file-conventions/page.md:119-120`). Đọc trong `<Suspense>` là đúng mẫu. CMS không đặt `ensureStatic` (chỉ `app/(site)/layout.tsx:6` có), nên không bị luật "navigation" cấm `searchParams` server (`ensureStatic.md:89`).
- Client đổi URL bằng `useRouter` hoặc `Link`, sau điều hướng page nhận `searchParams` mới (`D/03-api-reference/04-functions/use-search-params.md:282`). `useSearchParams` chỉ dùng ở Client Component. Server nên đọc prop `searchParams` của page (`use-search-params.md:74-75`). Layout không nhận `searchParams` (`use-search-params.md:272-276`), nên Screen phải nhận từ `page.tsx`.
- Client Component gọi `useSearchParams` cần nằm trong `<Suspense>`, nếu không build fail (`use-search-params.md:181`).
- Gợi ý (không phải lỗi): `page.tsx` truyền **promise** `searchParams` xuống Screen trong `<Suspense>`, không `await` ở page, để khung CMS vẫn prerender được.

---

## 5. AD-18 — Nhiều lời gọi song song trong `after()`: ĐÚNG

- `D/03-api-reference/04-functions/after.md`: không nêu giới hạn số tác vụ hay độ song song. Callback có thể async và được lồng `after` (`after.md:56`). Vì vậy `Promise.allSettled([...])` trong một `after()`, hoặc nhiều `after()` riêng, đều hợp lệ. Nên dùng `allSettled` để mỗi phần lỗi độc lập, đúng ý AD-18.
- `maxDuration` có áp cho `after`: "`after` will run for the platform's default or configured max duration of your route" (`after.md:50`). Với Server Action, đặt `maxDuration` ở cấp page hoặc layout (`D/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md:18`). Hiện `app/cms/layout.tsx` đang để 60.
- Lưu ý nên ghi vào spine:
  - `maxDuration` là cấu hình cho **nền tảng triển khai** ("Deployment platforms can use `maxDuration`…", `maxDuration.md:6`). Với self-host `next start` (`after` "fully supported", `D/02-guides/self-hosting.md:269`), tài liệu không nói `next start` tự cắt theo `maxDuration`. Hạn 90 s mỗi lời gọi phải được cài trong `platform/ai` (AbortSignal hoặc timeout), không dựa vào `maxDuration`.
  - Nếu sau này chạy trên nền tảng serverless có cắt theo `maxDuration`: các phần chạy song song nên tổng thời gian ≈ phần dài nhất. Nhưng nếu hạn AI = 90 s mà `maxDuration` = 90 thì hàm có thể bị cắt trước khi kịp ghi `FAILED`. Đề xuất `maxDuration` ≥ hạn AI + biên ghi DB (ví dụ 100–120), hoặc hạn AI 80 s. Mốc 120 s của poller vẫn là lưới an toàn.
  - Khi restart, Next chờ các `after()` đang chờ xong nếu tắt êm bằng SIGTERM (`self-hosting.md:271`). Process manager nên có thời gian drain. Nếu không, mốc 120 s → `FAILED` của AD-18 xử lý.

---

## 6. `meo-vat/trang/[n]` cạnh `[danh-muc]/trang/[n]`: ĐÚNG

- Chạy `getSortedRoutes` (`node_modules/next/dist/shared/lib/router/utils/sorted-routes.js`) với tập route của spine: các route tĩnh (`/meo-vat`, `/meo-vat/trang/[n]`, `/gom-link/trang/[n]`, `/bio`, `/tim-kiem`, …) xếp **trước** `/[danh-muc]` và `/[danh-muc]/trang/[n]`. Kết quả khớp: `/meo-vat/trang/2` → `/meo-vat/trang/[n]`; `/do-bep/trang/2` → `/[danh-muc]/trang/[n]`. Không xung đột, không lỗi build.
- Tài liệu chỉ nêu quy tắc "predefined routes take precedence over dynamic routes" ở Pages Router (`node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/07-api-routes.md:413`). App Router dùng cùng hàm sắp xếp; kết quả chạy thử ở trên là bằng chứng chính.
- Lưu ý: `getSortedRoutes` báo lỗi khi hai segment động cùng cấp khác tên. Thư mục hiện tại `app/(site)/[category]` phải **đổi tên** thành `[danh-muc]`, không để cả hai cùng tồn tại. `RESERVED_ROOT_SLUGS` (AD-20) chặn Danh mục trùng `meo-vat`/`gom-link`, nên `generateStaticParams` của `[danh-muc]` không sinh trùng route tĩnh.
