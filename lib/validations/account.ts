import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validations/checkout";

const avatarSchema = z
  .union([
    z.literal(""),
    z
      .url("请输入有效的头像网址")
      .max(2048, "头像网址不能超过 2048 个字符")
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      }, "头像网址必须使用 HTTP 或 HTTPS"),
  ])
  .transform((value) => value || null);

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "姓名至少需要 2 个字符").max(100, "姓名不能超过 100 个字符"),
    avatar: avatarSchema,
  })
  .strict();

export const updateAddressSchema = shippingAddressSchema;

export const wishlistProductSchema = z
  .object({
    productId: z.string().regex(/^[a-f\d]{24}$/i, "商品 ID 格式无效"),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
