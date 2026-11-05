import { redirect } from "next/navigation";

// Gốc CMS chuyển tới danh sách Bài web (UX-DR70). Chuyển hướng tạm (307): sau này `/cms` thành dashboard.
export default function CmsRootPage() {
  redirect("/cms/bai-viet");
}
