"use client";

import { useRouter } from "next/navigation";
import { saveInspirationResearch } from "@/modules/research/actions";
import { InspirationResearchForm } from "@/modules/research/components/inspiration-research-form.client";
import type { InspirationResearchData } from "@/modules/research/types";

// Sửa Hồ sơ nghiên cứu của Cảm hứng đã Duyệt (FR-22, AD-19): lưu qua `research.saveInspirationResearch`; không đổi
// trạng thái gợi ý.
export function InspirationResearchEditor({ inspirationId, data }: { inspirationId: string; data: InspirationResearchData }) {
  const router = useRouter();
  return (
    <InspirationResearchForm
      defaultValues={data}
      action={(values) => saveInspirationResearch({ inspirationId, data: values })}
      submitLabel="Lưu hồ sơ"
      pendingLabel="Đang lưu…"
      successMessage="Đã lưu"
      onSaved={() => router.refresh()}
    />
  );
}
