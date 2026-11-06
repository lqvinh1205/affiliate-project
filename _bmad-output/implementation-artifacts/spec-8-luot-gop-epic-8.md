---
title: 'Lượt gộp Epic 8: Người đọc tương tác — Story 8.1–8.4'
type: 'feature'
created: '2026-11-06'
status: 'in-review'
review_loop_iteration: 0
baseline_revision: 'dd3109f8fbd30fea5865e5d76062e45a374a1ff2'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-7-luot-gop-epic-7.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/cong-thuc/them-trang-public.md'
  - '{project-root}/docs/nen-tang-ky-thuat/nextjs-16.md'
warnings: ['multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Người đọc chưa thả tim, chia sẻ hay tìm được bài; Trang chủ và 404 chưa có "Xem nhiều"; `/cms/bai-viet` chưa có cột Lượt tim. Epic 8 gồm Story 8.1–8.4 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai 8.1 → 8.4, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). Mở rộng module `engagement` (Lượt tim, "Xem nhiều") và `posts` (cột `searchText`, action công khai `searchPosts`) theo spine AD-6 (ngoại lệ số 1 và 2), AD-7, AD-23; ShareButtons ở `components/shared`. Trang public giữ tĩnh: số tim và kết quả tìm kiếm lấy phía client.

## Boundaries & Constraints

**Always:** Spine AD-2 (tầng; đọc chéo qua select/điều kiện của module chủ — `publishedPostWhere`, `postCardSelect`, `toPostCard`), AD-4 (`Post.searchText` của `posts`, `PostStat` của `engagement`), AD-5, AD-6 (ngoại lệ số 1, 2: không `run()`, validate, giới hạn tần suất, không `updateTag`, không `console.error`), AD-7 (`ensureStatic`, `"use cache"` + `cacheLife` + tag mọi module được đọc, không đọc `searchParams` ở server), AD-8 (ngày qua ranh giới client là ISO), AD-15 (migration + backfill), AD-23, AD-26 (`/tim-kiem` noindex), AD-27 (`formatCount`); không lưu/log IP, định danh, từ khoá (NFR-7, [QD-18]); mọi action/query mới có test DB, mọi hàm thuần có test đơn vị.

**Never:** Không hiện Lượt xem ở site, không hiện Lượt tim trên PostCard (UX Q5); không cookie; không `updateTag` mỗi lượt xem / tim; không thêm thư viện npm (không jsdom, không full-text extension); không Banner (Epic 9); không sửa PRD/spine/`AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mở trang bài | trang tĩnh | LikeButton hiện "—" rồi số tim (`getPostLikes`); trạng thái "đã thả" từ `localStorage` `tim:<postId>`; ba LikeButton (cuối bài, ArticleActionBar, cột phải desktop) cùng một trạng thái | mất mạng / lỗi đọc → giữ "—", vẫn bấm được |
| Thả / bỏ tim | chạm LikeButton | đổi ngay (optimistic) ±1, tim nảy ≤ 200 ms (tắt khi reduced-motion); server trả số mới; ghi/xoá `tim:<postId>` | giới hạn / lỗi / bài không còn → hoàn trạng thái + Toast "Chưa thả tim được, thử lại sau nhé" |
| Dội tim | > 30 lần/phút cùng IP | lần 31 `RATE_LIMITED_ERROR`; IP khác không ảnh hưởng; đọc số tim có bộ đếm riêng (120/phút) | — |
| Bỏ tim khi 0 | `liked: false`, likes = 0 / chưa có `PostStat` | vẫn 0, không tạo `PostStat` | — |
| Bài nháp / không có | thả tim | `POST_GONE_ERROR`, không ghi; đọc số tim = 0 | — |
| Chia sẻ | Facebook / Threads | mở `facebook.com/sharer` / `threads.com/intent/post` tab mới, URL canonical | — |
| Sao chép link | nút chính (không có chia sẻ gốc) | ghi URL canonical + Toast "Đã sao chép liên kết" | clipboard bị chặn → Toast "Chưa sao chép được, bạn giữ ngón tay lên thanh địa chỉ để chép nhé" |
| Chia sẻ gốc | thiết bị cảm ứng có `navigator.share` | nút chính mở chia sẻ gốc | huỷ → không làm gì; lỗi khác → sao chép link |
| Tìm "noi chien" | ≥ 2 ký tự, ngừng gõ 300 ms / Enter | "Tìm thấy N bài viết cho "noi chien"" (`aria-live`) + PostCard *row*, tô "nồi", "chiên" | — |
| Gõ 1 ký tự / xoá hết | `"a"` / `""` | giữ trạng thái trước / về chip Danh mục | — |
| Không kết quả | `xyzxyz` | EmptyState "Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..." + gợi ý gõ ngắn hơn + "Chủ đề được đọc nhiều nhất" | — |
| Lỗi tìm | giới hạn 60/phút, lỗi DB, mất mạng | "Chưa tìm được lúc này, thử lại nhé" + "Thử lại" | không log từ khoá |
| Từ khoá không hợp lệ | 1 ký tự, chỉ ký tự lạ (`%_%`), > 100 ký tự | `INVALID_INPUT_ERROR` (client không gửi khi < 2 ký tự) | — |
| `/tim-kiem` chưa gõ | mở từ nút tìm | SearchBox tự focus; chip mỗi Danh mục có bài → `/[danh-muc]`; trang `○` tĩnh, `noindex` | — |
| Lưu bài | `savePost`, `createPostDraft`, Duyệt `WEB_POST` | `searchText` = tiêu đề + tóm tắt + thẻ + chữ thân bài, bỏ dấu, chữ thường | — |
| Bài cũ | migration `add_post_search_text` | backfill bằng SQL cùng luật với `toSearchText` (kiểm 10/10 bài DB cục bộ khớp) | — |
| Xem nhiều | `PostViewDaily` 30 ngày | Trang chủ ≤ 5 bài PostCard *rank* `01`–`05` trong `<ol>`; mobile sau Gom link đồ xinh, desktop 5 cột cạnh Bài nổi bật; 0 bài → ẩn khu | lượt xem cũ hơn 30 ngày, bài nháp không tính |
| 404 | đường dẫn lạ | EmptyState + SearchBox (Enter → `/tim-kiem?q=…`, tìm ngay) + 3 bài Xem nhiều | — |
| CMS | `/cms/bai-viet?sap-xep=luot-tim` | cột Lượt tim (desktop), "N lượt tim" (mobile); xếp giảm dần, bài 0 tim sau cùng theo sửa gần nhất | — |

</intent-contract>

## Code Map

- **8.1 Thả tim:**
  - `modules/engagement/{constants,schema,service,actions}.ts`: `LIKE_RATE_LIMIT` (30/phút), `LIKE_COUNT_RATE_LIMIT` (120/phút), `LIKED_POST_KEY_PREFIX`, `POST_GONE_ERROR`; `getPostLikesInputSchema`, `setPostLikeInputSchema`; `getPostLikesRecord`, `setPostLikeRecord`; action `getPostLikes`, `setPostLike`.
  - `modules/engagement/like-state.ts` (+ test): `nextLikeCount`, `likeLabel`.
  - `modules/engagement/components/post-like.client.tsx`: `PostLikeProvider` (trạng thái chung, `useSyncExternalStore` đọc `localStorage`, bản nhớ trong trang khi bị chặn), `LikeButton`.
  - `platform/errors.ts`: `INVALID_INPUT_ERROR`, `RATE_LIMITED_ERROR` chuyển từ `engagement/constants.ts` (dùng chung với `posts.searchPosts`).
  - CMS: `engagement/cms-queries.ts` `getPostStatsForCms`, `listPostsByStatForCms({ by })` (thay `getPostViewsForCms`, `listPostsByViewsForCms`), `types.ts` `CmsPostWithStats`; `app/cms/bai-viet/_components/{post-list-params,post-sort-tabs,post-search-form,post-list-screen}` (`?sap-xep=luot-tim`, cột Lượt tim).
  - `app/globals.css`: keyframes `like-pop`.
- **8.2 Chia sẻ:** `components/shared/share-buttons.client.tsx`, `share-links.ts` (+ test); `app/(site)/bai-viet/[slug]/_components/{post-screen.tsx, article-action-bar.client.tsx}` (ArticleActionBar luôn hiện: LikeButton + "Sản phẩm" + ShareButtons); `modules/posts/components/post-article.tsx` slot `actions` (cuối bài "Bạn thấy bài viết này hữu ích?" + cột phải desktop); `ARTICLE_ACTIONS_TITLE_ID`. Toast: `Toaster` chuyển từ `app/layout.tsx` sang `app/cms/layout.tsx` (đỉnh) và `app/(site)/layout.tsx` (đáy, `--site-toast-bottom`, 3 giây).
- **8.3 Tìm kiếm:**
  - `prisma/schema/posts.prisma` `searchText String @default("") @db.Text` + migration `20261106140000_add_post_search_text` (thêm cột + backfill SQL); `prisma/seed.ts` ghi `searchText`.
  - `platform/search-text.ts` (+ test): `toSearchText`, `searchTerms`, `highlightParts`.
  - `modules/posts/{constants,schema,service,actions,queries,types}.ts`: `SEARCH_*`, `searchPostsInputSchema`, `searchTextOf` trong mọi ghi bài, `searchPostsRecord`, action `searchPosts`, xuất `postCardSelect`/`toPostCard`/`newestFirst`, `SearchPostItem`.
  - `modules/posts/components/{search-box.client.tsx, post-search.client.tsx}`; `PostCard` thêm `highlight`.
  - `app/(site)/tim-kiem/{page.tsx, _components/search-screen.tsx, _components/search-skeleton.tsx}`; `components/shared/chip-styles.ts` (FilterChips dùng chung).
- **8.4 Xem nhiều:** `modules/engagement/{tags.ts, queries.ts}` (`ENGAGEMENT_TAG`, `getPopularPosts`), `components/popular-post-list.tsx`; `PostCard` *rank* + *featured* theo bề rộng khung (`@container`); `app/(site)/_components/home-screen.tsx`, `not-found-screen.tsx`, `search-launcher.client.tsx`.
- Docs: `docs/kien-truc-codebase.md`; `deferred-work.md` (2 mục).

```text
Action: getPostLikes / setPostLike
- Module chủ: engagement            - File: modules/engagement/actions.ts
- Loại: ngoại lệ AD-6 số 1 (engagement — ghi Lượt tim, đọc số Lượt tim một bài)
- Input: getPostLikesInputSchema { postId: uuid } / setPostLikeInputSchema { postId: uuid, liked: boolean }
- Output: Result<{ likes: number }>
- Quyền: công khai; giới hạn 120 (đọc) / 30 (ghi) lần/phút theo băm IP trong bộ nhớ (AD-23)
- Service: getPostLikesRecord / setPostLikeRecord     - Bảng ghi: PostStat (engagement); đọc Post qua publishedPostWhere
- updateTag: không                   - Lỗi: INVALID_INPUT_ERROR, RATE_LIMITED_ERROR, POST_GONE_ERROR, UNEXPECTED_ERROR
- Gọi từ: modules/engagement/components/post-like.client.tsx (trang bài)

Action: searchPosts
- Module chủ: posts                 - File: modules/posts/actions.ts
- Loại: ngoại lệ AD-6 số 2 (chỉ đọc, công khai)
- Input: searchPostsInputSchema { q: string ≤ 100 } → từ đã gấp (≤ 8 từ, ≥ 2 ký tự)
- Output: Result<{ total: number; terms: string[]; items: SearchPostItem[] }> (≤ 20 bài, `publishedAt` ISO)
- Quyền: công khai; giới hạn 60 lần/phút theo băm IP; chỉ bài đã xuất bản; không log từ khoá
- Service: searchPostsRecord (đọc không cache — AD-5)  - updateTag: không
- Gọi từ: modules/posts/components/post-search.client.tsx (`/tim-kiem`)
```

```text
Query: getPopularPosts(limit) (queries.ts)
- Module: engagement (chạm PostViewDaily + Post + ảnh Sản phẩm — AD-2)
- Cache: "use cache", cacheLife("days"), cacheTag(engagement, posts, products); thời điểm hiện tại lấy trong hàm
- Gọi từ: home-screen.tsx (5), not-found-screen.tsx (3 đầu của cùng mục cache), search-screen.tsx (5, khi không kết quả)

Query: getPostStatsForCms(ids), listPostsByStatForCms({ status, q, page, by }) (cms-queries.ts)
- Module: engagement                 - Gọi từ: app/cms/bai-viet/_components/post-list-screen.tsx
```

**Bảng phân tích ảnh hưởng schema (doi-schema.md Bước 2):**

| Hạng mục | File / ký hiệu bị ảnh hưởng | Việc phải làm |
|---|---|---|
| Query public | `posts/queries.ts` không select `searchText` | — |
| Query CMS | không đọc `searchText` | — |
| Kiểu | `SearchPostItem` (mới) | đã thêm |
| Validate + form | `searchPostsInputSchema`; form bài không có trường `searchText` (server tự tính) | — |
| Ghi | `savePostRecord`, `createPostDraftRecord`, `applyWebPostSuggestionRecord` | ghi `searchText` |
| Cache tag | không đổi (ghi bài đã `updateTag(posts)`) | — |
| Module khác đọc | không | — |
| Seed | `prisma/seed.ts` | ghi `searchText` |
| Test | `modules/posts/search.db.test.ts` | đã thêm |
| Code cũ | không có | — |

Phân loại: **an toàn** (thêm cột có mặc định + backfill); không xoá/đổi tên cột. Production: Vinh chạy `npx prisma migrate deploy` (backfill chạy trong migration).

## Tasks & Acceptance

**Execution:**
- [x] 8.1 action/service Lượt tim, `PostLikeProvider` + `LikeButton` ở 3 vị trí, cột + sắp xếp Lượt tim CMS
- [x] 8.2 `ShareButtons` (Facebook, Threads, Sao chép link / chia sẻ gốc), Toast site ở đáy
- [x] 8.3 cột `searchText` + migration backfill, `searchPosts`, `/tim-kiem` (SearchBox, chip Danh mục, kết quả tô từ khớp, rỗng, lỗi)
- [x] 8.4 `getPopularPosts`, PostCard *rank*, Xem nhiều trên Trang chủ (mobile / desktop) và 404 (+ SearchBox)
- [x] Test cho mọi action/query/hàm thuần mới; docs; `deferred-work.md`
- [x] Kiểm tay (`next start -p 3300`, Chrome headless qua CDP, UA điện thoại thường): trang bài 360px — 3 LikeButton "Thả tim bài viết, 0 lượt" → chạm ở ArticleActionBar → cả 3 "Đã thả tim, 1 lượt", `localStorage` `tim:<id>` = 1, tải lại vẫn đã thả; bỏ tim về 0; "Sao chép link" (clipboard headless bị chặn) → Toast hướng dẫn chép tay ở đáy trên ArticleActionBar; `/tim-kiem` tự focus ô tìm, 8 chip Danh mục; gõ "noi chien" → "Tìm thấy 1 bài viết cho "noi chien"", tô "nồi", "chiên"; "xyzxyz" → EmptyState; `/tim-kiem?q=nồi` tìm ngay; 404 → SearchBox + Xem nhiều, Enter "noi chien" → `/tim-kiem?q=noi%20chien` có kết quả; Trang chủ 1280px Bài nổi bật 7 cột + Xem nhiều 5 cột; `/cms/bai-viet?sap-xep=luot-tim` có Basic Auth 200 (cột "Lượt tim", tab "Lượt tim nhiều nhất"), không auth 401. Dữ liệu thử (`PostStat`, `PostViewDaily`) trên DB cục bộ đã xoá (trước đó rỗng).

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy.
- Given `npm run build`, when xem bảng route, then `/`, `/bai-viet/[slug]`, `/tim-kiem` tĩnh (`○`/`◐`), revalidate vẫn 1d.
- Given trang bài, Trang chủ, `/tim-kiem`, 404 ở 360px và 1280px, then đúng AC Story 8.1–8.4 trong `epics.md`.

## Spec Change Log

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Đọc số tim giới hạn 120 lần/phút/nguồn** (`LIKE_COUNT_RATE_LIMIT`, bộ đếm riêng với ghi tim 30/phút của FR-35). Lý do: mỗi lần mở bài đọc một lần; nhiều người đọc chung IP (NAT di động) cùng mở bài nên để rộng hơn ghi, vẫn chặn script dội.
2. **Tìm kiếm giới hạn 60 lần/phút/nguồn** (`SEARCH_RATE_LIMIT`, Deferred của spine giao story chốt). Lý do: gõ có chờ 300 ms nên một lần tìm thật tốn vài lượt; cùng mức Lượt xem (Epic 7) cho người chung IP.
3. **Từ khoá: ≥ 2 ký tự sau khi gấp, ≤ 100 ký tự, tối đa 8 từ (từ thừa bỏ), bài phải chứa đủ mọi từ (AND), trả ≤ 20 bài nhưng đếm đủ N.** Lý do: chặn truy vấn nặng; 20 kết quả đủ một màn điện thoại; AC chỉ nêu "N bài".
4. **`searchText` = tiêu đề + tóm tắt + thẻ + chữ thân bài (sau sanitize)**, gấp bằng `toSearchText` (bỏ dấu, đ → d, chữ thường, ký tự không phải a-z/0-9 → khoảng trắng). Không đưa từ khoá SEO, tên Danh mục, tên Sản phẩm vào. Ký tự `%`, `_` bị bỏ khi gấp nên `contains` không có ký tự đại diện.
5. **Backfill bằng SQL trong migration** (`translate` bảng chữ tiếng Việt + `regexp_replace`), không dùng extension `unaccent` (spine không nêu) và không script chạy tay. Đã so 10/10 bài DB cục bộ khớp `toSearchText`; chữ ngoài tiếng Việt có dấu khác (vd "ü") SQL đổi thành khoảng trắng — lưu lại bài là đúng.
6. **Kết quả qua ranh giới client: `publishedAt` là chuỗi ISO** (AD-8), client đổi lại `Date` cho PostCard. Highlight chỉ trên tiêu đề (PostCard *row* không có tóm tắt).
7. **`/tim-kiem` đọc `?q=` phía client bằng `useSearchParams` trong `<Suspense>`**, fallback là chính màn tìm ở trạng thái chưa gõ (trang `○` tĩnh). SearchBox ở 404 mở `/tim-kiem?q=…`; trang không ghi lại `?q=` khi gõ.
8. **Tìm kiếm xếp mới xuất bản trước**, không xếp theo mức liên quan (ghi `deferred-work.md`).
9. **"Xem nhiều" dùng `cacheLife("days")`** (không phải "hours" như ví dụ [NX-36]): trang 404 nằm trong cây của mọi route, hồ sơ "hours" kéo cả site (kể cả CMS) xuống revalidate 1h khi build. Danh sách 30 ngày trễ tối đa một ngày; không `updateTag` mỗi lượt xem (AD-23).
10. **Xem nhiều: bằng Lượt xem thì theo id** (thứ tự ổn định, query `groupBy` có `take`); bài chỉ có lượt xem ngoài cửa sổ không vào; cửa sổ = hôm nay + 29 ngày trước theo ngày Việt Nam.
11. **Trang chủ dựng khu Xem nhiều hai chỗ** (mobile sau Gom link đồ xinh — `lg:hidden`; desktop cột 5/12 cạnh Bài nổi bật — `hidden lg:block`, id tiêu đề khác nhau) để thứ tự đọc và Tab đúng ở cả hai bố cục (UX-DR88) thay vì đổi `order` CSS. PostCard *featured* xếp ảnh/chữ cạnh nhau theo bề rộng khung (`@container`, ≥ 48rem) thay vì theo màn hình, nên trong cột 7/12 nó xếp dọc.
12. **PostCard *rank***: số `01`–`05` + PostTypeBadge + tiêu đề + ngày · phút đọc, không ảnh.
13. **404 lấy 3 bài đầu của cùng mục cache 5 bài** (`getPopularPosts(5).slice(0, 3)`) để Trang chủ và 404 dùng chung một lần đọc.
14. **Chia sẻ gốc chỉ trên thiết bị cảm ứng** (`navigator.share` và `pointer: coarse`): Chrome/Safari máy tính cũng có `navigator.share` nhưng UX nói "mobile"; khi đó nút chính (nền `primary`) là "Chia sẻ bài viết" thay "Sao chép link". Lỗi chia sẻ gốc khác huỷ → sao chép link.
15. **Threads: `https://www.threads.com/intent/post?text=<tiêu đề> <URL>`**, Facebook: `sharer.php?u=<URL>`. Link chia sẻ là `<a target="_blank">` hình nút tròn. Icon Facebook vẽ SVG "f" (lucide 1.x không có icon thương hiệu), Threads dùng `AtSign`.
16. **ArticleActionBar luôn hiện trên trang bài mobile** (trước đây ẩn khi bài không có Sản phẩm): giờ có LikeButton + ShareButtons. Màn < 380px nút "Sản phẩm" chỉ còn icon (chữ `sr-only`) để hàng vừa 360px.
17. **Khối cuối bài "Bạn thấy bài viết này hữu ích?"** (theo Stitch) chứa LikeButton + ShareButtons; desktop thêm ở cột phải dính dưới Mục lục (cột phải hiện cả khi bài < 2 h2).
18. **Thả tim: đang gửi thì bỏ qua chạm mới**; "đã thả" chỉ ghi `localStorage` khi server nhận; `localStorage` bị chặn → nhớ trong trang tới khi tải lại. Không lọc bot cho thả tim (bot không bấm nút; chỉ Lượt xem lọc bot — FR-33). Bài nháp / đã xoá → lỗi `POST_GONE_ERROR` + Toast chung.
19. **Toast tách theo khu**: CMS giữ `top-center`; site `bottom-center`, 3 giây, cách đáy `--site-toast-bottom` (trên ArticleActionBar/BottomTabBar < 1024px, 1,5rem ≥ 1024px). Toast site dùng `toast()` thường (không icon lỗi đỏ).
20. **`INVALID_INPUT_ERROR`, `RATE_LIMITED_ERROR` chuyển sang `platform/errors.ts`** (dùng chung `engagement` và `posts.searchPosts`; `posts` không import được `engagement`).
21. **Thứ tự sắp xếp CMS**: tab thứ ba "Lượt tim nhiều nhất" (`?sap-xep=luot-tim`); query Lượt xem/Lượt tim gộp thành `listPostsByStatForCms({ by })` (cùng luật ghép hai đoạn của Epic 7). Không thêm index `PostStat.likes` (ít bài; thêm khi cần).

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng 3300+ (không dùng 3100, 3200), trình duyệt điện thoại thật: thả tim / bỏ tim, chia sẻ gốc và sao chép link (clipboard thật), `/tim-kiem` gõ không dấu, Trang chủ có Xem nhiều sau khi có lượt xem (danh sách làm mới theo ngày).

**Kết quả (mốc trước review gộp, 2026-11-06):** `npm test` 342/342 (39 file); `npm run test:db` 205/205 (24 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch (`/`, `/bai-viet/[slug]`, `/tim-kiem` `○`/`◐`, revalidate 1d). Không gọi `claude -p` (epic không có tính năng AI).
