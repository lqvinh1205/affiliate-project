import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import type { InspirationResearchData } from "@/modules/research/prompts/research-inspiration.prompt";
import type { ResearchProfileData } from "@/modules/research/prompts/research-product.prompt";

const NOT_FOUND = "Chưa có Hồ sơ nghiên cứu đã duyệt cho Sản phẩm này. Tải lại trang.";

// Duyệt gợi ý `RESEARCH` (gọi từ `modules/suggestions/actions.ts`, AD-9): upsert theo khoá `productId` nên Duyệt
// hai lần không tạo hai hồ sơ (AD-19).
export async function upsertResearchProfileRecord(
  data: { productId: string; data: ResearchProfileData },
  tx?: Prisma.TransactionClient,
) {
  const json = data.data as Prisma.InputJsonValue;
  return (tx ?? db).researchProfile.upsert({
    where: { productId: data.productId },
    create: { productId: data.productId, data: json },
    update: { data: json },
    select: { id: true },
  });
}

// Sửa hồ sơ đã Duyệt (FR-22): chỉ sửa hồ sơ có sẵn; không tạo hồ sơ khi chưa Duyệt.
export async function saveResearchProfileRecord(
  data: { productId: string; data: ResearchProfileData },
  tx?: Prisma.TransactionClient,
) {
  try {
    return await (tx ?? db).researchProfile.update({
      where: { productId: data.productId },
      data: { data: data.data as Prisma.InputJsonValue },
      select: { id: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new UserError(NOT_FOUND);
    throw e;
  }
}

// ---------- Hồ sơ của Cảm hứng (FR-2, Epic 10) ----------

const INSPIRATION_NOT_FOUND = "Chưa có Hồ sơ nghiên cứu đã duyệt cho Cảm hứng này. Tải lại trang.";

// Duyệt gợi ý `RESEARCH` gắn `inspirationId` (gọi từ `modules/suggestions/actions.ts`, AD-9): upsert theo khoá
// `inspirationId` (AD-19).
export async function upsertInspirationResearchRecord(
  data: { inspirationId: string; data: InspirationResearchData },
  tx?: Prisma.TransactionClient,
) {
  const json = data.data as Prisma.InputJsonValue;
  return (tx ?? db).researchProfile.upsert({
    where: { inspirationId: data.inspirationId },
    create: { inspirationId: data.inspirationId, data: json },
    update: { data: json },
    select: { id: true },
  });
}

// Sửa hồ sơ Cảm hứng đã Duyệt (FR-22): chỉ sửa hồ sơ có sẵn.
export async function saveInspirationResearchRecord(data: { inspirationId: string; data: InspirationResearchData }) {
  try {
    return await db.researchProfile.update({
      where: { inspirationId: data.inspirationId },
      data: { data: data.data as Prisma.InputJsonValue },
      select: { id: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new UserError(INSPIRATION_NOT_FOUND);
    throw e;
  }
}
