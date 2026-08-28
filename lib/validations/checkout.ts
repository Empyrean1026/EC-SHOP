import { z } from "zod";
import { CART_MAX_DISTINCT_ITEMS, CART_MAX_QUANTITY } from "@/lib/cart/constants";
import { PAYMENT_METHODS } from "@/models/constants";

const requiredText = (label: string, maximum: number, minimum = 1) =>
  z.string().trim().min(minimum, `${label}は${minimum}文字以上で入力してください`).max(maximum);

export const shippingAddressSchema = z
  .object({
    fullName: requiredText("お名前", 100, 2),
    phone: requiredText("電話番号", 30, 7)
      .regex(/^[+\d\s().-]+$/, "電話番号に使用できない文字が含まれています")
      .refine(
        (value) => value.replace(/\D/g, "").length >= 7,
        "電話番号は数字7桁以上で入力してください",
      ),
    line1: requiredText("住所", 200),
    line2: z.string().trim().max(200),
    city: requiredText("市区町村", 100),
    state: z.string().trim().max(100),
    postalCode: requiredText("郵便番号", 20, 2).regex(
      /^[A-Za-z\d\s-]+$/,
      "郵便番号に使用できない文字が含まれています",
    ),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "国・地域を選択してください"),
  })
  .strict();

export const checkoutFormSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(PAYMENT_METHODS),
    saveAddress: z.boolean(),
    confirmOrder: z.boolean().refine((value) => value, "商品内容と注文合計をご確認ください"),
  })
  .strict();

const expectedCartItemSchema = z
  .object({
    productId: z.string().regex(/^[a-f\d]{24}$/i, "商品IDの形式が正しくありません"),
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
    unitPrice: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    currency: z.enum(["jpy", "usd", "cny"]),
  })
  .strict();

export const createCheckoutOrderSchema = checkoutFormSchema
  .extend({
    idempotencyKey: z.uuid("購入手続きのリクエストIDが正しくありません"),
    expectedItems: z.array(expectedCartItemSchema).min(1).max(CART_MAX_DISTINCT_ITEMS),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.expectedItems.map((item) => item.productId)).size ===
      value.expectedItems.length,
    { message: "確認対象の商品を重複して指定できません", path: ["expectedItems"] },
  );

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderSchema>;
