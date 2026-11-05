import { permanentRedirect } from "next/navigation";

// Gốc CMS chuyển thẳng tới danh sách Bài web (UX-DR70); sau này thành dashboard.
export default function CmsRootPage() {
  permanentRedirect("/cms/bai-viet");
}
