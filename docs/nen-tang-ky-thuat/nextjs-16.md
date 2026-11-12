# Next.js 16.4

> Phiên bản: `next` 16.4.3, `react`/`react-dom` 19.3.0, `eslint-config-next` 16.4.3 (`package.json`) · Nguồn: `node_modules/next/dist/docs/01-app/` (đường dẫn cụ thể ở từng mục và ở **Tham khảo**) · Kiểm lần cuối: 2026-11-05 @ 8771851

Mọi đường dẫn tài liệu dạng `docs/01-app/...` bên dưới là tương đối so với `node_modules/next/dist/docs/`. Khi tài liệu này và trí nhớ của agent khác nhau, tin tài liệu này; khi tài liệu này và `node_modules/next/dist/docs/` khác nhau, tin `node_modules` và sửa tài liệu này.

## Tóm tắt cho agent

- **Cache Components đang bật** (`cacheComponents: true`, `partialPrefetching: true` — `next.config.ts:9-10`). Dữ liệu mặc định là **động**; chỉ thứ bọc `"use cache"` mới được đưa vào bản prerender. Không dùng `export const dynamic`, `revalidate`, `fetchCache`, `dynamicParams`, `runtime` — chúng gây lỗi build. Xem [NX-01], [NX-62].
- **Toàn bộ site public phải tĩnh hoàn toàn**: `app/(site)/layout.tsx:6` đặt `ensureStatic = "navigation"`. Trong `app/(site)/**` **cấm** truy vấn DB không cache, `connection()`, `cookies()`, `headers()`, `searchParams` phía server — **kể cả khi bọc `<Suspense>`**. Xem [NX-03], [NX-52].
- Đọc dữ liệu public **chỉ** qua hàm `"use cache"` + `cacheLife(...)` + `cacheTag(...)`: code mới ở `modules/<miền>/queries.ts` (spine AD-7); code cũ hiện có ở `modules/posts/queries.ts`. Xem [NX-22], [NX-32].
- Ghi dữ liệu ảnh hưởng trang public → gọi `updateTag` với tag của **mọi** module có dữ liệu thay đổi (hiện chỉ có `POSTS_TAG`) **trong Server Action** (AD-7). `updateTag` chỉ chạy được trong Server Action; ở Route Handler dùng `revalidateTag(tag, "max")` hoặc `revalidateTag(tag, { expire: 0 })`. Xem [NX-06], [NX-54], [NX-55].
- Comment `modules/posts/queries.ts` ghi `revalidateTag("posts")` là **sai** so với code; code đúng dùng `updateTag` (`app/cms/actions.ts:112,132,143`). Xem [NX-50].
- Mỗi Server Action **tự** kiểm tra quyền bằng `requireAdmin()` (qua `run()` ở `platform/auth/run.ts:5-14`), trả về `Result` `{ ok: true, ... } | { ok: false, error }`, trừ ba ngoại lệ có tên của `[QD-20]`. Không dựa vào `proxy.ts`. Xem [NX-24], [NX-34], [NX-58].
- File chặn request là `proxy.ts` (tên mới của `middleware.ts`), hàm export tên `proxy`. Matcher hiện chặn **cả `/cms/*` (trừ `/cms/upload`) và `/api/*`** bằng Basic Auth — không có endpoint công khai dưới `/api` (spine AD-6). Xem [NX-09], [NX-25], [NX-57].
- Tính năng theo từng request (lượt xem, lượt thích) trên trang public: làm ở **Client Component** gọi action công khai của `[QD-20]` sau khi trang tĩnh đã tải; **không** gọi `updateTag` cho mỗi lượt. Xem [NX-35], [NX-36], [NX-56].
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

- `images.remotePatterns` sinh từ `IMAGE_HOSTS` (`protocol: "https"`, chỉ `hostname`) — `next.config.ts:5-8`, `platform/images.ts:2`.
- `cacheComponents: true` — `next.config.ts:9`; `partialPrefetching: true` — `next.config.ts:10`.
- Turbopack: rule `*.css` qua loader `@tailwindcss/turbopack` — `next.config.ts:11-18`. `next dev`/`next build` dùng Turbopack (`package.json` scripts).
- Không có `cacheLife` tuỳ biến, `cacheHandlers`, `serverActions` trong config → dùng mặc định (body action ≤ 1MB, cache in-memory).

### [NX-21] Cây route và chế độ render

| URL | File | Chế độ | Ghi chú |
| --- | --- | --- | --- |
| (mọi trang) | `app/layout.tsx` | Tĩnh | Root layout: font, `Toaster`, `metadata` gốc — `app/layout.tsx:13-22` |
| `/`, `/[danh-muc]`, `/meo-vat`, `/gom-link`, `/bai-viet/[slug]` | `app/(site)/layout.tsx` | **Tĩnh hoàn toàn** | Route group `(site)` không thêm segment URL; `ensureStatic = "navigation"` — `app/(site)/layout.tsx:4-6` |
| `/` | `app/(site)/page.tsx` | Tĩnh | 3 truy vấn cached song song — `app/(site)/page.tsx:11-15` |
| `/meo-vat`, `/gom-link` (+ `/trang/[n]`) | `app/(site)/{meo-vat,gom-link}/` (Loại bài); Danh mục ở `app/(site)/[danh-muc]/` | Tĩnh | Loại bài: trang `trang/[n]` từ số bài (`staticPageParams`, giữ chỗ `n="2"`); Danh mục: `generateStaticParams` từ `listCategoriesWithPostCounts`, slug lạ → tra `CategorySlugRedirect` → 308 hoặc `notFound()` trước `<Suspense>`; `trang/1` → 308 về trang gốc |
| `/bai-viet/[slug]` | `app/(site)/bai-viet/[slug]/page.tsx` | Tĩnh + ISR | `generateStaticParams` từ DB — `:18-21`; không có bài → `notFound()` — `:45` |
| 404 site | `app/(site)/not-found.tsx` | Tĩnh | |
| `/cms` | `app/cms/page.tsx` | Shell tĩnh + danh sách động | `<Suspense>` + `connection()` + DB không cache — `:15-17`, `:22-27` |
| `/cms/new` | `app/cms/new/page.tsx` | Tĩnh | Form client `NewPostForm` |
| `/cms/upload` (POST), `/uploads/[...path]` (GET) | `app/cms/upload/route.ts`, `app/uploads/[...path]/route.ts` | Động (route handler) | Upload ngoài proxy, tự `requireAdmin()`; phục vụ file từ `UPLOAD_DIR` (Story 2.8) |
| `/cms/posts/[id]` | `app/cms/posts/[id]/page.tsx` | Shell tĩnh + editor động | Không có `generateStaticParams`; `await params` **trong** `<Suspense>` — `:7-21` |
| `/cms/*` | `app/cms/layout.tsx` | | `robots: noindex,nofollow` — `:5-8`; `maxDuration = 120` vì gọi AI (AD-18) — `:10-11` |
| `/sitemap.xml` | `app/sitemap.ts` | Tĩnh (Route Handler đặc biệt) | |
| `/robots.txt` | `app/robots.ts` | Tĩnh | Disallow `/cms`, `/api/` — `:6` |
| `/cms/styleguide` | `app/cms/styleguide/page.tsx` | | Trang duyệt design system, sau Basic Auth, `noindex` — `:13-14` |

- Không có `app/api/` (Route Handler) nào; không có `loading.tsx`, `error.tsx`, `global-error.tsx`.
- `[category]` và `/bai-viet/[slug]` cùng cấp trong `(site)`: segment tĩnh `bai-viet` được ưu tiên hơn segment động `[category]` (hành vi định tuyến chuẩn; chưa tìm thấy câu khẳng định trong tài liệu cài sẵn — đừng đặt slug Danh mục trùng `bai-viet`).

### [NX-22] Lớp đọc dữ liệu public — `modules/posts/queries.ts`

- Năm hàm, mỗi hàm cùng một khuôn `"use cache"` → `cacheLife("days")` → `cacheTag(POSTS_TAG)` → truy vấn Prisma:
  - `getLatestPosts(limit)` — `modules/posts/queries.ts`
  - `getPostsByType(postType, limit?)` — `modules/posts/queries.ts` (`category` ở đây là Loại bài, lọc `Post.postType` — `[NO-20]`)
  - `getRelatedPosts(slug, category, limit = 3)` — `modules/posts/queries.ts`
  - `getPostBySlug(slug)` — `modules/posts/queries.ts` (trả `null` nếu không có/chưa đăng)
  - `getPublishedSlugs()` — `modules/posts/queries.ts` (dùng cho `generateStaticParams` và sitemap)
- `POSTS_TAG = "posts"` — `modules/posts/queries.ts`. Mọi hàm chỉ lấy `status: "PUBLISHED"` — `modules/posts/queries.ts`.
- Đối số là primitive (`string`, `number`, union `PostType`) → khoá cache ổn định. Giá trị trả về là object thường + `Date` → serialize được.
- Một tag chung cho mọi thứ: mọi lần ghi gọi `updateTag("posts")` làm mới toàn bộ danh sách + chi tiết + sitemap. Chấp nhận được vì lượng bài nhỏ và chỉ Vinh ghi. Spine AD-7: khi có module `products`, query đọc Sản phẩm gắn thêm tag của `products`.

### [NX-23] Lớp đọc dữ liệu CMS

- CMS đọc DB **không cache**, luôn trong `<Suspense>`. Code cũ dưới đây gọi `db` thẳng trong page (miễn luật ESLint qua `LEGACY_APP_FILES`); code mới đọc qua `modules/<miền>/cms-queries.ts` (spine AD-5, AD-7):
  - `/cms`: `PostList` gọi `await connection()` rồi `db.post.findMany` — `app/cms/page.tsx:22-27`. `connection()` đảm bảo truy vấn không chạy lúc build/prefetch.
  - `/cms/posts/[id]`: `Editor` nhận Promise `params`, await bên trong `<Suspense>` — `app/cms/posts/[id]/page.tsx:7-21`. `notFound()` ở `:21` chạy sau khi đã stream → trả 200 + `noindex` (chấp nhận được cho CMS, xem [NX-63]).
- `PostEditor` được gắn `key={post.updatedAt.toISOString()}` — `app/cms/posts/[id]/page.tsx:25` → khi dữ liệu đổi, state form được tạo lại thay vì giữ state cũ (quan trọng vì [NX-59]).

### [NX-24] Server Actions — `app/cms/actions.ts` (code cũ, đích `modules/<miền>/actions.ts`)

- File có `"use server"` ở dòng 1 — mọi export là Server Action.
- Kiểu kết quả: `type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }` — `platform/errors.ts:9`.
- Bộ bọc `run(fn)` — `platform/auth/run.ts:5-14`: `await requireAdmin()` → chạy `fn` → trả `{ ok: true, ...kếtQuả }`; bắt **mọi** lỗi: `UserError` → `{ ok: false, error: e.message }`; lỗi khác → `console.error` và `{ ok: false, error: "Có lỗi xảy ra, thử lại sau" }`. Hệ quả: chỉ thông báo `UserError` tiếng Việt hiện thẳng cho người dùng qua `toast.error` (`components/cms/new-post-form.tsx:28-31`, `components/cms/post-editor.tsx:55-61`).
- Validate input bằng Zod `safeParse` rồi ném `UserError(firstError(...))` — `app/cms/actions.ts:50-51`, `:98-99`. HTML luôn qua `sanitizePostHtml` — `:79`, `:106`.
- Gọi `updateTag(POSTS_TAG)` sau khi ghi:
  - `savePost` — `app/cms/actions.ts:112`
  - `setPostStatus` — `app/cms/actions.ts:132`
  - `deletePost` — `app/cms/actions.ts:143`
  - `createPost` **không** gọi — `app/cms/actions.ts:48-94` — đúng, vì bài mới luôn là bản nháp (không có trong truy vấn public).
- Action chỉ đọc (`runSeoCheck`, `runThreads`) vẫn đi qua `run()` để kiểm quyền — `app/cms/actions.ts:148-162`.
- Client gọi action trong `startTransition`, kiểm `res.ok`, rồi `router.push(...)` — `components/cms/new-post-form.tsx:24-34`, `components/cms/post-editor.tsx:44-53`, `:84`.

### [NX-25] Proxy và xác thực

- `proxy.ts:4-10`: Basic Auth — header `authorization` hợp lệ → `NextResponse.next()`; ngược lại trả 401 + `WWW-Authenticate: Basic realm="CMS"`.
- `proxy.ts:14`: `matcher: ["/cms", "/cms/((?!upload$).*)", "/api/:path*"]` (AD-24; `/cms/upload` tự `requireAdmin()`).
- `platform/auth/basic-auth.ts:7-13`: so khớp `ADMIN_USERNAME:ADMIN_PASSWORD` bằng `timingSafeEqual` trên SHA-256; thiếu biến môi trường → luôn từ chối.
- `platform/auth/require-admin.ts:6-10`: `requireAdmin()` đọc `(await headers()).get("authorization")` và ném `UserError("Bạn cần đăng nhập CMS")`. Comment `:5` ghi rõ lý do: action có thể bị POST trực tiếp.
- Vì action được POST tới route đang dùng chúng (`/cms/...`), action CMS hiện được kiểm tra **hai lớp**: Proxy (matcher `/cms`) và `requireAdmin()`.

### [NX-26] SEO

- Root `metadata`: `metadataBase: new URL(SITE_URL)`, `title.template: "%s | Mẹo Cuộc Sống"`, `openGraph: SITE_OPEN_GRAPH` (`siteName`, `locale: "vi_VN"`, ảnh mặc định; `platform/site.ts`) — `app/layout.tsx`. Next gộp metadata nông: trang tự đặt `openGraph` phải trải `...SITE_OPEN_GRAPH` và thêm `url` = canonical. `SITE_URL` lấy từ `NEXT_PUBLIC_SITE_URL` — `platform/site.ts:2`.
- `generateMetadata` của trang Danh mục / Loại bài: `listPageMetadata` (`app/(site)/_components/list-page-metadata.ts`), `alternates.canonical` và `openGraph.url` tương đối, meta description = mô tả (Danh mục thiếu mô tả dùng `defaultCategoryDescription`; trang n > 1 thêm "– Trang n"); Danh mục / Loại bài chưa có bài: `noindex`, ngoài sitemap.
- `generateMetadata` của Bài web: gọi `getPostBySlug` (đã cache) nên hợp lệ dưới `ensureStatic='navigation'`; `openGraph.type: "article"`, `publishedTime`, `modifiedTime` — `app/(site)/bai-viet/[slug]/page.tsx:23-41`.
- JSON-LD `Article` + `BreadcrumbList` qua `app/(site)/_components/json-ld.tsx` (escape `<`) — `app/(site)/bai-viet/[slug]/page.tsx:54-79`.
- `sitemap.ts` dùng `getPublishedSlugs()` (đã cache, tag `posts`) — `app/sitemap.ts:6-22`. `robots.ts` — `app/robots.ts:4-9`.
- CMS: `robots: { index: false, follow: false }` — `app/cms/layout.tsx:5-8`.

### [NX-27] Ảnh

- Host cho phép: `down-vn.img.susercontent.com`, `cf.shopee.vn` — `platform/images.ts:2`; dùng chung cho `remotePatterns` và validate form CMS (`isAllowedImageUrl` — `platform/images.ts:6-15`).
- Ảnh hero/bài dùng `fill` + `sizes` + `priority` — `app/(site)/page.tsx:27-34`, `app/(site)/bai-viet/[slug]/page.tsx:96-103`. Ảnh thiếu → `/placeholder.svg` (tự `unoptimized` vì đuôi `.svg`).

### [NX-28] Kiểu cho page/layout

- Dùng helper toàn cục, không import: `PageProps<"/bai-viet/[slug]">` (`app/(site)/bai-viet/[slug]/page.tsx:23,43`), `LayoutProps<"/">` (`app/layout.tsx:25`), `LayoutProps<"/cms">` (`app/cms/layout.tsx:13`). Helper được sinh khi chạy `next dev`/`next build`/`next typegen`. Nguồn: `docs/01-app/03-api-reference/03-file-conventions/page.md`, `layout.md`.
- Tham số route là chuỗi literal theo URL (không kèm route group): `"/[category]"`, không phải `"/(site)/[category]"`.

## Công thức

### [NX-30] Thêm một trang public tĩnh (không tham số)

1. Tạo `app/(site)/<duong-dan>/page.tsx`. Trang tự kế thừa `ensureStatic = "navigation"`; không đặt lại.
2. `page.tsx` mỏng (spine AD-12): chỉ metadata, `<Suspense fallback={<XSkeleton />}>` và một `<XScreen />`. Screen và skeleton đặt ở `_components/` cạnh route (`<x>-screen.tsx`, `<x>-skeleton.tsx`); Screen đọc dữ liệu bằng hàm cached trong `modules/<miền>/queries.ts` ([NX-32]). Không gọi `db` trực tiếp; không import `@/lib/*` (ESLint chặn trong route mới) — hàm cần dùng còn ở `modules/posts/queries.ts` thì chuyển nó trước theo `docs/cong-thuc/chuyen-code-cu.md`.
3. Khai báo `metadata` tĩnh, có `alternates.canonical`.
4. Thêm URL vào `app/sitemap.ts`.
5. Chạy `npm run build`; lỗi "uncached or runtime data on a route that must be fully static" → xem [NX-40].

```tsx
// app/(site)/gioi-thieu/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutScreen } from "./_components/about-screen";
import { AboutSkeleton } from "./_components/about-skeleton";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Về Mẹo Cuộc Sống.",
  alternates: { canonical: "/gioi-thieu" },
};

export default function AboutPage() {
  return (
    <Suspense fallback={<AboutSkeleton />}>
      <AboutScreen />
    </Suspense>
  );
}

// app/(site)/gioi-thieu/_components/about-screen.tsx
import { getLatestPosts } from "@/modules/posts/queries";

export async function AboutScreen() {
  const latest = await getLatestPosts(3); // cached → nằm trong bản prerender
  return <div className="mx-auto max-w-3xl px-4 py-10">{/* ... */}</div>;
}
```

### [NX-31] Thêm trang public có tham số động

1. Export `generateStaticParams` trả **ít nhất một** bộ tham số đầy đủ, lấy từ hàm cached ([NX-53]).
2. Trong `page.tsx`, `await params`, tra dữ liệu bằng hàm cached, không có → `notFound()` (đổi slug → `permanentRedirect()`, AD-20) **trước** `<Suspense>`, rồi truyền dữ liệu cho Screen (spine AD-12). Gọi trong `<Suspense>` thì response đã stream, `notFound()` trả HTTP 200.
3. `generateMetadata` chỉ dùng hàm cached; không tồn tại → `return {}`.
4. Không export `dynamicParams`, `revalidate`, `dynamic`.

```tsx
// app/(site)/the/[tag]/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPostsByTag, getAllTags } from "@/modules/posts/queries"; // hàm mới, theo [NX-32]
import { TagScreen } from "./_components/tag-screen";
import { TagSkeleton } from "./_components/tag-skeleton";

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
  if (posts.length === 0) notFound(); // trước Suspense → HTTP 404 thật
  return (
    <Suspense fallback={<TagSkeleton />}>
      <TagScreen tag={tag} posts={posts} />
    </Suspense>
  );
}
```

### [NX-32] Thêm một truy vấn public có cache

1. Viết trong `modules/<miền>/queries.ts` của module chủ (file mở đầu `import "server-only"`, spine AD-5, AD-8), hàm `async`. Không tạo file mới trong `lib/`.
2. Ba dòng đầu thân hàm: `"use cache";` → `cacheLife(...)` → `cacheTag(...)` với tag của **mọi** module có bảng mà hàm đọc — trả về, lọc, đếm hay sắp xếp (spine AD-7; tag ở `tags.ts` của từng module).
3. Trả Sản phẩm (kể cả ảnh dự phòng từ Sản phẩm) thì dùng `visibleProductWhere`/`publicProductSelect` của `modules/products/queries.ts` và gắn thêm tag `products` (AD-7). Không cần Sản phẩm thì bỏ hẳn khỏi `select`.
4. Đối số chỉ là primitive/object thường; trả về object thường (map qua DTO), không trả instance class.
5. Không đọc `headers()`, `cookies()`, `searchParams`, không gọi `requireAdmin()` bên trong.
6. Mọi Server Action ghi vào dữ liệu này phải gọi `updateTag` với tag tương ứng.

```ts
// modules/posts/queries.ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/platform/db";
import { POSTS_TAG } from "@/modules/posts/tags";

// Thẻ bài không kèm ảnh Sản phẩm → chỉ đọc bảng Post → chỉ tag posts.
const tagCardSelect = { slug: true, title: true, excerpt: true, featuredImage: true, publishedAt: true } as const;

export async function getPostsByTag(tag: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  return db.post.findMany({
    where: { status: "PUBLISHED", tags: { has: tag } },
    orderBy: { publishedAt: "desc" },
    select: tagCardSelect,
  });
}
```

### [NX-33] Thêm một màn CMS

1. Tạo `app/cms/<man>/page.tsx` (đường dẫn tiếng Việt theo Structural Seed) — tự được Proxy bảo vệ (matcher `/cms/((?!upload$).*)`) và kế thừa `noindex` + `maxDuration` từ `app/cms/layout.tsx`.
2. `page.tsx` chỉ gồm metadata + `<Suspense fallback={<XSkeleton />}>` + `<XScreen />` (spine AD-12); Screen và skeleton ở `_components/` cạnh route.
3. Screen đọc qua `modules/<miền>/cms-queries.ts` (không cache) — CMS cần dữ liệu mới nhất; `app/` không import `@/platform/db` (ESLint). Nếu Screen không có `params`/API runtime nào khác, gọi `await connection()` trước truy vấn (giống `app/cms/page.tsx:23`) để truy vấn không chạy lúc build.
4. Có tham số: truyền Promise `params` vào Screen và `await` bên trong `<Suspense>`; Screen CMS gọi `notFound()` trong `<Suspense>` (chấp nhận HTTP 200 vì CMS không index — AD-12); không cần `generateStaticParams`.
5. Form tương tác là Client Component `modules/<miền>/components/<x>-form.client.tsx` (spine AD-11, AD-14), gọi action theo [NX-34].

```tsx
// app/cms/san-pham/page.tsx
import { Suspense } from "react";
import { ProductListScreen } from "./_components/product-list-screen";
import { ProductListSkeleton } from "./_components/product-list-skeleton";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListScreen />
    </Suspense>
  );
}

// app/cms/san-pham/_components/product-list-screen.tsx
import { connection } from "next/server";
import { listProductsForCms } from "@/modules/products/cms-queries";

export async function ProductListScreen() {
  await connection();
  const products = await listProductsForCms();
  return (
    <>
      <h1 className="mb-4 text-2xl">Sản phẩm</h1>
      <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
    </>
  );
}
```

### [NX-34] Thêm một Server Action

1. Đặt trong `modules/<miền>/actions.ts` của module chủ bảng bị ghi (`"use server"` ở dòng 1); ghi DB ở `service.ts` cùng module (spine AD-5, AD-6). Không thêm action vào `app/cms/actions.ts` (code cũ). Khuôn đầy đủ: `docs/cong-thuc/them-server-action.md`.
2. Luôn bọc thân bằng `run(async () => { ... })` import từ `@/platform/auth/run` → tự có `requireAdmin()` và kiểu `Result`. Không chép `run`, **không** bỏ `requireAdmin()`.
3. Nhận một tham số `input` (id nằm trong `input`), validate bằng Zod `safeParse` (schema ở `schema.ts` của module); lỗi → `throw new UserError(<thông báo tiếng Việt>)`.
4. Nhận **ID** + thay đổi, không nhận nguyên bản ghi từ client; đọc lại phần còn lại từ DB.
5. Ghi DB → gọi `updateTag` với tag của **mọi** module có dữ liệu thay đổi (AD-7), sau khi ghi, trước khi `return`/`redirect`. Thay đổi chỉ ảnh hưởng màn CMS hiện tại mà không có tag → `refresh()`.
6. Trả object nhỏ chỉ chứa thứ UI cần (`{ id }`, `{ slug }`, `{}`), không trả bản ghi Prisma thô.
7. Client: form nhiều trường dùng React Hook Form + `zodResolver` với cùng schema (AD-14); form một trường gọi trong `startTransition`, kiểm `res.ok`, hiện `toast.error(res.error)`.

```ts
// modules/posts/actions.ts
export async function renamePost(input: RenamePostInput) {
  return run(async () => {
    const parsed = renamePostInputSchema.safeParse(input); // modules/posts/schema.ts — { id, title }
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const post = await renamePostRecord(parsed.data); // modules/posts/service.ts
    updateTag(POSTS_TAG);
    return { slug: post.slug };
  });
}
```

```tsx
// modules/posts/components/rename-button.client.tsx — form một trường
"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { renamePost } from "@/modules/posts/actions";

export function RenameButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const onClick = () =>
    startTransition(async () => {
      const res = await renamePost({ id, title });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã đổi tên");
    });
  return <button disabled={pending} onClick={onClick}>Đổi tên</button>;
}
```

### [NX-35] Thêm lượt xem (dữ liệu theo request) mà không phá cache trang public

Mục tiêu: trang `/bai-viet/[slug]` vẫn tĩnh hoàn toàn; số lượt xem được ghi và hiển thị sau khi trang tải. Đây là mẫu chính thức trong `docs/01-app/01-getting-started/07-mutating-data.md` mục "useEffect". Quy tắc nghiệp vụ ở spine AD-23. **Code thật (Epic 7):** `modules/engagement/actions.ts` (`recordPostView`, nhận `postId`), `modules/engagement/components/post-view-tracker.client.tsx` (không hiện số — site không công khai Lượt xem, UX Q5), giới hạn tần suất `platform/rate-limit.ts`, bot `platform/bot.ts`; ví dụ dưới đây là bản rút gọn ban đầu, khi lệch thì theo code.

1. **Lưu trữ**: bộ đếm ở bảng riêng của module `engagement` (`PostStat { postId, views, likes }`, `PostViewDaily` — spine AD-23, `prisma/schema/engagement.prisma`), **không** thêm cột vào `Post` — `Post.updatedAt` có `@updatedAt` (`prisma/schema/posts.prisma:18`) và đang được dùng cho `lastModified` của sitemap (`app/sitemap.ts:17`) và `dateModified` của JSON-LD/OpenGraph; cập nhật hàng `Post` ở mỗi lượt xem sẽ làm sai các giá trị này.
2. **Server Action công khai** trong `modules/engagement/actions.ts` — ngoại lệ có tên của `[QD-20]` (spine AD-6): không `run()`/`requireAdmin()`; validate bằng `safeParse` của `modules/engagement/schema.ts`; **bắt buộc** giới hạn tần suất (bộ nhớ tiến trình, theo băm IP có thời hạn ngắn, không ghi DB hay log — AD-23); ghi qua `modules/engagement/service.ts`; chỉ tăng cho bài `PUBLISHED`; bỏ qua user-agent bot. **Không** gọi `updateTag`/`revalidatePath`/`refresh` ([NX-56]). Không `console.error` trong action công khai (log chỉ ở `run()` và `platform/ai`): lỗi bất ngờ trả `UNEXPECTED_ERROR`.
3. **Chống trùng phía client**: `localStorage` của trình duyệt (không cookie); trình duyệt của Vinh tự đánh dấu khi vào `/cms` và không gửi lượt xem (AD-23).
4. **Client Component** `modules/engagement/components/view-counter.client.tsx` gọi action trong `useEffect` + `startTransition`; render placeholder ban đầu (phần này nằm trong HTML tĩnh). Dùng `useRef` chống gửi lại khi route hiện lại từ `<Activity>` ([NX-59]). Hiển thị số qua `formatCount` của `@/platform/format` (AD-27).
5. Đặt `<ViewCounter slug={post.slug} />` trong Screen của trang bài (`_components/`), không trong `page.tsx` (AD-12).
6. Kiểm tra: `npm run build` vẫn ra `○`/tĩnh cho `/bai-viet/[slug]`; lượt xem không làm đổi nội dung cache.

```ts
// modules/engagement/actions.ts — ngoại lệ có tên của [QD-20], không run()/requireAdmin()
"use server";

import { UNEXPECTED_ERROR, type Result } from "@/platform/errors";
import { recordViewInputSchema } from "@/modules/engagement/schema";
import { recordPostView } from "@/modules/engagement/service";

export async function recordView(input: unknown): Promise<Result<{ views: number }>> {
  const parsed = recordViewInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dữ liệu không hợp lệ" };
  // Bắt buộc: giới hạn tần suất theo băm IP trong bộ nhớ tiến trình (AD-23) — `platform/rate-limit.ts` (Epic 7),
  // không tự tạo file ngoài hợp đồng AD-5. Vượt giới hạn → { ok: false, error: "Thao tác quá nhanh, thử lại sau" }.
  try {
    const views = await recordPostView(parsed.data.slug); // chỉ bài PUBLISHED; null nếu không có
    if (views === null) return { ok: false, error: "Không tìm thấy bài" };
    return { ok: true, views };
  } catch {
    return { ok: false, error: UNEXPECTED_ERROR };
  }
}
```

```tsx
// modules/engagement/components/view-counter.client.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { formatCount } from "@/platform/format";
import { recordView } from "@/modules/engagement/actions";

const SEEN_KEY = "da-xem:"; // chống trùng bằng localStorage (AD-23)

export function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return; // <Activity> chạy lại effect khi route hiện lại
    sent.current = true;
    if (localStorage.getItem("cms-admin") || localStorage.getItem(SEEN_KEY + slug)) return;
    startTransition(async () => {
      const res = await recordView({ slug });
      if (!res.ok) return;
      localStorage.setItem(SEEN_KEY + slug, "1");
      setViews(res.views);
    });
  }, [slug]);

  return <span>{views === null ? "—" : `${formatCount(views)} lượt xem`}</span>;
}
```

- Không dùng Route Handler công khai thay cho action: spine AD-6 chỉ cho ba ngoại lệ có tên và không có endpoint công khai dưới `/api` ([NX-57]).
- Không đọc số lượt xem trong Server Component của `(site)` (dữ liệu không cache → vi phạm `ensureStatic`), và không đưa lượt xem vào `getPostBySlug`. Số tim của một bài đọc phía client qua action đọc công khai của `modules/engagement/actions.ts` sau khi mount (AD-6).

### [NX-36] Lượt thích / số liệu tương tác hiển thị trên danh sách

1. Ghi (bấm thích): giống [NX-35] — action công khai của `modules/engagement/actions.ts`, gọi từ Client Component, giới hạn tần suất, **không** `updateTag`. Trạng thái "đã thích" của người xem lưu trong `localStorage` và đọc trong Client Component; đọc giá trị chỉ có ở trình duyệt khi render đầu thì dùng `use(browser())` trong `<Suspense>` (`docs/01-app/02-guides/single-page-applications.md` mục "Rendering components only in the browser").
2. Hiển thị **tổng** hoặc "Xem nhiều" trên trang tĩnh: đọc bằng hàm cached trong `modules/engagement/queries.ts` với `cacheLife` cố định ngắn hơn `days`, gắn `ENGAGEMENT_TAG` (`"engagement"`, `modules/engagement/tags.ts`) cùng `POSTS_TAG` vì có đọc bảng `Post` (AD-7, AD-23). Không dùng `cacheLife("seconds")` (bị loại khỏi prerender → vi phạm `ensureStatic='navigation'`). Số liệu trễ tối đa theo `revalidate` của profile — chấp nhận.
3. Không gọi `updateTag(ENGAGEMENT_TAG)` ở mỗi lượt thích (AD-23).

```ts
// modules/engagement/queries.ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/platform/db";
import { POSTS_TAG } from "@/modules/posts/tags";
import { ENGAGEMENT_TAG } from "@/modules/engagement/tags";

export async function getStatsBySlugs(slugs: string[]) {
  "use cache";
  cacheLife("hours");
  cacheTag(ENGAGEMENT_TAG, POSTS_TAG);
  const rows = await db.postStat.findMany({
    where: { post: { slug: { in: slugs }, status: "PUBLISHED" } },
    select: { views: true, likes: true, post: { select: { slug: true } } },
  });
  return Object.fromEntries(rows.map((r) => [r.post.slug, { views: r.views, likes: r.likes }]));
}
```

### [NX-37] Thêm Route Handler

Spine AD-6 chỉ có **một** Route Handler: `app/cms/upload/route.ts` (AD-24). Thêm Route Handler khác (kể cả endpoint quản trị dưới `/api`, webhook) là thay đổi kiến trúc: sửa spine trước, không tự thêm.

1. `app/cms/upload/route.ts` nằm ngoài matcher của `proxy.ts`: gọi `requireAdmin()` trước khi đọc body; thiếu quyền trả 401 kèm `WWW-Authenticate` cùng realm với `proxy.ts`; kiểm loại và dung lượng; gọi `platform/storage.put(file) → { url }` (đích).
2. Route Handler tự `export const maxDuration` nếu cần; không nhận từ layout.
3. `GET` có dữ liệu: tách truy vấn ra helper `"use cache"`; không đặt `"use cache"` trong thân handler.
4. Vô hiệu cache từ handler: `revalidateTag(tag, "max")` hoặc `revalidateTag(tag, { expire: 0 })`. Không gọi `updateTag`/`refresh` (chỉ chạy trong Server Action).

### [NX-38] Metadata/SEO cho trang mới

1. Trang không tham số: `export const metadata`. Trang có tham số: `generateMetadata` chỉ gọi hàm cached.
2. Đặt `title` ngắn (template gốc tự thêm `| Mẹo Cuộc Sống`), `description`, `alternates.canonical` dạng đường dẫn tương đối (ghép với `metadataBase`), `openGraph: { ...SITE_OPEN_GRAPH, url: <canonical> }`.
3. Trang `(site)` không đọc `headers()`/`cookies()` trong `generateMetadata`.
4. Nếu thêm `"use cache"` vào `generateMetadata`, không trả `URL` (dùng chuỗi).
5. Thêm URL vào `app/sitemap.ts`; trang nội bộ thì thêm vào `disallow` của `app/robots.ts` và đặt `robots: { index: false }`.

### [NX-39] Thêm host ảnh

1. Thêm hostname vào `IMAGE_HOSTS` (`platform/images.ts:2`) — tự cập nhật cả `remotePatterns` và validate CMS.
2. Không dùng wildcard: `isAllowedImageUrl` so khớp hostname đúng từng chữ ([NX-60]).
3. Khởi động lại `next dev` (đổi `next.config.ts` cần khởi động lại — chưa kiểm trong tài liệu cài sẵn, xem phần cuối).

### [NX-40] Gỡ lỗi prerender / tĩnh

1. Chạy `npm run dev` rồi mở đúng URL lỗi: dev overlay chỉ ra dòng code truy cập dữ liệu không cache/runtime, kèm các cách sửa (cache, bỏ truy cập, đọc ở client).
2. Chỉ chạy được build: `next build --debug-prerender` để có stack trace có source map. Nguồn: `docs/01-app/02-guides/keeping-pages-static.md`, `ensureStatic.md` mục "Validation".
3. Trong `(site)`, cách sửa hợp lệ chỉ có: thêm `"use cache"` cho truy vấn, bỏ truy cập runtime, hoặc chuyển sang Client Component ([NX-35]). Bọc `<Suspense>` **không** sửa được lỗi dưới `ensureStatic='navigation'`.

## Bẫy hay gặp

### [NX-50] Comment `modules/posts/queries.ts` nói `revalidateTag`, code dùng `updateTag`

- **Triệu chứng:** agent đọc `modules/posts/queries.ts` ("khi publish/sửa bài gọi revalidateTag(\"posts\")") rồi viết action mới gọi `revalidateTag("posts")` hoặc `revalidateTag("posts", "max")`. Sau khi Vinh bấm Lưu/Đăng, trang public vẫn hiện nội dung cũ ở lần tải kế tiếp; trang hiện tại không render lại trong response của action.
- **Nguyên nhân:** comment lỗi thời. `revalidateTag` một đối số đã deprecated; `revalidateTag(tag, "max")` là stale-while-revalidate, không re-render trong response của action. Code thật dùng `updateTag(POSTS_TAG)` — `app/cms/actions.ts:112,132,143`.
- **Cách đúng:** trong Server Action dùng `updateTag(POSTS_TAG)`. Chỉ dùng `revalidateTag(tag, "max" | { expire: 0 })` ở Route Handler. Sửa comment này khi chuyển `modules/posts/queries.ts` sang `modules/posts/queries.ts` (`[NO-16]`).

### [NX-51] Đọc `headers()`/`cookies()` hoặc gọi `requireAdmin()` trong `"use cache"`

- **Triệu chứng:** lỗi `next-request-in-use-cache`; có thể qua `next build` nhưng lỗi khi `next start`.
- **Nguyên nhân:** scope cache cấm API request theo cả call stack; `requireAdmin()` gọi `headers()` (`platform/auth/require-admin.ts:7`).
- **Cách đúng:** kiểm quyền và đọc request **bên ngoài** hàm cached, truyền giá trị cần thiết làm đối số. Hàm trong `modules/posts/queries.ts` không nhận/đọc thông tin người dùng.

### [NX-52] Thêm dữ liệu động vào trang `(site)`

- **Triệu chứng:** build lỗi "Next.js encountered uncached or runtime data on a route that must be fully static", dù đã bọc `<Suspense>`.
- **Nguyên nhân:** `ensureStatic = "navigation"` ở `app/(site)/layout.tsx:6` cấm DB không cache, `connection()`, `cookies()`, `headers()`, `searchParams` server, `cacheLife("seconds")`, và Promise phụ thuộc request truyền sang client — bất kể `<Suspense>`.
- **Cách đúng:** cache truy vấn ([NX-32]); dữ liệu theo người xem/theo request đưa sang Client Component ([NX-35]); tham số query đọc bằng `useSearchParams()` trong Client Component bọc `<Suspense>`. Không đặt `ensureStatic = false` hay mức lỏng hơn ở segment con (build lỗi).

### [NX-53] `generateStaticParams` trả mảng rỗng; build cần DB

- **Triệu chứng:** build lỗi `empty-generate-static-params` hoặc `ensureStatic = "navigation" requires an exported generateStaticParams()`; build trên máy/CI không có DB thì lỗi kết nối.
- **Nguyên nhân:** `app/(site)/bai-viet/[slug]/page.tsx:18-21` lấy slug từ DB lúc build; DB chưa có Bài web `PUBLISHED` → `[]`. Cache Components cấm mảng rỗng.
- **Cách đúng:** đảm bảo DB lúc build có ít nhất một bài đã đăng (seed `npm run db:seed`) và `DATABASE_URL` có ở môi trường build. Không xoá `generateStaticParams`, không trả param giả. Route mới phải trả ≥ 1 phần tử từ nguồn chắc chắn có dữ liệu. **Ngoại lệ duy nhất** (spine AD-7): route phân trang `…/trang/[n]` không có trang nào từ `n = 2` thì trả một tham số giữ chỗ `n = "2"` (với `[danh-muc]` là của Danh mục đầu tiên) để page gọi `notFound()` lúc prerender; `n = 1` thì `permanentRedirect` về trang gốc.

### [NX-54] Ghi dữ liệu public mà quên vô hiệu cache

- **Triệu chứng:** sửa/đăng/gỡ bài xong, trang public vẫn cũ tới 1 ngày.
- **Nguyên nhân:** mọi truy vấn public `cacheLife("days")` (revalidate 1 ngày) — `modules/posts/queries.ts`; không vô hiệu thì chỉ tự làm mới theo thời gian.
- **Cách đúng:** mọi action thay đổi dữ liệu public gọi `updateTag` với tag của **mọi** module có dữ liệu thay đổi (AD-7; hiện chỉ có `POSTS_TAG`). Thêm tag mới thì cũng thêm lời gọi `updateTag` tương ứng ở mọi action ghi.

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
- **Nguyên nhân:** `proxy.ts:14` matcher gồm `/api/:path*`; `app/robots.ts:6` cũng disallow `/api/`.
- **Cách đúng:** dữ liệu công khai theo request dùng action công khai của `[QD-20]` gọi từ Client Component trên trang `(site)` (spine AD-6). Không thêm endpoint công khai; sửa matcher là thay đổi bảo mật, phải sửa spine trước.

### [NX-58] Bỏ `requireAdmin()` vì "đã có proxy"

- **Triệu chứng:** action mới không gọi `run()`/`requireAdmin()`; có thể gọi trực tiếp bằng POST mà không cần mật khẩu khi action được dùng ở một route ngoài `/cms`.
- **Nguyên nhân:** action là POST tới route đang dùng nó; Proxy chỉ chạy theo matcher. Di chuyển component dùng action sang route khác hoặc đổi matcher sẽ âm thầm bỏ lớp bảo vệ (`proxy.md` mục "Execution order").
- **Cách đúng:** mọi action CMS đi qua `run()` (`platform/auth/run.ts:5-14`). Action công khai chỉ là ba ngoại lệ có tên của `[QD-20]`: validate chặt, giới hạn tần suất, không chạm dữ liệu quản trị.

### [NX-59] `<Activity>` giữ route ẩn: effect chạy lại, state cũ còn đó

- **Triệu chứng:** lượt xem tăng 2 lần khi người dùng bấm Back về bài; form CMS hiện dữ liệu cũ sau khi quay lại.
- **Nguyên nhân:** với Cache Components, route rời đi được ẩn chứ không unmount; effect bị dọn và **chạy lại** khi hiện lại; state được giữ.
- **Cách đúng:** effect có tác dụng phụ (ghi DB) dùng `useRef` chặn chạy lại ([NX-35]). Form khởi tạo từ dữ liệu server đặt `key` theo phiên bản dữ liệu (như `app/cms/posts/[id]/page.tsx:25`). Xem `docs/01-app/02-guides/preserving-ui-state.md`.

### [NX-60] Wildcard host ảnh lệch giữa CMS và `next/image`

- **Triệu chứng:** thêm `"*.example.com"` vào `IMAGE_HOSTS`: `next/image` nhận ảnh nhưng CMS từ chối mọi URL của host đó.
- **Nguyên nhân:** `isAllowedImageUrl` so hostname bằng `IMAGE_HOSTS.includes(hostname)` (khớp đúng — `platform/images.ts:11`), còn `remotePatterns` hiểu `*` là **đúng một** cấp subdomain, `**` là nhiều cấp.
- **Cách đúng:** chỉ thêm hostname cụ thể. Cần wildcard thì sửa `isAllowedImageUrl` và mẫu `remotePatterns` cho khớp nhau trong cùng thay đổi, kèm test ở `platform/images.test.ts`.

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
- **Cách đúng:** map qua DTO (như `toCard` — `modules/posts/queries.ts`); `Date` dùng được; `URL` đổi thành chuỗi; action trả `{ ok, ...ítTrường }`.

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
- [ ] Dữ liệu lấy qua hàm cached trong `modules/<miền>/queries.ts` , mỗi hàm có `"use cache"` + `cacheLife(...)` tường minh (≥ `minutes`) + `cacheTag(...)` của mọi module có bảng nó đọc ([NX-32], [NX-64]).
- [ ] Route động có `generateStaticParams` trả ≥ 1 phần tử từ hàm cached; không export `dynamicParams`/`dynamic`/`revalidate`/`runtime` ([NX-53], [NX-62]).
- [ ] `await params` và `notFound()` ở cấp page, ngoài `<Suspense>` ([NX-63]).
- [ ] `generateMetadata` chỉ dùng hàm cached; có `alternates.canonical`; URL mới có trong `app/sitemap.ts` ([NX-38]).
- [ ] Tính năng theo người xem/theo request nằm trong Client Component; không vô hiệu cache mỗi lượt; có chặn effect chạy lại ([NX-35], [NX-56], [NX-59]).
- [ ] `npm run build` thành công và route vẫn tĩnh.

Màn CMS (`app/cms/**`):

- [ ] Đọc qua `cms-queries.ts` trong component con bọc `<Suspense>`; có `connection()` hoặc `await params` trước truy vấn ([NX-33]).
- [ ] Form khởi tạo từ dữ liệu server có `key` theo phiên bản dữ liệu ([NX-59]).

Server Action:

- [ ] Nằm trong `modules/<miền>/actions.ts` (`"use server"`); bọc bằng `run()` → có `requireAdmin()`; trả `Result` ([NX-34], [NX-58]).
- [ ] Input validate bằng Zod; nhận ID + thay đổi, không nhận nguyên bản ghi; HTML qua `sanitizePostHtml`.
- [ ] Ghi dữ liệu xuất hiện ở trang public → gọi `updateTag` với tag của mọi module có dữ liệu thay đổi trước `return`/`redirect`; action công khai của `[QD-20]` không gọi `updateTag`; không dùng `revalidateTag` một đối số ([NX-50], [NX-54]).
- [ ] Trả object nhỏ, serialize được; lỗi là `UserError` với thông báo tiếng Việt ([NX-65]).
- [ ] Action công khai (không `requireAdmin`) là một trong ba ngoại lệ có tên của `[QD-20]`, validate chặt, giới hạn tần suất, không vô hiệu cache ([NX-35]).

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
