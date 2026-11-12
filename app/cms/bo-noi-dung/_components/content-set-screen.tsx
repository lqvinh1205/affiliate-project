import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Lightbulb } from "lucide-react";
import type { Platform } from "@/generated/prisma/enums";
import { getContentSetForCms } from "@/modules/content-sets/cms-queries";
import { PLATFORM_LABEL, PLATFORM_PART_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";
import type { ContentSetForCms } from "@/modules/content-sets/types";
import { MarkPostedRow } from "@/modules/content-sets/components/mark-posted-row.client";
import { getContentSetSuggestionsForCms } from "@/modules/suggestions/cms-queries";
import type { ContentSetPartView } from "@/modules/suggestions/types";
import { AddPlatformButton } from "@/modules/suggestions/components/add-platform-button.client";
import { ContentSetPartCard, WebPostTarget } from "@/modules/suggestions/components/content-set-part-card";
import { GeneratingPoller } from "@/modules/suggestions/components/generating-poller.client";
import { SuggestionCard } from "@/modules/suggestions/components/suggestion-card";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import { ContentSetJumpBar, type JumpChip } from "@/app/cms/bo-noi-dung/_components/content-set-jump-bar";

const SECTION_ID: Record<Platform, string> = { WEBSITE: "bai-web", THREADS: "threads", FACEBOOK: "facebook" };

function Header({ set, approved, total }: { set: ContentSetForCms; approved: number; total: number }) {
  const angle = set.angleName ? `${set.angleName}${set.angleEdit || set.angleHook ? ` — ${set.angleEdit || set.angleHook}` : ""}` : null;
  const audience = set.audienceName
    ? `${set.audienceName}${set.audienceEdit || set.audienceReason ? ` — ${set.audienceEdit || set.audienceReason}` : ""}`
    : null;
  return (
    <header className="space-y-space-md">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Bộ nội dung</h1>
      <ul className="space-y-1" aria-label="Sản phẩm trong bộ">
        {set.products.map((p) => (
          <li key={p.id}>
            <Link href={`/cms/san-pham/${p.id}`} className="flex min-h-touch-target items-center gap-space-sm hover:underline">
              <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                <ImageFallback src={p.image} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <span className="min-w-0 truncate text-label-md">{p.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 text-body-sm">
        {angle && (
          <div>
            <dt className="inline text-on-surface-variant">Góc viết: </dt>
            <dd className="inline">{angle}</dd>
          </div>
        )}
        {audience && (
          <div>
            <dt className="inline text-on-surface-variant">Người đọc: </dt>
            <dd className="inline">{audience}</dd>
          </div>
        )}
        {!angle && set.post && (
          <div>
            <dt className="inline text-on-surface-variant">Nguồn: </dt>
            <dd className="inline">Bài web “{set.post.title}”</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap items-center gap-space-md">
        {total > 0 && (
          <p className="text-label-md" aria-live="polite">
            {approved}/{total} đã duyệt
          </p>
        )}
        {set.inspirationId && (
          <Link
            href={`/cms/cam-hung/${set.inspirationId}`}
            className="inline-flex min-h-touch-target items-center gap-1 text-label-md text-primary hover:underline"
          >
            <Lightbulb className="size-4" aria-hidden /> Từ Cảm hứng
          </Link>
        )}
        {set.post && (
          <Link
            href={`/cms/bai-viet/${set.post.id}`}
            className="inline-flex min-h-touch-target items-center gap-1 text-label-md text-primary hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden /> Mở bài web
          </Link>
        )}
      </div>
    </header>
  );
}

// Màn Bộ nội dung `/cms/bo-noi-dung/[id]` (UX-DR75, cao trào UJ-1): một cột (≤ 768px căn giữa trên desktop), đầu màn,
// thanh nhảy dính, khối Bài web → Threads (bài, Bình luận, Đánh dấu đã đăng) → Facebook; nền tảng chưa có thì dòng
// "Thêm Bài {nền tảng}". Đúng một GeneratingPoller cho cả màn khi còn phần đang tạo (AD-18). Hai module cùng tầng
// (`content-sets`, `suggestions` đọc chéo) nên Screen gọi từng query rồi ghép (AD-2).
export async function ContentSetScreen({ params }: Pick<PageProps<"/cms/bo-noi-dung/[id]">, "params">) {
  const { id } = await params;
  const [set, parts] = await Promise.all([getContentSetForCms(id), getContentSetSuggestionsForCms(id)]);
  if (!set) notFound();

  const social = (p: SocialPlatform) => set.socialPosts.find((s) => s.platform === p) ?? null;
  const views = Object.values(parts).filter((v): v is ContentSetPartView => v !== null);
  const generating = views.filter((v) => v.status === "GENERATING").map((v) => v.createdAt).sort();
  const approved = views.filter((v) => v.status === "APPROVED").length;

  const has = {
    WEBSITE: !!parts.web || !!set.post,
    THREADS: !!parts.threads || !!parts.threadsComment || !!social("THREADS"),
    FACEBOOK: !!parts.facebook || !!parts.facebookComment || !!social("FACEBOOK"),
  } satisfies Record<Platform, boolean>;
  const mainStatus = { WEBSITE: parts.web?.status, THREADS: parts.threads?.status, FACEBOOK: parts.facebook?.status };
  const chips: JumpChip[] = (Object.keys(has) as Platform[])
    .filter((p) => has[p])
    .map((p) => ({
      href: `#${SECTION_ID[p]}`,
      label: p === "WEBSITE" ? "Bài web" : PLATFORM_LABEL[p],
      status: mainStatus[p] ?? (p === "WEBSITE" && set.post ? "APPROVED" : null),
    }));

  const socialSection = (platform: SocialPlatform) => {
    const post = platform === "THREADS" ? parts.threads : parts.facebook;
    const comment = platform === "THREADS" ? parts.threadsComment : parts.facebookComment;
    const target = social(platform);
    if (!has[platform]) return <AddPlatformButton contentSetId={set.id} platform={platform} />;
    return (
      <>
        {post && (
          <ContentSetPartCard
            part={platform === "THREADS" ? { kind: "THREADS_POST", view: parts.threads! } : { kind: "FACEBOOK_POST", view: parts.facebook! }}
            platform={platform}
            headingId={`${SECTION_ID[platform]}-post`}
            set={set}
            socialPost={target}
          />
        )}
        {comment && (
          <ContentSetPartCard
            part={{ kind: "LINK_COMMENT", view: comment }}
            platform={platform}
            headingId={`${SECTION_ID[platform]}-comment`}
            set={set}
            socialPost={target}
          />
        )}
        {target && <MarkPostedRow id={target.id} platform={platform} postedAt={target.postedAt} postUrl={target.postUrl} />}
      </>
    );
  };

  return (
    <div className="space-y-space-lg">
      {generating.length > 0 && <GeneratingPoller startedAt={generating[0]} />}
      <Header set={set} approved={approved} total={views.length} />
      <ContentSetJumpBar chips={chips} />

      <section id={SECTION_ID.WEBSITE} aria-label="Bài web" className="scroll-mt-32 space-y-space-md">
        {parts.web ? (
          <ContentSetPartCard part={{ kind: "WEB_POST", view: parts.web }} platform="WEBSITE" headingId="bai-web-post" set={set} socialPost={null} />
        ) : set.post ? (
          <SuggestionCard
            title="Bài web"
            status={null}
            headingId="bai-web-post"
            footer={
              <Link
                href={`/cms/bai-viet/${set.post.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target w-full lg:w-auto")}
              >
                <ExternalLink aria-hidden /> Mở bài web
              </Link>
            }
          >
            <WebPostTarget post={set.post} />
          </SuggestionCard>
        ) : (
          <AddPlatformButton contentSetId={set.id} platform="WEBSITE" />
        )}
      </section>

      {(["THREADS", "FACEBOOK"] as const).map((p) => (
        <section key={p} id={SECTION_ID[p]} aria-label={PLATFORM_PART_LABEL[p]} className="scroll-mt-32 space-y-space-md">
          {socialSection(p)}
        </section>
      ))}
    </div>
  );
}
