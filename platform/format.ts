const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export const formatDate = (d: Date | null) => (d ? dateFmt.format(d) : "");

const shortDateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

// Ngày tuyệt đối dd/mm/yyyy (vd "cập nhật 05/11/2026").
export const formatShortDate = (d: Date | null) => (d ? shortDateFmt.format(d) : "");

const countFmt = new Intl.NumberFormat("vi-VN");

// Số đếm (Lượt xem, Lượt tim) theo vi-VN: 1234 → "1.234" (AD-27).
export const formatCount = (n: number) => countFmt.format(n);

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

// Ngày lịch Việt Nam của thời điểm `d`, dạng `Date` lúc 00:00 UTC — giá trị cho cột `@db.Date` (vd `PostViewDaily.day`).
export const vietnamDay = (d: Date) => new Date(`${dayKeyFmt.format(d)}T00:00:00Z`);

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hourCycle: "h23",
  timeZone: "Asia/Ho_Chi_Minh",
});

// Giờ + ngày theo giờ Việt Nam (vd lịch Banner "00:00 11/11/2026").
export const formatDateTime = (d: Date | null) => (d ? dateTimeFmt.format(d) : "");

// Ô `<input type="datetime-local">` (giá trị "YYYY-MM-DDTHH:mm", không có múi giờ) luôn hiểu là giờ Việt Nam (UTC+7,
// không đổi giờ mùa hè), bất kể múi giờ của máy đang mở CMS.
const inputFmt = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Ho_Chi_Minh",
});
const DATE_TIME_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Thời điểm → giá trị ô datetime-local theo giờ Việt Nam; null → "".
export const toVietnamDateTimeInput = (d: Date | null) => (d ? inputFmt.format(d).replace(" ", "T") : "");

// Giá trị ô datetime-local (giờ Việt Nam) → thời điểm; sai dạng hoặc ngày không có (vd 30/02) → null.
export function parseVietnamDateTime(value: string): Date | null {
  if (!DATE_TIME_INPUT.test(value)) return null;
  const d = new Date(`${value}:00+07:00`);
  return !Number.isNaN(d.getTime()) && toVietnamDateTimeInput(d) === value ? d : null;
}
