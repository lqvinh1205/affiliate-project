// User-agent của bot phổ biến (công cụ tìm kiếm, trình xem trước link, công cụ đo, thư viện HTTP) — không đếm Lượt
// xem (FR-33, AD-23). Không chặn trình duyệt trong app (Zalo, Facebook `FBAN`, Instagram): đó là người đọc thật.
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebot|embedly|bingpreview|skypeuripreview|vkshare|pinterest|headlesschrome|lighthouse|pagespeed|pingdom|uptimerobot|curl\/|wget\/|python-requests|python-urllib|aiohttp|axios\/|node-fetch|undici|go-http-client|okhttp|java\/|httpclient|scrapy|phantomjs|puppeteer|playwright|ahrefs|semrush|mj12|petalbot|yandex|baiduspider|bytespider|gptbot|claudebot|ccbot|perplexity/i;

// Thiếu user-agent cũng coi là bot (trình duyệt thật luôn gửi).
export function isBotUserAgent(ua: string | null | undefined) {
  return !ua?.trim() || BOT_UA.test(ua);
}
