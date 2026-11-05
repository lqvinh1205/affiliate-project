import { describe, expect, it } from "vitest";
import { listPageMetadata } from "@/app/(site)/_components/list-page-metadata";

describe("listPageMetadata", () => {
  it("trang 1: tiêu đề là tên, canonical là trang gốc, có meta description", () => {
    expect(listPageMetadata({ title: "Nhà bếp", description: "Mẹo bếp", path: "/nha-bep", page: 1 })).toEqual({
      title: "Nhà bếp",
      description: "Mẹo bếp",
      alternates: { canonical: "/nha-bep" },
    });
  });

  it("trang n > 1: tiêu đề thêm '– Trang n', canonical là chính trang đó", () => {
    expect(
      listPageMetadata({ title: "Nhà bếp", description: null, path: "/nha-bep/trang/3", page: 3 }),
    ).toEqual({ title: "Nhà bếp – Trang 3", description: undefined, alternates: { canonical: "/nha-bep/trang/3" } });
  });

  it("noindex thêm robots index:false", () => {
    expect(listPageMetadata({ title: "A", description: null, path: "/a", page: 1, noindex: true }).robots).toEqual({
      index: false,
    });
  });
});
