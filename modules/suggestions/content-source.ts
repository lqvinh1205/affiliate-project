import { visibleText } from "@/platform/html/content";
import type { ResearchProfileData } from "@/modules/research/types";

// Ngân sách chữ nguồn cho prompt Bộ nội dung (Bài web, Threads, Facebook).
export const SOURCE_MAX = 12_000;
const SEPARATOR = "\n\n";

const lines = (label: string, items: string[]) => (items.length ? `- ${label}: ${items.join("; ")}` : null);

function clip(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

// Dữ liệu nguồn cho prompt: Hồ sơ nghiên cứu đã Duyệt của từng Sản phẩm (thông tin, mô tả ảnh, khen/chê/phù hợp)
// và — bộ tạo từ Bài web có sẵn (FR-16) — chữ của bài. Không có giá (thân bài không nêu giá — FR-13).
// Mỗi khối có ngân sách riêng để không khối nào bị cắt mất hẳn: Bài web (nguồn chính) đứng đầu; các Sản phẩm chia
// đều phần của mình (một nửa khi có Bài web), phần thừa của khối ngắn chuyển cho khối sau; Bài web lấy phần còn lại.
export function describeSource(
  products: { name: string }[],
  profiles: (ResearchProfileData | null)[],
  post: { title: string; excerpt: string | null; content: string } | null,
) {
  const blocks = products.map((p, i) => {
    const r = profiles[i];
    const rows = [
      `Sản phẩm ${i + 1}: ${p.name}`,
      r ? lines("Thông tin", r.info.map((x) => x.text)) : "- (chưa có Hồ sơ nghiên cứu)",
      r?.infoNote ? `- Ghi chú: ${r.infoNote}` : null,
      r?.imageDescription ? `- Mô tả ảnh: ${r.imageDescription}` : null,
      r?.reviewSummary ? lines("Được khen", r.reviewSummary.praise) : null,
      r?.reviewSummary ? lines("Bị chê", r.reviewSummary.complaints) : null,
      r?.reviewSummary ? lines("Hợp với", r.reviewSummary.fit) : null,
    ];
    return rows.filter(Boolean).join("\n");
  });
  const postBlock = post
    ? `Bài web có sẵn (nguồn chính):\nTiêu đề: ${post.title}\nTóm tắt: ${post.excerpt ?? ""}\nNội dung: ${visibleText(post.content)}`
    : null;

  const count = blocks.length + (postBlock ? 1 : 0);
  const total = SOURCE_MAX - SEPARATOR.length * Math.max(0, count - 1);
  let productBudget = postBlock ? Math.floor(total / 2) : total;
  const clipped = blocks.map((b, i) => {
    const out = clip(b, Math.floor(productBudget / (blocks.length - i)));
    productBudget -= out.length;
    return out;
  });
  const used = clipped.reduce((n, b) => n + b.length, 0);
  return [postBlock ? clip(postBlock, total - used) : null, ...clipped].filter(Boolean).join(SEPARATOR);
}
