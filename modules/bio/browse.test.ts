import { describe, expect, it } from "vitest";
import {
  BIO_UNCATEGORIZED_KEY,
  bioCategoryRowsOf,
  bioDefaultGroupsOf,
  bioGroupsOf,
  bioItemsOfRow,
  bioOtherRowsOf,
} from "@/modules/bio/browse";

const bep = { id: "bep", name: "Đồ bếp", slug: "do-bep", description: "Nồi, chảo" };
const don = { id: "don", name: "Dọn dẹp", slug: "don-dep", description: null };
const trong = { id: "trong", name: "Ở trọ", slug: "o-tro", description: null };
// Thứ tự bio: món ghim trước.
const items = [
  { id: "g1", pinned: true, categoryId: "bep" },
  { id: "g2", pinned: true, categoryId: null },
  { id: "a", pinned: false, categoryId: "don" },
  { id: "b", pinned: false, categoryId: "bep" },
  { id: "c", pinned: false, categoryId: null },
  { id: "d", pinned: false, categoryId: "bep" },
];
const unpinned = items.map((p) => ({ ...p, pinned: false }));
const ids = (l: { id: string }[] | null) => l?.map((p) => p.id);

describe("bioGroupsOf", () => {
  it("Nổi bật trước, rồi Danh mục theo thứ tự hiển thị, món ghim không lặp, món không Danh mục ở Khác cuối", () => {
    const groups = bioGroupsOf(items, [bep, don, trong]);
    expect(groups.map((g) => [g.title, ids(g.items)])).toEqual([
      ["Nổi bật", ["g1", "g2"]],
      ["Đồ bếp", ["b", "d"]],
      ["Dọn dẹp", ["a"]],
      ["Khác", ["c"]],
    ]);
  });

  it("bỏ nhóm rỗng (không ghim, không món thiếu Danh mục)", () => {
    const groups = bioGroupsOf([{ id: "a", pinned: false, categoryId: "bep" }], [bep]);
    expect(groups.map((g) => g.key)).toEqual(["bep"]);
  });
});

describe("bioDefaultGroupsOf (màn mặc định)", () => {
  it("có món ghim: chỉ nhóm Nổi bật", () => {
    expect(bioDefaultGroupsOf(items, [bep, don]).map((g) => [g.title, ids(g.items)])).toEqual([["Nổi bật", ["g1", "g2"]]]);
  });

  it("không món ghim: mọi nhóm theo Danh mục", () => {
    expect(bioDefaultGroupsOf(unpinned, [bep, don]).map((g) => g.title)).toEqual(["Đồ bếp", "Dọn dẹp", "Khác"]);
  });
});

describe("bioCategoryRowsOf, bioItemsOfRow (dòng Danh mục)", () => {
  it("mỗi Danh mục có món một dòng (slug, mô tả, số món tính cả món ghim), dòng Khác cuối; bỏ Danh mục rỗng", () => {
    expect(bioCategoryRowsOf(items, [bep, don, trong])).toEqual([
      { key: "do-bep", name: "Đồ bếp", description: "Nồi, chảo", count: 3 },
      { key: "don-dep", name: "Dọn dẹp", description: null, count: 1 },
      { key: BIO_UNCATEGORIZED_KEY, name: "Khác", description: null, count: 2 },
    ]);
  });

  it("không có món thiếu Danh mục: không có dòng Khác", () => {
    expect(bioCategoryRowsOf([{ pinned: false, categoryId: "bep" }], [bep]).map((r) => r.key)).toEqual(["do-bep"]);
  });

  it("danh sách phẳng giữ thứ tự bio: món ghim lên đầu, vẫn mang dấu Ghim", () => {
    const list = bioItemsOfRow(items, [bep, don], "do-bep");
    expect(list?.map((p) => [p.id, p.pinned])).toEqual([
      ["g1", true],
      ["b", false],
      ["d", false],
    ]);
    expect(ids(bioItemsOfRow(items, [bep, don], BIO_UNCATEGORIZED_KEY))).toEqual(["g2", "c"]);
  });

  it("slug không khớp hoặc Danh mục không còn món: null (về màn mặc định)", () => {
    expect(bioItemsOfRow(items, [bep, don, trong], "khong-co")).toBeNull();
    expect(bioItemsOfRow(items, [bep, don, trong], "o-tro")).toBeNull();
    expect(bioItemsOfRow([{ id: "x", pinned: false, categoryId: "bep" }], [bep], BIO_UNCATEGORIZED_KEY)).toBeNull();
  });
});

describe("bioOtherRowsOf", () => {
  const rows = bioCategoryRowsOf(items, [bep, don, trong]);

  it("bỏ dòng Danh mục đang xem, giữ thứ tự", () => {
    expect(bioOtherRowsOf(rows, "do-bep").map((r) => r.key)).toEqual(["don-dep", BIO_UNCATEGORIZED_KEY]);
  });

  it("đang xem dòng Khác: bỏ Khác, giữ thứ tự", () => {
    expect(bioOtherRowsOf(rows, BIO_UNCATEGORIZED_KEY).map((r) => r.key)).toEqual(["do-bep", "don-dep"]);
  });

  it("chỉ một dòng → rỗng", () => {
    const one = bioCategoryRowsOf([{ pinned: false, categoryId: "bep" }], [bep]);
    expect(bioOtherRowsOf(one, "do-bep")).toEqual([]);
  });
});
