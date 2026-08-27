import { z } from "zod";
import { CART_MAX_DISTINCT_ITEMS, CART_MAX_QUANTITY } from "@/lib/cart/constants";
import { PAYMENT_METHODS } from "@/models/constants";

const requiredText = (label: string, maximum: number, minimum = 1) =>
  z.string().trim().min(minimum, `${label}至少需要 ${minimum} 个字符`).max(maximum);

export const shippingAddressSchema = z
  .object({
    fullName: requiredText("收件人姓名", 100, 2),
    phone: requiredText("联系电话", 30, 7)
      .regex(/^[+\d\s().-]+$/, "联系电话包含无效字符")
      .refine((value) => value.replace(/\D/g, "").length >= 7, "联系电话至少需要 7 位数字"),
    line1: requiredText("详细地址", 200),
    line2: z.string().trim().max(200),
    city: requiredText("城市", 100),
    state: z.string().trim().max(100),
    postalCode: requiredText("邮政编码", 20, 2).regex(/^[A-Za-z\d\s-]+$/, "邮政编码包含无效字符"),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "请选择国家或地区"),
  })
  .strict();

export const checkoutFormSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(PAYMENT_METHODS),
    saveAddress: z.boolean(),
    confirmOrder: z.boolean().refine((value) => value, "请确认商品信息和订单金额"),
  })
  .strict();

const expectedCartItemSchema = z
  .object({
    productId: z.string().regex(/^[a-f\d]{24}$/i, "商品 ID 格式无效"),
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
    unitPrice: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    currency: z.enum(["jpy", "usd", "cny"]),
  })
  .strict();

export const createCheckoutOrderSchema = checkoutFormSchema
  .extend({
    idempotencyKey: z.uuid("结算请求标识无效"),
    expectedItems: z.array(expectedCartItemSchema).min(1).max(CART_MAX_DISTINCT_ITEMS),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.expectedItems.map((item) => item.productId)).size ===
      value.expectedItems.length,
    { message: "确认商品不能重复", path: ["expectedItems"] },
  );

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderSchema>;
