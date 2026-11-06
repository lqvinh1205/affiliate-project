// Giới hạn cứng của Hồ sơ nghiên cứu (AD-14, AD-25). `ResearchProfile.data` là Json nên giới hạn chỉ ở Zod
// (`researchProfileSchema`), áp cho cả kết quả AI (cắt bớt) và form sửa (báo lỗi tại trường).
export const RESEARCH_INFO_MAX = 8;
export const RESEARCH_INFO_TEXT_MAX = 600;
export const RESEARCH_NOTE_MAX = 300;
export const RESEARCH_IMAGE_DESCRIPTION_MAX = 1500;
export const RESEARCH_REVIEW_ITEMS_MAX = 5;
export const RESEARCH_REVIEW_ITEM_MAX = 300;
export const RESEARCH_AUDIENCES_MIN = 1;
export const RESEARCH_AUDIENCES_MAX = 3;
export const RESEARCH_ANGLES_MIN = 3;
export const RESEARCH_ANGLES_MAX = 6;
export const RESEARCH_NAME_MAX = 120;
export const RESEARCH_REASON_MAX = 500;
export const RESEARCH_CATEGORY_REASON_MAX = 300;

// Nhãn ba mục tóm tắt đánh giá (FR-8).
export const REVIEW_SUMMARY_LABELS = { praise: "Khen", complaints: "Chê", fit: "Phù hợp" } as const;

// Ô "Sửa lại (tuỳ chọn)" dưới Góc viết / Người đọc đang chọn (UX-DR46): bằng `RESEARCH_REASON_MAX` — Bộ nội dung
// lưu bản sửa vào cột `VarChar(500)` (`CONTENT_SET_CHOICE_TEXT_MAX`).
export const CONTENT_CHOICE_EDIT_MAX = RESEARCH_REASON_MAX;

// Hồ sơ nghiên cứu của Cảm hứng (FR-2): từ khoá tìm trên Shopee + dàn ý bài mẹo. Json → giới hạn chỉ ở Zod
// (`inspirationResearchSchema`).
export const INSPIRATION_SUMMARY_MAX = 600;
export const INSPIRATION_KEYWORDS_MIN = 1;
export const INSPIRATION_KEYWORDS_MAX = 8;
export const INSPIRATION_KEYWORD_MAX = 80;
export const INSPIRATION_OUTLINE_MIN = 2;
export const INSPIRATION_OUTLINE_MAX = 8;
export const INSPIRATION_OUTLINE_HEADING_MAX = 120;
export const INSPIRATION_OUTLINE_DETAIL_MAX = 500;
