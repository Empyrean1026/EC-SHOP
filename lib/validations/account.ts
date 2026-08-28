import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validations/checkout";

const avatarSchema = z
  .union([
    z.literal(""),
    z
      .url("有効なプロフィール画像URLを入力してください")
      .max(2048, "プロフィール画像URLは2048文字以内で入力してください")
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      }, "プロフィール画像URLは HTTP または HTTPS を使用してください"),
  ])
  .transform((value) => value || null);

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "氏名は2文字以上で入力してください")
      .max(100, "氏名は100文字以内で入力してください"),
    avatar: avatarSchema,
  })
  .strict();

export const updateAddressSchema = shippingAddressSchema;

export const wishlistProductSchema = z
  .object({
    productId: z.string().regex(/^[a-f\d]{24}$/i, "商品IDの形式が正しくありません"),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
