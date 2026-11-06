import { describe, expect, it } from "vitest";
import {
  BIO_KEY_FIELD,
  flattenBioEntries,
  orderBioEntries,
  planBioMove,
  type BioEntry,
  type BioGroup,
} from "@/modules/bio/order";

const day = (n: number) => new Date(Date.UTC(2026, 10, n));
const entry = (id: string, created: number, bio: Partial<NonNullable<BioEntry["bioItem"]>> | null = null): BioEntry => ({
  id,
  createdAt: day(created),
  bioItem: bio && { visible: true, pinned: false, sortAt: null, pinnedAt: null, ...bio },
});
const ids = (l: BioEntry[]) => l.map((e) => e.id);

// Áp kế hoạch đổi chỗ vào danh sách rồi xếp lại (giả lập ghi DB).
function applied(entries: BioEntry[], plan: { id: string; at: Date }[], kind: BioGroup = "rest") {
  return entries.map((e) => {
    const p = plan.find((x) => x.id === e.id);
    const base = { visible: true, pinned: false, sortAt: null, pinnedAt: null, ...e.bioItem };
    return p ? { ...e, bioItem: { ...base, [BIO_KEY_FIELD[kind]]: p.at } } : e;
  });
}

describe("orderBioEntries (thứ tự Trang bio)", () => {
  it("thiếu BioItem = không ghim, mới tạo trước", () => {
    const { pinned, rest } = orderBioEntries([entry("a", 1), entry("b", 3), entry("c", 2)]);
    expect(pinned).toEqual([]);
    expect(ids(rest)).toEqual(["b", "c", "a"]);
  });

  it("món ghim theo thứ tự đặt (pinnedAt tăng dần) và đứng trước món còn lại", () => {
    const list = [
      entry("a", 1),
      entry("b", 2, { pinned: true, pinnedAt: day(20) }),
      entry("c", 3, { pinned: true, pinnedAt: day(10) }),
      entry("d", 4),
    ];
    expect(ids(orderBioEntries(list).pinned)).toEqual(["c", "b"]);
    expect(ids(flattenBioEntries(list))).toEqual(["c", "b", "d", "a"]);
  });

  it("bỏ ghim giữ chỗ đã sắp tay ở nhóm còn lại (sortAt không phụ thuộc pinnedAt)", () => {
    const list = [entry("a", 3), entry("b", 2), entry("c", 1, { sortAt: day(9), pinnedAt: null })];
    expect(ids(orderBioEntries(list).rest)).toEqual(["c", "a", "b"]);
  });

  it("món đã sắp tay dùng sortAt thay cho ngày tạo; hoà khoá xếp theo id", () => {
    const list = [entry("b", 5), entry("a", 5), entry("c", 1, { sortAt: day(9) })];
    expect(ids(orderBioEntries(list).rest)).toEqual(["c", "a", "b"]);
  });
});

describe("planBioMove", () => {
  it("đưa lên trong nhóm còn lại: đổi khoá hai món kề nhau", () => {
    const list = [entry("a", 3), entry("b", 2), entry("c", 1)];
    const rest = orderBioEntries(list).rest;
    const plan = planBioMove(rest, "rest", "c", "up");
    expect(plan).toEqual([
      { id: "b", at: day(1) },
      { id: "c", at: day(2) },
    ]);
    expect(ids(orderBioEntries(applied(list, plan)).rest)).toEqual(["a", "c", "b"]);
  });

  it("món đầu không lên được, món cuối không xuống được", () => {
    const rest = orderBioEntries([entry("a", 2), entry("b", 1)]).rest;
    expect(planBioMove(rest, "rest", "a", "up")).toEqual([]);
    expect(planBioMove(rest, "rest", "b", "down")).toEqual([]);
    expect(planBioMove(rest, "rest", "khong-co", "up")).toEqual([]);
  });

  it("ngày tạo trùng nhau (Sản phẩm từ migration) vẫn đổi chỗ được", () => {
    const list = [entry("a", 1), entry("b", 1), entry("c", 1)];
    const rest = orderBioEntries(list).rest;
    expect(ids(rest)).toEqual(["a", "b", "c"]);
    const once = applied(list, planBioMove(rest, "rest", "c", "up"));
    expect(ids(orderBioEntries(once).rest)).toEqual(["a", "c", "b"]);
    const twice = applied(once, planBioMove(orderBioEntries(once).rest, "rest", "c", "up"));
    expect(ids(orderBioEntries(twice).rest)).toEqual(["c", "a", "b"]);
  });

  it("đưa xuống trong nhóm Đang ghim", () => {
    const list = [
      entry("a", 1, { pinned: true, pinnedAt: day(10), sortAt: day(30) }),
      entry("b", 2, { pinned: true, pinnedAt: day(11) }),
      entry("c", 3, { pinned: true, pinnedAt: day(12) }),
    ];
    const plan = planBioMove(orderBioEntries(list).pinned, "pinned", "a", "down");
    expect(plan.map((p) => p.id).sort()).toEqual(["a", "b"]);
    const after = applied(list, plan, "pinned");
    expect(ids(orderBioEntries(after).pinned)).toEqual(["b", "a", "c"]);
    // Khoá của nhóm còn lại không đổi.
    expect(after[0].bioItem?.sortAt).toEqual(day(30));
  });
});
