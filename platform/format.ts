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
