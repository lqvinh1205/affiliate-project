import { INSPIRATION_VIDEO_SKIPPED, SKIPPED_MESSAGE } from "@/modules/suggestions/constants";
import type { SuggestionSkipped } from "@/modules/suggestions/types";

// Dải `skipped` của hồ sơ Cảm hứng (UX-DR77): mỗi năng lực AI bỏ qua → một câu. Câu về video theo file của Cảm hứng
// (`mediaKind`): đã có ảnh thì không gợi ý tải ảnh nữa (ảnh đọc được hay không xem `skipped` có `images`); có file video
// thì gợi ý đổi sang ảnh; chỉ có link thì gợi ý tải ảnh chụp màn hình.
export function inspirationSkippedMessages(skipped: SuggestionSkipped[], mediaKind: "image" | "video" | null): string[] {
  return skipped.map((s) => {
    if (s !== "video") return SKIPPED_MESSAGE[s];
    if (mediaKind === "image") return INSPIRATION_VIDEO_SKIPPED[skipped.includes("images") ? "imageNotRead" : "imageRead"];
    return INSPIRATION_VIDEO_SKIPPED[mediaKind === "video" ? "file" : "link"];
  });
}
