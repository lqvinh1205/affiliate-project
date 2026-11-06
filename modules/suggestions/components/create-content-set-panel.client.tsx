"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type { Platform } from "@/generated/prisma/enums";
import {
  CONTENT_SET_PRODUCTS_MAX,
  CONTENT_SET_PRODUCTS_PARAM,
  PLATFORM_KEYS,
} from "@/modules/content-sets/constants";
import { PlatformToggle } from "@/modules/content-sets/components/platform-toggle.client";
import type { PickerProduct } from "@/modules/products/types";
import { ProductPicker } from "@/modules/products/components/product-picker.client";
import type { ResearchProfileData } from "@/modules/research/types";
import { ChoicePicker, type ChoiceGroup } from "@/modules/research/components/choice-picker.client";
import { createContentSet } from "@/modules/suggestions/actions";
import type { VisibleSuggestionStatus } from "@/modules/suggestions/constants";
import { SuggestionStatusBadge } from "@/modules/suggestions/components/suggestion-status-badge";
import { callAction } from "@/components/shared/call-action";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

// Một Sản phẩm trong bộ: trạng thái hồ sơ (`null` = chưa nghiên cứu; `APPROVED` = có Hồ sơ nghiên cứu đã Duyệt) và
// dữ liệu hồ sơ để chọn Góc viết / Người đọc (hồ sơ đã Duyệt, hoặc bản *Chờ duyệt* của Sản phẩm hiện tại).
export type PanelProduct = {
  id: string;
  name: string;
  image: string | null;
  research: VisibleSuggestionStatus | null;
  profile: ResearchProfileData | null;
};

const key = (productId: string, id: string) => `${productId}:${id}`;
const splitKey = (k: string) => {
  const i = k.indexOf(":");
  return { productId: k.slice(0, i), id: k.slice(i + 1) };
};

function Thumb({ image }: { image: string | null }) {
  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-surface-container">
      <ImageFallback src={image} alt="" fill sizes="40px" className="object-cover" />
    </span>
  );
}

// CreateContentSetPanel (UX-DR47, FR-12, Flow 6): "Sản phẩm trong bộ" (Sản phẩm hiện tại đầu tiên + StatusBadge hồ sơ
// từng món), ProductPicker "Thêm Sản phẩm (bài Gom link)", AnglePicker / AudiencePicker (nhóm theo Sản phẩm khi bộ
// nhiều món), PlatformToggle, nút "Tạo bộ nội dung". Món thêm vào nằm trên URL `?bo=` (AD-12) để Screen đọc lại hồ sơ
// của nó; lựa chọn Góc viết / Người đọc là trạng thái trên màn (mất khi rời trang — UX-DR46). Nút chỉ bật khi đủ điều
// kiện; khi tắt dùng `aria-disabled` + dòng lý do điều kiện đầu tiên chưa đạt.
export function CreateContentSetPanel({
  current,
  extras,
  pickerResults,
  pickerQuery,
}: {
  current: PanelProduct;
  extras: PanelProduct[];
  pickerResults: PickerProduct[];
  pickerQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [angle, setAngle] = useState<string | null>(null);
  const [angleEdit, setAngleEdit] = useState("");
  const [audience, setAudience] = useState<string | null>(null);
  const [audienceEdit, setAudienceEdit] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(PLATFORM_KEYS);
  const [navigating, startNavigation] = useTransition();
  const [pending, startTransition] = useTransition();

  const multi = extras.length > 0;
  const currentReady = current.research === "PENDING" || current.research === "APPROVED";
  const sources = [...(currentReady && current.profile ? [current] : []), ...extras.filter((p) => p.research === "APPROVED" && p.profile)];
  const groups = (kind: "angles" | "audiences"): ChoiceGroup[] =>
    sources.map((p) => ({
      title: multi ? p.name : null,
      options: p.profile![kind].map((c) => ({
        key: key(p.id, c.id),
        name: c.name,
        text: "hook" in c ? c.hook : c.reason,
      })),
    }));
  const angleGroups = groups("angles");
  const audienceGroups = groups("audiences");
  const allKeys = (gs: ChoiceGroup[]) => gs.flatMap((g) => g.options.map((o) => o.key));
  // Người đọc mặc định chọn nhóm đầu; Góc viết không chọn sẵn (UX-DR46). Lựa chọn của món đã gỡ khỏi bộ bị bỏ.
  const angleKey = angle && allKeys(angleGroups).includes(angle) ? angle : null;
  const audienceKey = audience && allKeys(audienceGroups).includes(audience) ? audience : (allKeys(audienceGroups)[0] ?? null);

  const setExtras = (ids: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (ids.length > 0) params.set(CONTENT_SET_PRODUCTS_PARAM, ids.join(","));
    else params.delete(CONTENT_SET_PRODUCTS_PARAM);
    startNavigation(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  };
  const extraIds = extras.map((p) => p.id);
  const move = (from: number, to: number) => {
    const next = [...extraIds];
    [next[from], next[to]] = [next[to], next[from]];
    setExtras(next);
  };

  // Điều kiện đầu tiên chưa đạt (UX-DR47).
  let reason: { text: string; href?: string } | null = null;
  const unapproved = extras.find((p) => p.research !== "APPROVED");
  if (current.research === "GENERATING") reason = { text: "Đang nghiên cứu…" };
  else if (current.research === null) reason = { text: "Bấm Nghiên cứu để có Hồ sơ nghiên cứu trước" };
  else if (current.research === "FAILED" || current.research === "REJECTED") reason = { text: "Tạo lại Hồ sơ nghiên cứu" };
  else if (current.research === "PENDING") reason = { text: "Duyệt Hồ sơ nghiên cứu trước" };
  else if (unapproved) reason = { text: `'${unapproved.name}' chưa có hồ sơ đã duyệt`, href: `/cms/san-pham/${unapproved.id}` };
  else if (!angleKey) reason = { text: "Chọn một Góc viết" };
  else if (!audienceKey) reason = { text: "Chọn một Người đọc" };
  else if (platforms.length === 0) reason = { text: "Chọn ít nhất một nền tảng" };
  else if (navigating) reason = { text: "Đang cập nhật Sản phẩm trong bộ…" };

  const submit = () => {
    if (reason || !angleKey || !audienceKey) return;
    startTransition(async () => {
      const res = await callAction(() =>
        createContentSet({
          productIds: [current.id, ...extraIds],
          angle: splitKey(angleKey),
          angleEdit,
          audience: splitKey(audienceKey),
          audienceEdit,
          platforms,
        }),
      );
      if (!res.ok) return void toast.error(res.error);
      router.push(`/cms/bo-noi-dung/${res.contentSetId}`);
    });
  };

  const row = (p: PanelProduct, i: number | null) => (
    <li key={p.id} className="flex items-center gap-space-sm py-1 pr-1 pl-space-sm">
      <Thumb image={p.image} />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-space-sm gap-y-1">
        <span className="min-w-0 truncate text-label-md">{p.name}</span>
        {p.research ? (
          <SuggestionStatusBadge status={p.research} />
        ) : (
          <span className="text-body-sm text-on-surface-variant">Chưa có hồ sơ</span>
        )}
        {i !== null && p.research !== "APPROVED" && (
          <Link href={`/cms/san-pham/${p.id}`} className="inline-flex min-h-touch-target items-center text-body-sm text-primary hover:underline">
            Mở Sản phẩm
          </Link>
        )}
      </span>
      {i !== null && (
        <>
          <Button type="button" variant="ghost" size="icon-lg" className="size-touch-target!" aria-label={`Đưa "${p.name}" lên`} disabled={i === 0 || navigating} onClick={() => move(i, i - 1)}>
            <ArrowUp aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon-lg" className="size-touch-target!" aria-label={`Đưa "${p.name}" xuống`} disabled={i === extras.length - 1 || navigating} onClick={() => move(i, i + 1)}>
            <ArrowDown aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon-lg" className="size-touch-target!" aria-label={`Gỡ "${p.name}" khỏi bộ`} disabled={navigating} onClick={() => setExtras(extraIds.filter((id) => id !== p.id))}>
            <X aria-hidden />
          </Button>
        </>
      )}
    </li>
  );

  return (
    <section aria-labelledby="create-content-set" className="space-y-space-lg rounded-xl border bg-card p-space-md">
      <h2 id="create-content-set" className="text-headline-sm">
        Tạo bộ nội dung
      </h2>

      <div className="space-y-space-sm">
        <p className="text-label-md">Sản phẩm trong bộ</p>
        <ol className="divide-y rounded-xl border">
          {row(current, null)}
          {extras.map((p, i) => row(p, i))}
        </ol>
        {1 + extras.length < CONTENT_SET_PRODUCTS_MAX ? (
          <ProductPicker
            id="content-set-products-search"
            value={[{ id: current.id } as PickerProduct, ...extras.map((p) => ({ id: p.id }) as PickerProduct)]}
            onChange={(next) => setExtras(next.slice(1).map((p) => p.id))}
            results={pickerResults}
            query={pickerQuery}
            showValue={false}
            noun="bộ"
            addLabel="Thêm Sản phẩm (bài Gom link)"
          />
        ) : (
          <p className="text-body-sm text-on-surface-variant">Bộ đã đủ {CONTENT_SET_PRODUCTS_MAX} Sản phẩm.</p>
        )}
      </div>

      {sources.length > 0 && (
        <>
          <ChoicePicker
            label="Góc viết"
            groups={angleGroups}
            value={angleKey}
            onChange={(k) => {
              setAngle(k);
              setAngleEdit("");
            }}
            edit={angleEdit}
            onEditChange={setAngleEdit}
          />
          <ChoicePicker
            label="Người đọc mục tiêu"
            groups={audienceGroups}
            value={audienceKey}
            onChange={(k) => {
              setAudience(k);
              setAudienceEdit("");
            }}
            edit={audienceEdit}
            onEditChange={setAudienceEdit}
          />
        </>
      )}

      <div className="space-y-space-sm">
        <p id="content-set-platforms" className="text-label-md">
          Nền tảng
        </p>
        <PlatformToggle options={PLATFORM_KEYS} value={platforms} onChange={setPlatforms} labelledBy="content-set-platforms" />
      </div>

      <div className="space-y-space-sm">
        <Button
          type="button"
          size="lg"
          className={cn("w-full", reason && "opacity-50")}
          aria-disabled={reason ? true : undefined}
          aria-describedby={reason ? "create-content-set-reason" : undefined}
          disabled={pending}
          onClick={submit}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {pending ? "Đang gửi…" : "Tạo bộ nội dung"}
        </Button>
        {reason && (
          <p id="create-content-set-reason" className="text-body-sm text-on-surface-variant">
            {reason.text}
            {reason.href && (
              <>
                {" "}
                <Link href={reason.href} className="inline-flex min-h-touch-target items-center text-primary hover:underline">
                  Mở Sản phẩm
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
