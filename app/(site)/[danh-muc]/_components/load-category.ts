import { notFound, permanentRedirect } from "next/navigation";
import { getCategorySlugRedirect, getPublicCategory } from "@/modules/categories/queries";

// Tra Danh mục theo đường dẫn ở cấp `page.tsx`, trước `<Suspense>` (AD-12): không thấy thì tra lịch sử
// đổi đường dẫn và trả 308 sang đường dẫn mới, giữ phần đuôi (`/trang/n`) (AD-20); không có lịch sử → 404.
export async function loadCategory(slug: string, rest = "") {
  const category = await getPublicCategory(slug);
  if (category) return category;
  const current = await getCategorySlugRedirect(slug);
  if (current) permanentRedirect(`/${current}${rest}`);
  notFound();
}
