import type { CurrencyCode } from "@/models";

export type CartProductSnapshot = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: CurrencyCode;
  image: string | null;
  stock: number;
};

export type CartLine = {
  product: CartProductSnapshot;
  quantity: number;
  subtotal: number;
};

export type CartTotal = {
  currency: CurrencyCode;
  amount: number;
};

export type CartAdjustmentCode =
  "PRODUCT_REMOVED" | "OUT_OF_STOCK" | "QUANTITY_REDUCED" | "CART_CAPACITY_REACHED";

export type CartAdjustment = {
  productId: string;
  code: CartAdjustmentCode;
  fromQuantity?: number;
  toQuantity?: number;
};

export type ShoppingCart = {
  items: CartLine[];
  itemCount: number;
  totalQuantity: number;
  totals: CartTotal[];
  adjustments: CartAdjustment[];
};
