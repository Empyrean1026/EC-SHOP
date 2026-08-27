import { z } from "zod";
import { CART_MAX_DISTINCT_ITEMS, CART_MAX_QUANTITY } from "@/lib/cart/constants";

export const cartProductIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "商品 ID 格式无效");

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
      message: "购物车中的商品不能重复",
      path: ["items"],
    },
  );

export type CartLineInput = z.infer<typeof cartLineInputSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
