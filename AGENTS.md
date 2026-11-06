<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent Master

Ở lượt đầu tiên của mỗi phiên làm việc trực tiếp với người dùng trong repo này, gọi skill `master` (Skill tool) trước khi làm gì khác, rồi xử lý yêu cầu của người dùng trong vai Master. Không áp dụng cho subagent hoặc agent được giao một nhiệm vụ cụ thể, và bỏ qua khi người dùng đã gọi thẳng một skill khác.

<!-- bmad:context -->
<!-- Verified 2026-11-06 against acbae56. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## affiliate-project

Website "Mẹo Vặt Cuộc Sống" + gom link affiliate Shopee, có CMS nội bộ dùng AI (nghiên cứu Sản phẩm, Xưởng Bộ nội dung, chấm SEO). Next.js 16 (App Router, `cacheComponents`), Prisma 7 + PostgreSQL, Tailwind 4 + shadcn (base-ui), npm. Artifact BMad nằm trong `_bmad-output/`: yêu cầu ở PRD `_bmad-output/planning-artifacts/prds/`; cấu trúc đích ở spine `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` — spine thắng `docs/` khi mâu thuẫn. `docs/PRD_AFFILIATE_PROJECT.md` chỉ là ý tưởng ban đầu, đã lỗi thời.

## Policy

- Không bao giờ `git commit` hay `git push`; để thay đổi trong working tree cho người dùng tự review và commit.
- Không làm tính năng cào dữ liệu Shopee (ScrapingBee, tự chuyển link) — đang tạm hoãn; admin nhập tay tên, ảnh, giá, `affiliateUrl` trong CMS.
- Không tạo lại `lib/`, `components/site/`, `components/cms/` (cấu trúc cũ đã chuyển hết theo AD-17); code mới vào `modules/<miền>/` và `platform/` theo spine. Phát hiện file cũ còn sót trong `app/` thì chuyển theo `docs/cong-thuc/chuyen-code-cu.md` (cơ chế `LEGACY_APP_FILES` trong `eslint.config.mjs` vẫn giữ).

## Where things are

- Hạ tầng dùng chung: `platform/` (db, `auth/run.ts`, `errors.ts`, `html/sanitize.ts`, `validation/fields.ts`, `images.ts`, `ai/ask.ts`).
- Thêm màn hình, action/query, đổi schema, tính năng AI, sửa lỗi, bỏ chức năng: theo công thức tương ứng trong `docs/cong-thuc/`.

## Running and verifying

- Chạy `docker compose up -d` trước `npm run dev`, `npx prisma migrate dev`, `npm run db:seed` — Postgres cục bộ ở cổng 54329, không phải 5432.
- Test DB: `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` — `.env` cục bộ thường thiếu biến này nên `npm run test:db` trần báo lỗi.
- Trước khi bàn giao chạy `npm test`, `npm run test:db` (lệnh trên), `npx tsc --noEmit` và `npm run lint`; repo không có script typecheck.

## Conventions that differ from defaults

- Bỏ qua schema và code mẫu trong PRD (`shopeeUrl`, `prisma-client-js`, API routes); đọc `prisma/schema/` (một file mỗi module chủ) và code hiện tại.
- Import Prisma từ `@/generated/prisma/client`, không phải `@prisma/client`; `generated/` bị gitignore, sinh lại bằng `npx prisma generate`.
- Mỗi Server Action mới phải bọc trong `run()` (`platform/auth/run.ts`, gọi `requireAdmin()`) — `proxy.ts` không bảo vệ được action bị POST trực tiếp; lỗi cho người dùng ném `UserError` tiếng Việt, lỗi khác hiện thông báo chung.
- HTML bài viết luôn đi qua `sanitizePostHtml` (`platform/html/sanitize.ts`) khi lưu và khi render.
- Ghi/sửa/xoá xong phải `updateTag` tag (`modules/<miền>/tags.ts`) của mọi module có dữ liệu thay đổi; query public mới dùng `"use cache"` + `cacheTag` của mọi module có dữ liệu nó trả về (spine AD-7).
- Gọi AI chỉ qua `ask()` ở `platform/ai/ask.ts` với prompt đặt ở `modules/<miền>/prompts/*.prompt.ts`; không gọi SDK hay `claude` trực tiếp. Nhà chính là `claude -p` theo gói thuê bao (`AI_PROVIDERS=claude-cli`); test luôn dùng `AI_PROVIDERS=fake`, không gọi AI thật.
- Thêm host ảnh chỉ ở `IMAGE_HOSTS` trong `platform/images.ts` — dùng chung cho `next.config.ts` và validate form.

## Known pitfalls

- Migration có xoá cột: `npx prisma migrate dev --create-only` từ chối chạy không tương tác — tạo thư mục migration từ `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script`, sửa tay SQL đổi tên/chép dữ liệu, rồi `npx prisma migrate dev`.
- Prisma 7 từ chối `npx prisma migrate reset` khi chạy từ AI agent (docs cũ vẫn ghi bước này) — dùng `npx prisma migrate deploy`; cần xoá sạch DB cục bộ thì nhờ người dùng chạy.
- Sau khi chuyển hoặc xoá route, `.next/dev/types` cũ làm `tsc` và build lỗi — xoá thư mục đó (sinh lại khi chạy `next dev`).

<!-- /bmad:context -->
