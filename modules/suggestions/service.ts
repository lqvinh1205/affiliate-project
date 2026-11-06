import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { SuggestionKind } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { CATEGORY_NOT_PICKED, GENERATING_STALE, SUGGESTION_ERROR_MAX } from "@/modules/suggestions/constants";

// Ghi bảng `Suggestion` (chủ: `suggestions`). Vòng đời theo spine AD-18:
// GENERATING → PENDING | FAILED; PENDING → APPROVED | REJECTED | SUPERSEDED. Mọi chuyển trạng thái là `updateMany`
// có điều kiện trạng thái cũ, để hai thao tác chạy chồng nhau không ghi đè nhau.

const NOT_FOUND = "Không tìm thấy gợi ý. Tải lại trang.";
const BUSY = "AI đang nghiên cứu Sản phẩm này. Chờ xong rồi thử lại.";
const ALREADY_APPROVED = "Hồ sơ nghiên cứu đã duyệt. Sửa trực tiếp trên hồ sơ.";
const NOT_PENDING = "Gợi ý này không còn chờ duyệt. Tải lại trang.";

const RESEARCH_KINDS: SuggestionKind[] = ["RESEARCH", "PRODUCT_CATEGORY"];

type Tx = Prisma.TransactionClient;

const json = (v: unknown) => v as Prisma.InputJsonValue;

// Bắt đầu một lần nghiên cứu Sản phẩm (lần đầu hoặc Tạo lại — FR-21, AD-19): trong một transaction
// - hồ sơ mới nhất đã Duyệt → `UserError` (sửa hồ sơ, không nghiên cứu lại);
// - còn gợi ý đang tạo chưa quá hạn → `UserError`; quá hạn (`staleBefore`) → `FAILED` trước khi chèn bản mới;
// - gợi ý đang chờ duyệt → `SUPERSEDED`;
// - chèn `RESEARCH` và `PRODUCT_CATEGORY` ở `GENERATING`, mang `parentSuggestionId` là bản mới nhất cùng `kind`.
// Partial unique index chặn hai lần bấm cùng lúc (P2002 → `UserError`).
export async function startResearchRecords(data: {
  productId: string;
  promptId: string;
  promptVersion: number;
  staleBefore: Date;
}) {
  try {
    return await db.$transaction(async (tx) => {
      const latest = await Promise.all(
        RESEARCH_KINDS.map((kind) =>
          tx.suggestion.findFirst({
            where: { productId: data.productId, kind, status: { not: "SUPERSEDED" } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true, status: true, createdAt: true },
          }),
        ),
      );
      const [research] = latest;
      if (research?.status === "APPROVED") throw new UserError(ALREADY_APPROVED);
      const active = { productId: data.productId, kind: { in: RESEARCH_KINDS } };
      const busy = await tx.suggestion.count({
        where: { ...active, status: "GENERATING", createdAt: { gte: data.staleBefore } },
      });
      if (busy > 0) throw new UserError(BUSY);
      await tx.suggestion.updateMany({
        where: { ...active, status: "GENERATING" },
        data: { status: "FAILED", errorMessage: GENERATING_STALE },
      });
      await tx.suggestion.updateMany({ where: { ...active, status: "PENDING" }, data: { status: "SUPERSEDED" } });

      const [researchId, categoryId] = await Promise.all(
        RESEARCH_KINDS.map(async (kind, i) => {
          const created = await tx.suggestion.create({
            data: {
              kind,
              productId: data.productId,
              promptId: data.promptId,
              promptVersion: data.promptVersion,
              parentSuggestionId: latest[i]?.id ?? null,
            },
            select: { id: true },
          });
          return created.id;
        }),
      );
      return { researchId, categoryId };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new UserError(BUSY);
    throw e;
  }
}

// AI xong (gọi trong `after()`): hồ sơ → `PENDING` kèm `sources`, `skipped`; Danh mục gợi ý → `PENDING`, hoặc
// `FAILED` khi AI không chọn được Danh mục có sẵn (FR-11). Chỉ ghi gợi ý còn `GENERATING` (bản đã bị thay thì bỏ).
export async function completeResearchRecords(data: {
  researchId: string;
  categoryId: string;
  profile: unknown;
  category: unknown | null;
  sources: { url: string; title: string }[];
  skipped: string[];
}) {
  await db.$transaction(async (tx) => {
    await tx.suggestion.updateMany({
      where: { id: data.researchId, status: "GENERATING" },
      data: { status: "PENDING", payload: json(data.profile), sources: json(data.sources), skipped: json(data.skipped) },
    });
    await tx.suggestion.updateMany({
      where: { id: data.categoryId, status: "GENERATING" },
      data:
        data.category === null
          ? { status: "FAILED", errorMessage: CATEGORY_NOT_PICKED }
          : { status: "PENDING", payload: json(data.category) },
    });
  });
}

// AI lỗi (gọi trong `after()`): các gợi ý còn `GENERATING` → `FAILED` kèm thông báo tiếng Việt (AD-13, AD-18).
export async function failSuggestionsRecord(data: { ids: string[]; message: string }) {
  await db.suggestion.updateMany({
    where: { id: { in: data.ids }, status: "GENERATING" },
    data: { status: "FAILED", errorMessage: data.message.slice(0, SUGGESTION_ERROR_MAX) },
  });
}

// Duyệt (AD-9, AD-19): một transaction gồm `apply` (upsert vào đích qua `service.ts` của module chủ đích, cùng `tx`)
// và chuyển `APPROVED`. Lần Duyệt thứ hai (kể cả chạy chồng) thấy gợi ý không còn `PENDING` → `UserError`, transaction
// huỷ nên đích không bị ghi hai lần. `payload` giữ nguyên bản AI (bất biến); bản đã sửa nằm ở đích.
export async function approveSuggestionRecord(
  id: string,
  apply: (s: { kind: SuggestionKind; payload: unknown; productId: string | null }, tx: Tx) => Promise<{ edited: boolean }>,
) {
  return db.$transaction(async (tx) => {
    const s = await tx.suggestion.findUnique({
      where: { id },
      select: { kind: true, status: true, payload: true, productId: true },
    });
    if (!s) throw new UserError(NOT_FOUND);
    if (s.status !== "PENDING") throw new UserError(NOT_PENDING);
    const { edited } = await apply(s, tx);
    const { count } = await tx.suggestion.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "APPROVED", editedBeforeApproval: edited },
    });
    if (count !== 1) throw new UserError(NOT_PENDING);
    return { id, kind: s.kind, productId: s.productId };
  });
}

// Từ chối (FR-22): chỉ gợi ý đang chờ duyệt.
export async function rejectSuggestionRecord(data: { id: string }) {
  const { count } = await db.suggestion.updateMany({
    where: { id: data.id, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  if (count === 1) return { id: data.id };
  const exists = await db.suggestion.count({ where: { id: data.id } });
  throw new UserError(exists ? NOT_PENDING : NOT_FOUND);
}
