# Epic 1 Context: Epic nền — site cũ chạy trên cấu trúc mới

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Đưa repo brownfield (Next.js 16, code nằm ở `lib/`, `components/site|cms/`, `app/cms/actions.ts`) sang nền modular monolith `app → modules → platform` mà website và CMS vẫn chạy y như hiện tại: hành vi Next.js quan trọng đã được kiểm chứng trên bản build thật, hạ tầng chung nằm ở `platform/` có unit test, ESLint tự chặn import sai tầng, database có Danh mục và Sản phẩm dùng chung nhiều bài, và tài liệu mô tả đúng cấu trúc mới. Đây là điều kiện chặn cho mọi epic sau; không story nghiệp vụ nào được làm trước hoặc trong epic này. Làm đúng 4 bước di chuyển theo thứ tự.

## Stories

- Story 1.1: Kiểm chứng hành vi Next.js và khoá `/cms` đúng matcher
- Story 1.2: Dựng `platform/` và khung test Vitest
- Story 1.3: Khoá ranh giới module bằng ESLint
- Story 1.4: Migration nền — Danh mục và Sản phẩm dùng chung
- Story 1.5: Cập nhật tài liệu và AGENTS.md theo cấu trúc mới

## Requirements & Constraints

- **Không đổi hành vi người dùng thấy:** sau mỗi story, đọc bài, soạn, xuất bản vẫn chạy như trước; `npx tsc --noEmit`, `npm run lint` (và `npm run build` khi chuyển file) phải sạch. Chuyển file không đổi logic; sửa lỗi làm ở bước riêng.
- **Bảo mật CMS:** chỉ người vận hành vào được CMS và ghi dữ liệu; mọi thao tác ghi kiểm quyền phía server (`proxy.ts` không bảo vệ action bị POST trực tiếp).
- **Dữ liệu cũ:** 10 bài mẫu phải giữ nguyên, hiện đủ Sản phẩm; số Bài web và Sản phẩm trước/sau migration không đổi. `/styleguide` không còn công khai trước khi deploy.
- **Kiểm chứng thật, không giả định:** nếu `[NO-23]` (`updateTag` làm mới trang đã prerender) hoặc `[NO-24]` (Server Action công khai trên trang `ensureStatic = "navigation"`) không đạt thì dừng, báo Vinh, đề xuất sửa spine trước khi sang Story 1.2. Ghi kết quả vào `docs/no-ky-thuat.md`.
- **Lỗi bảo mật phải sửa kèm test** khi dựng `platform/`: thân bài sau sanitize không còn `a`, `img`; URL ảnh dạng `//host` bị từ chối; validate form và `remotePatterns` cùng đọc một danh sách host; link affiliate chỉ nhận domain Shopee chính chủ; bài nháp AI qua cùng schema với bài viết tay; lỗi quyền và "không tìm thấy" trả tiếng Việt.
- **Luật dự án:** không commit/push; không thêm thư viện ngoài danh sách đã duyệt; chỉ chạy migrate trên Postgres cục bộ (cổng 54329); không sửa tay khối `bmad:context` trong `AGENTS.md` (làm mới qua `bmad-project-context`); `[QU-26]`–`[QU-28]` phải do Vinh duyệt, agent không tự duyệt.

## Technical Decisions

- **Tầng và hướng phụ thuộc:** `app` (route mỏng) → `modules/<miền>/` (danh sách module đóng: `posts`, `products`, `categories`, `content-sets`, `suggestions`, `research`, `style-profiles`, `inspirations`, `banners`, `bio`, `engagement`) → `platform/`. `platform/` và `components/` không import `modules/`/`app/`; `app/` không import `platform/db` hay `service.ts`. Tầng module: T0 `categories`, `style-profiles` · T1 `products`, `inspirations` · T2 `research`, `posts`, `banners` · T3 `engagement`, `content-sets`, `bio` · T4 `suggestions`; chỉ import tầng thấp hơn, và chỉ `queries.ts`, `cms-queries.ts`, `types.ts`, `constants.ts`, `tags.ts`, `components/`. Không barrel `index.ts`, không re-export tạm từ chỗ cũ.
- **Cấu trúc `platform/`:** `db` (mở đầu `import "server-only"`), `auth/{basic-auth,require-admin,run}`, `errors.ts`, `validation/{fields,errors}.ts`, `html/` (sanitize, mục lục, thời gian đọc — tính sau sanitize), `slug.ts`, `images.ts`, `format.ts` (vi-VN, `Asia/Ho_Chi_Minh`), `site`. `platform/ai` và `platform/storage` **không** dựng ở epic này. Bảng file cũ → vị trí mới ở `docs/cong-thuc/chuyen-code-cu.md`.
- **Lỗi:** `run()` gọi `requireAdmin()`, trả `Result<T>`; lỗi cho người dùng là `UserError` tiếng Việt, lỗi bất ngờ `console.error` + "Có lỗi xảy ra, thử lại sau".
- **Validate một nguồn:** schema module ghép từ `platform/validation/fields.ts` (`requiredText`, `optionalText`, `imageUrl`, `shopeeAffiliateUrl`, `slugField`); host ảnh chỉ khai báo ở `platform/images.ts`.
- **Sanitize:** allowlist thân bài không có `a`, `img`; áp khi ghi và khi render.
- **Proxy:** matcher `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]`; `/cms`, `/cms/*`, `/cms.rsc` không header → 401 + `WWW-Authenticate`.
- **Test:** Vitest 5.1.0 + vite 8.3.5 (peer); alias `server-only` sang file rỗng, `@/` theo `tsconfig`; test `*.test.ts` cạnh nguồn, tên tiếng Việt, viết theo spec chứ không theo hành vi code hiện có; không gọi AI thật; lệnh test ghi vào `docs/kiem-chung.md`.
- **ESLint:** `no-restricted-imports` cho `modules/**`, `platform/**`, `components/shared/**`, `app/**` (chặn trái tầng, chặn `@/lib/*`, `@/components/site|cms/*`); `import/no-cycle` bật; file cũ miễn qua danh sách `ignores` tường minh, chuyển file nào thì bỏ khỏi danh sách.
- **shadcn:** alias `lib` → `@/components/ui/lib`, `utils` → `@/components/ui/lib/utils`, `hooks` → `@/components/ui/hooks`; hook tự viết dùng chung ở `components/shared/hooks/`.
- **`maxDuration = 120`** ở `app/cms/layout.tsx` (thay 60). `/styleguide` chuyển sang `app/cms/styleguide` (noindex, sau Basic Auth).
- **Migration nền (một migration duy nhất):** tách `prisma/schema/` (`_base.prisma` + `<module chủ>.prisma`, generator `output = "../../generated/prisma"`, import vẫn `@/generated/prisma/client`); tạo bằng `--create-only`, tên `verb_object`, đọc SQL trước khi áp. Enum `Category` → `PostType` (`MEO_VAT`, `GOM_LINK`), `Post.category` → `Post.postType`; model `Category` (chủ `categories`: `name`, `slug`, `description`, thứ tự hiển thị); `Post.categoryId`, `Product.categoryId` nullable, `onDelete` ghi rõ; bảng nối tường minh `PostProduct` (chủ `posts`, có thứ tự); chép `Product.postId` sang `PostProduct` rồi bỏ cột. **Không** thêm `hidden`, `priceText`, `searchText`, bảng lịch sử slug. Quy ước Prisma: model số ít PascalCase, id `String @id @default(uuid())`, không `@@map`, enum HOA; `onDelete`: `Cascade` con thuộc cha, `Restrict` thực thể dùng chung, `SetNull` liên kết tuỳ chọn.
- **Seed:** tối thiểu một Danh mục và một Bài web đã xuất bản gắn Danh mục đó (để `generateStaticParams` không rỗng); chạy lại không lỗi. Lưu ý `[NO-08]`: seed hiện `deleteMany()` toàn bộ bài.
- **Chủ bảng:** `posts` — `Post`, `PostProduct`; `products` — `Product`; `categories` — `Category`. Chỉ module chủ ghi bảng của mình.

## Cross-Story Dependencies

- Thứ tự bắt buộc 1.1 → 1.2 → 1.3 → 1.4 → 1.5. Story 1.1 là cổng: không đạt `[NO-23]`/`[NO-24]` thì dừng cả epic.
- 1.3 cần `platform/` từ 1.2 để danh sách `ignores` và luật import có đích đúng. 1.4 là story duy nhất của epic tạo migration. 1.5 cần 1.1–1.4 xong để mọi đường dẫn trong docs tồn tại.
- Mọi epic 2–10 phụ thuộc epic này. Việc hoãn sang epic khác: kiểm 308 cho slug cũ (story đổi slug, Epic 3); `platform/ai` (story AI đầu tiên, Epic 4); `platform/storage` (story upload đầu tiên, Epic 2); các cột `hidden`, `priceText`, `searchText`, bảng lịch sử slug (story FR tương ứng).
