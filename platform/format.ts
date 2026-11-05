const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export const formatDate = (d: Date | null) => (d ? dateFmt.format(d) : "");
