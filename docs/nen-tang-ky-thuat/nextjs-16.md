# Next.js 16.4

> Phiên bản: `next` 16.4.3, `react`/`react-dom` 19.3.0, `eslint-config-next` 16.4.3 (`package.json`) · Nguồn: `node_modules/next/dist/docs/01-app/` (đường dẫn cụ thể ở từng mục và ở **Tham khảo**) · Kiểm lần cuối: 2026-11-03 @ dfd7e8f

Mọi đường dẫn tài liệu dạng `docs/01-app/...` bên dưới là tương đối so với `node_modules/next/dist/docs/`. Khi tài liệu này và trí nhớ của agent khác nhau, tin tài liệu này; khi tài liệu này và `node_modules/next/dist/docs/` khác nhau, tin `node_modules` và sửa tài liệu này.

## Tóm tắt cho agent

- **Cache Components đang bật** (`cacheComponents: true`, `partialPrefetching: true` — `next.config.ts:9-10`). Dữ liệu mặc định là **động**; chỉ thứ bọc `"use cache"` mới được đưa vào bản prerender. Không dùng `export const dynamic`, `revalidate`, `fetchCache`, `dynamicParams`, `runtime` — chúng gây lỗi build. Xem [NX-01], [NX-62].
- **Toàn bộ site public phải tĩnh hoàn toàn**: `app/(site)/layout.tsx:6` đặt `ensureStatic = "navigation"`. Trong `app/(site)/**` **cấm** truy vấn DB không cache, `connection()`, `cookies()`, `headers()`, `searchParams` phía server — **kể cả khi bọc `<Suspense>`**. Xem [NX-03], [NX-52].
- Đọc dữ liệu public **chỉ** qua hàm trong `lib/posts.ts`; mỗi hàm có `"use cache"` + `cacheLife(...)` + `cacheTag(POSTS_TAG)`. Xem [NX-22], [NX-32].
- Ghi dữ liệu ảnh hưởng trang public → gọi `updateTag(POSTS_TAG)` **trong Server Action**. `updateTag` chỉ chạy được trong Server Action; ở Route Handler dùng `revalidateTag(tag, "max")` hoặc `revalidateTag(tag, { expire: 0 })`. Xem [NX-06], [NX-54], [NX-55].
- Comment `lib/posts.ts:6` ghi `revalidateTag("posts")` là **sai** so với code; code đúng dùng `updateTag` (`app/cms/actions.ts:88,107,115`). Xem [NX-50].
- Mỗi Server Action **tự** kiểm tra quyền bằng `requireAdmin()` (qua `run()` ở `app/cms/actions.ts:21-29`), trả về `Result` `{ ok: true, ... } | { ok: false, error }`. Không dựa vào `proxy.ts`. Xem [NX-24], [NX-34], [NX-58].
- File chặn request là `proxy.ts` (tên mới của `middleware.ts`), hàm export tên `proxy`. Matcher hiện chặn **cả `/cms/*` và `/api/*`** bằng Basic Auth — endpoint public không được đặt dưới `/api`. Xem [NX-09], [NX-25], [NX-57].
- Tính năng theo từng request (lượt xem, lượt thích) trên trang public: làm ở **Client Component** gọi Server Action/Route Handler sau khi trang tĩnh đã tải; **không** gọi `updateTag` cho mỗi lượt. Xem [NX-35], [NX-36], [NX-56].
- `params`, `searchParams`, `headers()`, `cookies()` đều là **Promise** — luôn `await`. Kiểu trang/layout dùng helper toàn cục `PageProps<"/route">`, `LayoutProps<"/route">`. Xem [NX-07], [NX-28].
- `generateStaticParams` phải trả **ít nhất một** phần tử, nếu không build lỗi; build vì thế cần DB có ít nhất một Bài web đã đăng. Xem [NX-10], [NX-53].

## Khái niệm cốt lõi

### [NX-01] Mô hình render của Cache Components

- Khi bật `cacheComponents`, truy cập dữ liệu **mặc định là động** (chạy lúc request). Agent chọn cái gì được cache ở cấp hàm/component/trang bằng `"use cache"`. Next.js prerender một **static shell** (HTML + RSC payload) phục vụ ngay, phần động stream vào sau — đây là Partial Prerendering (PPR), mặc định của App Router khi bật cờ. Nguồn: `docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`.
- Ba thứ được đưa vào static shell (`docs/01-app/01-getting-started/08-caching.md` mục "Prerendering"):
  1. Kết quả `"use cache"` có thời gian sống đủ dài ([NX-05]).
  2. Fallback của `<Suspense>` (nội dung bên trong stream lúc request).
  3. Giá trị "dự đoán được": import module, tính toán thuần.
- Thứ không hoàn tất được lúc prerender (DB/fetch không cache, `cookies()`, `headers()`, `searchParams`, `new Date()`, `Math.random()`) phải nằm trong `<Suspense>` hoặc được cache; nếu không, dev overlay báo lỗi "blocking route" và build có thể thất bại.
- Giá trị thời gian/ngẫu nhiên trong Server Component: bọc `"use cache"` (chụp một lần) hoặc `await io()` (từ `next/cache`) trong `<Suspense>` (tính lúc request). `io()` được ưu tiên hơn `connection()` vì vẫn prefetch được. Nguồn: `docs/01-app/03-api-reference/04-functions/io.md`.
- Cache Components yêu cầu runtime Node.js; không export `runtime` ở bất kỳ segment nào (`cacheComponents.md`).
- Khi điều hướng phía client, route cũ không bị unmount mà được ẩn bằng React `<Activity mode="hidden">`: state được giữ, effect bị dọn khi ẩn và **chạy lại** khi hiện lại (`cacheComponents.md` mục "Navigation with Activity"). Hệ quả xem [NX-59].

### [NX-02] Partial Prefetching và các giai đoạn điều hướng

- `partialPrefetching: true` (bắt buộc đi kèm `cacheComponents`) làm `<Link>` mặc định chỉ prefetch **App Shell** của route — phần không phụ thuộc URL, dùng chung cho mọi link tới cùng route. Nội dung phụ thuộc `params`/`searchParams` được lấy sau khi bấm. Nguồn: `docs/01-app/03-api-reference/05-config/01-next-config-js/partialPrefetching.md`.
- Ba giai đoạn (navigation stages): (1) `<Link>` mặc định tải App Shell; (2) `<Link prefetch={true}>` tải thêm nội dung theo URL của link; (3) khi bấm, điều hướng render phần còn lại.
- Route có `generateStaticParams` + dữ liệu đã cache thì bản prerender đầy đủ theo từng URL đã có sẵn; `prefetch={true}` lấy được nó trước khi bấm.
- `await prefetch()` / `await navigation()` (từ `next/cache`) đẩy một cây con xuống giai đoạn sau; dự án chưa dùng. Nguồn: `docs/01-app/03-api-reference/04-functions/prefetch.md`, `navigation.md`.

### [NX-03] `ensureStatic` — khoá trang ở trạng thái tĩnh

- Route segment config mới (từ v16.4.0), export từ `page` hoặc `layout`, chỉ chạy khi bật `cacheComponents`. Giá trị: `'auto'` (mặc định) | `'shell'` | `'prefetch'` | `'navigation'` | `false`. Nguồn: `docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`.
- `'navigation'` = **toàn bộ** output render phía server phải được tạo lúc prerender. Next.js kiểm tra ở cả `next dev` và `next build`. Các thứ sau làm **hỏng** kiểm tra, **dù đã bọc `<Suspense>`** hay đặt `instant = false`:
  - Dữ liệu không cache (DB/fetch thiếu `"use cache"`) và `connection()`.
  - Dữ liệu runtime: `cookies()`, `headers()`, `searchParams` phía server.
  - Scope `"use cache"` có `expire` < 5 phút, `stale` < 30 giây, hoặc `revalidate` = 0.
  - Truyền Promise dữ liệu phụ thuộc request từ Server Component sang Client Component.
  - Các ràng buộc này áp dụng cả cho `generateMetadata` và `generateViewport`.
- Được phép: dữ liệu `"use cache"`, `prefetch()`, `navigation()`; trong Client Component bọc `<Suspense>`: `use(browser())`, `use(io())`, `useParams()`, `useSearchParams()`.
- Route động dưới `'navigation'` **bắt buộc** export `generateStaticParams()` trả ít nhất một bộ tham số đầy đủ. URL chưa prerender: request đầu **chờ** bản tĩnh hoàn chỉnh (không stream fallback), rồi lưu lại cho lần sau.
- Mức đặt ở layout áp cho mọi route dưới nó (kể cả layout cha). Segment con chỉ được đặt mức **chặt hơn**; đặt lỏng hơn hoặc `false` → build lỗi.
- Khác `instant`: `instant` chỉ kiểm tra điều hướng có hiện UI ngay không (mặc định kiểm ở dev, mức `'warning'`). Nguồn: `.../02-route-segment-config/instant.md`.

### [NX-04] `"use cache"` — cache được đọc gì, không được đọc gì

Nguồn: `docs/01-app/03-api-reference/01-directives/use-cache.md`.

- Đặt ở đầu file (mọi export thành cached, phải async) hoặc đầu một hàm/component async.
- **Khoá cache** = build ID + ID hàm + đối số đã serialize (+ biến closure bị bắt). Đối số khác nhau → mục cache khác nhau.
- Đối số và giá trị trả về phải **serialize được**: primitive, object thường, mảng, `Date`, `Map`, `Set`, TypedArray; giá trị trả về được thêm JSX. **Không** được: instance class, hàm (trừ truyền xuyên qua), Symbol, **`URL`**.
- **Cấm** đọc `cookies()`, `headers()`, `searchParams` bên trong scope cache — cấm theo cả call stack (hàm helper được gọi bên trong cũng tính). Lỗi `next-request-in-use-cache`; trên route động lỗi có thể chỉ lộ ra lúc `next start`. Cách đúng: đọc bên ngoài rồi truyền giá trị vào làm đối số.
- `React.cache` bên trong `"use cache"` bị cô lập: giá trị đặt bên ngoài không nhìn thấy bên trong.
- Lưu trữ runtime mặc định là **LRU trong bộ nhớ của từng instance**. Self-host một instance: giữ qua các request. Serverless: thường không giữ. Mọi mục cache mất khi deploy mới (khoá chứa build ID).
- Trên client, router giữ kết quả theo `stale` (tối thiểu 30 giây).

### [NX-05] `cacheLife` — hồ sơ thời gian sống

Nguồn: `docs/01-app/03-api-reference/04-functions/cacheLife.md`.

- Chỉ gọi bên trong scope `"use cache"`, mỗi lần chạy hàm chỉ một lời gọi `cacheLife`. Tài liệu khuyên gọi `cacheLife` **trong mọi** scope `"use cache"`, ngay tại hàm đó (không gói vào helper dùng chung).
- `stale` = client dùng không hỏi server; `revalidate` = sau mốc này request kế tiếp nhận bản cũ và server tạo lại ngầm; `expire` = quá mốc này mà không có request thì request kế tiếp phải chờ bản mới.

| Profile | `stale` | `revalidate` | `expire` | Dùng được dưới `ensureStatic='navigation'`? |
| --- | --- | --- | --- | --- |
| `default` (không gọi `cacheLife`) | 5 phút | 15 phút | không bao giờ | Có |
| `seconds` | 30 giây | 1 giây | 1 phút | **Không** (`expire` < 5 phút → thành "lỗ động") |
| `minutes` | 5 phút | 1 phút | 1 giờ | Có |
| `hours` | 5 phút | 1 giờ | 1 ngày | Có |
| `days` | 5 phút | 1 ngày | 1 tuần | Có — **dự án đang dùng** |
| `weeks` | 5 phút | 1 tuần | 30 ngày | Có |
| `max` | 5 phút | 30 ngày | 1 năm | Có |

- Ngưỡng prerender: `revalidate: 0` hoặc `expire` < 5 phút → bị loại khỏi prerender; `stale` < 30 giây → bị loại; `stale` từ 30 giây tới dưới 5 phút → có trong prerender nhưng không có trong App Shell.
- Có thể định nghĩa profile riêng ở `cacheLife` trong `next.config.ts`; dự án **chưa** định nghĩa, nên các tên trên mang đúng giá trị mặc định.
- Cache lồng nhau: scope ngoài có `cacheLife` tường minh thì dùng thời gian của chính nó, bất kể scope trong. Scope ngoài không có `cacheLife` mà bọc một cache ngắn hạn → build lỗi.

### [NX-06] Vô hiệu hoá cache: `updateTag` / `revalidateTag` / `revalidatePath` / `refresh`

Nguồn: `docs/01-app/03-api-reference/04-functions/updateTag.md`, `revalidateTag.md`, `refresh.md`, `cacheTag.md`; `docs/01-app/02-guides/server-actions.md` mục "Choosing a cache update".

| API | Gọi ở đâu | Hành vi | Re-render route hiện tại trong cùng response của action? |
| --- | --- | --- | --- |
| `cacheTag(...tags)` | Trong scope `"use cache"` | Gắn tag (tối đa 128 tag/lần gọi, mỗi tag ≤ 256 ký tự, phân biệt hoa thường) | — |
| `updateTag(tag)` | **Chỉ Server Action** (nơi khác ném lỗi) | Hết hạn **ngay**; request kế tiếp **chờ** dữ liệu mới (read-your-own-writes) | Có |
| `revalidateTag(tag, "max")` | Server Action, Route Handler (không dùng trong Proxy, Client Component) | Đánh dấu stale; request kế tiếp nhận bản cũ trong khi tạo lại ngầm (stale-while-revalidate) | **Không** |
| `revalidateTag(tag, { expire: 0 })` | Như trên | Hết hạn ngay — dùng ở Route Handler/webhook khi không gọi được `updateTag` | — |
| `revalidateTag(tag)` (1 đối số) | — | **Deprecated**, tương đương `{ expire: 0 }` | — |
| `revalidatePath(path)` | Server Action, Route Handler | Vô hiệu theo đường dẫn (qua soft tag `_N_T_...`) | Có |
| `refresh()` | **Chỉ Server Action** | Không đụng cache; chỉ tải lại RSC payload của route hiện tại | Có |

- Gọi bất kỳ hàm vô hiệu nào trong Server Action sẽ xoá **toàn bộ** client router cache ngay (`cacheLife.md` mục "Client cache behavior").
- Vô hiệu hoá do request kích hoạt: trang dùng tag được tạo lại khi có người truy cập, không phải tất cả cùng lúc (`revalidateTag.md`).
- Nhiều instance: vô hiệu hoá mặc định chỉ có hiệu lực trên instance nhận lời gọi; cần cache handler dùng chung. Nguồn: `docs/01-app/02-guides/how-revalidation-works.md`.

### [NX-07] API theo request và các Promise

- `params`, `searchParams` (props của page/layout/`generateMetadata`), `headers()`, `cookies()` đều trả **Promise** → luôn `await`. Nguồn: `docs/01-app/03-api-reference/04-functions/headers.md`, `cookies.md`, `docs/01-app/01-getting-started/08-caching.md` mục "Working with runtime APIs".
- Với Cache Components, gọi `headers()`/`cookies()` ngoài `<Suspense>` làm route không prerender được. `params` không có `generateStaticParams` cũng là dữ liệu runtime → phải await trong `<Suspense>`.
- Trong layout, không `await params` ở cấp trên cùng; truyền Promise `params` xuống component con trong `<Suspense>` rồi mới await (`docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` mục "With Cache Components").
- `connection()` (`next/server`): dừng prerender, chờ request thật — **cũng chặn prefetch**. `io()` (`next/cache`): dừng prerender nhưng vẫn cache/prefetch được; ưu tiên `io()` khi chỉ cần loại khỏi static shell. Nguồn: `docs/01-app/03-api-reference/04-functions/connection.md`, `io.md`.
- `after(cb)` (`next/server`): chạy việc sau khi response (hoặc prerender) xong; dùng được trong Server Component, Server Function, Route Handler, Proxy. Không làm route thành động. Trong Server Component **không** gọi `headers()`/`cookies()` bên trong callback (đọc trước rồi truyền vào); trong Server Action/Route Handler thì được. Trên trang tĩnh, callback chạy lúc build/revalidate, không chạy mỗi lượt xem. Nguồn: `docs/01-app/03-api-reference/04-functions/after.md`.

### [NX-08] Server Actions

Nguồn: `docs/01-app/02-guides/server-actions.md`, `docs/01-app/02-guides/data-security.md`, `docs/01-app/03-api-reference/01-directives/use-server.md`, `docs/01-app/01-getting-started/07-mutating-data.md`.

- Server Action = hàm trong file/hàm có `"use server"`, gọi bằng `<form action>`, `formAction`, hoặc trong `startTransition` (event handler, `useEffect`).
- Về mạng: action là **POST tới chính route đang gọi nó**. Bất kỳ ai gửi được POST đó đều gọi được action → coi mỗi action là điểm vào không tin cậy: xác thực + phân quyền **bên trong** action, validate input, chỉ trả dữ liệu UI cần.
- Next.js tự bảo vệ: kiểm tra CSRF (`Origin` so với `Host`/`X-Forwarded-Host`), giới hạn body 1MB (`serverActions.bodySizeLimit`), action ID mã hoá và xoá action không dùng khỏi bundle, mã hoá biến closure (`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` khi nhiều instance).
- Client gửi action **tuần tự** (mỗi client một action một lúc); `Promise.all` nhiều action từ client không chạy song song.
- Một response mang cả giá trị trả về và RSC payload mới của route hiện tại khi action gọi `updateTag`, `revalidatePath`, `refresh`, sửa cookie, hoặc `redirect`. `redirect` ném exception điều khiển → gọi `updateTag` **trước** `redirect`.
- Action ID đổi giữa các bản deploy → client cũ có thể gặp lỗi "Failed to find Server Action"; UI nên cho thử lại.

### [NX-09] Proxy (tên mới của Middleware)

Nguồn: `docs/01-app/03-api-reference/03-file-conventions/proxy.md`, `docs/01-app/01-getting-started/16-proxy.md`.

- File `proxy.ts` ở gốc repo (ngang hàng `app/`), export **một** hàm tên `proxy` hoặc default export. Convention `middleware` đã deprecated.
- Runtime mặc định Node.js; export `runtime` trong file proxy → **ném lỗi**.
- Không có `matcher` → chạy cho **mọi** request, kể cả `_next/static`, `_next/image`, file trong `public/`. Giá trị `matcher` phải là hằng số (phân tích tĩnh lúc build). Pattern neo ở đầu path: `/cms/:path*` khớp `/cms` và `/cms/...`.
- Thứ tự: `headers` (config) → `redirects` (config) → **Proxy** → rewrites `beforeFiles` → route trong filesystem → ... Nghĩa là Proxy chạy **trước** cả trang đã prerender.
- Server Function không phải route riêng; chúng là POST tới route dùng chúng, nên matcher bỏ qua path nào thì action trên path đó cũng không qua Proxy. Tài liệu yêu cầu luôn kiểm tra quyền trong từng Server Function.

### [NX-10] Route động và `generateStaticParams` dưới Cache Components

Nguồn: `docs/01-app/03-api-reference/04-functions/generate-static-params.md`, `docs/01-app/02-guides/migrating-to-cache-components.md` mục "`generateStaticParams` and `dynamicParams`", `docs/01-app/02-guides/incremental-static-regeneration-cache-components.md`.

- `generateStaticParams` phải trả **ít nhất một** param; mảng rỗng → lỗi build `empty-generate-static-params`.
- Xoá `generateStaticParams` = route mất ISR, render mỗi request (dù dữ liệu có `"use cache"`); dưới `ensureStatic='navigation'` còn làm build lỗi.
- `dynamicParams` **không được hỗ trợ** khi bật Cache Components (build lỗi). Param không có trong danh sách vẫn được phục vụ; muốn từ chối thì gọi `notFound()` khi dữ liệu không tồn tại.
- ISR: URL có trong `generateStaticParams` → trang tĩnh sẵn. URL khác → tạo khi có request đầu, lưu cho lần sau (dưới `'navigation'` request đầu chờ bản hoàn chỉnh).
- `notFound()` gọi **trước** khi stream bắt đầu → mã 404; trang chạm `notFound()` lúc prerender có thể giữ trạng thái Static và vẫn trả 404. Gọi **bên trong** `<Suspense>` đã stream → giữ mã **200** và Next.js chèn `noindex`. Nguồn: `docs/01-app/03-api-reference/04-functions/not-found.md`.

### [NX-11] Metadata, sitemap, robots

Nguồn: `docs/01-app/03-api-reference/04-functions/generate-metadata.md`, `docs/01-app/01-getting-started/14-metadata-and-og-images.md`, `docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`, `robots.md`.

- `export const metadata` (tĩnh) hoặc `export async function generateMetadata({ params })` (động); metadata được gộp từ root layout xuống page. `title.template` ở layout áp cho `title` của trang con.
- Với Cache Components, `generateMetadata` theo cùng luật như component: đọc dữ liệu không cache hoặc runtime → hoãn tới lúc request. Nếu phần còn lại của trang prerender được hoàn toàn mà metadata lại động → Next.js **báo lỗi**, buộc chọn: cache dữ liệu (`"use cache"`) hoặc đánh dấu động có chủ đích.
- `generateMetadata` có `"use cache"` thì giá trị trả về phải serialize được — `URL` không được; trả `metadataBase` dạng chuỗi.
- `sitemap.ts`, `robots.ts` là Route Handler đặc biệt, **tĩnh mặc định** trừ khi dùng API runtime.

### [NX-12] Route Handlers dưới Cache Components

Nguồn: `docs/01-app/01-getting-started/15-route-handlers.md`, `docs/01-app/03-api-reference/03-file-conventions/route.md`.

- `GET` theo cùng mô hình với trang: prerender được nếu không chạm dữ liệu không cache/runtime; chạm `request.url`, `request.headers`, `request.body`, DB không cache, `headers()`, `connection()` → chạy lúc request. Phương thức khác (`POST`...) không được cache.
- Không đặt `"use cache"` trực tiếp trong thân handler; tách ra hàm helper.
- `updateTag`/`refresh` **không** dùng được ở Route Handler; dùng `revalidateTag`.

### [NX-13] `next/image` và `remotePatterns`

Nguồn: `docs/01-app/03-api-reference/02-components/image.md` mục `remotePatterns`, `dangerouslyAllowSVG`.

- URL ảnh ngoài phải khớp `images.remotePatterns`; không khớp → optimizer trả **400**.
- Wildcard hostname: `*` khớp **một** cấp subdomain; `**` khớp nhiều cấp (chỉ ở đầu). Bỏ `search` → cho phép mọi query string.
- SVG không được tối ưu mặc định; `src` kết thúc `.svg` tự động `unoptimized`.

### [NX-14] `error.tsx`, `not-found.tsx`

Nguồn: `docs/01-app/03-api-reference/03-file-conventions/error.md`, `not-found.md`.

- `error.tsx` phải là Client Component (`"use client"`), nhận `{ error, retry }`. `retry()` (ổn định từ v16.3.0) tải lại và render lại; `reset()` vẫn có nhưng chỉ dùng khi cố ý không tải lại. `error: unknown`.
- `error.tsx` không bắt lỗi của `layout.tsx` cùng segment; lỗi root layout cần `app/global-error.tsx` (tự có `<html>`, `<body>`; không nhận global CSS).
- `not-found.tsx` render bên trong boundary của `loading` và `error` cùng segment.
- Dự án hiện **chưa có** `error.tsx` hay `global-error.tsx` nào.

## Dự án dùng như thế nào

### [NX-20] Cấu hình

- `images.remotePatterns` sinh từ `IMAGE_HOSTS` (`protocol: "https"`, chỉ `hostname`) — `next.config.ts:5-8`, `lib/images.ts:3`.
- `cacheComponents: true` — `next.config.ts:9`; `partialPrefetching: true` — `next.config.ts:10`.
- Turbopack: rule `*.css` qua loader `@tailwindcss/turbopack` — `next.config.ts:11-18`. `next dev`/`next build` dùng Turbopack (`package.json` scripts).
- Không có `cacheLife` tuỳ biến, `cacheHandlers`, `serverActions` trong config → dùng mặc định (body action ≤ 1MB, cache in-memory).

### [NX-21] Cây route và chế độ render

| URL | File | Chế độ | Ghi chú |
| --- | --- | --- | --- |
| (mọi trang) | `app/layout.tsx` | Tĩnh | Root layout: font, `ThemeProvider`, `Toaster`, `metadata` gốc — `app/layout.tsx:14-23` |
| `/`, `/[category]`, `/bai-viet/[slug]` | `app/(site)/layout.tsx` | **Tĩnh hoàn toàn** | Route group `(site)` không thêm segment URL; `ensureStatic = "navigation"` — `app/(site)/layout.tsx:4-6` |
| `/` | `app/(site)/page.tsx` | Tĩnh | 3 truy vấn cached song song — `app/(site)/page.tsx:11-15` |
| `/meo-vat`, `/gom-link` | `app/(site)/[category]/page.tsx` | Tĩnh | `generateStaticParams` từ hằng `CATEGORIES` — `:7-9`; slug lạ → `notFound()` — `:24` |
| `/bai-viet/[slug]` | `app/(site)/bai-viet/[slug]/page.tsx` | Tĩnh + ISR | `generateStaticParams` từ DB — `:18-21`; không có bài → `notFound()` — `:45` |
| 404 site | `app/(site)/not-found.tsx` | Tĩnh | |
| `/cms` | `app/cms/page.tsx` | Shell tĩnh + danh sách động | `<Suspense>` + `connection()` + DB không cache — `:15-17`, `:22-27` |
| `/cms/new` | `app/cms/new/page.tsx` | Tĩnh | Form client `NewPostForm` |
| `/cms/posts/[id]` | `app/cms/posts/[id]/page.tsx` | Shell tĩnh + editor động | Không có `generateStaticParams`; `await params` **trong** `<Suspense>` — `:7-21` |
| `/cms/*` | `app/cms/layout.tsx` | | `robots: noindex,nofollow` — `:5-8`; `maxDuration = 60` vì gọi AI — `:10-11` |
| `/sitemap.xml` | `app/sitemap.ts` | Tĩnh (Route Handler đặc biệt) | |
| `/robots.txt` | `app/robots.ts` | Tĩnh | Disallow `/cms`, `/api/`, `/styleguide` — `:6` |
| `/styleguide` | `app/styleguide/page.tsx` | | Trang tạm, ghi "xóa trước khi deploy" — `:13-14` |

- Không có `app/api/` (Route Handler) nào; không có `loading.tsx`, `error.tsx`, `global-error.tsx`.
- `[category]` và `/bai-viet/[slug]` cùng cấp trong `(site)`: segment tĩnh `bai-viet` được ưu tiên hơn segment động `[category]` (hành vi định tuyến chuẩn; chưa tìm thấy câu khẳng định trong tài liệu cài sẵn — đừng đặt slug Danh mục trùng `bai-viet`).

### [NX-22] Lớp đọc dữ liệu public — `lib/posts.ts`

- Năm hàm, mỗi hàm cùng một khuôn `"use cache"` → `cacheLife("days")` → `cacheTag(POSTS_TAG)` → truy vấn Prisma:
  - `getLatestPosts(limit)` — `lib/posts.ts:44-55`
  - `getPostsByCategory(category, limit?)` — `lib/posts.ts:57-68`
  - `getRelatedPosts(slug, category, limit = 3)` — `lib/posts.ts:70-81`
  - `getPostBySlug(slug)` — `lib/posts.ts:83-97` (trả `null` nếu không có/chưa đăng)
  - `getPublishedSlugs()` — `lib/posts.ts:99-108` (dùng cho `generateStaticParams` và sitemap)
- `POSTS_TAG = "posts"` — `lib/posts.ts:7`. Mọi hàm chỉ lấy `status: "PUBLISHED"` — `lib/posts.ts:41`.
- Đối số là primitive (`string`, `number`, union `CategoryKey`) → khoá cache ổn định. Giá trị trả về là object thường + `Date` → serialize được.
- Một tag chung cho mọi thứ: mọi lần ghi gọi `updateTag("posts")` làm mới toàn bộ danh sách + chi tiết + sitemap. Chấp nhận được vì lượng bài nhỏ và chỉ Vinh ghi.

### [NX-23] Lớp đọc dữ liệu CMS

- CMS đọc DB **trực tiếp, không cache**, luôn trong `<Suspense>`:
  - `/cms`: `PostList` gọi `await connection()` rồi `db.post.findMany` — `app/cms/page.tsx:22-27`. `connection()` đảm bảo truy vấn không chạy lúc build/prefetch.
  - `/cms/posts/[id]`: `Editor` nhận Promise `params`, await bên trong `<Suspense>` — `app/cms/posts/[id]/page.tsx:7-21`. `notFound()` ở `:21` chạy sau khi đã stream → trả 200 + `noindex` (chấp nhận được cho CMS, xem [NX-63]).
- `PostEditor` được gắn `key={post.updatedAt.toISOString()}` — `app/cms/posts/[id]/page.tsx:25` → khi dữ liệu đổi, state form được tạo lại thay vì giữ state cũ (quan trọng vì [NX-59]).

### [NX-24] Server Actions — `app/cms/actions.ts`

- File có `"use server"` ở dòng 1 — mọi export là Server Action.
- Kiểu kết quả: `type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }` — `app/cms/actions.ts:19`.
- Bộ bọc `run(fn)` — `app/cms/actions.ts:21-29`: `await requireAdmin()` → chạy `fn` → trả `{ ok: true, ...kếtQuả }`; bắt **mọi** lỗi, `console.error`, trả `{ ok: false, error: e.message }`. Hệ quả: thông báo lỗi ném ra trong action (tiếng Việt) hiện thẳng cho người dùng qua `toast.error` (`components/cms/new-post-form.tsx:28-31`, `components/cms/post-editor.tsx:55-63`).
- Validate input bằng Zod `safeParse` rồi ném `firstError(...)` — `app/cms/actions.ts:45-46`, `:74-75`. HTML luôn qua `sanitizePostHtml` — `:56`, `:82`.
- Gọi `updateTag(POSTS_TAG)` sau khi ghi:
  - `savePost` — `app/cms/actions.ts:88`
  - `setPostStatus` — `app/cms/actions.ts:107`
  - `deletePost` — `app/cms/actions.ts:115`
  - `createPost` **không** gọi — `app/cms/actions.ts:43-70` — đúng, vì bài mới luôn là bản nháp (không có trong truy vấn public).
- Action chỉ đọc (`runSeoCheck`, `runThreads`) vẫn đi qua `run()` để kiểm quyền — `app/cms/actions.ts:120-134`.
- Client gọi action trong `startTransition`, kiểm `res.ok`, rồi `router.push(...)` — `components/cms/new-post-form.tsx:24-34`, `components/cms/post-editor.tsx:44-53`, `:84`.

### [NX-25] Proxy và xác thực

- `proxy.ts:4-10`: Basic Auth — header `authorization` hợp lệ → `NextResponse.next()`; ngược lại trả 401 + `WWW-Authenticate: Basic realm="CMS"`.
- `proxy.ts`: `matcher: ["/cms", "/cms/((?!upload$).*)", "/api/:path*"]` (AD-24; `/cms/upload` tự `requireAdmin()`).
- `lib/auth.ts:7-13`: so khớp `ADMIN_USERNAME:ADMIN_PASSWORD` bằng `timingSafeEqual` trên SHA-256; thiếu biến môi trường → luôn từ chối.
- `lib/require-admin.ts:5-9`: `requireAdmin()` đọc `(await headers()).get("authorization")` và ném `Error("Unauthorized")`. Comment `:4` ghi rõ lý do: action có thể bị POST trực tiếp.
- Vì action được POST tới route đang dùng chúng (`/cms/...`), action CMS hiện được kiểm tra **hai lớp**: Proxy (matcher `/cms`) và `requireAdmin()`.

### [NX-26] SEO

- Root `metadata`: `metadataBase: new URL(SITE_URL)`, `title.template: "%s | Mẹo Vặt Cuộc Sống"`, `openGraph.locale: "vi_VN"` — `app/layout.tsx:14-23`. `SITE_URL` lấy từ `NEXT_PUBLIC_SITE_URL` — `lib/site.ts:2`.
- `generateMetadata` của chuyên mục: dữ liệu từ hằng `CATEGORIES`, `alternates.canonical` tương đối — `app/(site)/[category]/page.tsx:11-20`.
- `generateMetadata` của Bài web: gọi `getPostBySlug` (đã cache) nên hợp lệ dưới `ensureStatic='navigation'`; `openGraph.type: "article"`, `publishedTime`, `modifiedTime` — `app/(site)/bai-viet/[slug]/page.tsx:23-41`.
- JSON-LD `Article` + `BreadcrumbList` qua `components/json-ld.tsx:2-9` (escape `<`) — `app/(site)/bai-viet/[slug]/page.tsx:54-79`.
- `sitemap.ts` dùng `getPublishedSlugs()` (đã cache, tag `posts`) — `app/sitemap.ts:6-22`. `robots.ts` — `app/robots.ts:4-9`.
- CMS: `robots: { index: false, follow: false }` — `app/cms/layout.tsx:5-8`.

### [NX-27] Ảnh

- Host cho phép: `down-vn.img.susercontent.com`, `cf.shopee.vn`, `*.supabase.co` — `lib/images.ts:3`; dùng chung cho `remotePatterns` và validate form CMS (`isAllowedImageUrl` — `lib/images.ts:5-16`).
- Ảnh hero/bài dùng `fill` + `sizes` + `priority` — `app/(site)/page.tsx:27-34`, `app/(site)/bai-viet/[slug]/page.tsx:96-103`. Ảnh thiếu → `/placeholder.svg` (tự `unoptimized` vì đuôi `.svg`).

### [NX-28] Kiểu cho page/layout

- Dùng helper toàn cục, không import: `PageProps<"/bai-viet/[slug]">` (`app/(site)/bai-viet/[slug]/page.tsx:23,43`), `LayoutProps<"/">` (`app/layout.tsx:25`), `LayoutProps<"/cms">` (`app/cms/layout.tsx:13`). Helper được sinh khi chạy `next dev`/`next build`/`next typegen`. Nguồn: `docs/01-app/03-api-reference/03-file-conventions/page.md`, `layout.md`.
- Tham số route là chuỗi literal theo URL (không kèm route group): `"/[category]"`, không phải `"/(site)/[category]"`.

## Công thức

### [NX-30] Thêm một trang public tĩnh (không tham số)

1. Tạo `app/(site)/<duong-dan>/page.tsx`. Trang tự kế thừa `ensureStatic = "navigation"`; không đặt lại.
2. Lấy dữ liệu bằng hàm cached trong `lib/posts.ts` (hoặc thêm hàm mới theo [NX-32]). Không gọi `db` trực tiếp trong trang.
3. Khai báo `metadata` tĩnh, có `alternates.canonical`.
4. Thêm URL vào `app/sitemap.ts`.
5. Chạy `npm run build`; lỗi "uncached or runtime data on a route that must be fully static" → xem [NX-40].

```tsx
// app/(site)/gioi-thieu/page.tsx
import type { Metadata } from "next";
import { getLatestPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Về Mẹo Vặt Cuộc Sống.",
  alternates: { canonical: "/gioi-thieu" },
};

export default async function AboutPage() {
  const latest = await getLatestPosts(3); // cached → nằm trong bản prerender
  return <div className="mx-auto max-w-3xl px-4 py-10">{/* ... */}</div>;
}
```

### [NX-31] Thêm trang public có tham số động

1. Export `generateStaticParams` trả **ít nhất một** bộ tham số đầy đủ, lấy từ hàm cached ([NX-53]).
2. Trong page, `await params` **bên ngoài** `<Suspense>`, tra dữ liệu bằng hàm cached; không có → `notFound()` trước khi trả JSX (để có mã 404 thật).
3. `generateMetadata` chỉ dùng hàm cached; không tồn tại → `return {}`.
4. Không export `dynamicParams`, `revalidate`, `dynamic`.

```tsx
// app/(site)/the/[tag]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByTag, getAllTags } from "@/lib/posts"; // hàm mới, theo [NX-32]

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.slice(0, 50).map((tag) => ({ tag })); // phải có ≥ 1 phần tử
}

export async function generateMetadata({ params }: PageProps<"/the/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}`, alternates: { canonical: `/the/${tag}` } };
}

export default async function TagPage({ params }: PageProps<"/the/[tag]">) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);
  if (posts.length === 0) notFound();
  return <div>{/* ... */}</div>;
}
```

### [NX-32] Thêm một truy vấn public có cache

1. Viết trong `lib/posts.ts` (hoặc file `lib/*.ts` cùng khuôn), hàm `async`.
2. Ba dòng đầu thân hàm: `"use cache";` → `cacheLife("days");` → `cacheTag(POSTS_TAG);` (thêm tag riêng nếu cần, ví dụ `cacheTag(POSTS_TAG, \`post-${slug}\`)`).
3. Đối số chỉ là primitive/object thường; trả về object thường (map qua DTO như `toCard`), không trả instance class.
4. Không đọc `headers()`, `cookies()`, `searchParams`, không gọi `requireAdmin()` bên trong.
5. Mọi Server Action ghi vào dữ liệu này phải gọi `updateTag` với tag tương ứng.

```ts
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export async function getPostsByTag(tag: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  const rows = await db.post.findMany({
    where: { ...published, tags: { has: tag } },
    orderBy: newestFirst,
    select: cardSelect,
  });
  return rows.map(toCard);
}
```

### [NX-33] Thêm một màn CMS

1. Tạo `app/cms/<man>/page.tsx` — tự được Proxy bảo vệ (matcher `/cms/((?!upload$).*)`) và kế thừa `noindex` + `maxDuration` từ `app/cms/layout.tsx`.
2. Phần khung (tiêu đề, nút) để ngoài; phần đọc DB đặt trong một async component con bọc `<Suspense fallback={<Skeleton .../>}>`.
3. Trong component con đọc DB trực tiếp (không cache) — CMS cần dữ liệu mới nhất. Nếu component không có `params`/API runtime nào khác, gọi `await connection()` trước truy vấn (giống `app/cms/page.tsx:23`) để truy vấn không chạy lúc build.
4. Có tham số: truyền Promise `params` vào component con và `await` bên trong `<Suspense>` (giống `app/cms/posts/[id]/page.tsx:7-16`); không cần `generateStaticParams`.
5. Form tương tác là Client Component trong `components/cms/`, gọi action theo [NX-34]. Nếu form khởi tạo state từ dữ liệu server, đặt `key` theo phiên bản dữ liệu (ví dụ `updatedAt`).

```tsx
// app/cms/products/page.tsx
import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";

export default function ProductsScreen() {
  return (
    <>
      <h1 className="mb-4 text-2xl">Sản phẩm</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProductList />
      </Suspense>
    </>
  );
}

async function ProductList() {
  await connection();
  const products = await db.product.findMany({ select: { id: true, name: true } });
  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

### [NX-34] Thêm một Server Action

1. Đặt trong `app/cms/actions.ts` (hoặc file `"use server"` khác cùng khuôn). Export `async function`.
2. Luôn bọc thân bằng `run(async () => { ... })` → tự có `requireAdmin()` và kiểu `Result`. File mới thì chép mẫu `run` hoặc tách `run` ra module dùng chung — **không** bỏ `requireAdmin()`.
3. Validate input bằng Zod `safeParse`; lỗi → `throw new Error(<thông báo tiếng Việt>)`.
4. Nhận **ID** + thay đổi, không nhận nguyên bản ghi từ client; đọc lại phần còn lại từ DB.
5. Ghi DB → nếu dữ liệu xuất hiện trên trang public thì gọi `updateTag(POSTS_TAG)` (sau khi ghi, trước khi `return`/`redirect`). Thay đổi chỉ ảnh hưởng màn CMS hiện tại mà không có tag → `refresh()`.
6. Trả object nhỏ chỉ chứa thứ UI cần (`{ id }`, `{ slug }`, `{}`), không trả bản ghi Prisma thô.
7. Client: gọi trong `startTransition`, kiểm `res.ok`, hiện `toast.error(res.error)`.

```ts
// app/cms/actions.ts
export async function renamePost(id: string, title: string) {
  return run(async () => {
    const parsed = z.object({ title: z.string().trim().min(1, "Tiêu đề trống") }).safeParse({ title });
    if (!parsed.success) throw new Error(firstError(parsed.error));
    const post = await db.post.update({ where: { id }, data: { title: parsed.data.title }, select: { slug: true } });
    updateTag(POSTS_TAG);
    return { slug: post.slug };
  });
}
```

```tsx
// components/cms/rename-button.tsx
"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { renamePost } from "@/app/cms/actions";

export function RenameButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const onClick = () =>
    startTransition(async () => {
      const res = await renamePost(id, title);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã đổi tên");
    });
  return <button disabled={pending} onClick={onClick}>Đổi tên</button>;
}
```

### [NX-35] Thêm lượt xem (dữ liệu theo request) mà không phá cache trang public

Mục tiêu: trang `/bai-viet/[slug]` vẫn tĩnh hoàn toàn; số lượt xem được ghi và hiển thị sau khi trang tải. Đây là mẫu chính thức trong `docs/01-app/01-getting-started/07-mutating-data.md` mục "useEffect".

1. **Lưu trữ**: đặt bộ đếm ở bảng riêng (ví dụ `PostStat { postId, views }`), **không** thêm cột vào `Post` — `Post.updatedAt` có `@updatedAt` (`prisma/schema.prisma:25`) và đang được dùng cho `lastModified` của sitemap (`app/sitemap.ts:17`) và `dateModified` của JSON-LD/OpenGraph; cập nhật hàng `Post` ở mỗi lượt xem sẽ làm sai các giá trị này. Chi tiết schema thuộc tài liệu Prisma.
2. **Server Action công khai** (không `requireAdmin`, vì khách gọi): đặt trong file `"use server"` riêng, ví dụ `app/(site)/actions.ts`. Action được POST tới `/bai-viet/<slug>` nên **không** đi qua Proxy (matcher chỉ `/cms`, `/api`). Validate slug, chỉ tăng cho bài `PUBLISHED`, trả `Result`. **Không** gọi `updateTag`/`revalidatePath`/`refresh` ([NX-56]).
3. **Client Component** gọi action trong `useEffect` + `startTransition`; render placeholder ban đầu (phần này nằm trong HTML tĩnh). Dùng `useRef` chống gửi lại khi route hiện lại từ `<Activity>` ([NX-59]).
4. Đặt `<ViewCounter slug={post.slug} />` trong `app/(site)/bai-viet/[slug]/page.tsx`. Không cần `<Suspense>` vì component không suspend khi prerender.
5. Kiểm tra: `npm run build` vẫn ra `○`/tĩnh cho `/bai-viet/[slug]`; lượt xem không làm đổi nội dung cache.
6. Cân nhắc giới hạn tần suất (rate limit) vì action công khai ghi DB (`docs/01-app/02-guides/data-security.md` mục "Rate limiting").

```ts
// app/(site)/actions.ts
"use server";

import { db } from "@/lib/db";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function recordView(slug: string): Promise<Result<{ views: number }>> {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,200}$/.test(slug)) {
    return { ok: false, error: "Đường dẫn không hợp lệ" };
  }
  try {
    const post = await db.post.findFirst({ where: { slug, status: "PUBLISHED" }, select: { id: true } });
    if (!post) return { ok: false, error: "Không tìm thấy bài" };
    const stat = await db.postStat.upsert({
      where: { postId: post.id },
      create: { postId: post.id, views: 1 },
      update: { views: { increment: 1 } },
      select: { views: true },
    });
    return { ok: true, views: stat.views };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Có lỗi xảy ra" };
  }
}
```

```tsx
// components/site/view-counter.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { recordView } from "@/app/(site)/actions";

export function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return; // <Activity> chạy lại effect khi route hiện lại
    sent.current = true;
    startTransition(async () => {
      const res = await recordView(slug);
      if (res.ok) setViews(res.views);
    });
  }, [slug]);

  return <span>{views === null ? "—" : `${views.toLocaleString("vi-VN")} lượt xem`}</span>;
}
```

- Phương án thay thế: Route Handler `POST` — **không** đặt dưới `/api` ([NX-57]); hoặc sửa matcher của `proxy.ts` (là thay đổi bảo mật, cần duyệt).
- Không đọc số lượt xem trong Server Component của `(site)` (dữ liệu không cache → vi phạm `ensureStatic`), và không đưa lượt xem vào `getPostBySlug`.

### [NX-36] Lượt thích / số liệu tương tác hiển thị trên danh sách

1. Ghi (bấm thích): giống [NX-35] — Server Action công khai, gọi từ Client Component, **không** `updateTag`. Trạng thái "đã thích" của người xem lưu phía trình duyệt (cookie/localStorage) và đọc trong Client Component; đọc giá trị chỉ có ở trình duyệt khi render đầu thì dùng `use(browser())` trong `<Suspense>` (`docs/01-app/02-guides/single-page-applications.md` mục "Rendering components only in the browser").
2. Hiển thị **tổng** trên thẻ bài (trang chủ, chuyên mục — đều tĩnh): đọc bằng hàm cached có thời gian sống ngắn hơn `days`, với tag riêng, ví dụ `cacheLife("hours")` + `cacheTag("post-stats")`. Không dùng `cacheLife("seconds")` (bị loại khỏi prerender → vi phạm `ensureStatic='navigation'`). Số liệu sẽ trễ tối đa theo `revalidate` của profile — chấp nhận.
3. Không gọi `updateTag("post-stats")` ở mỗi lượt thích. Nếu cần làm mới sớm hơn, gọi `revalidateTag("post-stats", "max")` có điều tiết (ví dụ từ một tác vụ định kỳ), vẫn không phải mỗi lượt.

```ts
// lib/post-stats.ts
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export async function getStatsBySlugs(slugs: string[]) {
  "use cache";
  cacheLife("hours");
  cacheTag("post-stats");
  const rows = await db.postStat.findMany({
    where: { post: { slug: { in: slugs } } },
    select: { views: true, likes: true, post: { select: { slug: true } } },
  });
  return Object.fromEntries(rows.map((r) => [r.post.slug, { views: r.views, likes: r.likes }]));
}
```

### [NX-37] Thêm Route Handler

1. Endpoint cho admin: đặt dưới `app/api/.../route.ts` — được Proxy Basic Auth bảo vệ; vẫn kiểm `isAuthorized(request.headers.get("authorization"))` trong handler (phòng khi matcher đổi).
2. Endpoint công khai: **không** đặt dưới `/api` ([NX-57]); chọn path khác ngoài matcher.
3. `GET` có dữ liệu: tách truy vấn ra helper `"use cache"`; không đặt `"use cache"` trong thân handler.
4. Vô hiệu cache từ handler (webhook): `revalidateTag(POSTS_TAG, "max")` (cho phép bản cũ trong lúc tạo lại) hoặc `revalidateTag(POSTS_TAG, { expire: 0 })` (hết hạn ngay). Không gọi `updateTag`/`refresh`.

```ts
// app/api/revalidate/route.ts — được proxy.ts bảo vệ bằng Basic Auth
import { revalidateTag } from "next/cache";
import { isAuthorized } from "@/lib/auth";
import { POSTS_TAG } from "@/lib/posts";

export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  revalidateTag(POSTS_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
```

### [NX-38] Metadata/SEO cho trang mới

1. Trang không tham số: `export const metadata`. Trang có tham số: `generateMetadata` chỉ gọi hàm cached.
2. Đặt `title` ngắn (template gốc tự thêm `| Mẹo Vặt Cuộc Sống`), `description`, `alternates.canonical` dạng đường dẫn tương đối (ghép với `metadataBase`).
3. Trang `(site)` không đọc `headers()`/`cookies()` trong `generateMetadata`.
4. Nếu thêm `"use cache"` vào `generateMetadata`, không trả `URL` (dùng chuỗi).
5. Thêm URL vào `app/sitemap.ts`; trang nội bộ thì thêm vào `disallow` của `app/robots.ts` và đặt `robots: { index: false }`.

### [NX-39] Thêm host ảnh

1. Thêm hostname vào `IMAGE_HOSTS` (`lib/images.ts:3`) — tự cập nhật cả `remotePatterns` và validate CMS.
2. Wildcard: dùng `"*.example.com"` chỉ khi ảnh nằm đúng **một** cấp subdomain ([NX-60]).
3. Khởi động lại `next dev` (đổi `next.config.ts` cần khởi động lại — chưa kiểm trong tài liệu cài sẵn, xem phần cuối).

### [NX-40] Gỡ lỗi prerender / tĩnh

1. Chạy `npm run dev` rồi mở đúng URL lỗi: dev overlay chỉ ra dòng code truy cập dữ liệu không cache/runtime, kèm các cách sửa (cache, bỏ truy cập, đọc ở client).
2. Chỉ chạy được build: `next build --debug-prerender` để có stack trace có source map. Nguồn: `docs/01-app/02-guides/keeping-pages-static.md`, `ensureStatic.md` mục "Validation".
3. Trong `(site)`, cách sửa hợp lệ chỉ có: thêm `"use cache"` cho truy vấn, bỏ truy cập runtime, hoặc chuyển sang Client Component ([NX-35]). Bọc `<Suspense>` **không** sửa được lỗi dưới `ensureStatic='navigation'`.

## Bẫy hay gặp

### [NX-50] Comment `lib/posts.ts:6` nói `revalidateTag`, code dùng `updateTag`

- **Triệu chứng:** agent đọc `lib/posts.ts:6` ("khi publish/sửa bài gọi revalidateTag(\"posts\")") rồi viết action mới gọi `revalidateTag("posts")` hoặc `revalidateTag("posts", "max")`. Sau khi Vinh bấm Lưu/Đăng, trang public vẫn hiện nội dung cũ ở lần tải kế tiếp; trang hiện tại không render lại trong response của action.
- **Nguyên nhân:** comment lỗi thời. `revalidateTag` một đối số đã deprecated; `revalidateTag(tag, "max")` là stale-while-revalidate, không re-render trong response của action. Code thật dùng `updateTag(POSTS_TAG)` — `app/cms/actions.ts:88,107,115`.
- **Cách đúng:** trong Server Action dùng `updateTag(POSTS_TAG)`. Chỉ dùng `revalidateTag(tag, "max" | { expire: 0 })` ở Route Handler. Sửa comment `lib/posts.ts:6` thành `updateTag` khi có thay đổi chạm file này (tài liệu này không sửa code).

### [NX-51] Đọc `headers()`/`cookies()` hoặc gọi `requireAdmin()` trong `"use cache"`

- **Triệu chứng:** lỗi `next-request-in-use-cache`; có thể qua `next build` nhưng lỗi khi `next start`.
- **Nguyên nhân:** scope cache cấm API request theo cả call stack; `requireAdmin()` gọi `headers()` (`lib/require-admin.ts:6`).
- **Cách đúng:** kiểm quyền và đọc request **bên ngoài** hàm cached, truyền giá trị cần thiết làm đối số. Hàm trong `lib/posts.ts` không nhận/đọc thông tin người dùng.

### [NX-52] Thêm dữ liệu động vào trang `(site)`

- **Triệu chứng:** build lỗi "Next.js encountered uncached or runtime data on a route that must be fully static", dù đã bọc `<Suspense>`.
- **Nguyên nhân:** `ensureStatic = "navigation"` ở `app/(site)/layout.tsx:6` cấm DB không cache, `connection()`, `cookies()`, `headers()`, `searchParams` server, `cacheLife("seconds")`, và Promise phụ thuộc request truyền sang client — bất kể `<Suspense>`.
- **Cách đúng:** cache truy vấn ([NX-32]); dữ liệu theo người xem/theo request đưa sang Client Component ([NX-35]); tham số query đọc bằng `useSearchParams()` trong Client Component bọc `<Suspense>`. Không đặt `ensureStatic = false` hay mức lỏng hơn ở segment con (build lỗi).

### [NX-53] `generateStaticParams` trả mảng rỗng; build cần DB

- **Triệu chứng:** build lỗi `empty-generate-static-params` hoặc `ensureStatic = "navigation" requires an exported generateStaticParams()`; build trên máy/CI không có DB thì lỗi kết nối.
- **Nguyên nhân:** `app/(site)/bai-viet/[slug]/page.tsx:18-21` lấy slug từ DB lúc build; DB chưa có Bài web `PUBLISHED` → `[]`. Cache Components cấm mảng rỗng.
- **Cách đúng:** đảm bảo DB lúc build có ít nhất một bài đã đăng (seed `npm run db:seed`) và `DATABASE_URL` có ở môi trường build. Không xoá `generateStaticParams`, không trả param giả. Route mới phải trả ≥ 1 phần tử từ nguồn chắc chắn có dữ liệu.

### [NX-54] Ghi dữ liệu public mà quên vô hiệu cache

- **Triệu chứng:** sửa/đăng/gỡ bài xong, trang public vẫn cũ tới 1 ngày.
- **Nguyên nhân:** mọi truy vấn public `cacheLife("days")` (revalidate 1 ngày) — `lib/posts.ts:46,59,72,85,101`; không vô hiệu thì chỉ tự làm mới theo thời gian.
- **Cách đúng:** mọi action thay đổi bài/sản phẩm đã đăng gọi `updateTag(POSTS_TAG)`. Thêm tag mới thì cũng thêm lời gọi `updateTag` tương ứng ở mọi action ghi.

### [NX-55] Gọi `updateTag`/`refresh` ngoài Server Action

- **Triệu chứng:** lỗi "updateTag can only be called from within a Server Action" ở Route Handler, Server Component hoặc script.
- **Nguyên nhân:** `updateTag` và `refresh` chỉ dùng trong Server Action.
- **Cách đúng:** ở Route Handler dùng `revalidateTag(tag, "max")` hoặc `revalidateTag(tag, { expire: 0 })`. Không gọi hàm vô hiệu cache trong lúc render.

### [NX-56] Vô hiệu cache ở mỗi lượt xem/lượt thích

- **Triệu chứng:** sau khi thêm bộ đếm, trang chậm, DB tải cao; mỗi lượt xem làm mọi trang public bị render lại.
- **Nguyên nhân:** action đếm gọi `updateTag(POSTS_TAG)`/`revalidatePath` → xoá cache mọi bài ở mỗi request; hoặc lượt xem được gộp vào `getPostBySlug`.
- **Cách đúng:** theo [NX-35]/[NX-36]: action đếm không vô hiệu cache; tổng số liệu đọc bằng hàm cached riêng với `cacheLife("hours")` và tag riêng.

### [NX-57] Endpoint công khai đặt dưới `/api` bị chặn 401

- **Triệu chứng:** khách truy cập gọi `/api/...` nhận 401 và trình duyệt bật hộp đăng nhập Basic Auth.
- **Nguyên nhân:** `proxy.ts:13` matcher gồm `/api/:path*`; `app/robots.ts:6` cũng disallow `/api/`.
- **Cách đúng:** endpoint công khai dùng Server Action gọi từ trang `(site)` hoặc Route Handler ở path ngoài matcher. Chỉ sửa matcher khi đã duyệt thay đổi bảo mật.

### [NX-58] Bỏ `requireAdmin()` vì "đã có proxy"

- **Triệu chứng:** action mới không gọi `run()`/`requireAdmin()`; có thể gọi trực tiếp bằng POST mà không cần mật khẩu khi action được dùng ở một route ngoài `/cms`.
- **Nguyên nhân:** action là POST tới route đang dùng nó; Proxy chỉ chạy theo matcher. Di chuyển component dùng action sang route khác hoặc đổi matcher sẽ âm thầm bỏ lớp bảo vệ (`proxy.md` mục "Execution order").
- **Cách đúng:** mọi action CMS đi qua `run()` (`app/cms/actions.ts:21-29`). Action công khai (lượt xem) phải được thiết kế là công khai có chủ đích: validate chặt, không chạm dữ liệu quản trị.

### [NX-59] `<Activity>` giữ route ẩn: effect chạy lại, state cũ còn đó

- **Triệu chứng:** lượt xem tăng 2 lần khi người dùng bấm Back về bài; form CMS hiện dữ liệu cũ sau khi quay lại.
- **Nguyên nhân:** với Cache Components, route rời đi được ẩn chứ không unmount; effect bị dọn và **chạy lại** khi hiện lại; state được giữ.
- **Cách đúng:** effect có tác dụng phụ (ghi DB) dùng `useRef` chặn chạy lại ([NX-35]). Form khởi tạo từ dữ liệu server đặt `key` theo phiên bản dữ liệu (như `app/cms/posts/[id]/page.tsx:25`). Xem `docs/01-app/02-guides/preserving-ui-state.md`.

### [NX-60] Wildcard host ảnh lệch giữa CMS và `next/image`

- **Triệu chứng:** CMS chấp nhận URL ảnh nhưng trang public hiện ảnh vỡ, optimizer trả 400.
- **Nguyên nhân:** `isAllowedImageUrl` coi `"*.supabase.co"` là "mọi subdomain ở mọi cấp" (`hostname.endsWith(".supabase.co")` — `lib/images.ts:11`), còn `remotePatterns` hiểu `*` là **đúng một** cấp subdomain.
- **Cách đúng:** giữ host ảnh ở dạng một cấp (`<project>.supabase.co`). Cần nhiều cấp thì dùng `"**.supabase.co"` trong `remotePatterns` và sửa `isAllowedImageUrl` cho khớp trong cùng thay đổi.

### [NX-61] Viết `middleware.ts` hoặc thêm `runtime` vào proxy

- **Triệu chứng:** tạo `middleware.ts` / `export function middleware` theo thói quen; hoặc `export const config = { runtime: ... }` trong `proxy.ts` → lỗi.
- **Nguyên nhân:** convention `middleware` đã deprecated, đổi tên thành `proxy`; Proxy chạy Node.js và cấm option `runtime`.
- **Cách đúng:** sửa `proxy.ts` hiện có, giữ hàm tên `proxy`; một file chỉ một hàm proxy.

### [NX-62] Dùng route segment config cũ

- **Triệu chứng:** build lỗi kiểu `Route segment config "dynamicParams" is not compatible with nextConfig.cacheComponents`.
- **Nguyên nhân:** khi bật Cache Components, `dynamic`, `dynamicParams`, `revalidate`, `fetchCache` bị bỏ; `runtime` không được hỗ trợ; `experimental_ppr` bị xoá.
- **Cách đúng:** thời gian sống → `cacheLife`; ép tĩnh → `ensureStatic`; từ chối param lạ → `notFound()`; ép động → `<Suspense>` + `connection()`/`io()` (chỉ ngoài `(site)`). Các option còn dùng được: `maxDuration`, `ensureStatic`, `instant`, `prefetch` (`preferredRegion` vẫn có nhưng đã deprecated).

### [NX-63] `notFound()` bên trong `<Suspense>` trả 200

- **Triệu chứng:** URL không tồn tại vẫn trả HTTP 200 (kèm `noindex`).
- **Nguyên nhân:** response đã bắt đầu stream từ boundary trước khi `notFound()` chạy.
- **Cách đúng:** trang public: tra dữ liệu và gọi `notFound()` ở cấp page, ngoài `<Suspense>` (như `app/(site)/bai-viet/[slug]/page.tsx:44-45`); `ensureStatic='navigation'` làm request đầu chờ bản tĩnh nên giữ được 404 (comment `app/(site)/layout.tsx:4-5`). Trang CMS (`app/cms/posts/[id]/page.tsx:21`) chấp nhận 200 vì không index.

### [NX-64] Cache lồng nhau / cache quá ngắn

- **Triệu chứng:** build lỗi khi prerender với cache lồng nhau; hoặc trang `(site)` báo vi phạm `ensureStatic` sau khi thêm `cacheLife("seconds")` hay `cacheLife({ expire: 60 })`.
- **Nguyên nhân:** scope ngoài không có `cacheLife` bọc cache ngắn hạn → lỗi; `expire` < 5 phút / `stale` < 30 giây / `revalidate: 0` bị loại khỏi prerender.
- **Cách đúng:** mỗi scope `"use cache"` gọi `cacheLife` tường minh; trong `(site)` dùng tối thiểu `minutes`.

### [NX-65] Giá trị không serialize được qua ranh giới cache/action

- **Triệu chứng:** lỗi serialize khi trả `URL`, instance class, hàm từ hàm `"use cache"`; client nhận nhiều dữ liệu thừa từ action.
- **Nguyên nhân:** `"use cache"` và Server Action serialize đối số/kết quả; tài liệu yêu cầu chỉ trả dữ liệu UI cần.
- **Cách đúng:** map qua DTO (như `toCard` — `lib/posts.ts:31-37`); `Date` dùng được; `URL` đổi thành chuỗi; action trả `{ ok, ...ítTrường }`.

### [NX-66] Cache in-memory và nhiều instance

- **Triệu chứng:** sau khi đăng bài, có request thấy bài mới, có request thấy bài cũ; sau mỗi lần deploy, request đầu chậm.
- **Nguyên nhân:** `"use cache"` mặc định lưu trong bộ nhớ từng instance; vô hiệu tag chỉ có hiệu lực trên instance nhận lời gọi; cache mất khi deploy (khoá chứa build ID).
- **Cách đúng:** chạy một instance, hoặc cấu hình `cacheHandlers` dùng chung (`docs/01-app/03-api-reference/05-config/01-next-config-js/cacheHandlers.md`) trước khi chạy nhiều instance. Nền tảng deploy chưa chốt — xem tài liệu kiến trúc khi có.

### [NX-67] Viết `error.tsx` theo API cũ

- **Triệu chứng:** dùng prop `reset` để "thử lại" nhưng dữ liệu không được tải lại; hoặc quên `"use client"`.
- **Nguyên nhân:** từ v16.3.0 prop chuẩn là `retry()` (tải lại + render lại); `reset()` chỉ xoá trạng thái lỗi.
- **Cách đúng:** `"use client"`, nhận `{ error, retry }: { error: unknown; retry: () => void }`, nút gọi `retry()`. Lỗi ở root layout cần `app/global-error.tsx`.

### [NX-68] `new Date()` / `Math.random()` trong Server Component

- **Triệu chứng:** dev overlay báo cần quyết định giá trị thời gian/ngẫu nhiên; trong `(site)` build lỗi.
- **Nguyên nhân:** Cache Components buộc chọn: chụp một lần vào static shell (`"use cache"`) hay tính mỗi request (`await io()` trong `<Suspense>`). Trong `(site)` chỉ được chọn cách đầu.
- **Cách đúng:** ngày hiển thị lấy từ dữ liệu (`publishedAt`, như `formatDate`); "x phút trước" theo thời gian thực làm ở Client Component với `use(io())` trong `<Suspense>`. Nguồn: `docs/01-app/03-api-reference/04-functions/io.md`, `docs/01-app/01-getting-started/08-caching.md` mục "Random values and timestamps".

## Checklist khi viết workflow / review

Trang public (`app/(site)/**`):

- [ ] Không có truy vấn DB/fetch thiếu `"use cache"`; không `connection()`, `cookies()`, `headers()`, `searchParams` phía server — kể cả trong `<Suspense>` ([NX-52]).
- [ ] Dữ liệu lấy qua hàm cached trong `lib/`, mỗi hàm có `"use cache"` + `cacheLife(...)` tường minh (≥ `minutes`) + `cacheTag(...)` ([NX-32], [NX-64]).
- [ ] Route động có `generateStaticParams` trả ≥ 1 phần tử từ hàm cached; không export `dynamicParams`/`dynamic`/`revalidate`/`runtime` ([NX-53], [NX-62]).
- [ ] `await params` và `notFound()` ở cấp page, ngoài `<Suspense>` ([NX-63]).
- [ ] `generateMetadata` chỉ dùng hàm cached; có `alternates.canonical`; URL mới có trong `app/sitemap.ts` ([NX-38]).
- [ ] Tính năng theo người xem/theo request nằm trong Client Component; không vô hiệu cache mỗi lượt; có chặn effect chạy lại ([NX-35], [NX-56], [NX-59]).
- [ ] `npm run build` thành công và route vẫn tĩnh.

Màn CMS (`app/cms/**`):

- [ ] Đọc DB trong component con bọc `<Suspense>`; có `connection()` hoặc `await params` trước truy vấn ([NX-33]).
- [ ] Form khởi tạo từ dữ liệu server có `key` theo phiên bản dữ liệu ([NX-59]).

Server Action:

- [ ] Nằm trong file `"use server"`; bọc bằng `run()` → có `requireAdmin()`; trả `Result` ([NX-34], [NX-58]).
- [ ] Input validate bằng Zod; nhận ID + thay đổi, không nhận nguyên bản ghi; HTML qua `sanitizePostHtml`.
- [ ] Ghi dữ liệu xuất hiện ở trang public → gọi `updateTag(POSTS_TAG)` trước `return`/`redirect`; không dùng `revalidateTag` một đối số ([NX-50], [NX-54]).
- [ ] Trả object nhỏ, serialize được; lỗi là `Error` với thông báo tiếng Việt ([NX-65]).
- [ ] Action công khai (không `requireAdmin`) được ghi rõ là công khai, validate chặt, không vô hiệu cache ([NX-35]).

Route Handler / Proxy:

- [ ] Endpoint công khai không nằm dưới `/api`; endpoint admin dưới `/api` vẫn tự kiểm `isAuthorized` ([NX-37], [NX-57]).
- [ ] Không gọi `updateTag`/`refresh` trong Route Handler; dùng `revalidateTag(tag, "max" | { expire: 0 })` ([NX-55]).
- [ ] Không tạo `middleware.ts`; không thêm `runtime` vào `proxy.ts`; mọi thay đổi `matcher` được review như thay đổi bảo mật ([NX-61]).

Ảnh và cấu hình:

- [ ] Host ảnh mới thêm vào `IMAGE_HOSTS`; wildcard một cấp khớp cả `isAllowedImageUrl` và `remotePatterns` ([NX-39], [NX-60]).
- [ ] Mọi API Next.js mới dùng đã được đối chiếu với `node_modules/next/dist/docs/` trước khi viết (theo `AGENTS.md`).

## Tham khảo

Tất cả trong `node_modules/next/dist/docs/`:

- Cache Components, PPR: `01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `partialPrefetching.md`, `cacheHandlers.md`; `01-app/01-getting-started/08-caching.md`, `09-revalidating.md`.
- Giữ trang tĩnh: `01-app/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`, `instant.md`, `index.md`; `01-app/02-guides/keeping-pages-static.md`.
- `use cache` và hàm cache: `01-app/03-api-reference/01-directives/use-cache.md`; `01-app/03-api-reference/04-functions/cacheLife.md`, `cacheTag.md`, `updateTag.md`, `revalidateTag.md`, `refresh.md`, `io.md`, `connection.md`, `after.md`, `prefetch.md`, `navigation.md`.
- Cơ chế vô hiệu cache: `01-app/02-guides/how-revalidation-works.md`.
- ISR và route động: `01-app/02-guides/incremental-static-regeneration-cache-components.md`, `01-app/02-guides/migrating-to-cache-components.md`, `01-app/03-api-reference/04-functions/generate-static-params.md`, `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`.
- Server Actions và bảo mật: `01-app/02-guides/server-actions.md`, `01-app/02-guides/data-security.md`, `01-app/03-api-reference/01-directives/use-server.md`, `01-app/01-getting-started/07-mutating-data.md`.
- Proxy: `01-app/03-api-reference/03-file-conventions/proxy.md`, `01-app/01-getting-started/16-proxy.md`.
- Request API: `01-app/03-api-reference/04-functions/headers.md`, `cookies.md`.
- Metadata: `01-app/03-api-reference/04-functions/generate-metadata.md`, `01-app/01-getting-started/14-metadata-and-og-images.md`, `01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`, `robots.md`.
- Route Handlers: `01-app/01-getting-started/15-route-handlers.md`, `01-app/03-api-reference/03-file-conventions/route.md`.
- Ảnh: `01-app/03-api-reference/02-components/image.md`.
- Lỗi và 404: `01-app/03-api-reference/03-file-conventions/error.md`, `not-found.md`; `01-app/03-api-reference/04-functions/not-found.md`.
- Page/Layout props: `01-app/03-api-reference/03-file-conventions/page.md`, `layout.md`; colocation: `01-app/01-getting-started/02-project-structure.md`.
- Chỉ chạy ở trình duyệt: `01-app/02-guides/single-page-applications.md`; giữ state khi điều hướng: `01-app/02-guides/preserving-ui-state.md`.

### Chưa kiểm được trong tài liệu cài sẵn

- `updateTag(POSTS_TAG)` làm mới cả **trang đã prerender** (HTML/RSC của `/bai-viet/[slug]`, `sitemap.xml`) chứ không chỉ mục cache dữ liệu: tài liệu ngụ ý (`09-revalidating.md` mục "What should I cache?" khuyên dùng tag để làm mới static shell) nhưng không mô tả cơ chế gắn tag từ hàm vào trang. Kiểm thực tế bằng `next build && next start` rồi sửa bài.
- Server Action công khai được POST tới trang có `ensureStatic = "navigation"` (công thức [NX-35]): tài liệu không nói rõ có ràng buộc gì; mẫu `useEffect` đếm lượt xem có trong `07-mutating-data.md` nhưng không xét `ensureStatic`. Kiểm bằng build + chạy thử.
- Thứ tự ưu tiên segment tĩnh `bai-viet` so với segment động `[category]` cùng cấp ([NX-21]): không tìm thấy trong tài liệu cài sẵn.
- Đổi `next.config.ts` cần khởi động lại `next dev`: không tìm thấy câu khẳng định trong tài liệu cài sẵn.
- Prisma tự cập nhật `@updatedAt` khi `update`/`updateMany`: thuộc Prisma, chưa kiểm ở đây — xem tài liệu Prisma của dự án.
- Quy tắc file `"use server"` chỉ được export hàm async: tài liệu cài sẵn chỉ nói Server Function phải async (`07-mutating-data.md`), không nói rõ ràng buộc với export không phải hàm.
