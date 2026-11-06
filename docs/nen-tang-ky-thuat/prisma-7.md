# Prisma 7.10

> Phiên bản: `prisma` 7.10.1, `@prisma/client` 7.10.1, `@prisma/adapter-pg` 7.10.1, `pg` ^8.23.1 (theo `package.json` và `node_modules/*/package.json`) · Nguồn: `node_modules/prisma/` (CLI `build/cli.js`, `config.d.ts`), `node_modules/@prisma/config/dist/index.d.ts`, `node_modules/@prisma/adapter-pg/README.md` + `dist/index.d.ts`, client sinh ra trong `generated/prisma/` · Kiểm lần cuối: 2026-11-05 @ 8771851

## Tóm tắt cho agent

[PR-01]

- Không import `@prisma/client`. Import `PrismaClient`, enum, kiểu model và namespace `Prisma` từ `@/generated/prisma/client` (trong `prisma/` dùng đường dẫn tương đối `../generated/prisma/client`).
- Không tạo `new PrismaClient()` trong code ứng dụng. Dùng `db` từ `@/platform/db` (`platform/db.ts`, singleton, driver adapter `PrismaPg`, mở đầu `import "server-only"`). Prisma 7 **bắt buộc** truyền `adapter` (hoặc `accelerateUrl`).
- Schema tách nhiều file trong `prisma/schema/`: `_base.prisma` (generator, datasource) + `<module chủ>.prisma` (spine AD-4). URL database không nằm trong schema. CLI đọc URL từ `prisma.config.ts` (`DIRECT_URL ?? DATABASE_URL`); runtime đọc `DATABASE_URL` trong `platform/db.ts`. Prisma 7 **không tự nạp `.env`** — `prisma.config.ts` và `prisma/seed.ts` tự `import "dotenv/config"`.
- `generated/` bị gitignore và được sinh lại bởi `postinstall` (`prisma generate`). Sửa file trong `prisma/schema/` → chạy `npx prisma generate`, kể cả sau `migrate dev`.
- Chỉ chạy `prisma migrate dev` với Postgres cục bộ (docker, cổng 54329). Không bao giờ chạy `migrate dev`, `migrate reset`, `db push`, `db seed` vào database production (nơi chạy chưa chốt; `.env.example` đang giả định Supabase — spine Deferred) từ phiên agent. Production chỉ nhận `prisma migrate deploy`, do Vinh chạy.
- Luôn tạo migration bằng `npx prisma migrate dev --create-only --name <verb_object>` rồi đọc SQL trước khi áp (spine AD-15). Trong môi trường không tương tác, thiếu `--name` sẽ ra migration không tên.
- `npm run db:seed` **xoá toàn bộ** `Post` (và `PostProduct` theo cascade), rồi xoá Sản phẩm không còn bài nào dùng, trước khi tạo dữ liệu mẫu (`[NO-08]`).
- Mọi truy vấn bài public đi qua `modules/posts/queries.ts` có `"use cache"` + `cacheTag("posts")`). Ghi dữ liệu ảnh hưởng tới trang public thì gọi `updateTag(POSTS_TAG)` trong Server Action.
- `Product` là bản ghi dùng chung, nối với `Post` qua bảng `PostProduct` (có `sortOrder`). Xoá `Post` xoá dòng `PostProduct` (`Cascade`), không xoá `Product` (`Restrict` phía `Product`) — xem [PR-10], [PR-30].

## Khái niệm cốt lõi

### [PR-02] Generator `prisma-client` sinh code TypeScript vào repo

`prisma/schema/_base.prisma:1-4` dùng `provider = "prisma-client"` (không phải `prisma-client-js` cũ) với `output = "../../generated/prisma"` (tính từ `prisma/schema/`). Generator này sinh **mã nguồn TypeScript** vào `generated/prisma/`, không vào `node_modules/.prisma`:

| File | Nội dung | Dùng ở đâu |
|---|---|---|
| `generated/prisma/client.ts` | `PrismaClient`, `Prisma` namespace, kiểu `Post`/`Product`/`PostProduct`/`Category`, re-export enum | Code server (`platform/db.ts:3`, `prisma/seed.ts:3`) |
| `generated/prisma/browser.ts` | `Prisma` namespace bản browser, enum, kiểu model — **không có** `PrismaClient` | Client Component nếu cần enum/kiểu |
| `generated/prisma/enums.ts` | `PostType`, `Status` dạng `const` object + union type | Có thể import trực tiếp |
| `generated/prisma/models/*.ts` | `PostSelect`, `PostInclude`, `PostWhereInput`, `PostCreateInput`, `PostGetPayload`... | Qua `Prisma.<Tên>` |

Thư mục này nằm trong `.gitignore:45` (`/generated`) và được tạo lại bởi `"postinstall": "prisma generate"` (`package.json`). Không sửa tay file trong đó.

Enum sinh ra là object `as const`, không phải TypeScript `enum` (`generated/prisma/enums.ts`):

```ts
export const PostType = { MEO_VAT: 'MEO_VAT', GOM_LINK: 'GOM_LINK' } as const
export type PostType = (typeof PostType)[keyof typeof PostType]
```

Vì vậy chuỗi literal `"MEO_VAT"` gán thẳng được cho kiểu `PostType` (repo làm vậy ở `prisma/seed.ts:26`). Lưu ý tên `Category` giờ là **model** Danh mục, không phải enum.

### [PR-03] `prisma.config.ts` là nơi cấu hình CLI

`prisma.config.ts:1-14`:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // CLI (migrate) cần kết nối trực tiếp, không qua pgbouncer.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
```

- `schema` trỏ tới **thư mục** `prisma/schema`: Prisma gộp mọi file `.prisma` trong đó. Khối `datasource` trong `prisma/schema/_base.prisma:6-8` chỉ còn `provider`. Kiểu `Datasource` của config chỉ có `url` và `shadowDatabaseUrl` (`node_modules/@prisma/config/dist/index.d.ts:26-29`) — không có `directUrl` như Prisma 5/6. "URL trực tiếp cho migrate" được thực hiện bằng cách cho `datasource.url` ưu tiên `DIRECT_URL`.
- `migrations.seed` là lệnh shell mà `prisma db seed` chạy (`index.d.ts:133-135`). Không còn khoá `prisma.seed` trong `package.json`.
- CLI in "Loaded Prisma config from prisma.config.ts." mỗi lần chạy; nếu không thấy dòng này, bạn đang chạy sai thư mục.
- Repo dùng `process.env.X` thay vì helper `env("X")` của `prisma/config`. `env()` ném `PrismaConfigEnvError` khi thiếu biến (`index.d.ts:57`, `:179`); giữ `process.env` để `postinstall` → `prisma generate` chạy được trên máy/CI không có `.env`.

### [PR-04] Driver adapter `@prisma/adapter-pg`

Prisma 7 chạy query compiler bằng TypeScript/WASM (`npx prisma --version` báo `Query Compiler : enabled`) và kết nối DB qua driver adapter. Kiểu `PrismaClientOptionsWithAdapter` trong `generated/prisma/internal/prismaNamespace.ts:875-895` ghi rõ adapter là **required** trừ khi dùng Prisma Accelerate.

`PrismaPg` nhận `pg.Pool | pg.PoolConfig | string` và tuỳ chọn thứ hai `PrismaPgOptions` (`node_modules/@prisma/adapter-pg/dist/index.d.ts:42,57-79`). Mặc định adapter **không cache prepared statement có tên** (chỉ bật khi truyền `statementNameGenerator`), nên dùng được với pgbouncer chế độ transaction.

### [PR-05] Ba chuỗi kết nối và ai dùng chuỗi nào

| Môi trường | Biến | Đích | Ai dùng |
|---|---|---|---|
| Dev cục bộ | `DATABASE_URL`, `DIRECT_URL` | `localhost:54329` (docker `postgres:17-alpine`, `docker-compose.yml:4-11`) | cả runtime và CLI |
| Production runtime (giả định Supabase) | `DATABASE_URL` | pooler cổng **6543**, `?pgbouncer=true` (`.env.example:1-2`) | `platform/db.ts:10` |
| Production migrate (giả định Supabase) | `DIRECT_URL` | cổng **5432** session/direct (`.env.example:3-4`) | `prisma.config.ts:12` |

Hai dòng production là **giả định**: nơi chạy Postgres production, VPS, backup chưa chốt (spine mục Deferred, "trước khi deploy lần đầu"). `.env.example` đang ghi mẫu Supabase; đừng coi đó là quyết định.

- `?pgbouncer=true` là tham số kiểu cũ của Prisma engine. Với `adapter-pg`, `pg-connection-string` parse nó thành khoá `pgbouncer` mà `pg` bỏ qua (đã thử `parse()`), và adapter không có xử lý riêng cho nó. Tham số này vô hại nhưng không phải thứ làm cho kết nối tương thích pgbouncer — điều đó đến từ [PR-04].
- Migrate cần kết nối trực tiếp/session: lệnh DDL, advisory lock và shadow database không chạy ổn qua pooler transaction mode.

## Dự án dùng như thế nào

### [PR-06] Client singleton `platform/db.ts`

`platform/db.ts:1-13`:

```ts
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- `import "server-only"` làm build lỗi nếu Client Component kéo `db` vào bundle (spine AD-8). Vitest thay `server-only` bằng file rỗng (`vitest.config.ts`).
- `app/` không import `@/platform/db` (ESLint chặn, trừ file cũ trong `LEGACY_APP_FILES` của `eslint.config.mjs`); đích là đọc qua `queries.ts`/`cms-queries.ts`, ghi qua `service.ts` của module chủ.
- Lưu vào `globalThis` khi dev để hot reload không tạo thêm pool kết nối mỗi lần sửa file.
- `DATABASE_URL` được Next.js nạp từ `.env`; script ngoài Next (seed) phải tự `import "dotenv/config"` (`prisma/seed.ts:1`).
- `prisma/seed.ts:5-7` tạo client riêng vì chạy bằng `tsx` ngoài Next. Đây là ngoại lệ duy nhất được phép.

### [PR-07] Quy ước schema trong repo

Theo `prisma/schema/*.prisma` và spine AD-15:

- Mỗi model nằm trong `prisma/schema/<module chủ>.prisma` theo bảng *Chủ sở hữu bảng* của spine: `posts.prisma` (`Post`, `PostProduct`, enum `PostType`, `Status`), `products.prisma` (`Product`), `categories.prisma` (`Category`). `_base.prisma` chỉ có generator và datasource.
- Khoá chính: `id String @id @default(uuid())` (`posts.prisma:2`, `products.prisma:2`). Không dùng `autoincrement`.
- Tên model PascalCase số ít, tên trường camelCase, **không** `@@map`/`@map` — bảng và cột Postgres mang đúng tên model/trường, có dấu nháy (`"Post"`, `"featuredImage"`) như trong `prisma/migrations/20261102104412_init/migration.sql`. Enum viết HOA.
- Chuỗi dài dùng `@db.Text` (`content`, `posts.prisma:5`); giới hạn độ dài cứng dùng `@db.VarChar(n)` (`excerpt`, `posts.prisma:6`) và phải khớp validate Zod (`lib/post-input.ts:14`, xem [BM-05]).
- Trường tuỳ chọn là `String?` và lưu `null`, không lưu chuỗi rỗng. Zod chuyển `""` → `null` trước khi ghi (`optionalText`, `platform/validation/fields.ts:4`).
- Danh sách ngắn (tags, keywords) dùng mảng Postgres `String[]` (`posts.prisma:11`, `:14`), không tách bảng.
- `createdAt @default(now())`, `updatedAt @updatedAt` (`posts.prisma:17-18`). `updatedAt` được dùng làm `key` remount editor (`app/cms/posts/[id]/page.tsx:25`) và `lastModified` sitemap (`app/sitemap.ts:17`).
- Mỗi quan hệ ghi rõ `onDelete`: `Cascade` cho con thuộc hẳn cha (`PostProduct.post`), `Restrict` cho tham chiếu tới thực thể dùng chung, kể cả khi khoá ngoại tuỳ chọn (`PostProduct.product`; `Post.categoryId`, `Product.categoryId` nullable nhưng `Restrict` vì không xoá Danh mục còn dùng — FR-28), `SetNull` cho liên kết tuỳ chọn không trỏ tới thực thể dùng chung.
- Bảng nối luôn là model tường minh (`PostProduct`, `posts.prisma:26-36`), không dùng many-to-many ngầm.
- Mỗi khoá ngoại có `@@index` riêng (`Post @@index([categoryId])`, `posts.prisma:22`; `PostProduct @@index([productId])`, `:35`; `@@unique([postId, productId])` phủ `postId`). Index ghép phục vụ truy vấn public: `@@index([status, postType, publishedAt])` (`posts.prisma:21`) khớp `where { status, postType } orderBy publishedAt` trong `modules/posts/queries.ts`.
- Comment tiếng Việt ngắn để ghi ý nghĩa nghiệp vụ (`posts.prisma:5`, `:7`, `:8`, `:25`).
- Enum Postgres native (`CREATE TYPE "Category" AS ENUM` ở migration init, đổi tên thành `"PostType"` ở `20261105081913_add_categories_and_post_products`). Giá trị enum viết HOA, không dấu.

Giá trị enum `PostType` đang bị lặp ở ba nơi, phải sửa cùng lúc: `prisma/schema/posts.prisma:38-41`, `modules/posts/constants.ts` (`POST_TYPES` — khoá lấy từ enum Prisma + nhãn/slug), `lib/post-input.ts:16,29` (`z.enum([...])`).

### [PR-08] Import kiểu, enum và `Prisma` namespace

```ts
// Server
import { PrismaClient, Prisma, PostType, Status, type Post, type Product } from "@/generated/prisma/client";
// Client Component (không kéo PrismaClient/runtime vào bundle)
import { PostType, type Post } from "@/generated/prisma/browser";
```

- `Prisma` namespace (`generated/prisma/internal/prismaNamespace.ts`) chứa kiểu đầu vào của mọi model qua `export type * from '../models'` (`:22`): `Prisma.PostSelect`, `Prisma.PostInclude`, `Prisma.PostWhereInput`, `Prisma.PostCreateInput`, `Prisma.PostUncheckedCreateInput`, `Prisma.PostUpdateInput`, `Prisma.PostGetPayload<...>`, `Prisma.TransactionClient` (`:969`).
- Lớp lỗi runtime cũng nằm trong `Prisma`: `Prisma.PrismaClientKnownRequestError` (`:32`), `PrismaClientValidationError` (`:44`)...
- Không có `Prisma.validator` trong client đã sinh (đã grep `internal/prismaNamespace.ts`). Dùng `satisfies Prisma.PostSelect` thay thế — xem [PR-17].
- Code hiện tại **không** import kiểu từ Prisma vào UI: `modules/posts/constants.ts` dùng `PostType` của `@/generated/prisma/enums`, editor tự khai báo `Status` (`components/cms/post-editor.tsx:19`). Giữ nguyên khi sửa nhỏ; khi thêm code mới cần kiểu model, import từ `browser.ts` thay vì khai báo lại.

### [PR-09] Mẫu truy vấn đang dùng

**`select` cho danh sách, `include` cho trang chi tiết.**

- Thẻ bài (`modules/posts/queries.ts`) dùng `cardSelect` `as const`: chỉ lấy trường cần hiển thị, kèm `postProducts: { select: { product: { select: { image: true } } }, orderBy: { sortOrder: "asc" }, take: 1 }` để lấy ảnh dự phòng. `content` được select chỉ để tính `readingMinutes` rồi bị bỏ trong `toCard` (`:31-38`) — không trả `content` ra ngoài thẻ.
- Trang bài (`modules/posts/queries.ts`) và editor CMS (`app/cms/posts/[id]/page.tsx:17-20`) dùng `include: { postProducts: { orderBy: { sortOrder: "asc" }, include: { product: true } } }` vì cần toàn bộ trường, rồi trải `postProducts` thành mảng Sản phẩm.
- Danh sách CMS dùng `_count: { select: { postProducts: true } }` (`app/cms/page.tsx:26`) thay vì tải cả mảng.

**Thứ tự.** Bài public luôn `orderBy: { publishedAt: "desc" }` (`modules/posts/queries.ts`); CMS `updatedAt: "desc"` (`app/cms/page.tsx:25`); Sản phẩm trong bài luôn theo `PostProduct.sortOrder: "asc"`. `sortOrder` là chỉ số mảng lúc lưu (`app/cms/actions.ts:43-45`) — không tự đặt tay.

**Lọc bài public.** Luôn trải `published` (`{ status: "PUBLISHED" }`, `modules/posts/queries.ts`) vào `where`. Đọc một bài public dùng `findFirst({ where: { ...published, slug } })`, không `findUnique({ where: { slug } })`, vì phải lọc thêm `status`.

**Tìm-hoặc-báo.** Action dùng `findUnique` rồi ném `UserError("Không tìm thấy bài viết")` khi `null` (`app/cms/actions.ts:119-120`); page dùng `findUnique` + `notFound()` (`app/cms/posts/[id]/page.tsx:17-21`).

**Slug duy nhất.** `uniqueSlug` (`app/cms/actions.ts:23-30`) thử `slug`, `slug-2`, ... bằng `findFirst({ where: { slug, NOT: { id: excludeId } } })`. Ràng buộc `@unique` (`Post_slug_key`, `migration.sql:42`) là hàng rào cuối nếu hai request trùng lúc.

### [PR-10] Ghi Sản phẩm qua bảng nối và cascade

- Tạo và lưu bài đều chạy trong `db.$transaction(async (tx) => ...)`: ghi `Post` rồi gọi `replacePostProducts(tx, postId, products)` (`app/cms/actions.ts:35-46`, `:87-91`, `:103-111`).
- `replacePostProducts` thay **toàn bộ** Sản phẩm của bài: đọc `productId` cũ, `tx.postProduct.deleteMany({ where: { postId } })`, xoá các `Product` cũ không còn `PostProduct` nào (`postProducts: { none: {} }`), rồi `createMany` Sản phẩm mới (id tự sinh bằng `crypto.randomUUID()`) và `createMany` dòng `PostProduct` theo thứ tự form. Hệ quả: `Product.id` vẫn đổi sau mỗi lần lưu ([PR-26], `[NO-09]`).
- Xoá bài: `replacePostProducts(tx, id, [])` rồi `tx.post.delete` (`app/cms/actions.ts:139-142`). Ở mức DB, `PostProduct.post` là `ON DELETE CASCADE` và `PostProduct.product` là `ON DELETE RESTRICT` (`prisma/schema/posts.prisma:29`, `:31`; migration `20261105081913_add_categories_and_post_products`) — không xoá được `Product` còn bài dùng.
- Ghi luôn kèm `select` tối thiểu (`select: { id: true }`, `select: { slug: true }`) để không kéo `content` về không cần thiết.

### [PR-11] Transaction

`createPost`, `savePost`, `deletePost` dùng interactive transaction ([PR-10]). API có sẵn trong client đã sinh (`generated/prisma/internal/class.ts`):

```ts
// Dạng mảng: các lệnh độc lập, chạy tuần tự trong một transaction
await db.$transaction([db.post.update(...), db.postProduct.deleteMany(...)]);

// Dạng interactive: cần đọc rồi ghi dựa trên kết quả đọc
await db.$transaction(async (tx) => {
  const post = await tx.post.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
  await tx.post.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: post.publishedAt ?? new Date() } });
}, { timeout: 5000, isolationLevel: "Serializable" });
```

- Mặc định `maxWait` 2000 ms, `timeout` 5000 ms (`prismaNamespace.ts`); đổi toàn cục qua `transactionOptions` của `PrismaClient`.
- Trong callback chỉ dùng `tx`, không dùng `db` (lệnh qua `db` nằm ngoài transaction). Kiểu tham số là `Prisma.TransactionClient` (`app/cms/actions.ts:35`).
- Không gọi AI hay việc chậm khác bên trong interactive transaction: nó giữ một kết nối và dễ vượt `timeout`. `createPost` gọi AI **trước** khi mở transaction (`app/cms/actions.ts:57`, `:87`) — giữ thứ tự đó.

### [PR-12] Truy vấn có cache trong `modules/posts/queries.ts`

Mỗi hàm đọc public (`getLatestPosts`, `getPostsByType`, `getRelatedPosts`, `getPostBySlug`, `getPublishedSlugs`) có `"use cache"`, `cacheLife("days")`, `cacheTag(POSTS_TAG)` (`modules/posts/queries.ts`, `POSTS_TAG = "posts"` ở `:7`; code cũ, đích `modules/posts/queries.ts` + `modules/posts/tags.ts`).

```mermaid
sequenceDiagram
    participant Page as Trang public
    participant Fn as modules/posts/queries.ts ("use cache")
    participant Cache as Cache Next.js
    participant DB as Postgres (db)
    participant Act as Server Action CMS
    Page->>Fn: getPostBySlug(slug)
    Fn->>Cache: tra theo build ID + tham số
    alt có entry còn hạn
        Cache-->>Page: kết quả đã serialize
    else hết hạn / chưa có
        Fn->>DB: db.post.findFirst(...)
        DB-->>Fn: rows
        Fn-->>Cache: lưu, gắn tag "posts"
        Fn-->>Page: kết quả
    end
    Act->>DB: update / delete
    Act->>Cache: updateTag("posts")
    Note over Cache: mọi entry tag "posts" hết hạn ngay
```

- Khoá cache gồm build ID và tham số hàm (`node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md:81-88`). Mỗi `slug`/`category`/`limit` khác nhau là một entry.
- Giá trị trả về phải serialize được (Date được phép, class instance thì không — `use-cache.md:148-169`). Trả về object thuần từ Prisma là ổn; **không** trả `Prisma.Decimal` hay instance tự định nghĩa từ hàm cache.
- Hồ sơ `days`: stale 5 phút, revalidate 1 ngày, expire 1 tuần (`cacheLife.md:145`). Không có `updateTag`, sửa trên DB có thể không hiện trên site tới 1 ngày.
- Ghi từ CMS gọi `updateTag(POSTS_TAG)` (`app/cms/actions.ts:112,132,143`). `updateTag` chỉ gọi được trong Server Action (`updateTag.md`); ở Route Handler dùng `revalidateTag`. Comment ở `modules/posts/queries.ts` nói `revalidateTag` nhưng code dùng `updateTag` — code là đúng (`[NO-16]`).
- Truy vấn đọc `Product` (qua `postProducts`) hiện chỉ gắn tag `posts`. Theo spine AD-7, khi có module `products`, query trả hoặc lọc Sản phẩm phải gắn thêm tag của `products`.
- `createPost` **không** gọi `updateTag` vì bài mới luôn là `DRAFT` (không xuất hiện ở truy vấn public).
- Không gọi `headers()`/`cookies()` (kể cả `requireAdmin()`) trong hàm `"use cache"` — sẽ lỗi `next-request-in-use-cache` (`use-cache.md:241`).
- Truy vấn CMS **không** cache: `app/cms/page.tsx:23` gọi `await connection()` trước khi đọc DB để luôn động.
- `generateStaticParams` gọi `getPublishedSlugs()` (`app/(site)/bai-viet/[slug]/page.tsx:18-21`) → `next build` cần kết nối được DB qua `DATABASE_URL`.

### [PR-13] Migrations

- Thư mục: `prisma/migrations/<timestamp>_<tên>/migration.sql` + `migration_lock.toml` (`provider = "postgresql"`). Hiện có `20261102104412_init` và `20261105081913_add_categories_and_post_products` (migration nền, SQL viết tay để giữ dữ liệu). Commit cả thư mục migration; không sửa migration đã được áp dụng ở bất kỳ DB dùng chung nào.
- Tên: `--name` được slug hoá với dấu `_` và cắt 200 ký tự (CLI 7.10.1). Đặt tên `verb_object` snake_case (spine AD-15): `add_product_hidden`, `add_categories_and_post_products`. Mỗi lần chỉ một story tạo migration.

| Lệnh | Khi nào | Ghi chú đã kiểm trong CLI 7.10.1 |
|---|---|---|
| `npx prisma migrate dev --name <ten>` | Dev cục bộ, sau khi sửa schema | Tạo + áp migration. Thiếu `--name` ở môi trường không tương tác → tên rỗng. Có cảnh báo mất dữ liệu ở môi trường không tương tác → lỗi `MigrateDevEnvNonInteractiveError`. Cần reset (drift) → in lý do rồi thoát mã 130, **không** tự reset. Mã lệnh không gọi generator và không gọi seed. |
| `npx prisma migrate dev --create-only --name <ten>` | **Mặc định** (spine AD-15): tạo rồi đọc SQL; sửa tay khi cần backfill dữ liệu, đổi kiểu cột, CHECK, index đặc biệt | Tạo file, không áp; đọc/sửa xong chạy lại `migrate dev`. |
| `npx prisma generate` | Sau mọi thay đổi schema | Sinh lại `generated/prisma`. |
| `npx prisma migrate status` | Kiểm tra | Chỉ đọc. |
| `npx prisma migrate deploy` | Staging/production | Chỉ áp migration có sẵn. Vinh chạy, không phải agent. |
| `npx prisma migrate reset` | Chỉ DB cục bộ | Xoá sạch dữ liệu. |

- `migrate dev` dùng shadow database (tạo tạm). Trên Postgres docker với user `postgres` việc này chạy được; trên database production (giả định Supabase) thì không thử. Kiểu config có `shadowDatabaseUrl` nếu sau này cần.
- Trước mọi lệnh CLI chạm DB, kiểm `.env` trỏ về đâu mà không in mật khẩu:

```bash
grep -o '@[^/]*' .env   # phải thấy @localhost:54329
```

### [PR-14] Seed

- Chạy: `npm run db:seed` → `prisma db seed` → lệnh trong `prisma.config.ts:8` (`tsx prisma/seed.ts`). Truyền tham số: `npx prisma db seed -- --arg value`.
- Trong CLI 7.10.1, chỉ `prisma db seed` gọi lệnh seed; `migrate dev`/`migrate reset` không tự seed.
- `prisma/seed.ts:164-172` upsert Danh mục mẫu `nha-cua-doi-song` theo slug (chạy lại không lỗi).
- `prisma/seed.ts:175-176` gọi `db.post.deleteMany()` → xoá **mọi** bài (và `PostProduct` theo cascade), rồi xoá Sản phẩm không còn bài nào dùng; sau đó tạo 10 bài `PUBLISHED` gắn Danh mục mẫu, `publishedAt` lùi từng ngày (`:179-201`). Bảo đảm `generateStaticParams` không rỗng (spine AD-7).
- Link sản phẩm mẫu là trang tìm kiếm Shopee (`prisma/seed.ts:20-21`), không phải Link affiliate thật.
- Seed tạo Sản phẩm bằng nested `create` qua `postProducts` (`:193-198`), nên khi đổi quan hệ Post–Product phải sửa seed cùng lúc.

## Công thức

### [PR-15] Thêm một trường vào model có sẵn

Ví dụ minh hoạ: thêm `Product.hidden` (FR-5). Trường mới chỉ thêm vào model của **module chủ** (spine AD-4: `Product` thuộc `products`), phục vụ trực tiếp một FR và ghi trong story (AD-15).

1. Sửa `prisma/schema/products.prisma`, thêm `hidden Boolean @default(false)`. Trường bắt buộc mới phải có `@default` hoặc migration cần backfill tay.
2. Kiểm `.env` trỏ local ([PR-13]), bật DB: `docker compose up -d`.
3. `npx prisma migrate dev --create-only --name add_product_pinned`, đọc `migration.sql` vừa sinh, xác nhận chỉ có `ALTER TABLE ... ADD COLUMN`; rồi `npx prisma migrate dev` và `npx prisma generate`.
4. Cập nhật Zod trong `schema.ts` của module chủ (đích `modules/products/schema.ts`; code cũ hiện ở `lib/post-input.ts` — chạm thì chuyển theo `docs/cong-thuc/chuyen-code-cu.md`), Server Action, form, chỗ hiển thị — theo [BM-17].
5. Nếu trường hiển thị ở trang public: thêm vào `select` của query có cache (đích `modules/<miền>/queries.ts`); action ghi phải `updateTag` tag của mọi module có dữ liệu thay đổi (spine AD-7).
6. Sửa `prisma/seed.ts` nếu trường cần dữ liệu mẫu.
7. `npm test`, `npx tsc --noEmit` và `npm run lint`.

### [PR-16] Thêm model mới + migration + cập nhật code

1. Xác định module chủ theo bảng *Chủ sở hữu bảng* của spine. Bảng không có trong bảng đó → `[SCHEMA-UNKNOWN]`, dừng và hỏi (AD-15).
2. Thêm model vào `prisma/schema/<module chủ>.prisma` (tạo file nếu module chưa có) theo [PR-07]: `id String @id @default(uuid())`, `createdAt`, `updatedAt`, quan hệ có `@relation(fields, references, onDelete)` ghi rõ, `@@index` cho mọi khoá ngoại và cho tổ hợp `where`/`orderBy` dùng ở trang public. Module khác chỉ thêm trường quan hệ ngược, không thêm cột (AD-4).
3. Chọn `onDelete` có chủ đích: `Cascade` khi bản ghi con thuộc hẳn cha; `Restrict` khi tham chiếu tới thực thể dùng chung hoặc PRD cấm xoá cha còn con, kể cả khoá ngoại tuỳ chọn (ví dụ FR-28: `categoryId` nullable nhưng không xoá Danh mục còn bài); `SetNull` khi liên kết tuỳ chọn không trỏ tới thực thể dùng chung.
4. `npx prisma migrate dev --create-only --name <verb_object>` → đọc SQL; thêm backfill, CHECK, index đặc biệt bằng tay nếu cần (kèm comment trong `.prisma`) → `npx prisma migrate dev` → `npx prisma generate`.
5. Viết code trong `modules/<miền>/` theo spine AD-5: đọc public ở `queries.ts` (`import "server-only"`, `"use cache"`, `cacheLife`, `cacheTag` của mọi module có bảng nó đọc); đọc CMS ở `cms-queries.ts` (không cache, gọi trong `<Suspense>`); ghi ở `service.ts`; tag ở `tags.ts`. Không tạo file mới ở `lib/`.
6. Viết Server Action trong `modules/<miền>/actions.ts` bọc bằng `run()` (`platform/auth/run.ts`, [BM-18]), validate bằng Zod trong `schema.ts`, gọi `service.ts`, rồi `updateTag` cho mọi tag bị ảnh hưởng.
7. Cập nhật seed, chạy `npm run db:seed` trên DB local.
8. Ghi lại thay đổi vào tài liệu này nếu khẳng định nào ở trên không còn đúng.

### [PR-17] Kiểu cho `select` dùng lại

`modules/posts/queries.ts` (code cũ) hiện khai báo `CardRow` tay. Khi viết mới, suy kiểu từ Prisma để không lệch schema:

```ts
import type { Prisma } from "@/generated/prisma/client";

const cardSelect = {
  slug: true,
  title: true,
  postProducts: { select: { product: { select: { image: true } } }, orderBy: { sortOrder: "asc" }, take: 1 },
} as const satisfies Prisma.PostSelect;

type CardRow = Prisma.PostGetPayload<{ select: typeof cardSelect }>;
```

Kiểu đầu vào ghi: `Prisma.PostCreateInput` (quan hệ lồng), `Prisma.PostUncheckedCreateInput` (gán thẳng `postId`), `Prisma.PostUpdateInput`. Dữ liệu đã qua `safeParse` của Zod truyền thẳng vào `data` được nếu kiểu output Zod khớp (như `savePost`, `app/cms/actions.ts:100-106`).

### [PR-18] Bắt lỗi ràng buộc duy nhất

```ts
import { Prisma } from "@/generated/prisma/client";
import { UserError } from "@/platform/errors";

try {
  await db.post.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new UserError("Đường dẫn đã tồn tại");
  }
  throw e;
}
```

`run()` (`platform/auth/run.ts:5-14`) chỉ trả nguyên văn message của `UserError`; lỗi khác bị ghi log và thay bằng "Có lỗi xảy ra, thử lại sau". Ném `UserError` tiếng Việt để toast đọc được; message thô của Prisma không lộ ra client.

### [PR-19] Dựng DB cục bộ từ đầu

```bash
docker compose up -d                    # Postgres 17 ở localhost:54329
grep -o '@[^/]*' .env                   # xác nhận trỏ local
npx prisma migrate dev                  # áp migration có sẵn (không tạo mới nếu schema khớp)
npx prisma generate
npm run db:seed                         # xoá và tạo lại dữ liệu mẫu
```

## Bẫy hay gặp

### [PR-20] Import nhầm `@prisma/client`

- Triệu chứng: lỗi kiểu "Module has no exported member 'Post'" hoặc client không có model `post`.
- Nguyên nhân: generator `prisma-client` sinh vào `generated/prisma`, không vào `@prisma/client`. README của `@prisma/adapter-pg` vẫn ghi ví dụ `from '@prisma/client'` — đó là mẫu cũ.
- Cách đúng: `import { PrismaClient } from "@/generated/prisma/client"`.

### [PR-21] Quên `prisma generate`

- Triệu chứng: TypeScript báo trường/model mới không tồn tại dù migration đã chạy; hoặc clone mới báo thiếu `@/generated/prisma/client`.
- Nguyên nhân: `generated/` không commit; mã `migrate dev` 7.10.1 không gọi generator.
- Cách đúng: chạy `npx prisma generate` sau mỗi thay đổi schema; `npm install` tự chạy qua `postinstall`.

### [PR-22] CLI không thấy biến môi trường

- Triệu chứng: `migrate`/`seed` báo thiếu URL dù `.env` có.
- Nguyên nhân: Prisma 7 không tự nạp `.env` (CLI tự ghi "Environment variables declared in this file are NOT automatically loaded by Prisma").
- Cách đúng: giữ `import "dotenv/config"` ở dòng đầu `prisma.config.ts` và mọi script chạy ngoài Next.

### [PR-23] Chạy migrate qua pooler

- Triệu chứng: `migrate` treo, lỗi prepared statement hoặc advisory lock khi trỏ tới pooler (giả định Supabase ở `.env.example`).
- Nguyên nhân: `DIRECT_URL` thiếu nên `prisma.config.ts:12` rơi về `DATABASE_URL` (pooler 6543).
- Cách đúng: luôn đặt `DIRECT_URL` (cổng 5432) khi trỏ tới pooler. Và dù sao, agent không chạy migrate vào database production ([QD-07]).

### [PR-24] Agent chạy lệnh phá dữ liệu vào production

- Triệu chứng: mất bài thật sau `db:seed`, `migrate reset`, `db push`.
- Nguyên nhân: CLI dùng bất cứ URL nào `.env` đang trỏ; seed xoá mọi bài bằng `deleteMany()` (`prisma/seed.ts:175`).
- Cách đúng: kiểm `.env` trước ([PR-13]); chỉ chạy lệnh ghi vào `localhost:54329`; production chỉ `migrate deploy` do Vinh chạy.

### [PR-25] Sửa bài nhưng site không đổi

- Triệu chứng: CMS lưu thành công nhưng trang public vẫn nội dung cũ tới hàng giờ.
- Nguyên nhân: action mới ghi DB mà không `updateTag(POSTS_TAG)`, hoặc dùng tag khác với `cacheTag` ở hàm đọc.
- Cách đúng: mọi action ghi dữ liệu mà hàm `"use cache"` đọc phải gọi `updateTag` với đúng tag đó, sau khi ghi xong.

### [PR-26] Lưu bài làm đổi id sản phẩm

- Triệu chứng: tham chiếu tới `Product.id` (ví dụ log, thống kê) bị mất sau khi lưu bài.
- Nguyên nhân: `replacePostProducts` xoá dòng nối cũ, xoá Sản phẩm mồ côi rồi tạo Sản phẩm mới ([PR-10], `[NO-09]`) — CMS chưa chọn được Sản phẩm có sẵn.
- Cách đúng: chưa lưu `Product.id` ở nơi khác khi CMS chưa sửa. Story làm Kho sản phẩm ([PR-30]) đổi sang chọn Sản phẩm có sẵn và chỉ cập nhật `PostProduct`.

### [PR-27] Thêm giá trị enum mà quên chỗ lặp

- Triệu chứng: Zod từ chối giá trị mới, hoặc `POST_TYPES[post.postType]` trả `undefined` làm vỡ trang.
- Nguyên nhân: `PostType` lặp ở schema, `modules/posts/constants.ts`, `lib/post-input.ts` ([PR-07], `[NO-19]`).
- Cách đúng: sửa cả ba trong cùng thay đổi; trong code mới dùng `z.enum(PostType)` với `PostType` import từ `@/generated/prisma/enums` (spine AD-5: `constants.ts` lấy giá trị enum từ Prisma) (Zod 4 nhận object enum, `node_modules/zod/v4/classic/schemas.d.ts:611`).

### [PR-28] Gọi việc chậm trong transaction

- Triệu chứng: `Transaction already closed` / hết thời gian chờ.
- Nguyên nhân: gọi AI hoặc mạng bên trong `$transaction(async (tx) => ...)`, vượt `timeout` 5000 ms.
- Cách đúng: chuẩn bị dữ liệu trước, chỉ đặt lệnh DB trong callback ([PR-11]).

## Mô hình dữ liệu theo PRD: đã có và dự kiến

Nguồn: `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md` §3, §4.2, §4.7, `addendum.md` A4 và spine (AD-4, AD-15, AD-17 bước 3, bảng *Chủ sở hữu bảng*). Migration nền `20261105081913_add_categories_and_post_products` đã làm phần **Đã có**; phần **Dự kiến** do story của FR tương ứng thêm, theo AD-15.

### [PR-30] Kho Sản phẩm dùng chung (FR-3, FR-4, FR-5)

**Đã có:**

- `Product` không còn thuộc riêng một `Post`; bảng nối tường minh `PostProduct { id, postId, productId, sortOrder }` với `@@unique([postId, productId])` (`prisma/schema/posts.prisma:26-36`), chủ là module `posts`. `onDelete: Cascade` phía `Post`, `Restrict` phía `Product`: xoá Bài web không xoá Sản phẩm (FR-4).
- Dữ liệu cũ đã chép từ `Product.postId`/`sortOrder` sang `PostProduct` rồi bỏ hai cột đó, giữ thứ tự; không gộp Sản phẩm trùng tên.
- `Product.categoryId` tuỳ chọn, `Restrict` (`prisma/schema/products.prisma:7-8`).

**Dự kiến:**

- `Product` cần thêm: `hidden` (FR-5; Sản phẩm còn được dùng thì không xoá cứng, chỉ ẩn — AD-15), `priceText`/`priceUpdatedAt`, Dữ liệu thô, thời điểm tạo (FR-12 đo SM-3).
- `savePost` phải đổi từ xoá-tạo Sản phẩm sang chọn Sản phẩm có sẵn và chỉ cập nhật `PostProduct` ([PR-26], `[NO-09]`).
- Sửa/ẩn Sản phẩm phải làm mới mọi Bài web và Trang bio đang dùng nó trong khoảng 1 phút (NFR-5): action sửa Sản phẩm `updateTag` tag của `products`, và mọi query đọc Sản phẩm gắn tag đó (spine AD-7).
- Truy vấn public lọc Sản phẩm bị ẩn ở mọi nơi qua `visibleProductWhere`/`publicProductSelect` của `modules/products/queries.ts` (đích, chưa có — AD-7).
- Seed dùng link tìm kiếm Shopee (`prisma/seed.ts:20-21`): qua được `shopeeAffiliateUrl` vì đúng domain, nhưng không phải Link affiliate thật (A4).

### [PR-31] Danh mục là bảng, Loại bài giữ enum (FR-28, FR-29)

**Đã có:**

- Enum cũ `Category` (`MEO_VAT | GOM_LINK`) đã đổi tên thành `PostType` (Loại bài), cột `Post.category` thành `Post.postType` (`prisma/schema/posts.prisma:8`, `:38-41`).
- Model `Category` (Danh mục: `name`, `slug @unique`, `description`, `sortOrder`) ở `prisma/schema/categories.prisma`, chủ là module `categories`. `Post.categoryId`, `Product.categoryId` tuỳ chọn, `onDelete: Restrict` (FR-28: không xoá Danh mục còn Bài web hoặc Sản phẩm).
- Seed tạo một Danh mục mẫu và gắn mọi bài mẫu vào đó.

**Dự kiến:**

- Giao diện CMS và route `[danh-muc]` cho Danh mục; đường dẫn Danh mục không trùng `RESERVED_ROOT_SLUGS` của spine AD-20 (`cms`, `api`, `bai-viet`, `bio`, `tim-kiem`, `meo-vat`, `gom-link`, `trang`, mọi thư mục gốc trong `app/(site)`) — kiểm bằng Zod; đổi đường dẫn lưu đường dẫn cũ (`CategorySlugRedirect`) để chuyển hướng vĩnh viễn (AD-20).
- Code cũ còn gọi Loại bài là `category` (`[NO-20]`): route `app/(site)/[danh-muc]/page.tsx` (Danh mục) và `app/(site)/{meo-vat,gom-link}/` (Loại bài), `modules/posts/constants.ts` (nhãn, slug, mô tả), badge màu (giữ theo Loại bài), breadcrumb và JSON-LD (`app/(site)/bai-viet/[slug]/page.tsx`), `getRelatedPosts`.
- `/meo-vat`, `/gom-link` vẫn là trang theo Loại bài, thư mục route riêng (spine AD-7).
- `categoryId` hiện nullable; đặt `NOT NULL` (nếu cần) là quyết định của story Danh mục, kèm backfill viết tay.

### [PR-32] Bảng phục vụ tương tác người đọc (FR-33, FR-35)

**Đã có từ Epic 7** (module `engagement`: `PostStat`, `PostViewDaily` trong `prisma/schema/engagement.prisma` — spine AD-23). Lượt xem và Lượt tim cần lưu theo bài nhưng **không** lưu định danh người đọc (NFR-7, xem [BM-16]). Đếm có thể ghi rất thường xuyên — không đặt chúng trong hàm `"use cache"` và không gọi `updateTag("posts")` mỗi lượt xem.

## Checklist khi viết workflow / review

[PR-40]

- [ ] Import Prisma từ `@/generated/prisma/client` (server) hoặc `@/generated/prisma/browser` (client), không từ `@prisma/client`.
- [ ] Code ứng dụng dùng `db` từ `@/platform/db`; không có `new PrismaClient` mới ngoài `prisma/seed.ts`; route mới trong `app/` không import `@/platform/db`.
- [ ] Model mới hoặc cột mới nằm trong `prisma/schema/<module chủ>.prisma` đúng bảng *Chủ sở hữu bảng* của spine; sửa schema đi kèm thư mục migration mới tên `verb_object`, tạo bằng `--create-only`, và đã chạy `npx prisma generate`.
- [ ] Đã đọc `migration.sql`; thay đổi có dữ liệu (đổi kiểu, bỏ cột, NOT NULL mới) có bước backfill viết tay.
- [ ] Không có lệnh `migrate dev`/`reset`/`db push`/`db seed` nào chạy vào URL khác `localhost:54329`.
- [ ] Trường mới: tuỳ chọn → `?` và lưu `null`; bắt buộc → có `@default` hoặc backfill.
- [ ] Mỗi khoá ngoại có `@@index`; `onDelete` ghi rõ (`Cascade`/`Restrict`/`SetNull` theo [PR-07]) và khớp PRD; bảng nối là model tường minh.
- [ ] Giá trị enum `PostType` mới đã cập nhật ở schema, `modules/posts/constants.ts`, `lib/post-input.ts` (hoặc code mới suy từ enum Prisma).
- [ ] Danh sách dùng `select` tối thiểu; không trả `content` ra thẻ bài; dùng `_count` thay vì tải mảng để đếm.
- [ ] Truy vấn public lọc `status: "PUBLISHED"` và nằm trong hàm `"use cache"` có `cacheTag` của mọi module có bảng nó đọc.
- [ ] Mọi action ghi dữ liệu mà trang public đọc đều gọi `updateTag` với đúng tag.
- [ ] Không gọi `headers()`/`cookies()`/`requireAdmin()` trong hàm `"use cache"`.
- [ ] Interactive transaction chỉ chứa lệnh DB qua `tx`, không gọi AI/mạng.
- [ ] `prisma/seed.ts` vẫn chạy được với schema mới.
- [ ] Thay đổi chạm tới [PR-30]/[PR-31] tuân theo ràng buộc PRD ghi ở đó.

## Tham khảo

- `node_modules/prisma/build/cli.js` — hành vi `migrate dev`, `db seed` (bản bundle; tìm chuỗi `MigrateDevEnvNonInteractiveError`, `Running seed command`).
- `node_modules/@prisma/config/dist/index.d.ts` — kiểu `PrismaConfig`, `Datasource`, `migrations.seed`.
- `node_modules/@prisma/adapter-pg/README.md`, `node_modules/@prisma/adapter-pg/dist/index.d.ts` — `PrismaPg`, `PrismaPgOptions`.
- `generated/prisma/client.ts`, `browser.ts`, `enums.ts`, `internal/prismaNamespace.ts`, `internal/class.ts` — API client đã sinh (sau `npx prisma generate`).
- `npx prisma <lệnh> --help` — trợ giúp đúng phiên bản cài.
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`, `04-functions/cacheLife.md`, `04-functions/updateTag.md` — tương tác cache với truy vấn DB.
- Tài liệu online: <https://pris.ly/d/driver-adapters>, <https://pris.ly/prisma-config-env-vars>.
- PRD: `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md`, `addendum.md` (A4).
- Liên quan: `docs/nen-tang-ky-thuat/kiem-tra-va-bao-mat.md` ([BM-05], [BM-17], [BM-18]).
