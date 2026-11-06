// Thứ tự Trang bio (spine › Chủ sở hữu bảng, FR-31) — một luật cho query public, query CMS và ghi:
// - thiếu `BioItem` = hiện, không ghim;
// - nhóm "Đang ghim": `sortAt` tăng dần (ghim gán lúc ghim → theo thứ tự đặt);
// - nhóm còn lại: khoá `sortAt ?? createdAt` giảm dần (chưa sắp tay = Sản phẩm mới nhất trước).
// Hoà khoá thì xếp theo `id` để thứ tự ổn định.

export type BioState = { visible: boolean; pinned: boolean; sortAt: Date | null };
export type BioEntry = { id: string; createdAt: Date; bioItem: BioState | null };
export type BioGroup = "pinned" | "rest";
export type MoveDirection = "up" | "down";

const DEFAULT_STATE: BioState = { visible: true, pinned: false, sortAt: null };

export function bioStateOf(entry: Pick<BioEntry, "bioItem">): BioState {
  return entry.bioItem ?? DEFAULT_STATE;
}

function keyOf(entry: BioEntry) {
  return (bioStateOf(entry).sortAt ?? entry.createdAt).getTime();
}

function compare(group: BioGroup) {
  const sign = group === "pinned" ? 1 : -1;
  return (a: BioEntry, b: BioEntry) => sign * (keyOf(a) - keyOf(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// Tách và xếp hai nhóm. Không lọc `visible` (CMS cần cả món đang tắt; query public tự lọc).
export function orderBioEntries<T extends BioEntry>(entries: T[]): { pinned: T[]; rest: T[] } {
  const pinned = entries.filter((e) => bioStateOf(e).pinned).sort(compare("pinned"));
  const rest = entries.filter((e) => !bioStateOf(e).pinned).sort(compare("rest"));
  return { pinned, rest };
}

// Danh sách phẳng theo thứ tự bio: món ghim trước rồi món còn lại.
export function flattenBioEntries<T extends BioEntry>(entries: T[]): T[] {
  const { pinned, rest } = orderBioEntries(entries);
  return [...pinned, ...rest];
}

// Khoá mới khi đưa `id` lên/xuống một bậc trong nhóm (`group` đã xếp bằng `orderBioEntries`). Trước khi đổi chỗ,
// khoá của cả nhóm được làm cho phân biệt (lệch 1 ms khi trùng — vd Sản phẩm cùng `createdAt` do migration) để đổi
// chỗ luôn có tác dụng. Trả các món cần ghi `sortAt` (khoá khác giá trị hiệu lực hiện tại); rỗng nếu đã ở đầu/cuối.
export function planBioMove(group: BioEntry[], kind: BioGroup, id: string, direction: MoveDirection) {
  const from = group.findIndex((e) => e.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= group.length) return [];
  const step = kind === "pinned" ? 1 : -1;
  const keys: number[] = [];
  for (const [i, e] of group.entries()) {
    const k = keyOf(e);
    keys.push(i === 0 ? k : step > 0 ? Math.max(k, keys[i - 1] + 1) : Math.min(k, keys[i - 1] - 1));
  }
  [keys[from], keys[to]] = [keys[to], keys[from]];
  return group.flatMap((e, i) => (keys[i] === keyOf(e) ? [] : [{ id: e.id, sortAt: new Date(keys[i]) }]));
}
