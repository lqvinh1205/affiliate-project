// Thứ tự Trang bio (spine › Chủ sở hữu bảng, FR-31) — một luật cho query public, query CMS và ghi:
// - thiếu `BioItem` = hiện, không ghim;
// - nhóm "Đang ghim": khoá `pinnedAt` tăng dần (ghim gán lúc ghim → theo thứ tự đặt);
// - nhóm còn lại: khoá `sortAt ?? createdAt` giảm dần (chưa sắp tay = Sản phẩm mới nhất trước). Ghim/bỏ ghim không
//   đụng `sortAt` → bỏ ghim về đúng chỗ cũ trong nhóm còn lại.
// Hoà khoá thì xếp theo `id` để thứ tự ổn định.

export type BioState = { visible: boolean; pinned: boolean; sortAt: Date | null; pinnedAt: Date | null };
export type BioEntry = { id: string; createdAt: Date; bioItem: BioState | null };
export type BioGroup = "pinned" | "rest";
export type MoveDirection = "up" | "down";

const DEFAULT_STATE: BioState = { visible: true, pinned: false, sortAt: null, pinnedAt: null };

export function bioStateOf(entry: Pick<BioEntry, "bioItem">): BioState {
  return entry.bioItem ?? DEFAULT_STATE;
}

// Cột khoá của từng nhóm — lên/xuống ghi đúng cột này.
export const BIO_KEY_FIELD = { pinned: "pinnedAt", rest: "sortAt" } as const satisfies Record<BioGroup, keyof BioState>;

function keyOf(entry: BioEntry, group: BioGroup) {
  return (bioStateOf(entry)[BIO_KEY_FIELD[group]] ?? entry.createdAt).getTime();
}

function compare(group: BioGroup) {
  const sign = group === "pinned" ? 1 : -1;
  return (a: BioEntry, b: BioEntry) =>
    sign * (keyOf(a, group) - keyOf(b, group)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
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
// khoá trùng nhau được làm cho phân biệt (lệch 1 ms) để đổi chỗ luôn có tác dụng; migration
// `bio_pinned_at_untie_product_created_at` đã gỡ các `Product.createdAt` trùng nhau nên thường chỉ ghi hai món.
// Trả các món cần ghi cột `BIO_KEY_FIELD[kind]` (khoá khác giá trị hiệu lực hiện tại); rỗng nếu đã ở đầu/cuối.
export function planBioMove(group: BioEntry[], kind: BioGroup, id: string, direction: MoveDirection) {
  const from = group.findIndex((e) => e.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= group.length) return [];
  const step = kind === "pinned" ? 1 : -1;
  const keys: number[] = [];
  for (const [i, e] of group.entries()) {
    const k = keyOf(e, kind);
    keys.push(i === 0 ? k : step > 0 ? Math.max(k, keys[i - 1] + 1) : Math.min(k, keys[i - 1] - 1));
  }
  [keys[from], keys[to]] = [keys[to], keys[from]];
  return group.flatMap((e, i) => (keys[i] === keyOf(e, kind) ? [] : [{ id: e.id, at: new Date(keys[i]) }]));
}
