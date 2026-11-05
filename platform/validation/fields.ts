import { z } from "zod";
import { isAllowedImageUrl } from "@/platform/images";

export const optionalText = z.string().trim().transform((s) => s || null);

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
