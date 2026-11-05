import { z } from "zod";
import { isAllowedImageUrl } from "@/platform/images";

export const optionalText = z.string().trim().transform((s) => s || null);

// Chuỗi bắt buộc: cắt khoảng trắng, rỗng báo `message`, dài hơn `max` (bằng `@db.VarChar(max)`) báo giới hạn.
export function requiredText(max: number, message: string) {
  return z.string().trim().min(1, message).max(max, `Tối đa ${max} ký tự`);
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Đường dẫn URL: chữ thường không dấu, số, dấu gạch ngang giữa các cụm.
export function slugField(max: number) {
  return z
    .string()
    .trim()
    .min(1, "Nhập đường dẫn")
    .max(max, `Tối đa ${max} ký tự`)
    .regex(SLUG_PATTERN, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (vd: do-bep)");
}

export const imageUrl = z
  .string()
  .trim()
  .refine((s) => !s || isAllowedImageUrl(s), "Ảnh phải là link https từ Shopee hoặc đường dẫn trong site")
  .transform((s) => s || null);

const SHOPEE_HOSTS = ["shopee.vn", "s.shopee.vn", "shope.ee"];
const SHOPEE_ERROR = "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)";

export const shopeeAffiliateUrl = z
  .string()
  .trim()
  .refine((s) => {
    try {
      const { protocol, hostname } = new URL(s);
      return protocol === "https:" && SHOPEE_HOSTS.includes(hostname);
    } catch {
      return false;
    }
  }, SHOPEE_ERROR);
