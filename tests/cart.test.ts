import assert from "node:assert/strict";
import test from "node:test";
import { calculateCartTotals, calculateTotalQuantity } from "@/lib/cart/totals";
import { toCartProductSnapshot } from "@/lib/cart/product";
import { addCartItemSchema, cartLinesSchema, updateCartItemSchema } from "@/lib/validations/cart";
import { createCartStore, sanitizeGuestCartItems } from "@/store/cart-store";
import type { CartLine, CartProductSnapshot } from "@/types/cart";

const product: CartProductSnapshot = {
  id: "507f1f77bcf86cd799439011",
  name: "Studio Headphones",
  slug: "studio-headphones",
  price: 32900,
  currency: "jpy",
  image: "/products/studio-headphones.svg",
  stock: 3,
};

test("cart mutation schemas enforce ObjectIds, quantities, uniqueness, and strict fields", () => {
  assert.equal(addCartItemSchema.safeParse({ productId: product.id, quantity: 2 }).success, true);
  assert.equal(addCartItemSchema.safeParse({ productId: "invalid", quantity: 2 }).success, false);
  assert.equal(updateCartItemSchema.safeParse({ quantity: 0 }).success, false);
  assert.equal(updateCartItemSchema.safeParse({ quantity: 100 }).success, false);
  assert.equal(
    cartLinesSchema.safeParse({
      items: [
        { productId: product.id, quantity: 1 },
        { productId: product.id, quantity: 2 },
      ],
    }).success,
    false,
  );
  assert.equal(
    addCartItemSchema.safeParse({ productId: product.id, quantity: 1, price: 1 }).success,
    false,
  );
});

test("guest cart hydration rejects tampered rows and recomputes trusted subtotals", () => {
  const items = sanitizeGuestCartItems({
    items: [
      { product, quantity: 99, subtotal: 1 },
      { product, quantity: 1, subtotal: 1 },
      { product: { ...product, id: "bad-id" }, quantity: 1 },
      { product: { ...product, id: "507f1f77bcf86cd799439012", price: -1 }, quantity: 1 },
      {
        product: {
          ...product,
          id: "507f1f77bcf86cd799439013",
          slug: "../../account",
          image: "javascript:alert(1)",
        },
        quantity: 1,
      },
      {
        product: {
          ...product,
          id: "507f1f77bcf86cd799439014",
          slug: "unsafe-image-path",
          image: "/products/../secret.svg",
        },
        quantity: 1,
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.product.image, "/products/studio-headphones.svg");
  assert.equal(items[0]?.quantity, 3);
  assert.equal(items[0]?.subtotal, 98700);
});

test("Zustand guest cart actions enforce stock and maintain derived totals", () => {
  const store = createCartStore();

  assert.deepEqual(store.getState().addLocalItem(product, 2), { success: true });
  assert.equal(store.getState().totalQuantity, 2);
  assert.equal(store.getState().totals[0]?.amount, 65800);
  assert.equal(store.getState().addLocalItem(product, 2).success, false);
  assert.deepEqual(store.getState().setLocalQuantity(product.id, 3), { success: true });
  assert.equal(store.getState().items[0]?.subtotal, 98700);

  store.getState().removeLocalItem(product.id);
  assert.equal(store.getState().itemCount, 0);
});

test("cart totals remain separate across currencies instead of adding incompatible money", () => {
  const items: CartLine[] = [
    { product, quantity: 2, subtotal: 65800 },
    {
      product: {
        ...product,
        id: "507f1f77bcf86cd799439013",
        slug: "cable",
        name: "Cable",
        currency: "usd",
        price: 1299,
      },
      quantity: 1,
      subtotal: 1299,
    },
  ];

  assert.equal(calculateTotalQuantity(items), 3);
  assert.deepEqual(calculateCartTotals(items), [
    { currency: "jpy", amount: 65800 },
    { currency: "usd", amount: 1299 },
  ]);
});

test("catalog products convert to minimal cart snapshots", () => {
  const snapshot = toCartProductSnapshot({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: "Closed-back monitoring headphones.",
    price: product.price,
    currency: product.currency,
    category: null,
    images: ["https://example.com/headphones.jpg"],
    stock: product.stock,
    rating: 4.9,
    reviewCount: 42,
    salesCount: 211,
    isActive: true,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  });

  assert.deepEqual(snapshot, {
    ...product,
    image: "https://example.com/headphones.jpg",
  });
});
