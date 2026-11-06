import { Info } from "lucide-react";
import { SKIPPED_MESSAGE } from "@/modules/suggestions/constants";
import type { SuggestionSkipped } from "@/modules/suggestions/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Dải `skipped` đầu thân thẻ (UX-DR45): AI bỏ qua ảnh / tìm web; hồ sơ vẫn Duyệt được.
export function SkippedNotice({ skipped }: { skipped: SuggestionSkipped[] }) {
  if (skipped.length === 0) return null;
  return (
    <Alert role="status" className="border-0 bg-surface-container-high text-on-surface">
      <Info aria-hidden />
      <AlertDescription className="text-body-sm text-on-surface">
        {skipped.map((s) => (
          <p key={s}>{SKIPPED_MESSAGE[s]}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
}
