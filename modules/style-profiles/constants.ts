import type { Platform } from "@/generated/prisma/enums";

// Hồ sơ phong cách (FR-18, spine AD-25). Giá trị khởi tạo chỉ ở file này; quy chuẩn trong prompt cũ `lib/ai.ts`
// (Bài web, chuỗi Threads) chuyển thành giá trị khởi tạo ở đây.

// Giới hạn cứng của cột = `@db.VarChar(n)` trong `prisma/schema/style-profiles.prisma` (AD-14).
export const STYLE_VOICE_MAX = 1000;
export const STYLE_EMOJI_MAX = 300;
export const STYLE_FORBIDDEN_MAX = 1000;
export const STYLE_RULES_MAX = 1000;
export const STYLE_DISCLOSURE_MAX = 200;

// Trần của mục tiêu mềm = giới hạn cứng của module chủ nội dung (AD-25): Bài web ở `modules/posts/constants.ts`
// (`WEB_POST_WORDS_MAX`, `WEB_POST_SECTIONS_MAX`), bài mạng xã hội ở `modules/content-sets/constants.ts`
// (`THREADS_POST_MAX`, `THREADS_PARTS_MAX`, `FACEBOOK_WORDS_MAX`). Module tầng T0 không import được hai module đó
// (AD-2) nên số được chép lại ở đây; test `modules/content-sets/style-limits.test.ts` giữ hai nơi bằng nhau.
export const STYLE_HARD_LIMITS = {
  WEBSITE: { lengthMax: 3000, partsMax: 10 },
  THREADS: { lengthMax: 500, partsMax: 10 },
  FACEBOOK: { lengthMax: 1000, partsMax: null },
} as const satisfies Record<Platform, { lengthMax: number; partsMax: number | null }>;

// Nghĩa của `lengthMin`/`lengthMax` và `partsMin`/`partsMax` theo nền tảng (nhãn form, prompt). `parts` null: nền
// tảng không có mục này. `disclosure`: có ô "câu công khai" (FR-18 — chỉ Threads, Facebook).
export const STYLE_PLATFORMS = {
  WEBSITE: {
    label: "Website",
    length: { label: "Độ dài thân bài", unit: "từ" },
    parts: { label: "Số mục h2", unit: "mục" },
    disclosure: false,
  },
  THREADS: {
    label: "Threads",
    length: { label: "Độ dài mỗi bài trong chuỗi", unit: "ký tự" },
    parts: { label: "Số bài trong chuỗi", unit: "bài" },
    disclosure: true,
  },
  FACEBOOK: {
    label: "Facebook",
    length: { label: "Độ dài bài", unit: "từ" },
    parts: null,
    disclosure: true,
  },
} as const satisfies Record<
  Platform,
  {
    label: string;
    length: { label: string; unit: string };
    parts: { label: string; unit: string } | null;
    disclosure: boolean;
  }
>;

export const STYLE_PLATFORM_KEYS = Object.keys(STYLE_PLATFORMS) as Platform[];

// Giọng thương hiệu dùng chung (FR-18).
const BRAND_VOICE =
  "Gần gũi, dí dỏm vừa phải kiểu Gen-Z nhưng rõ ràng, hữu ích. Không sến, không phóng đại, không giật tít sai sự thật. Tiếng Việt có dấu chuẩn.";

const SOCIAL_FORBIDDEN =
  "Không chèn link vào thân bài (link nằm ở Bình luận kèm link). Không nêu giá cụ thể. Không hứa hẹn tuyệt đối, không chê sản phẩm của hãng khác.";

export type StyleProfileValues = {
  voice: string;
  lengthMin: number;
  lengthMax: number;
  partsMin: number | null;
  partsMax: number | null;
  emoji: string;
  forbidden: string;
  rules: string;
  disclosure: string | null;
};

// Giá trị khởi tạo (FR-13, FR-14, FR-15): dùng khi nền tảng chưa có bản ghi `StyleProfile`.
export const STYLE_PROFILE_DEFAULTS = {
  WEBSITE: {
    voice: BRAND_VOICE,
    lengthMin: 600,
    lengthMax: 900,
    partsMin: 3,
    partsMax: 5,
    emoji: "Không dùng emoji trong thân bài.",
    forbidden:
      "Không chèn link, ảnh hay giá vào thân bài — Sản phẩm hiện riêng bên dưới bài. Không dùng h1. Không nhắc tên sản phẩm của hãng khác để so sánh hạ thấp.",
    rules:
      "Mở bài 1–2 đoạn ngắn đi thẳng vào vấn đề. Tiêu đề ≤ 70 ký tự, hấp dẫn nhưng không giật tít; SEO title ≤ 60 ký tự; SEO description 140–160 ký tự; tóm tắt 1–2 câu ≤ 200 ký tự; 3–5 thẻ ngắn viết thường; 3–6 từ khoá người Việt hay tìm.",
    disclosure: null,
  },
  THREADS: {
    voice: BRAND_VOICE,
    lengthMin: 40,
    lengthMax: 250,
    partsMin: 4,
    partsMax: 7,
    emoji: "Emoji làm điểm nhấn vừa phải, 1–2 cái mỗi bài.",
    forbidden: SOCIAL_FORBIDDEN,
    rules:
      "Bài 1 là hook gây tò mò. Các bài giữa đưa giá trị thật (mẹo, điểm hay), câu ngắn. Theo nguyên tắc cộng đồng Threads: không spam hashtag, không kêu gọi tương tác giả (follow/like để nhận quà).",
    disclosure: null,
  },
  FACEBOOK: {
    voice: BRAND_VOICE,
    lengthMin: 80,
    lengthMax: 250,
    partsMin: null,
    partsMax: null,
    emoji: "Emoji vừa phải ở đầu dòng hoặc cuối câu.",
    forbidden: SOCIAL_FORBIDDEN,
    rules:
      "Mở bằng một câu gây chú ý; xuống dòng sau 1–2 câu cho dễ đọc trên điện thoại; kết bằng lời mời xem bình luận để lấy link. Theo Tiêu chuẩn cộng đồng Facebook: không câu like/share, không nội dung gây hiểu lầm.",
    disclosure: null,
  },
} as const satisfies Record<Platform, StyleProfileValues>;
