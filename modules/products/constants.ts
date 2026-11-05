// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/products.prisma` (spine AD-14).
export const PRODUCT_NAME_MAX = 200;
export const PRODUCT_PRICE_TEXT_MAX = 50;
// Dữ liệu thô là cột `Text`: giới hạn chỉ ở Zod để form không gửi khối chữ vô hạn.
export const PRODUCT_RAW_TEXT_MAX = 20_000;
export const PRODUCT_RAW_IMAGE_URLS_MAX = 30;

// Số Sản phẩm mỗi trang ở `/cms/san-pham` (`?trang=n`).
export const PRODUCT_PAGE_SIZE = 20;
