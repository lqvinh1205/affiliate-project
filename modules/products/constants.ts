// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/products.prisma` (spine AD-14).
export const PRODUCT_NAME_MAX = 200;
export const PRODUCT_PRICE_TEXT_MAX = 50;
// Dữ liệu thô là cột `Text`: giới hạn chỉ ở Zod để form không gửi khối chữ vô hạn.
export const PRODUCT_RAW_TEXT_MAX = 20_000;
export const PRODUCT_RAW_IMAGE_URLS_MAX = 30;

// Số Sản phẩm mỗi trang ở `/cms/san-pham` (`?trang=n`).
export const PRODUCT_PAGE_SIZE = 20;

// Số kết quả tìm tối đa của ProductPicker (trình soạn Bài web).
export const PRODUCT_PICKER_LIMIT = 10;
// Tham số URL của ô tìm ProductPicker (`?sp=`): Screen đọc lại qua `cms-queries` (AD-12, không có action đọc).
export const PRODUCT_PICKER_PARAM = "sp";
