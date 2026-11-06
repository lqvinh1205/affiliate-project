import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { formatShortDate } from "@/platform/format";
import { listContentSetsForInspirationForCms } from "@/modules/content-sets/cms-queries";
import { getInspirationForCms } from "@/modules/inspirations/cms-queries";
import type { InspirationDisplayStatus } from "@/modules/inspirations/constants";
import { InspirationForm } from "@/modules/inspirations/components/inspiration-form.client";
import { InspirationMedia } from "@/modules/inspirations/components/inspiration-media";
import { InspirationStatusActions } from "@/modules/inspirations/components/inspiration-status-actions.client";
import { InspirationStatusBadge } from "@/modules/inspirations/components/inspiration-status-badge";
import { PRODUCT_PICKER_PARAM } from "@/modules/products/constants";
import { listPickerProductsForCms } from "@/modules/products/cms-queries";
import { getInspirationResearchForCms } from "@/modules/research/cms-queries";
import { getInspirationSuggestionForCms } from "@/modules/suggestions/cms-queries";
import { GeneratingPoller } from "@/modules/suggestions/components/generating-poller.client";
import { InspirationResearchCard } from "@/modules/suggestions/components/inspiration-research-card";
import { AttachProductSheet } from "@/app/cms/cam-hung/_components/attach-product-sheet.client";

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// Chi tiết Cảm hứng `/cms/cam-hung/[id]` (UX-DR77, UJ-2): nguồn (link, file, ghi chú; sửa được để tải thêm file),
// thẻ AI "Từ khoá Shopee và dàn ý", InspirationActions ("Gắn sản phẩm", "Bỏ qua" / "Đưa lại vào Mới"), và link tới các
// Bộ nội dung đã tạo từ Cảm hứng — có bộ thì *Đã dùng* (suy ra từ `content-sets`, AD-2). Đúng một GeneratingPoller khi
// gợi ý đang tạo (AD-18).
export async function InspirationDetailScreen({ params, searchParams }: PageProps<"/cms/cam-hung/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const pickerQuery = first(query[PRODUCT_PICKER_PARAM]).trim();
  const [inspiration, contentSets, suggestion, profile, pickerRows] = await Promise.all([
    getInspirationForCms(id),
    listContentSetsForInspirationForCms(id),
    getInspirationSuggestionForCms(id),
    getInspirationResearchForCms(id),
    listPickerProductsForCms(pickerQuery),
  ]);
  if (!inspiration) notFound();
  const status: InspirationDisplayStatus = contentSets.length > 0 ? "USED" : inspiration.status;

  return (
    <div className="space-y-space-lg">
      <header className="space-y-space-xs">
        <Link
          href="/cms/cam-hung"
          className="-ml-2 inline-flex min-h-touch-target items-center gap-1 rounded-lg px-2 text-label-md text-on-surface-variant hover:text-on-surface"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Cảm hứng
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <h1 className="text-headline-lg-mobile lg:text-headline-lg">Cảm hứng</h1>
            <InspirationStatusBadge status={status} />
          </div>
          {status !== "USED" && <InspirationStatusActions id={inspiration.id} skipped={status === "SKIPPED"} />}
        </div>
      </header>

      <section aria-labelledby="inspiration-source" className="space-y-space-sm rounded-xl border bg-card p-space-md">
        <h2 id="inspiration-source" className="sr-only">
          Nguồn
        </h2>
        {inspiration.note && <p className="text-body-regular">{inspiration.note}</p>}
        {inspiration.url && (
          <a
            href={inspiration.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-touch-target max-w-full items-center gap-1 text-body-sm break-all text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            {inspiration.url}
            <span className="sr-only">(mở tab mới)</span>
          </a>
        )}
        {inspiration.mediaUrl && inspiration.mediaKind && (
          <InspirationMedia url={inspiration.mediaUrl} kind={inspiration.mediaKind} />
        )}
        <p className="text-body-sm text-on-surface-variant">Lưu {formatShortDate(new Date(inspiration.createdAt))}</p>
        <details className="border-t pt-space-sm">
          <summary className="min-h-touch-target cursor-pointer content-center text-label-md text-primary">
            Sửa Cảm hứng (link, file, ghi chú)
          </summary>
          <div className="pt-space-sm">
            <InspirationForm
              key={`${inspiration.url}|${inspiration.mediaUrl}|${inspiration.note}`}
              defaultValues={{
                id: inspiration.id,
                url: inspiration.url ?? "",
                mediaUrl: inspiration.mediaUrl ?? "",
                note: inspiration.note ?? "",
              }}
            />
          </div>
        </details>
      </section>

      {suggestion?.status === "GENERATING" && <GeneratingPoller startedAt={suggestion.createdAt} />}
      <InspirationResearchCard
        inspirationId={inspiration.id}
        mediaKind={inspiration.mediaKind}
        suggestion={suggestion}
        profile={profile}
      />

      <section aria-labelledby="inspiration-products" className="space-y-space-sm">
        <h2 id="inspiration-products" className="text-headline-sm">
          Sản phẩm và Bộ nội dung
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          Gắn Sản phẩm rồi tạo Bộ nội dung ở Chi tiết Sản phẩm; bộ tạo ra sẽ hiện ở đây và Cảm hứng thành “Đã dùng”.
        </p>
        <AttachProductSheet
          inspirationId={inspiration.id}
          pickerResults={pickerRows.map((p) => ({ ...p, priceUpdatedAt: p.priceUpdatedAt?.toISOString() ?? null }))}
          pickerQuery={pickerQuery}
        />
        {contentSets.length > 0 && (
          <ul aria-label="Bộ nội dung từ Cảm hứng này" className="divide-y rounded-xl border">
            {contentSets.map((set) => (
              <li key={set.id}>
                <Link
                  href={`/cms/bo-noi-dung/${set.id}`}
                  className="flex min-h-touch-target items-center justify-between gap-space-sm px-space-md py-2 hover:bg-surface-container"
                >
                  <span className="min-w-0 truncate font-medium">{set.title}</span>
                  <span className="min-w-0 max-w-[50%] truncate text-body-sm text-on-surface-variant">
                    {set.productName ? `${set.productName} · ` : ""}
                    {formatShortDate(new Date(set.createdAt))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
