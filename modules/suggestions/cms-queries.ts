import "server-only";
import type { Platform, SuggestionKind } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import {
  getContentSetIdForPostForCms,
  parseFacebookPayload,
  parseLinkCommentPayload,
  parseThreadsPayload,
} from "@/modules/content-sets/cms-queries";
import { parseWebPostPayload } from "@/modules/posts/cms-queries";
import {
  parseInspirationResearchPayload,
  parseProductCategoryPayload,
  parseResearchPayload,
} from "@/modules/research/cms-queries";
import {
  GENERATING_STALE,
  GENERATING_TIMEOUT_MS,
  INSPIRATION_GENERATING_STALE,
  PART_STALE,
  type ContentSetKind,
  type VisibleSuggestionStatus,
} from "@/modules/suggestions/constants";
import { riskWarningsSchema, suggestionSkippedSchema, suggestionSourcesSchema } from "@/modules/suggestions/schema";

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

// Gợi ý nghiên cứu hiện hành của Chi tiết Cảm hứng (FR-2, UX-DR77): bản `RESEARCH` mới nhất gắn `inspirationId`.
export async function getInspirationSuggestionForCms(inspirationId: string) {
  const row = await db.suggestion.findFirst({
    where: { inspirationId, kind: "RESEARCH", status: { not: "SUPERSEDED" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select,
  });
  if (!row) return null;
  const v = view(row, parseInspirationResearchPayload(row.payload), Date.now());
  const stale = v.status === "FAILED" && row.status === "GENERATING";
  return { ...v, errorMessage: stale ? INSPIRATION_GENERATING_STALE : v.errorMessage };
}

// ---------- Bộ nội dung (Epic 5) ----------

const partSelect = {
  ...select,
  platform: true,
  riskWarnings: true,
  firstCopiedAt: true,
} as const;

type PartRow = Awaited<ReturnType<typeof findParts>>[number];

function findParts(contentSetId: string) {
  return db.suggestion.findMany({
    where: { contentSetId, status: { not: "SUPERSEDED" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: partSelect,
  });
}

function partView<P>(row: PartRow, payload: P | null, now: number) {
  const base = view(row, payload, now);
  const risks = riskWarningsSchema.safeParse(row.riskWarnings);
  return {
    ...base,
    errorMessage: base.status === "FAILED" && row.status === "GENERATING" ? PART_STALE : base.errorMessage,
    kind: row.kind as ContentSetKind,
    riskWarnings: risks.success ? risks.data : [],
    firstCopiedAt: row.firstCopiedAt?.toISOString() ?? null,
    editedBeforeApproval: row.editedBeforeApproval,
  };
}

// Gợi ý hiện hành của từng phần trong Bộ nội dung (UX-DR75): bản mới nhất mỗi khoá (`kind` + `platform`), bản
// `SUPERSEDED` không hiện. Payload parse theo `kind` bằng Zod của module chủ đích; hỏng thì `payload` null.
export async function getContentSetSuggestionsForCms(contentSetId: string) {
  const rows = await findParts(contentSetId);
  const now = Date.now();
  const latest = (kind: SuggestionKind, platform: Platform) => rows.find((r) => r.kind === kind && r.platform === platform);
  const web = latest("WEB_POST", "WEBSITE");
  const threads = latest("THREADS_POST", "THREADS");
  const threadsComment = latest("LINK_COMMENT", "THREADS");
  const facebook = latest("FACEBOOK_POST", "FACEBOOK");
  const facebookComment = latest("LINK_COMMENT", "FACEBOOK");
  return {
    web: web ? partView(web, parseWebPostPayload(web.payload), now) : null,
    threads: threads ? partView(threads, parseThreadsPayload(threads.payload), now) : null,
    threadsComment: threadsComment ? partView(threadsComment, parseLinkCommentPayload(threadsComment.payload), now) : null,
    facebook: facebook ? partView(facebook, parseFacebookPayload(facebook.payload), now) : null,
    facebookComment: facebookComment
      ? partView(facebookComment, parseLinkCommentPayload(facebookComment.payload), now)
      : null,
  };
}

// Trạng thái AI của một Bài web cho màn soạn (FR-22, UX-DR72; AD-19): Bộ nội dung có bài làm đích, bài có bị khoá
// Xuất bản (gợi ý `WEB_POST` hiện hành Đang tạo / Chờ duyệt — khoá chỉ ở giao diện), Cảnh báo rủi ro của gợi ý hiện
// hành (Chờ duyệt / Đã duyệt) để hiện trong PostEditor qua props.
export async function getPostAiStateForCms(postId: string) {
  const contentSetId = await getContentSetIdForPostForCms(postId);
  if (!contentSetId) return { contentSetId: null, locked: false, riskWarnings: [] };
  const row = await db.suggestion.findFirst({
    where: { contentSetId, kind: "WEB_POST", status: { not: "SUPERSEDED" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: partSelect,
  });
  if (!row) return { contentSetId, locked: false, riskWarnings: [] };
  const part = partView(row, null, Date.now());
  return {
    contentSetId,
    locked: part.status === "GENERATING" || part.status === "PENDING",
    riskWarnings: part.status === "PENDING" || part.status === "APPROVED" ? part.riskWarnings : [],
  };
}

// Một gợi ý (action Tạo lại cần biết `kind`, bộ, nền tảng).
export async function getSuggestionForCms(id: string) {
  return db.suggestion.findUnique({
    where: { id },
    select: { id: true, kind: true, status: true, contentSetId: true, platform: true },
  });
}
