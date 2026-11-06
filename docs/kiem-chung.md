# Kiểm chứng một thay đổi

> Nguồn: `package.json`, `docker-compose.yml`, `prisma.config.ts`, `tsconfig.json`, `eslint.config.mjs` · Kiểm lần cuối: 2026-11-05 @ 8771851

Một thay đổi chỉ được báo là xong khi đã qua các bước dưới đây, và báo cáo ghi rõ bước nào đã chạy, kết quả ra sao.

## Tóm tắt cho agent

- Unit test chạy bằng `npm test` (Vitest); repo **không có script typecheck**. `npm run lint` chỉ chạy ESLint (gồm luật ranh giới module).
- Bước bắt buộc: `npm test`, `npx tsc --noEmit` và `npm run lint`, cả ba phải sạch.
- Thay đổi chạm DB hoặc giao diện thì chạy app thật để xem.
- Postgres cục bộ ở cổng **54329** (không phải 5432), bật bằng `docker compose up -d`.

## 1. Bước bắt buộc với mọi thay đổi code

- **[KC-01]** `npx tsc --noEmit` — typecheck toàn repo (tsconfig `strict: true`). Đã kiểm 2026-11-03: sạch, mã thoát 0.
- **[KC-02]** `npm run lint` — ESLint với `eslint-config-next` (core-web-vitals + typescript) và luật ranh giới module của `eslint.config.mjs` (spine AD-2, AD-17): `no-restricted-imports` chặn import trái tầng giữa module, chặn `platform/`/`components/shared|ui/` import `modules/`/`app/`, chặn `app/` import `@/platform/db` và `service.ts`, chặn import `@/lib/*`, `@/components/site|cms/*`, chặn `../`; `import/no-cycle` bật cho mọi file `.ts/.tsx`. Phạm vi chính xác: luật ranh giới áp cho `modules/**`, `platform/**`, `components/shared/**`, `components/ui/**` và `app/**` trừ các file trong `LEGACY_APP_FILES` (`eslint.config.mjs`; các file này cũng không bị luật `../`). `lib/**`, `components/site/**`, `components/cms/**` và `components/*.tsx` ở gốc không có luật ranh giới nào — "không tạo file mới ở `lib/`, `components/site|cms/`" chỉ được giữ bằng review. Test của luật ở `eslint-rules.test.ts`. Đã kiểm 2026-11-05: sạch.
- **[KC-07]** `npm test` — chạy Vitest (`vitest run`, cấu hình `vitest.config.ts`: alias `@/` theo `tsconfig`, `server-only` sang file rỗng). Test `*.test.ts` đặt cạnh file nguồn, tên tiếng Việt, không chạm DB, không gọi AI thật. Đã kiểm 2026-11-05 (lượt gộp 2.4–2.8): 17 file, 188 test xanh.
- **[KC-08]** `npm run test:db` — test tích hợp DB (`*.db.test.ts`, cấu hình `vitest.db.config.ts`) cho `service.ts` và `cms-queries.ts` (spine AD-16). Cần `docker compose up -d` và `TEST_DATABASE_URL` trong `.env` (mẫu ở `.env.example`). `vitest.db.setup.ts` từ chối chạy nếu URL không phải `localhost`/`127.0.0.1` cổng 54329 với tên database kết thúc `_test` ([QD-07]), tự tạo database nếu chưa có rồi `prisma migrate deploy` lên đó; mỗi file test gọi `resetTestDb()` (`vitest.db.helpers.ts`) trước từng test. `npm test` không chạy các file này. Chạy khi chạm `service.ts`, `queries.ts`, `cms-queries.ts`, `actions.ts` hoặc `prisma/schema/`. **Khung test Server Action:** `vitest.db.mocks.ts` (`setupFiles`) mock `next/headers` (header Basic Auth trong `actionTest.authorization`, mặc định là admin test của `vitest.db.config.ts`; đặt `null` để thử chưa đăng nhập) và `next/cache` (`updateTag` ghi vào `actionTest.updatedTags`, `cacheTag`/`cacheLife` không làm gì — query `"use cache"` chạy thẳng). Action mới viết test `*.db.test.ts` gọi thẳng action: kết quả `Result`, dữ liệu DB, tag đã `updateTag`. Ví dụ: `modules/products/actions.db.test.ts`, `app/cms/actions.db.test.ts`. Query: `cacheTagsOf(fn)` (`vitest.db.helpers.ts`) trả các tag `cacheTag` đã gắn — `modules/posts/queries.db.test.ts` kiểm mọi query public. Test route/page dùng `db` đặt tên `*.db.test.ts` (ESLint có khối riêng cho `app/**/*.db.test.ts`); mock `next/navigation` (`permanentRedirect`, `notFound`) trong file test. Đã kiểm 2026-11-05: 6 file, 48 test xanh.
- **[KC-03]** Sửa file trong `prisma/schema/` (`_base.prisma` + `<module>.prisma`) thì chạy `npx prisma generate` trước typecheck, vì kiểu nằm trong `generated/prisma/` (gitignore).

## 2. Chạy app cục bộ

```bash
docker compose up -d          # Postgres 17 ở localhost:54329
npx prisma migrate dev        # áp migration vào DB cục bộ (chỉ DB cục bộ — [QD-07])
npm run db:seed               # 8 Danh mục + 10 bài mẫu (tuỳ chọn; xoá bài cũ trước — [NO-08])
npm run dev                   # http://localhost:3000
```

- **[KC-04]** CMS ở `/cms`, đăng nhập HTTP Basic bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `.env`. Không in giá trị này ra ([QD-05]).
- **[KC-05]** Tính năng AI cần khoá API trong `.env`; thiếu khoá thì lỗi tiếng Việt, không phải crash.
- **[KC-06]** `npm run build` bắt được lỗi mà dev server bỏ qua (ví dụ vi phạm quy tắc cache khi `cacheComponents: true`, xem `docs/nen-tang-ky-thuat/nextjs-16.md`). Chạy khi thay đổi chạm caching, route hay `next.config.ts`.

## 3. Kiểm theo loại thay đổi

| Thay đổi | Kiểm thêm |
|---|---|
| Schema/migration | Migration tạo được trên DB trống (`npx prisma migrate reset` trên DB **cục bộ**), seed chạy được |
| Server Action | Gọi khi chưa đăng nhập phải bị từ chối; dữ liệu sai trả lỗi tiếng Việt |
| Trang public | Xem ở 360px và desktop, sáng và tối; xem nguồn trang có metadata/JSON-LD đúng |
| Ghi dữ liệu hiển thị public | Sau khi lưu, trang public cập nhật mà không cần build lại (`updateTag`) |
| Link affiliate | Thuộc tính `rel`/`target` đúng ([QD-14]) |
| Migration thu hẹp cột | Trước khi áp lên DB có dữ liệu: `SELECT id, length("<cột>") FROM "<Bảng>" WHERE length("<cột>") > <n>;` cho **từng** cột bị thu hẹp phải rỗng (`docs/cong-thuc/doi-schema.md` Bước 4) |
| Upload (`/cms/upload`) | Xem §5 |
| Tính năng AI | Chạy thật một lần; thử khi thiếu khoá; output sai schema bị chặn |
| Allowlist `sanitizePostHtml` hẹp lại | Xem §6 |

## 4. Dự kiến

Đã có Vitest cho unit test `platform/` (Story 1.2) và test tích hợp DB `[KC-08]` (Story 2.2); không có e2e. Mục **Running and verifying** trong `AGENTS.md` cập nhật qua `bmad-project-context` (Story 1.5).

## 5. Upload file và sao lưu (Story 2.8)

- **Cấu hình:** `UPLOAD_DIR` (`.env.example`) — đường dẫn tuyệt đối ngoài `public/`, `.next/`. Thiếu biến → upload trả 500 "Có lỗi xảy ra" và log `Thiếu UPLOAD_DIR` (fail closed). File phục vụ qua `app/uploads/[...path]/route.ts` (`Cache-Control: public, max-age=31536000, immutable`), không qua `public/`.
- **Kiểm bằng curl** (đã chạy 2026-11-05 trên `npm run build && UPLOAD_DIR=<thư mục tạm> PORT=3107 npm start`):
  - `curl -X POST -H "Content-Type: image/jpeg" --data-binary x <host>/cms/upload` không auth → `401` + `WWW-Authenticate: Basic realm="CMS", charset="UTF-8"` (cùng header của `proxy.ts` cho `/cms`).
  - Ảnh 12 MB: `curl -u <admin> -H "Content-Type: image/jpeg" --data-binary @big.jpg <host>/cms/upload` → `{"ok":true,"url":"/uploads/<sha256>.jpg"}`; `sha256sum` file gốc = file trong `UPLOAD_DIR` = file tải về qua `GET /uploads/<tên>` (nhận nguyên vẹn > 10 MB).
  - `.exe` (`application/x-msdownload`) → `415`; video 105 MB → `413` "Video tối đa 100 MB" (cả khi có `Content-Length` lẫn `Transfer-Encoding: chunked`).
  - `GET /uploads/abc.png` → `404`; tên không đúng dạng sha256 + đuôi (kể cả `..`) → `404` (unit test `platform/storage/local-disk.test.ts`).
- **Kiểm tay trên trình duyệt (CHƯA chạy — cần Vinh):** mở `/cms/san-pham/moi` trên **Chrome** (máy tính hoặc Android) và **Safari iOS**, đăng nhập Basic Auth, ở trường Ảnh chạm "Chụp hoặc chọn ảnh", chọn ảnh > 10 MB: thanh tiến trình chạy, bấm "Huỷ" dừng được, tải xong ô URL có `/uploads/…` và xem trước đúng tỉ lệ 1:1; không bị hỏi lại mật khẩu (Basic Auth được gửi kèm XHR). Thử file sai loại → lỗi tại trường, các trường khác giữ nguyên. Ghi kết quả (ngày, thiết bị, phiên bản trình duyệt) vào đây.
- **Sao lưu (làm khi deploy):** thư mục `UPLOAD_DIR` sao lưu **cùng lúc** với Postgres, vì DB chỉ lưu URL `/uploads/<tên>`. Quy trình: (1) `pg_dump` database; (2) ngay sau đó sao chép thư mục, ví dụ `rsync -a --ignore-existing "$UPLOAD_DIR"/ <đích-backup>/uploads/` (tên file theo nội dung nên không bao giờ bị ghi đè, chỉ cần chép thêm file mới; bỏ file `.tmp-*`); (3) giữ hai bản cùng mốc thời gian. Khôi phục: khôi phục DB rồi chép thư mục về `UPLOAD_DIR`. File không còn bản ghi nào dùng không tự xoá.
- **Giới hạn đã biết:**
  - File đã upload **không bao giờ bị xoá**: đổi/xoá ảnh trong form hay xoá Sản phẩm chỉ bỏ URL, file mồ côi tích dần trong `UPLOAD_DIR`. Dọn file mồ côi để sau (cần quét mọi bảng lưu URL).
  - Route phục vụ chưa hỗ trợ `Range`/206: video upload chưa phát được (Safari bắt buộc Range). Chưa màn nào hiển thị video.
- **Test tự động:** `app/cms/upload/route.db.test.ts` (401 + `WWW-Authenticate`, 415 SVG, 413 theo Content-Length và khi luồng vượt giới hạn, 400 file rỗng, 200 với `/uploads/<sha256>.<đuôi>`), `platform/storage/local-disk.test.ts`, `platform/upload-rules.test.ts`.

## 6. Trước khi deploy Epic 3: thẻ HTML không còn được phép

Epic 3 thu hẹp allowlist của `sanitizePostHtml` (`platform/html/sanitize.ts`) về đúng định dạng trình soạn: h2, h3, p, br, strong, em, ul, ol, li, blockquote (`b`/`i`/`h1`/`h4`–`h6`/`div` đổi sang thẻ tương đương). Trang bài sanitize **cả khi render**, nên bài đã lưu có thẻ khác (bảng, `figure`, `hr`, `u`…) sẽ mất định dạng đó trên site ngay khi deploy — chữ bên trong vẫn còn. DB cục bộ không có bài nào như vậy (kiểm 2026-11-05). Trước khi deploy, Vinh chạy trên **production** (chỉ đọc):

```sql
SELECT id, slug, status FROM "Post"
WHERE content ~* '<(table|thead|tbody|tr|th|td|figure|figcaption|hr|u|h4|h5|h6|h1|img|a)[\s>/]';
```

Có dòng → mở từng bài trong `/cms/bai-viet/<id>`, xem trước, sửa lại bằng định dạng cho phép rồi lưu (hoặc chấp nhận mất định dạng). Lưu bài qua trình soạn cũng sanitize lại nội dung.

## 7. Bộ nội dung: Cảnh báo rủi ro và số đo SM-3 (Epic 5)

**Cảnh báo rủi ro (FR-23, AD-16).** Bộ câu mẫu `scripts/risk-eval/samples.json` (12 câu vi phạm thuộc 5 loại của `RISK_WARNING_RULES` + 12 câu bình thường). Chạy tay, gọi AI thật (ngoài suite Vitest):

```bash
npx tsx --conditions=react-server scripts/risk-eval/run.ts
```

Đạt khi bắt ≥ 90% câu vi phạm và báo nhầm ≤ 20% câu bình thường. Sửa `RISK_WARNING_RULES` hoặc đổi model thì chạy lại và ghi thêm dòng.

| Ngày | Nhà / model | Bắt câu vi phạm | Báo nhầm | Thời gian | Kết quả |
|---|---|---|---|---|---|
| 2026-11-06 | `claude-cli` / `haiku` | 12/12 (100%) | 0/12 (0%) | 9,3 giây | Đạt |

Lưu ý (review gộp Epic 5): dòng trên chấm bằng cách so khớp chuỗi con cũ; từ nay `scripts/risk-eval/score.ts` chấm qua `cleanRiskWarnings` và khớp nguyên câu (có test). Script đo một prompt kiểm riêng trên danh sách câu, chưa đo đúng đường chạy thật (AI tự đánh dấu trong nội dung vừa viết) — lần chạy thật kế tiếp ghi thêm dòng, xem `deferred-work.md`.

**SM-3 (thời gian làm một Sản phẩm, AD-21).** SM-3 = `firstCopiedAt` sớm nhất của Bộ nội dung (trên `SocialPost` và `Suggestion`) − `Product.createdAt` của Sản phẩm đầu tiên trong bộ (`ContentSetProduct.sortOrder = 0`). Chạy trên DB (chỉ đọc):

```sql
SELECT cs.id,
       p."createdAt" AS product_created,
       LEAST(MIN(sp."firstCopiedAt"), MIN(s."firstCopiedAt")) AS first_copied,
       LEAST(MIN(sp."firstCopiedAt"), MIN(s."firstCopiedAt")) - p."createdAt" AS sm3
FROM "ContentSet" cs
JOIN "ContentSetProduct" csp ON csp."contentSetId" = cs.id AND csp."sortOrder" = 0
JOIN "Product" p ON p.id = csp."productId"
LEFT JOIN "SocialPost" sp ON sp."contentSetId" = cs.id
LEFT JOIN "Suggestion" s ON s."contentSetId" = cs.id
GROUP BY cs.id, p."createdAt"
ORDER BY cs."createdAt" DESC;
```

SM-2 (nhịp đăng) đếm `SocialPost.postedAt` theo ngày.

## Checklist báo cáo

- [ ] Đã chạy `npm test` — kết quả.
- [ ] Đã chạy `npm run test:db` (nếu chạm `service.ts`/`queries.ts`/`cms-queries.ts`/`actions.ts`/schema) — kết quả.
- [ ] Migration thu hẹp cột: đã chạy kiểm độ dài trước khi áp lên DB có dữ liệu.
- [ ] Đã chạy `npx tsc --noEmit` — kết quả.
- [ ] Đã chạy `npm run lint` — kết quả.
- [ ] Đã chạy `npm run build` (nếu chạm cache/route/config) — kết quả.
- [ ] Đã kiểm thủ công những gì (theo bảng §3), những gì chưa kiểm và vì sao.
