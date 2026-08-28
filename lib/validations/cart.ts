import { z } from "zod";
import { CART_MAX_DISTINCT_ITEMS, CART_MAX_QUANTITY } from "@/lib/cart/constants";

export const cartProductIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "商品IDの形式が正しくありません");

const cartLineInputSchema = z
  .object({
    productId: cartProductIdSchema,
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
  })
  .strict();

export const addCartItemSchema = z
  .object({
    productId: cartProductIdSchema,
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY).default(1),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
  })
  .strict();

export const cartLinesSchema = z
  .object({
    items: z.array(cartLineInputSchema).max(CART_MAX_DISTINCT_ITEMS),
  })
  .strict()
  .refine(
    (value) => new Set(value.items.map((item) => item.productId)).size === value.items.length,
    {
      message: "同じ商品をカートに重複して登録できません",
      path: ["items"],
    },
  );

export type CartLineInput = z.infer<typeof cartLineInputSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
