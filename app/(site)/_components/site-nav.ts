import { POST_TYPES } from "@/modules/posts/constants";

// Điều hướng site (EXPERIENCE.md › Điều hướng mobile): đích cố định của tab và nav ngang.
export const BIO_PATH = "/bio";
export const SEARCH_PATH = "/tim-kiem";
export const POST_TYPE_LINKS = [
  { href: `/${POST_TYPES.MEO_VAT.slug}`, label: POST_TYPES.MEO_VAT.label },
  { href: `/${POST_TYPES.GOM_LINK.slug}`, label: POST_TYPES.GOM_LINK.label },
] as const;

// Số Danh mục hiện thẳng trên nav ngang desktop; phần còn lại gom vào "Thêm".
export const DESKTOP_NAV_CATEGORIES = 4;
