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
