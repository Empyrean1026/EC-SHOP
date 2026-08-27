import type { CreateCheckoutOrderInput } from "@/lib/validations/checkout";
import type { ShoppingCart } from "@/types/cart";

export function cartMatchesCheckoutConfirmation(
  cart: ShoppingCart,
  expectedItems: CreateCheckoutOrderInput["expectedItems"],
): boolean {
  if (cart.adjustments.length > 0 || cart.items.length !== expectedItems.length) return false;

  const expectedByProduct = new Map(expectedItems.map((item) => [item.productId, item]));

  return cart.items.every((item) => {
    const expected = expectedByProduct.get(item.product.id);
    return (
      expected?.quantity === item.quantity &&
      expected.unitPrice === item.product.price &&
      expected.currency === item.product.currency
    );
  });
}
