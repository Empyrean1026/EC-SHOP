import type { CartLine, CartTotal } from "@/types/cart";

export function calculateCartTotals(items: CartLine[]): CartTotal[] {
  const totals = new Map<CartLine["product"]["currency"], number>();

  for (const item of items) {
    totals.set(item.product.currency, (totals.get(item.product.currency) ?? 0) + item.subtotal);
  }

  return Array.from(totals, ([currency, amount]) => ({ currency, amount })).sort((left, right) =>
    left.currency.localeCompare(right.currency),
  );
}

export function calculateTotalQuantity(items: CartLine[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}
