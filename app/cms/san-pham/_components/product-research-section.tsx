import { CONTENT_SET_PRODUCTS_MAX } from "@/modules/content-sets/constants";
import { getProductForCms, listPickerProductsForCms } from "@/modules/products/cms-queries";
import { getResearchProfileForCms } from "@/modules/research/cms-queries";
import { getProductSuggestionsForCms } from "@/modules/suggestions/cms-queries";
import { CategorySuggestionCard } from "@/modules/suggestions/components/category-suggestion-card";
import {
  CreateContentSetPanel,
  type PanelProduct,
} from "@/modules/suggestions/components/create-content-set-panel.client";
import { GeneratingPoller } from "@/modules/suggestions/components/generating-poller.client";
import { ResearchProfileCard } from "@/modules/suggestions/components/research-profile-card";

type ProductBasics = { id: string; name: string; image: string | null };

type Research = Awaited<ReturnType<typeof getProductSuggestionsForCms>>["research"];
type Profile = Awaited<ReturnType<typeof getResearchProfileForCms>>;

// Hồ sơ nghiên cứu của một món cho CreateContentSetPanel: có hồ sơ đã Duyệt → `APPROVED` (hồ sơ đã Duyệt không nghiên
// cứu lại — Epic 4); không thì trạng thái gợi ý mới nhất. Sản phẩm hiện tại chọn được Góc viết / Người đọc từ cả bản
// *Chờ duyệt* (UX-DR46); món thêm vào bộ chỉ dùng hồ sơ đã Duyệt.
function toPanelProduct(product: ProductBasics, research: Research, profile: Profile, allowPending: boolean): PanelProduct {
  const base = { id: product.id, name: product.name, image: product.image };
  if (profile) return { ...base, research: "APPROVED", profile: profile.data };
  return {
    ...base,
    research: research?.status ?? null,
    profile: allowPending && research?.status === "PENDING" ? research.payload : null,
  };
}

async function loadPanelProduct(product: ProductBasics) {
  const [{ research }, profile] = await Promise.all([
    getProductSuggestionsForCms(product.id),
    getResearchProfileForCms(product.id),
  ]);
  return toPanelProduct(product, research, profile, false);
}

// Khu nghiên cứu AI và tạo Bộ nội dung của Chi tiết Sản phẩm (UX-DR45, UX-DR47): ResearchProfileCard, thẻ Danh mục gợi
// ý, rồi CreateContentSetPanel. Đúng một GeneratingPoller cho cả màn khi còn gợi ý đang tạo (AD-18). Món thêm vào bộ
// (bài Gom link) nằm trên URL `?bo=`; ô tìm Sản phẩm trên `?sp=` (AD-12) — Screen đọc lại hồ sơ của từng món.
export async function ProductResearchSection({
  product,
  extraIds,
  pickerQuery,
}: {
  product: ProductBasics;
  extraIds: string[];
  pickerQuery: string;
}) {
  const ids = [...new Set(extraIds)].filter((id) => id !== product.id).slice(0, CONTENT_SET_PRODUCTS_MAX - 1);
  const [{ research, category }, profile, extraRows, pickerRows] = await Promise.all([
    getProductSuggestionsForCms(product.id),
    getResearchProfileForCms(product.id),
    Promise.all(ids.map((id) => getProductForCms(id))),
    listPickerProductsForCms(pickerQuery, [product.id, ...ids]),
  ]);
  const extras = await Promise.all(
    extraRows.filter((p) => p !== null).map((p) => loadPanelProduct({ id: p.id, name: p.name, image: p.image })),
  );
  const current = toPanelProduct(product, research, profile, true);
  const generating = [research, category].filter((s) => s?.status === "GENERATING").map((s) => s!.createdAt);

  return (
    <div className="mt-space-xl space-y-space-md">
      {generating.length > 0 && <GeneratingPoller startedAt={generating.sort()[0]} />}
      <ResearchProfileCard productId={product.id} suggestion={research} profile={profile} />
      {category && <CategorySuggestionCard suggestion={category} />}
      <CreateContentSetPanel
        key={product.id}
        current={current}
        extras={extras}
        pickerResults={pickerRows.map((p) => ({ ...p, priceUpdatedAt: p.priceUpdatedAt?.toISOString() ?? null }))}
        pickerQuery={pickerQuery}
      />
    </div>
  );
}
