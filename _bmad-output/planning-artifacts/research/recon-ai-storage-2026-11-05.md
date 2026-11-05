# Recon: nhà cung cấp AI và nơi lưu file upload

- Ngày: 2026-11-05. Phục vụ hai mục Deferred của spine: "Nhà cung cấp AI cụ thể" (AD-10, AD-18) và "Backend lưu file" (AD-24).
- Đầu vào: addendum A1, A3; PRD NFR-1, NFR-2, NFR-3, NFR-9, FR-2, FR-6, FR-7; spine AD-10, AD-18, AD-24, Deferred.
- Ràng buộc: 0đ/tháng (free tier hoặc gói thuê bao đang trả), không OpenAI, tiếng Việt tốt, JSON theo schema, đọc ảnh, tìm web có nguồn, mỗi lần gọi ≤ 90 giây, tự chuyển nhà khi lỗi.
- Lượng dùng giả định: 3 sản phẩm/ngày × ~6 lần gọi = ~18 lần/ngày, ~540 lần/tháng; trong đó ~1 lần/sản phẩm cần tìm web (~90 lần/tháng).
- Tài liệu này không chọn thay Vinh. Mọi con số có URL nguồn; chỗ nào nguồn chính thức không công bố thì ghi rõ.

---

## Câu hỏi 1 — Nhà cung cấp AI

### Phát hiện quan trọng nhất

Từ 2026-10-07, gói **Max và Ultra** của Claude có kèm **tín dụng Claude API hằng tháng: $100 (Max), $200 (Ultra)**. Không cần thêm phương thức thanh toán vào Claude Console. Khi hết tín dụng thì request bị từ chối cho tới kỳ sau, **không tính tiền vào gói**. Tín dụng dùng được cho Claude API, Agent SDK và Managed Agents, nhưng **không** dùng cho Claude Code. Gói Free, Pro và Enterprise không có khoản này.
Nguồn: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers

Addendum A3 loại "Claude API trả theo lượng dùng" vì tốn tiền. Nếu Vinh đang trả gói Max hoặc Ultra, lý do đó không còn: API được trả bằng tín dụng có sẵn trong gói, đúng điều kiện "gói thuê bao đang trả sẵn" của NFR-9. **Vinh cần cho biết đang dùng gói nào** (xem câu hỏi Q1 ở cuối).

### Bảng so sánh

| Phương án | Chi phí với Vinh | Đọc ảnh (FR-7) | Tìm web có nguồn (FR-6) | JSON theo schema | Điều khoản dùng tự động trên server | Rủi ro chính |
|---|---|---|---|---|---|---|
| **A. Claude API bằng tín dụng của gói Max/Ultra** | 0đ nếu dùng trong $100/tháng; hết thì API dừng, không bị tính thêm [1] | Có | Có: công cụ web search của API, **$10 / 1.000 lượt tìm** + token; web fetch không thu thêm [2] | Có (structured outputs) | Rõ ràng: dùng API key theo Commercial Terms. Consumer Terms cũng cho phép truy cập tự động khi dùng API key [3] | Chỉ có với gói Max/Ultra; tín dụng không cộng dồn sang tháng sau [1] |
| **B. Claude Code CLI headless (`claude -p`) đăng nhập bằng gói** | 0đ biên; trừ vào hạn mức gói, dùng chung với việc code [4][5] | Có (đọc file ảnh bằng công cụ Read, hoặc đưa ảnh qua `--input-format stream-json`) | Có (công cụ WebSearch/WebFetch của Claude Code khi được cấp quyền) | Có: `--output-format json --json-schema`, kết quả nằm trong `structured_output` [6] | **Vùng xám**, chi tiết ở mục dưới [3][5] | Chậm (khởi động CLI + vòng agent, dễ vượt 90 giây khi có tìm web); phải cài và đăng nhập CLI trên VPS; `--bare` (chế độ khuyên dùng cho script) **không** dùng được đăng nhập bằng gói [6] |
| **C. Gemini API free tier** | 0đ | Có, ảnh và video nhận miễn phí ở free tier (2.5 Flash-Lite, 3.1 Flash-Lite, 3 Flash Preview…) [7] | **Chỉ dòng 2.5**: grounding Google Search miễn phí tới **500 lượt/ngày, dùng chung cho Flash và Flash-Lite**. Dòng 3.x ở free tier: "Not available" [7] | Có (structured output ở API gốc) | Được phép (API key); **dữ liệu free tier được Google dùng để cải thiện sản phẩm** [7] | `gemini-2.5-flash` tắt ngày **2026-12-01**; `gemini-2.5-flash-lite` chưa có ngày tắt; `gemini-3.1-flash-lite` tắt sớm nhất 2027-05-07 [8]. Trang chính thức không công bố số RPM/RPD của free tier, phải xem trong AI Studio [9]. Grounding có vẻ **không chạy qua endpoint OpenAI-compatible** mà `llm.ts` đang dùng (chỉ có câu trả lời trên diễn đàn, chưa có tài liệu chính thức) [10] |
| **D. Groq free** | 0đ | Có: `qwen/qwen3.8-27b` (≤ 3 ảnh/lần, ≤ 20 MB) và `muse-spark-open` (bản preview giới hạn) [11] | Không có công cụ riêng. "Browser search" chỉ gắn với `openai/gpt-oss-*` (**vùng xám OpenAI**); `groq/compound` đã ngừng từ 2026-09-21 [12][13] | JSON mode / tool calling (không kiểm sâu) | Được phép (API key) | Trang chính thức không công bố hạn mức free; số liệu của bên thứ ba vênh nhau (1.000 hay 14.400 lượt/ngày) [14] |
| **E. Cerebras** | **Không còn free tier lâu dài.** Theo các trang theo dõi bên thứ ba: hạn mức 1M token/ngày đã kết thúc 2026-07-21; nay chỉ có trial $5, cần thẻ, dùng trong 30 ngày [15] | `qwen-3.8-27b` (≤ 2 ảnh) [16] | Không | — | — | **Loại**: vi phạm NFR-9 sau trial |
| **F. OpenRouter `:free`** | 0đ | Tuỳ model | Không (với model free) | Tuỳ model | Được phép | Chỉ **50 lượt/ngày** nếu chưa từng mua ≥ 10 credit (mua thì được 1.000 lượt/ngày, nhưng tốn tiền) [17]; danh sách model free hay thay đổi |

Chất lượng tiếng Việt: chưa có benchmark công khai đáng tin cho đúng tác vụ này. Dựa trên kinh nghiệm chung, Claude ≥ Gemini Flash > Qwen 27B về văn phong tiếng Việt. Đây là **giả định, cần thử**: chạy cùng 3 prompt thật (nghiên cứu, bài web, chuỗi Threads) trên A/B và C, rồi Vinh chấm.

### Tìm web khi nhà cung cấp không tự tìm

| API tìm kiếm | Free tier | Cần thẻ? | Ghi chú |
|---|---|---|---|
| **Tavily** | 1.000 credit/tháng; basic search = 1 credit, advanced = 2 [18][19] | Không [18] | Trả về nội dung đã trích, hợp để đưa thẳng vào prompt. Nhu cầu ~90–270 lượt/tháng nằm gọn trong hạn mức |
| **Serper** (Google SERP) | 2.500 lượt, trang chủ không nói là một lần hay hằng tháng (nhiều khả năng một lần) [20] | Không [20] | Chỉ trả kết quả SERP, không có nội dung trang |
| **Brave Search API** | Trang giá ghi "$5 free credits every month" (~1.000 lượt với giá $5/1.000), nhưng phần đầu trang lại ghi "up to $20", hai con số chưa khớp [21] | **Có** [21] | Được, nhưng phải gắn thẻ |
| **Google Custom Search JSON API** | 100 lượt/ngày, nhưng **đóng với khách mới, ngừng hẳn từ 2027-01-01** [22] | — | **Loại** |

### Điều khoản của phương án B (`claude -p` bằng gói)

- Consumer Terms (Free/Pro/Max) cấm truy cập "through automated or non-human means" **trừ khi** dùng API key "or where we otherwise explicitly permit it" [3].
- Tài liệu Claude Code mô tả rõ việc dùng `claude -p` khi đăng nhập bằng gói: "draw from your subscription limits". Phần này được xem là "explicitly permit" cho việc **chính người thuê bao** chạy script [5]. Tài liệu cũng ghi "Advertised usage limits … assume ordinary, individual usage of Claude Code and the Agent SDK" và cấm dùng thông tin đăng nhập của gói để phục vụ **người dùng khác** [4].
- Đánh giá: Vinh là người dùng duy nhất. Anh tự bấm nút trong CMS của mình, nên đây không phải "phục vụ người dùng khác". Tuy vậy, việc một web app trên VPS gọi CLI bằng OAuth vẫn nằm sát ranh giới "ordinary, individual usage", và Anthropic "reserves the right to take measures … without prior notice" [4]. **Vùng xám, mức rủi ro thấp đến vừa.** Hậu quả xấu nhất là tài khoản bị hạn chế, kéo theo cả công cụ code của Vinh.
- Lịch sử thay đổi: Anthropic từng định tách `claude -p` sang một khoản tín dụng riêng từ 2026-06-15, rồi tạm dừng. Hiện `claude -p` vẫn trừ vào hạn mức gói [5]. Chính sách ở mảng này đổi nhanh.

### Ước tính chi phí phương án A (dùng tín dụng $100)

Giả định thô: lần gọi thường dùng ~8k token vào và ~1,5k token ra; lần gọi nghiên cứu dùng ~40k token vào (gồm kết quả tìm) và 3 lượt tìm. Giá theo [2]:
- **Sonnet 5.5** ($2 / $10 mỗi MTok): 450 lần thường ≈ $14, 90 lần nghiên cứu ≈ $11, **tổng ≈ $25/tháng** (~25% tín dụng).
- **Haiku 5.5** ($0,10 / $0,50 mỗi MTok): **tổng ≈ $4/tháng**, phần lớn là phí tìm web.
- Khoảng dư rộng. Nên đặt spend limit cho một workspace riêng [1] để AI của site không ăn vào phần tín dụng Vinh dùng cho việc khác.

### Rủi ro chung

- Free tier đổi điều kiện không báo trước. Năm 2026 đã có ít nhất ba lần: Cerebras bỏ free tier [15], Groq ngừng `compound` [13], Gemini bỏ grounding miễn phí ở dòng 3.x [7]. Lớp `platform/ai` cần đọc model và nhà cung cấp từ env, đúng như AD-10 và A1 đã định.
- Grounding miễn phí của Gemini chỉ còn trên dòng 2.5. Khi `gemini-2.5-flash-lite` bị khai tử, nguồn này mất, nên cần Tavily làm đường dự phòng cho FR-6.
- Endpoint OpenAI-compatible của Gemini (đường `llm.ts` đang dùng) nhiều khả năng không hỗ trợ grounding [10]. Muốn dùng grounding phải gọi API gốc `generateContent` qua `fetch`, không cần SDK.
- Cooldown và chuyển nhà trong bộ nhớ tiến trình (A1) vẫn hợp với một VPS.

### Khuyến nghị câu 1

**Nếu Vinh dùng gói Max hoặc Ultra** → chọn **A làm nhà chính, C làm nhà dự phòng, Tavily làm đường tìm web dự phòng**:
1. Nhà chính: Claude API (Sonnet 5.5 cho bài viết và nghiên cứu, Haiku 5.5 cho việc nhẹ), trả bằng tín dụng kèm gói. Một nhà đáp ứng cả bốn năng lực (ảnh, tìm web có trích nguồn, JSON schema, tiếng Việt), điều khoản sạch, 0đ, không có rủi ro bị tính tiền thêm vì Console không gắn thẻ.
2. Dự phòng (NFR-2): Gemini `gemini-2.5-flash-lite` free qua API gốc. Có ảnh và có grounding 500 lượt/ngày. Model kế tiếp khi 2.5 bị tắt là `gemini-3.5-flash-lite` (dòng này không có grounding miễn phí).
3. Tìm web khi nhà đang chạy không tự tìm được: Tavily (gọi tìm trước, đưa kết quả vào prompt, giữ URL làm `sources`).
4. Groq `qwen3.8-27b` là lớp dự phòng thứ ba nếu muốn (có ảnh, không tìm web); không bắt buộc.

**Nếu Vinh dùng gói Pro (không có tín dụng API)** → chọn **C làm nhà chính, Tavily cho tìm web, D làm dự phòng**. `claude -p` (B) chỉ nên là tuỳ chọn mà Vinh tự bật cho tác vụ cần chất lượng cao, sau khi đã chấp nhận vùng xám điều khoản. Không nên để B làm nhà chính vì ba lý do: vùng xám điều khoản, độ trễ có thể vượt 90 giây khi có tìm web, và nó ăn vào hạn mức code của Vinh.

Lý do không chọn B làm trục chính trong cả hai trường hợp: phương án A có cùng chất lượng model nhưng điều khoản rõ, có structured output gốc, không phải cài CLI lên VPS, và gọi được bằng `fetch` từ `platform/ai` giống các nhà khác.

---

## Câu hỏi 2 — Nơi lưu file upload (ảnh, video ≤ 100 MB)

### Bảng so sánh

| Tiêu chí | **Đĩa VPS** | **Supabase Storage free** | **Cloudflare R2 free** | **Backblaze B2 free** |
|---|---|---|---|---|
| Chi phí | 0đ (đĩa có sẵn) | 0đ | 0đ trong hạn mức | 0đ trong hạn mức |
| Dung lượng miễn phí | Theo đĩa VPS | **1 GB** [23] | 10 GB-tháng; 1M thao tác loại A, 10M loại B mỗi tháng; egress miễn phí [24] | 10 GB đầu; egress miễn phí tới 3 lần dung lượng lưu trung bình mỗi tháng [25] |
| File 100 MB | Được (proxy phải cho body ≥ 100 MB, như spine đã ghi) | **Không: tối đa 50 MB/file** ở gói free [23] | Được | Được |
| Gián đoạn | Không | **Project bị tạm dừng sau 1 tuần không hoạt động** [23] | Không | Không |
| Cần thẻ | Không | Không | Nhiều nguồn bên thứ ba nói Cloudflare đòi thêm phương thức thanh toán trước khi tạo bucket (chưa xác minh trên trang chính thức) [26] | Đăng ký không cần; **bucket public cần lịch sử thanh toán hoặc trả một khoản nhỏ (được cộng lại vào số dư)** và phải xác minh email [27] |
| URL cho `next/image` | Cùng domain: `localPatterns`, hoặc subdomain `media.<domain>` thêm vào `IMAGE_HOSTS` | `*.supabase.co`, đã có trong `IMAGE_HOSTS` | `r2.dev` bị giới hạn tần suất, không dành cho production; production cần custom domain là zone trên cùng tài khoản Cloudflare [26] | `f00x.backblazeb2.com` hoặc qua CDN |
| Độ đơn giản cho một người | Cao nhất: ghi file bằng `fs`, không SDK, không khoá API | Vừa | Vừa: SDK S3 (`@aws-sdk/client-s3`) hoặc ký request thủ công, khoá API, CORS | Vừa (tương tự R2) |
| Backup | **Tự lo**: cùng nằm trên VPS với DB, VPS hỏng là mất cả hai | Gói free không có backup tự động [23] | Bền vững (do nhà cung cấp lo) | Bền vững |

### Ghi chú kỹ thuật cho đĩa VPS (Next.js 16)

- **Không** ghi vào `public/`: tài liệu Next nói `public` được phục vụ với `Cache-Control: public, max-age=0` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md`). Thực tế, file thêm vào sau `next build` thường không được `next start` phục vụ. Điểm này chưa thấy ghi trong tài liệu đi kèm, cần kiểm khi làm story.
- Hai cách phục vụ:
  1. Reverse proxy (Caddy/nginx) phục vụ thư mục `/var/lib/<app>/uploads` ở **subdomain riêng** `media.<domain>`. `next/image` coi đây là ảnh remote: thêm host vào `IMAGE_HOSTS` (`lib/images.ts`, sau này là `platform/images.ts`). Cách này đơn giản và tách tải khỏi Next.
  2. Route Handler của Next (ví dụ `app/media/[...path]/route.ts`) stream file từ đĩa; ảnh dùng đường dẫn tương đối và `images.localPatterns` (tài liệu Next 16, `image.md` mục `localPatterns`). Theo hiểu biết của tôi, bộ tối ưu ảnh của Next lấy ảnh local từ chính Next, nên một đường dẫn chỉ do proxy phục vụ có thể bị lỗi khi tối ưu (cần kiểm).
- `isAllowedImageUrl` hiện đã nhận URL bắt đầu bằng `/`.

### Rủi ro

- Đĩa VPS: mất dữ liệu nếu không backup ra ngoài; đầy đĩa nếu tải nhiều video (100 video ≈ 10 GB).
- Supabase: **không đáp ứng** video 100 MB và có thể bị tạm dừng. Loại.
- R2/B2: thêm khoá API, CORS và phụ thuộc bên ngoài; phần public có rào cản thẻ hoặc khoản thanh toán nhỏ, có thể không còn đúng "0đ" nếu B2 đòi trả trước (tiền đó được cộng lại vào số dư nhưng vẫn phải chi ra).

### Khuyến nghị câu 2

**Lưu trên đĩa VPS, phục vụ qua reverse proxy ở subdomain `media.<domain>` (thêm vào `IMAGE_HOSTS`), và backup hằng ngày bằng `rclone` ra một bucket private của B2 hoặc R2 trong hạn mức 10 GB free, chung job với backup Postgres.**

Lý do:
- 0đ thật, không cần thẻ cho đường phục vụ.
- Ít thành phần nhất: `platform/storage.put` chỉ là ghi file và trả `{ url }`, đúng hợp đồng AD-24, sau này đổi sang R2 cũng không phải sửa module.
- Không vướng giới hạn 50 MB như Supabase.
- Rủi ro mất dữ liệu được xử lý bằng backup ra ngoài. Bucket private không cần public URL, nên tránh được rào cản thanh toán cho bucket public của B2.

Khi nào chuyển sang R2: khi đĩa VPS chật, hoặc khi domain đã đặt trên Cloudflare (lúc đó custom domain cho R2 không tốn thêm gì).

---

## Câu hỏi Vinh cần trả lời

1. **Q1 — Gói Claude anh đang trả là gì (Pro / Max / Ultra)?** Câu này quyết định nhánh khuyến nghị câu 1. Nếu là Max/Ultra: anh có đồng ý nhận tín dụng API (link một tổ chức Claude Console, không gắn thẻ) và coi đó là "gói đang trả sẵn" theo NFR-9 không?
2. **Q2 — Có chấp nhận vùng xám điều khoản của `claude -p` không?** Nếu không, bỏ B hẳn khỏi danh sách.
3. **Q3 — Có chấp nhận Google dùng dữ liệu gửi lên Gemini free tier để cải thiện sản phẩm không?** Dữ liệu gửi đi là thông tin sản phẩm công khai và bản nháp bài, mức nhạy cảm thấp.
4. **Q4 — `gpt-oss` (model mở của OpenAI) chạy trên Groq/Cerebras có bị tính là "dùng OpenAI" không?** Câu trả lời ảnh hưởng việc có dùng được "browser search" của Groq hay không. Khuyến nghị trên **không** cần tới nó.
5. **Q5 — Có đồng ý thử chất lượng tiếng Việt** (3 prompt thật, so A hoặc B với C) trước khi chốt model mặc định không?
6. **Q6 — VPS có dung lượng đĩa trống bao nhiêu, và giữ video bao lâu?** (PRD câu hỏi mở 1). Câu này quyết định bao giờ phải chuyển sang R2.
7. **Q7 — Domain của site có đặt DNS trên Cloudflare không?** Nếu có, R2 với custom domain trở nên dễ.
8. **Q8 — Có đồng ý tạo tài khoản B2 hoặc R2 chỉ để làm nơi backup (bucket private) không?**

---

## Nguồn

1. API credits for Max, Ultra, and Team plans — https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers
2. Claude pricing (model, web search $10/1.000, web fetch) — https://platform.claude.com/docs/en/about-claude/pricing
3. Anthropic Consumer Terms (mục 3.7 truy cập tự động) — https://www.anthropic.com/legal/consumer-terms
4. Claude Code Legal and compliance (OAuth, "ordinary, individual usage") — https://code.claude.com/docs/en/legal-and-compliance
5. Claude Help Center: Agent SDK / `claude -p` dùng hạn mức gói (cập nhật 2026-06-15, 2026-10-07) — https://support.claude.com/en/articles/15036540
6. Claude Code headless (`--json-schema`, `--bare` không dùng đăng nhập gói) — https://code.claude.com/docs/en/headless ; CLI reference — https://code.claude.com/docs/en/cli-reference
7. Gemini API pricing (free tier, grounding, "Used to improve our products") — https://aistudio.google.com/docs/pricing
8. Gemini deprecations — https://aistudio.google.com/docs/deprecations
9. Gemini rate limits (không công bố số free tier, trỏ về AI Studio) — https://aistudio.google.com/docs/rate-limits
10. Diễn đàn Google AI: grounding qua OpenAI compatibility — https://discuss.ai.google.dev/t/does-openai-api-support-google-search-grounding/107542
11. Groq vision — https://console.groq.com/docs/vision
12. Groq models (gpt-oss có browser search) — https://console.groq.com/docs/models
13. Groq Compound ngừng 2026-09-21 — https://console.groq.com/docs/compound
14. Groq rate limits (bảng free không hiển thị) — https://console.groq.com/docs/rate-limits ; số liệu bên thứ ba: https://community.groq.com/t/is-there-a-free-tier-and-what-are-its-limits/790
15. Cerebras free tier kết thúc (bên thứ ba) — https://www.usagepricing.com/blueprint/activity/cerebras-2026-07-21-free-tier-credit-trial ; https://costbench.com/software/llm-api-providers/cerebras-inference/free-plan/
16. Cerebras rate limits (Free Trial) — https://inference-docs.cerebras.ai/support/rate-limits
17. OpenRouter limits — https://openrouter.ai/docs/api/reference/limits
18. Tavily pricing — https://www.tavily.com/pricing
19. Tavily API credits — https://docs.tavily.com/documentation/api-credits
20. Serper — https://serper.dev/
21. Brave Search API — https://brave.com/search/api/
22. Google Custom Search JSON API — https://developers.google.com/custom-search/v1/overview
23. Supabase pricing — https://supabase.com/pricing
24. Cloudflare R2 pricing — https://developers.cloudflare.com/r2/pricing/
25. Backblaze B2 pricing — https://www.backblaze.com/cloud-storage/pricing
26. R2 cần phương thức thanh toán, `r2.dev` không dành cho production (bên thứ ba) — https://tech-insider.org/how-to-set-up-cloudflare-r2-2026/ ; https://nubbo.app/blog/cloudflare-r2-free-tier/
27. B2 bucket public cần xác minh email và lịch sử thanh toán — https://help.backblaze.com/hc/en-us/articles/1260803940089-Why-do-I-need-to-verify-my-email-address-to-create-a-public-bucket ; https://www.backblaze.com/docs/cloud-storage-create-and-manage-buckets
