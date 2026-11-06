import "server-only";
import { db } from "@/platform/db";
import { visibleProductWhere } from "@/modules/products/queries";
import { BIO_SETTINGS_DEFAULTS } from "@/modules/bio/constants";
import { bioStateOf, orderBioEntries } from "@/modules/bio/order";

// Màn `/cms/bio` (FR-31, UX-DR80): giới thiệu + câu công khai + ảnh đại diện (thiếu bản ghi = giá trị khởi tạo) và BioProductList
// mọi Sản phẩm đang hiện trên website (Sản phẩm ẩn không có), chia nhóm "Đang ghim" / còn lại theo thứ tự bio.
export async function getBioForCms() {
  const [settings, rows] = await Promise.all([
    db.bioSettings.findFirst({ orderBy: { createdAt: "asc" }, select: { intro: true, disclosure: true, avatar: true } }),
    db.product.findMany({
      where: visibleProductWhere,
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        bioItem: { select: { visible: true, pinned: true, sortAt: true, pinnedAt: true } },
      },
    }),
  ]);
  const toItem = (r: (typeof rows)[number]) => {
    const { visible, pinned } = bioStateOf(r);
    return { id: r.id, name: r.name, image: r.image, visible, pinned };
  };
  const { pinned, rest } = orderBioEntries(rows);
  return { settings: settings ?? { ...BIO_SETTINGS_DEFAULTS }, pinned: pinned.map(toItem), rest: rest.map(toItem) };
}
