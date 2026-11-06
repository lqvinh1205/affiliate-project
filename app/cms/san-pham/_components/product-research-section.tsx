import { getResearchProfileForCms } from "@/modules/research/cms-queries";
import { getProductSuggestionsForCms } from "@/modules/suggestions/cms-queries";
import { CategorySuggestionCard } from "@/modules/suggestions/components/category-suggestion-card";
import { GeneratingPoller } from "@/modules/suggestions/components/generating-poller.client";
import { ResearchProfileCard } from "@/modules/suggestions/components/research-profile-card";

// Khu nghiên cứu AI của Chi tiết Sản phẩm (UX-DR45): ResearchProfileCard rồi thẻ Danh mục gợi ý ngay dưới. Đúng một
// GeneratingPoller cho cả màn khi còn gợi ý đang tạo (AD-18); hai module cùng tầng nên Screen gọi từng query rồi ghép.
export async function ProductResearchSection({ productId }: { productId: string }) {
  const [{ research, category }, profile] = await Promise.all([
    getProductSuggestionsForCms(productId),
    getResearchProfileForCms(productId),
  ]);
  const generating = [research, category].filter((s) => s?.status === "GENERATING").map((s) => s!.createdAt);

  return (
    <div className="mt-space-xl space-y-space-md">
      {generating.length > 0 && <GeneratingPoller startedAt={generating.sort()[0]} />}
      <ResearchProfileCard productId={productId} suggestion={research} profile={profile} />
      {category && <CategorySuggestionCard suggestion={category} />}
    </div>
  );
}
