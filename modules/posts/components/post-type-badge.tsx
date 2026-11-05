import type { PostType } from "@/generated/prisma/enums";
import { POST_TYPES } from "@/modules/posts/constants";

// Token DESIGN.md › post-type-badge-meo-vat / post-type-badge-gom-link. Chỉ hiển thị, không là link.
const STYLES: Record<PostType, string> = {
  MEO_VAT: "bg-secondary-container text-on-secondary-container",
  GOM_LINK: "bg-tertiary-fixed text-on-tertiary-fixed",
};

// PostTypeBadge: nhãn Loại bài (enum `PostType`), chữ hoa.
export function PostTypeBadge({ postType, className }: { postType: PostType; className?: string }) {
  return (
    // Ghép chuỗi thường: `cn` (tailwind-merge) coi cỡ chữ token `text-label-meta` và màu `text-…` cùng nhóm.
    <span className={`inline-block rounded px-1.5 py-0.5 text-label-meta uppercase ${STYLES[postType]} ${className ?? ""}`}>
      {POST_TYPES[postType].label}
    </span>
  );
}
