import "server-only";
import { db } from "@/platform/db";

export async function getCategoryForCms(id: string) {
  return db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, description: true },
  });
}
