import { describe, expect, it } from "vitest";
import { BIO_ALL_CHIP, bioChipsOf, bioGroupsOf, bioItemsOfCategory } from "@/modules/bio/browse";

const bep = { id: "bep", name: "Đồ bếp" };
const don = { id: "don", name: "Dọn dẹp" };
const trong = { id: "trong", name: "Ở trọ" };
// Thứ tự bio: món ghim trước.
const items = [
  { id: "g1", pinned: true, categoryId: "bep" },
  { id: "g2", pinned: true, categoryId: null },
  { id: "a", pinned: false, categoryId: "don" },
  { id: "b", pinned: false, categoryId: "bep" },
  { id: "c", pinned: false, categoryId: null },
  { id: "d", pinned: false, categoryId: "bep" },
];
const ids = (l: { id: string }[]) => l.map((p) => p.id);

describe("bioGroupsOf (chip Tất cả)", () => {
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

describe("bioChipsOf, bioItemsOfCategory (chip Danh mục)", () => {
  it("chip Tất cả không số; số món của Danh mục tính cả món ghim; không có chip Khác", () => {
    expect(bioChipsOf(items, [bep, don])).toEqual([
      { value: BIO_ALL_CHIP, label: "Tất cả" },
      { value: "bep", label: "Đồ bếp", count: 3 },
      { value: "don", label: "Dọn dẹp", count: 1 },
    ]);
  });

  it("danh sách phẳng giữ thứ tự bio: món ghim lên đầu, vẫn mang dấu Ghim", () => {
    const list = bioItemsOfCategory(items, "bep");
    expect(list.map((p) => [p.id, p.pinned])).toEqual([
      ["g1", true],
      ["b", false],
      ["d", false],
    ]);
  });
});
