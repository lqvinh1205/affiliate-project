import type { getContentSetSuggestionsForCms, getProductSuggestionsForCms } from "@/modules/suggestions/cms-queries";

type ProductSuggestions = Awaited<ReturnType<typeof getProductSuggestionsForCms>>;

// Gợi ý như màn CMS đọc (đã đổi `GENERATING` quá hạn thành `FAILED`, payload đã parse).
export type ResearchSuggestionView = NonNullable<ProductSuggestions["research"]>;
export type CategorySuggestionView = NonNullable<ProductSuggestions["category"]>;
export type SuggestionSkipped = ResearchSuggestionView["skipped"][number];

type ContentSetSuggestions = Awaited<ReturnType<typeof getContentSetSuggestionsForCms>>;

// Các phần của Bộ nội dung như màn CMS đọc (payload đã parse theo `kind`, ngày ISO).
export type WebPostPartView = NonNullable<ContentSetSuggestions["web"]>;
export type ThreadsPartView = NonNullable<ContentSetSuggestions["threads"]>;
export type FacebookPartView = NonNullable<ContentSetSuggestions["facebook"]>;
export type LinkCommentPartView = NonNullable<ContentSetSuggestions["threadsComment"]>;
export type ContentSetPartView = WebPostPartView | ThreadsPartView | FacebookPartView | LinkCommentPartView;
