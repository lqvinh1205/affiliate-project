import "server-only";
import type { SuggestionKind } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import { parseProductCategoryPayload, parseResearchPayload } from "@/modules/research/cms-queries";
import {
  GENERATING_STALE,
  GENERATING_TIMEOUT_MS,
  type VisibleSuggestionStatus,
} from "@/modules/suggestions/constants";
import { suggestionSkippedSchema, suggestionSourcesSchema } from "@/modules/suggestions/schema";

const select = {
  id: true,
  kind: true,
  status: true,
  payload: true,
  errorMessage: true,
  sources: true,
  skipped: true,
  editedBeforeApproval: true,
  createdAt: true,
} as const;

type Row = { id: string; status: string; errorMessage: string | null; sources: unknown; skipped: unknown; createdAt: Date };

// Gợi ý như màn hình thấy: `GENERATING` quá 120 giây trả là `FAILED` (AD-18); ngày qua ranh giới client là ISO (AD-8).
function view<P>(row: Row, payload: P | null, now: number) {
  const stale = row.status === "GENERATING" && now - row.createdAt.getTime() > GENERATING_TIMEOUT_MS;
  const sources = suggestionSourcesSchema.safeParse(row.sources ?? []);
  const skipped = suggestionSkippedSchema.safeParse(row.skipped ?? []);
  return {
    id: row.id,
    status: (stale ? "FAILED" : row.status) as VisibleSuggestionStatus,
    errorMessage: stale ? GENERATING_STALE : row.errorMessage,
    payload,
    sources: sources.success ? sources.data : [],
    skipped: skipped.success ? skipped.data : [],
    createdAt: row.createdAt.toISOString(),
  };
}

async function latest(productId: string, kind: SuggestionKind) {
  return db.suggestion.findFirst({
    where: { productId, kind, status: { not: "SUPERSEDED" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select,
  });
}

// Gợi ý hiện hành của Chi tiết Sản phẩm: hồ sơ nghiên cứu và Danh mục gợi ý mới nhất (bản `SUPERSEDED` không hiện).
// Payload Json được parse theo `kind`; hỏng thì `payload` null (thẻ báo lỗi, vẫn Tạo lại được).
export async function getProductSuggestionsForCms(productId: string) {
  const [research, category] = await Promise.all([latest(productId, "RESEARCH"), latest(productId, "PRODUCT_CATEGORY")]);
  const now = Date.now();
  return {
    research: research ? { ...view(research, parseResearchPayload(research.payload), now), editedBeforeApproval: research.editedBeforeApproval } : null,
    category: category ? view(category, parseProductCategoryPayload(category.payload), now) : null,
  };
}
