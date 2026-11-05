import { Info } from "lucide-react";

// Câu công khai mặc định (EXPERIENCE.md › Voice and Tone). Câu trên `/bio` lấy từ CMS (FR-31, Epic 6).
const POST_DISCLOSURE =
  "Bài viết có link tiếp thị liên kết Shopee. Bạn mua qua link, mình nhận một khoản hoa hồng nhỏ để duy trì trang web, giá bạn trả hoàn toàn không đổi.";
const SITE_DISCLOSURE =
  "Trang có link tiếp thị liên kết Shopee. Bạn mua qua link, mình nhận một khoản hoa hồng nhỏ để duy trì trang web, giá bạn trả hoàn toàn không đổi.";

// Nhãn công khai affiliate (FR-24, DESIGN.md › AffiliateDisclosure): không thu nhỏ, không giảm độ mờ.
// `box` — hộp trên trang bài (chỉ render khi bài có ≥ 1 Sản phẩm đang hiện); `text` — dòng chữ ở footer.
export function AffiliateDisclosure({ variant = "box" }: { variant?: "box" | "text" }) {
  if (variant === "text") {
    return (
      <p className="text-body-sm text-on-surface-variant">
        <strong className="font-semibold text-on-surface">Minh bạch liên kết:</strong> {SITE_DISCLOSURE}
      </p>
    );
  }
  return (
    <aside
      aria-label="Minh bạch liên kết"
      className="flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md text-body-sm text-on-surface-variant"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
        <Info className="size-4" strokeWidth={1.5} aria-hidden />
      </span>
      <p>
        <strong className="font-semibold text-on-surface">Minh bạch liên kết:</strong> {POST_DISCLOSURE}
      </p>
    </aside>
  );
}
