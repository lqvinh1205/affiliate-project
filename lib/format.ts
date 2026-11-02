const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric" });

export const formatDate = (d: Date | null) => (d ? dateFmt.format(d) : "");
