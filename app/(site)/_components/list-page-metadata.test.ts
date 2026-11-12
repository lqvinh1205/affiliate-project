import { describe, expect, it } from "vitest";
import { defaultCategoryDescription, listPageMetadata } from "@/app/(site)/_components/list-page-metadata";
import { SITE_OPEN_GRAPH } from "@/platform/site";

describe("listPageMetadata", () => {
  it("trang 1: tiêu đề là tên, canonical là trang gốc, có meta description, og:url là canonical", () => {
    expect(listPageMetadata({ title: "Nhà bếp", description: "Mẹo bếp", path: "/nha-bep", page: 1 })).toEqual({
      title: "Nhà bếp",
      description: "Mẹo bếp",
      alternates: { canonical: "/nha-bep" },
      openGraph: { ...SITE_OPEN_GRAPH, url: "/nha-bep" },
    });
  });

  it("trang n > 1: tiêu đề và mô tả thêm '– Trang n', canonical và og:url là chính trang đó", () => {
    expect(
      listPageMetadata({ title: "Nhà bếp", description: "Mẹo bếp", path: "/nha-bep/trang/3", page: 3 }),
    ).toEqual({
      title: "Nhà bếp – Trang 3",
      description: "Mẹo bếp – Trang 3",
      alternates: { canonical: "/nha-bep/trang/3" },
      openGraph: { ...SITE_OPEN_GRAPH, url: "/nha-bep/trang/3" },
    });
  });

  it("trang n > 1: mô tả kết thúc bằng dấu chấm thì bỏ dấu chấm trước '– Trang n'", () => {
    expect(
      listPageMetadata({ title: "Mẹo vặt", description: "Mẹo nhà cửa.", path: "/meo-vat/trang/2", page: 2 }).description,
    ).toBe("Mẹo nhà cửa – Trang 2");
  });

  it("trang 1 giữ nguyên dấu chấm cuối mô tả", () => {
    expect(listPageMetadata({ title: "A", description: "Mô tả.", path: "/a", page: 1 }).description).toBe("Mô tả.");
  });

  it("OpenGraph giữ tên site, locale và ảnh mặc định (Next gộp openGraph nông)", () => {
    const og = listPageMetadata({ title: "A", description: "B", path: "/a", page: 1 }).openGraph;
    expect(og).toMatchObject({ siteName: "Mẹo Cuộc Sống", locale: "vi_VN", type: "website" });
    expect(og?.images).toEqual(SITE_OPEN_GRAPH.images);
  });

  it("noindex thêm robots index:false", () => {
    expect(listPageMetadata({ title: "A", description: "B", path: "/a", page: 1, noindex: true }).robots).toEqual({
      index: false,
    });
  });
});

describe("defaultCategoryDescription", () => {
  it("sinh mô tả từ tên Danh mục", () => {
    expect(defaultCategoryDescription("Nhà bếp")).toBe(
      "Mẹo vặt và đồ hay chủ đề Nhà bếp: bài hướng dẫn dễ làm, món đồ tiện ích được chọn lọc.",
    );
  });
});
