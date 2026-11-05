"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <Button variant="outline" size="lg" onClick={() => toast.error("Đường dẫn đã có bài khác dùng.")}>
      Hiện Toast
    </Button>
  );
}
