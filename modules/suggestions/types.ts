import type { getProductSuggestionsForCms } from "@/modules/suggestions/cms-queries";

type ProductSuggestions = Awaited<ReturnType<typeof getProductSuggestionsForCms>>;

// Gợi ý như màn CMS đọc (đã đổi `GENERATING` quá hạn thành `FAILED`, payload đã parse).
export type ResearchSuggestionView = NonNullable<ProductSuggestions["research"]>;
export type CategorySuggestionView = NonNullable<ProductSuggestions["category"]>;
export type SuggestionSkipped = ResearchSuggestionView["skipped"][number];
