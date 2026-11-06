"use client";

import { useRouter } from "next/navigation";
import { saveResearchProfile } from "@/modules/research/actions";
import { ResearchProfileForm } from "@/modules/research/components/research-profile-form.client";
import type { ResearchProfileData } from "@/modules/research/types";

// Sửa Hồ sơ nghiên cứu đã Duyệt (FR-22, AD-19): form của module chủ đích, lưu qua `research.saveResearchProfile`;
// không đổi trạng thái gợi ý.
export function ResearchProfileEditor({ productId, data }: { productId: string; data: ResearchProfileData }) {
  const router = useRouter();
  return (
    <ResearchProfileForm
      defaultValues={data}
      action={(values) => saveResearchProfile({ productId, data: values })}
      submitLabel="Lưu hồ sơ"
      pendingLabel="Đang lưu…"
      successMessage="Đã lưu"
      onSaved={() => router.refresh()}
    />
  );
}
