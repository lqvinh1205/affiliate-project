import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Gợi ý *Lỗi* (UX-DR41, UX-DR96): Alert nền `error-container`, thông báo tiếng Việt; nút "Tạo lại" ở chân thẻ.
export function SuggestionError({ message }: { message: string | null }) {
  return (
    <Alert className="border-0 bg-error-container text-on-error-container">
      <CircleAlert aria-hidden />
      <AlertDescription className="text-body-sm text-on-error-container">
        {message ?? "AI chưa tạo được phần này. Bấm Tạo lại."}
      </AlertDescription>
    </Alert>
  );
}
