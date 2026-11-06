import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PLATFORM_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";
import type { ContentSetForCms, SocialPostForCms } from "@/modules/content-sets/types";
import { LinkCommentEditor, SocialPostEditor } from "@/modules/content-sets/components/social-post-editor.client";
import { POST_STATUS_LABEL } from "@/modules/posts/constants";
import { GENERATING_LABEL, SUGGESTION_KIND_LABEL } from "@/modules/suggestions/constants";
import type {
  FacebookPartView,
  LinkCommentPartView,
  ThreadsPartView,
  WebPostPartView,
} from "@/modules/suggestions/types";
import { GeneratingIndicator } from "@/modules/suggestions/components/generating-indicator.client";
import { RegenerateDialog } from "@/modules/suggestions/components/regenerate-dialog.client";
import { RejectSuggestionButton } from "@/modules/suggestions/components/reject-suggestion-button.client";
import { SocialApprovalForm } from "@/modules/suggestions/components/social-approval-form.client";
import { SuggestionCard } from "@/modules/suggestions/components/suggestion-card";
import { SuggestionError } from "@/modules/suggestions/components/suggestion-error";
import { SuggestionFooter } from "@/modules/suggestions/components/suggestion-footer";
import { WebPostApprovalForm } from "@/modules/suggestions/components/web-post-approval-form.client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

type Part =
  | { kind: "WEB_POST"; view: WebPostPartView }
  | { kind: "THREADS_POST"; view: ThreadsPartView }
  | { kind: "FACEBOOK_POST"; view: FacebookPartView }
  | { kind: "LINK_COMMENT"; view: LinkCommentPartView };

export function partTitle(kind: Part["kind"], platform: SocialPlatform | "WEBSITE") {
  return kind === "LINK_COMMENT" ? `${SUGGESTION_KIND_LABEL.LINK_COMMENT} · ${PLATFORM_LABEL[platform]}` : SUGGESTION_KIND_LABEL[kind];
}

// Phần nội dung của gợi ý (thân thẻ khi Chờ duyệt): chuỗi Threads, Bài Facebook, Bình luận → mảng phần chữ.
function textParts(part: Part): string[] | null {
  if (part.kind === "THREADS_POST") return part.view.payload?.posts ?? null;
  if (part.kind === "FACEBOOK_POST") return part.view.payload ? [part.view.payload.body] : null;
  if (part.kind === "LINK_COMMENT") return part.view.payload ? [part.view.payload.comment] : null;
  return null;
}

// "Mở bài web" → Soạn Bài web (UX-DR75).
function OpenPostLink({ postId }: { postId: string }) {
  return (
    <Link
      href={`/cms/bai-viet/${postId}`}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target w-full lg:w-auto")}
    >
      <ExternalLink aria-hidden /> Mở bài web
    </Link>
  );
}

// Bài web đích chỉ đọc (tiêu đề + tóm tắt) + "Mở bài web" (UX-DR75: Bài web đã có / đã Duyệt).
export function WebPostTarget({ post }: { post: NonNullable<ContentSetForCms["post"]> }) {
  return (
    <div className="space-y-space-sm">
      <p className="text-label-md">{post.title}</p>
      {post.excerpt && <p className="text-body-sm text-on-surface-variant">{post.excerpt}</p>}
      <p className="text-body-sm text-on-surface-variant">Bài web · {POST_STATUS_LABEL[post.status]}</p>
    </div>
  );
}

// Đích đã Duyệt của phần (AD-19): bài Threads/Facebook là `SocialPost.parts`, Bình luận là `SocialPost.linkComment`.
// Sửa được, không đổi trạng thái gợi ý (FR-22). Bài web: chỉ đọc ở thẻ, sửa ở Soạn Bài web.
const hasApprovedTarget = (kind: Part["kind"], socialPost: SocialPostForCms | null) =>
  kind === "LINK_COMMENT" ? !!socialPost?.linkComment : kind !== "WEB_POST" && !!socialPost;

function ApprovedTarget({ kind, socialPost }: { kind: Part["kind"]; socialPost: SocialPostForCms | null }) {
  if ((kind === "THREADS_POST" || kind === "FACEBOOK_POST") && socialPost) {
    return <SocialPostEditor key={JSON.stringify(socialPost.parts)} post={socialPost} />;
  }
  if (kind === "LINK_COMMENT" && socialPost?.linkComment) {
    return <LinkCommentEditor key={socialPost.linkComment} post={socialPost} />;
  }
  return null;
}

// Thẻ phần (theo gợi ý hiện hành) + — khi gợi ý hiện hành chưa Duyệt mà đích đã Duyệt vẫn còn (sau Tạo lại: bản mới
// Đang tạo / Chờ duyệt / Lỗi / Đã từ chối) — thẻ "bản đã duyệt" để vẫn xem, sửa, sao chép bản đang dùng (Story 5.7:
// "Bản đã duyệt vẫn giữ cho tới khi bạn Duyệt bản mới").
export function ContentSetPartCard(props: {
  part: Part;
  platform: SocialPlatform | "WEBSITE";
  headingId: string;
  set: ContentSetForCms;
  socialPost: SocialPostForCms | null;
}) {
  const { part, headingId, socialPost } = props;
  if (part.view.status === "APPROVED" || !hasApprovedTarget(part.kind, socialPost)) return <CurrentPartCard {...props} />;
  return (
    <>
      <CurrentPartCard {...props} />
      <SuggestionCard
        title={`${partTitle(part.kind, props.platform)} · bản đã duyệt (đang dùng)`}
        status="APPROVED"
        headingId={`${headingId}-approved`}
      >
        <ApprovedTarget kind={part.kind} socialPost={socialPost} />
      </SuggestionCard>
    </>
  );
}

// SuggestionCard một phần của Bộ nội dung (UX-DR41, UX-DR75) theo trạng thái gợi ý hiện hành:
// Đang tạo → GeneratingIndicator; Lỗi → Alert + Tạo lại (phần khác không ảnh hưởng); Đã từ chối → chỉ đầu thẻ + Tạo
// lại; Chờ duyệt → RiskWarning + nội dung sửa được + Duyệt / Từ chối / Tạo lại; Đã duyệt → sửa **đích** bằng
// component của `content-sets` (Bài web: chỉ đọc + "Mở bài web"), kèm Tạo lại (Story 5.7).
function CurrentPartCard({
  part,
  platform,
  headingId,
  set,
  socialPost,
}: {
  part: Part;
  platform: SocialPlatform | "WEBSITE";
  headingId: string;
  set: ContentSetForCms;
  socialPost: SocialPostForCms | null;
}) {
  const { view, kind } = part;
  const title = partTitle(kind, platform);
  const regenerate = (variant: "ghost" | "outline" = "ghost") => (
    <RegenerateDialog
      part={{ suggestionId: view.id, title, approved: view.status === "APPROVED" }}
      variant={variant}
    />
  );

  if (view.status === "GENERATING") {
    return (
      <SuggestionCard title={title} status="GENERATING" headingId={headingId}>
        <GeneratingIndicator label={GENERATING_LABEL[kind]} startedAt={view.createdAt} />
      </SuggestionCard>
    );
  }
  if (view.status === "REJECTED") {
    return <SuggestionCard title={title} status="REJECTED" headingId={headingId} footer={regenerate("outline")} />;
  }
  if (view.status === "FAILED" || (view.status === "PENDING" && !view.payload)) {
    return (
      <SuggestionCard title={title} status="FAILED" headingId={headingId} footer={regenerate("outline")}>
        <SuggestionError message={view.status === "FAILED" ? view.errorMessage : null} />
      </SuggestionCard>
    );
  }

  if (view.status === "PENDING") {
    const reject = <RejectSuggestionButton id={view.id} />;
    if (part.kind === "WEB_POST" && part.view.payload) {
      return (
        <SuggestionCard title={title} status="PENDING" headingId={headingId}>
          <WebPostApprovalForm
            suggestionId={view.id}
            payload={part.view.payload}
            riskWarnings={view.riskWarnings}
            publishedTarget={set.post?.status === "PUBLISHED"}
            reject={reject}
            regenerate={regenerate()}
          />
        </SuggestionCard>
      );
    }
    const parts = textParts(part);
    if (part.kind !== "WEB_POST" && parts && platform !== "WEBSITE") {
      return (
        <SuggestionCard title={title} status="PENDING" headingId={headingId}>
          <SocialApprovalForm
            suggestionId={view.id}
            kind={part.kind}
            platform={platform}
            initial={parts}
            riskWarnings={view.riskWarnings}
            copied={!!view.firstCopiedAt}
            postApproved={!!socialPost}
            reject={reject}
            regenerate={regenerate()}
          />
        </SuggestionCard>
      );
    }
  }

  // Đã duyệt: thẻ hiện và sửa đích; sửa không đổi trạng thái (FR-22, AD-19).
  let body = <p className="text-body-sm text-on-surface-variant">Không đọc được nội dung đã duyệt. Tải lại trang.</p>;
  let footer = regenerate("outline");
  if (kind === "WEB_POST" && set.post) {
    body = <WebPostTarget post={set.post} />;
    footer = <SuggestionFooter approve={<OpenPostLink postId={set.post.id} />} regenerate={regenerate("outline")} />;
  } else if (kind === "WEB_POST") {
    // `ContentSet.postId` về null khi Bài web bị xoá (onDelete SetNull): Tạo lại rồi Duyệt sẽ tạo bài mới cho bộ.
    body = (
      <p className="text-body-sm text-on-surface-variant">Bài web của bộ đã bị xoá. Bấm Tạo lại để AI viết Bài web mới cho bộ này.</p>
    );
  } else if (hasApprovedTarget(kind, socialPost)) {
    body = <ApprovedTarget kind={kind} socialPost={socialPost} />;
  }
  return (
    <SuggestionCard title={title} status="APPROVED" headingId={headingId} footer={footer}>
      {body}
    </SuggestionCard>
  );
}
